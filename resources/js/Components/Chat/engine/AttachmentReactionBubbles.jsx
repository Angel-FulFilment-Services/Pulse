import React, { useState } from 'react'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'

// Convert emoji name to readable format
const formatEmojiName = (name) => {
  if (!name) return ''
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Floating tooltip component
function ReactionTooltip({ isVisible, referenceEl, emoji, name, users, boundaryEl }) {
  const { x, y, strategy, refs } = useFloating({
    placement: 'top',
    strategy: 'fixed',
    middleware: [
      offset(4),
      flip({ 
        padding: 8,
        boundary: boundaryEl || undefined
      }),
      shift({ 
        padding: 8,
        boundary: boundaryEl || undefined
      })
    ],
    whileElementsMounted: autoUpdate,
  })

  // Set reference element
  React.useEffect(() => {
    if (referenceEl) {
      refs.setReference(referenceEl)
    }
  }, [referenceEl, refs])

  if (!isVisible) return null

  return (
    <div
      ref={refs.setFloating}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
        zIndex: 50,
      }}
      className="bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none"
    >
      <div className="font-medium mb-0.5">{formatEmojiName(name)}</div>
      <div className="text-gray-300">{users.join(', ')}</div>
    </div>
  )
}

export default function AttachmentReactionBubbles({ reactions, isMyMessage, currentUserId, onRemoveReaction, attachmentId, onHoverChange, boundaryRef, pendingReactionsRef }) {
  const [removingEmojis, setRemovingEmojis] = useState(new Set())
  const [hoveredReaction, setHoveredReaction] = useState(null)
  const [hoveredOverflow, setHoveredOverflow] = useState(false)
  const [newReactionEmojis, setNewReactionEmojis] = useState(new Set())
  const reactionRefs = React.useRef({})
  const overflowRef = React.useRef(null)
  const previousReactionCountsRef = React.useRef({})
  const removalTimeoutsRef = React.useRef(new Map())
  const animatingOutRef = React.useRef(new Map()) // Track emojis animating out with their data
  const newReactionKeysRef = React.useRef(new Set()) // Track which user+emoji combos are new
  
  // Track new reactions for animation
  React.useEffect(() => {
    if (!reactions || reactions.length === 0) {
      previousReactionCountsRef.current = {}
      // Clear any removal animations when reactions are gone
      setRemovingEmojis(new Set())
      removalTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      removalTimeoutsRef.current.clear()
      return
    }
    
    // Count current reactions by emoji
    const currentCounts = {}
    reactions.forEach(r => {
      currentCounts[r.emoji] = (currentCounts[r.emoji] || 0) + 1
    })
    
    // Check if any emojis have been completely removed
    const currentEmojis = new Set(Object.keys(currentCounts))
    
    // DON'T clear removal animation immediately - let it complete
    // The animation will clear itself after 250ms
    // This block is intentionally removed to allow phantom reactions to persist
    
    // Find newly added reactions (reactions that exist now but didn't before)
    const newReactions = reactions.filter(r => {
      const key = `${r.user_id}-${r.emoji}`
      const prevCount = previousReactionCountsRef.current[r.emoji] || 0
      const isNew = prevCount === 0 || !previousReactionCountsRef.current.hasOwnProperty(r.emoji)
      return isNew
    })
    
    // Add new reaction keys to the set
    if (newReactions.length > 0) {
      newReactions.forEach(r => {
        const key = `${r.user_id}-${r.emoji}`
        newReactionKeysRef.current.add(key)
      })
      
      // Clear after animation
      setTimeout(() => {
        newReactions.forEach(r => {
          const key = `${r.user_id}-${r.emoji}`
          newReactionKeysRef.current.delete(key)
        })
        setNewReactionEmojis(new Set())
      }, 300)
      
      // Trigger re-render
      setNewReactionEmojis(new Set(newReactions.map(r => r.emoji)))
    }
    
    // Find truly new reaction emojis (emoji types that didn't exist before)
    const newEmojis = reactions
      .filter(r => previousReactionCountsRef.current[r.emoji] === undefined)
      .map(r => r.emoji)
    
    if (newEmojis.length > 0) {
      // No need to update here - handled above
    }
    
    // Update previous counts even if no new emojis
    previousReactionCountsRef.current = currentCounts
  }, [reactions])
  
  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      removalTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      removalTimeoutsRef.current.clear()
    }
  }, [])
  
  if (!reactions || reactions.length === 0) {
    return null
  }

  // Group reactions by emoji while preserving first appearance order
  // Filter out reactions that are currently being removed (they'll be shown as phantoms)
  const filteredReactions = reactions.filter(r => !removingEmojis.has(r.emoji))
  
  const groupedReactions = filteredReactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji
    if (!acc[emoji]) {
      acc[emoji] = {
        emoji: emoji,
        name: reaction.name || emoji,
        count: 0,
        users: [],
        hasCurrentUser: false,
        firstSeenAt: reaction.created_at || Date.now(),
        insertionOrder: Object.keys(acc).length // Track insertion order
      }
    }
    acc[emoji].count++
    acc[emoji].users.push(reaction.user?.name || 'Someone')
    if (reaction.user_id === currentUserId) {
      acc[emoji].hasCurrentUser = true
    }
    return acc
  }, {})

  // Sort by insertion order to maintain stable display
  const reactionGroups = Object.values(groupedReactions).sort((a, b) => a.insertionOrder - b.insertionOrder)
  
  // Add phantom reactions for emojis that are being removed (so animation can complete)
  const phantomGroups = Array.from(animatingOutRef.current.values())
    .filter(data => !reactionGroups.some(g => g.emoji === data.emoji))
    .map(data => ({
      emoji: data.emoji,
      name: data.name,
      count: 0,
      users: [],
      hasCurrentUser: false,
      isPhantom: true
    }))
  
  const allReactionGroups = [...reactionGroups, ...phantomGroups]
  
  // Limit to 10 reactions, rest shown in overflow
  const MAX_VISIBLE_REACTIONS = 10
  const visibleReactions = allReactionGroups.slice(0, MAX_VISIBLE_REACTIONS)
  const overflowReactions = allReactionGroups.slice(MAX_VISIBLE_REACTIONS)
  const hasOverflow = overflowReactions.length > 0

  const handleClick = (group) => {
    if (!group.hasCurrentUser || !onRemoveReaction) return
    
    // Don't handle phantom clicks
    if (group.isPhantom) return
    
    // Check if this reaction is pending (block all interactions)
    const reactionKey = `attachment-${attachmentId}-${currentUserId}-${group.emoji}`
    const isPending = pendingReactionsRef?.current?.has(reactionKey)
    if (isPending) return
    
    // Prevent double-clicks on the same emoji
    if (removingEmojis.has(group.emoji)) return
    
    // Only animate if this is the last reaction of this type
    if (group.count === 1) {
      // Store the emoji data in ref for phantom creation
      animatingOutRef.current.set(group.emoji, {
        emoji: group.emoji,
        name: group.name,
        timestamp: Date.now()
      })
      
      setRemovingEmojis(prev => new Set(prev).add(group.emoji))
      
      // Call removal immediately for optimistic update
      onRemoveReaction(attachmentId, { emoji: group.emoji, name: group.name })
      
      // Clear animation state after animation completes
      setTimeout(() => {
        animatingOutRef.current.delete(group.emoji)
        setRemovingEmojis(prev => {
          const updated = new Set(prev)
          updated.delete(group.emoji)
          return updated
        })
      }, 200)
    } else {
      // Just remove without animation if count > 1
      onRemoveReaction(attachmentId, { emoji: group.emoji, name: group.name })
    }
  }

  return (
    <div 
      className={`absolute -bottom-4 flex gap-1 z-20 ${
        isMyMessage ? 'flex-row-reverse right-2' : 'left-2'
      }`}
      onMouseEnter={(e) => {
        e.stopPropagation()
        onHoverChange?.(false)
      }}
      onMouseLeave={(e) => {
        e.stopPropagation()
        onHoverChange?.(true)
      }}
    >
      {visibleReactions.map((group, idx) => {
        const reactionKey = `attachment-${attachmentId}-${currentUserId}-${group.emoji}`
        const isPending = pendingReactionsRef?.current?.has(reactionKey)
        
        // Only show pending state if user is currently trying to interact (has the user's reaction)
        const showPending = isPending && group.hasCurrentUser && removingEmojis.has(group.emoji)
        
        return (
        <div
          key={group.emoji}
          ref={el => reactionRefs.current[idx] = el}
          onClick={() => handleClick(group)}
          onMouseEnter={(e) => {
            e.stopPropagation()
            setHoveredReaction(idx)
          }}
          onMouseLeave={(e) => {
            e.stopPropagation()
            setHoveredReaction(null)
          }}
          className={`relative flex items-center gap-1 bg-white/75 dark:bg-dark-700/75 border border-gray-200 dark:border-dark-600 rounded-full px-1 py-1 shadow-sm transition-all ${
            group.hasCurrentUser ? 'cursor-pointer' : 'cursor-default'
          } ${showPending ? 'opacity-50 cursor-wait' : ''}`}
          style={{
            animation: removingEmojis.has(group.emoji)
              ? `popOut 0.2s ease-in forwards` 
              : newReactionEmojis.has(group.emoji) 
                ? `popIn 0.2s ease-out`
                : 'none',
            pointerEvents: isPending ? 'none' : 'auto'
          }}
        >
          <span className="text-md leading-none">{group.emoji}</span>
          {group.count > 1 && (
            <span className="text-xs text-gray-600 dark:text-dark-400 font-medium leading-none">
              {group.count}
            </span>
          )}
        </div>
        )
      })}
      
      {/* Overflow indicator */}
      {hasOverflow && (
        <div 
          ref={overflowRef}
          className="relative flex items-center gap-1 bg-white/75 dark:bg-dark-700/75 border border-gray-200 dark:border-dark-600 rounded-full px-2 py-1 shadow-sm cursor-default"
          onMouseEnter={(e) => {
            e.stopPropagation()
            setHoveredOverflow(true)
          }}
          onMouseLeave={(e) => {
            e.stopPropagation()
            setHoveredOverflow(false)
          }}
        >
          <span className="text-xs text-gray-600 dark:text-dark-400 font-medium leading-none">
            +{overflowReactions.length}
          </span>
        </div>
      )}
      
      {/* Floating tooltips */}
      {hoveredReaction !== null && visibleReactions[hoveredReaction] && (
        <ReactionTooltip
          isVisible={true}
          referenceEl={reactionRefs.current[hoveredReaction]}
          emoji={visibleReactions[hoveredReaction].emoji}
          name={visibleReactions[hoveredReaction].name}
          users={visibleReactions[hoveredReaction].users}
          boundaryEl={boundaryRef?.current}
        />
      )}
      
      {hoveredOverflow && overflowReactions.length > 0 && (
        <div
          ref={(el) => {
            if (el && overflowRef.current) {
              const rect = overflowRef.current.getBoundingClientRect()
              el.style.position = 'fixed'
              el.style.top = `${rect.top - el.offsetHeight - 4}px`
              el.style.left = `${rect.left + rect.width / 2 - el.offsetWidth / 2}px`
              el.style.zIndex = 50
            }
          }}
          className="bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none"
        >
          <div className="font-medium mb-1">Other reactions:</div>
          <div className="space-y-0.5">
            {overflowReactions.map((group, idx) => (
              <div key={idx} className="text-gray-300 flex items-center gap-1">
                <span>{group.emoji}</span>
                <span>{formatEmojiName(group.name)}</span>
                <span>({group.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes popIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes popOut {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
