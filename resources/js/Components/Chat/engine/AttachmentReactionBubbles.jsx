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
  const [removingEmoji, setRemovingEmoji] = useState(null)
  const [hoveredReaction, setHoveredReaction] = useState(null)
  const [hoveredOverflow, setHoveredOverflow] = useState(false)
  const [newReactionEmojis, setNewReactionEmojis] = useState(new Set())
  const reactionRefs = React.useRef({})
  const overflowRef = React.useRef(null)
  const previousReactionCountsRef = React.useRef({})
  
  // Track new reactions for animation
  React.useEffect(() => {
    if (!reactions || reactions.length === 0) {
      previousReactionCountsRef.current = {}
      return
    }
    
    // Count current reactions by emoji
    const currentCounts = {}
    reactions.forEach(r => {
      currentCounts[r.emoji] = (currentCounts[r.emoji] || 0) + 1
    })
    
    // Find truly new reaction emojis (emoji types that didn't exist before)
    const newEmojis = reactions
      .filter(r => r.isNewReaction && previousReactionCountsRef.current[r.emoji] === undefined)
      .map(r => r.emoji)
    
    if (newEmojis.length > 0) {
      setNewReactionEmojis(new Set(newEmojis))
      
      // Clear the new flag after animation completes
      const timer = setTimeout(() => {
        setNewReactionEmojis(new Set())
      }, 300) // Slightly longer than animation duration
      
      // Update previous counts
      previousReactionCountsRef.current = currentCounts
      
      return () => clearTimeout(timer)
    }
    
    // Update previous counts even if no new emojis
    previousReactionCountsRef.current = currentCounts
  }, [reactions])
  
  if (!reactions || reactions.length === 0) {
    return null
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji
    if (!acc[emoji]) {
      acc[emoji] = {
        emoji: emoji,
        name: reaction.name || emoji,
        count: 0,
        users: [],
        hasCurrentUser: false,
        firstSeenAt: reaction.created_at || Date.now()
      }
    }
    acc[emoji].count++
    acc[emoji].users.push(reaction.user?.name || 'Someone')
    if (reaction.user_id === currentUserId) {
      acc[emoji].hasCurrentUser = true
    }
    return acc
  }, {})

  const reactionGroups = Object.values(groupedReactions)
  
  // Limit to 10 reactions, rest shown in overflow
  const MAX_VISIBLE_REACTIONS = 10
  const visibleReactions = reactionGroups.slice(0, MAX_VISIBLE_REACTIONS)
  const overflowReactions = reactionGroups.slice(MAX_VISIBLE_REACTIONS)
  const hasOverflow = overflowReactions.length > 0

  const handleClick = (group) => {
    if (!group.hasCurrentUser || !onRemoveReaction) return
    
    // Check if this reaction is still pending
    const reactionKey = `${attachmentId}-${currentUserId}-${group.emoji}`
    const isPending = pendingReactionsRef?.current?.has(reactionKey)
    
    // Block removal if pending
    if (isPending) return
    
    // Only animate if this is the last reaction of this type (count === 1)
    if (group.count === 1) {
      setRemovingEmoji(group.emoji)
      setTimeout(() => {
        onRemoveReaction(attachmentId, { emoji: group.emoji, name: group.name })
        setRemovingEmoji(null)
      }, 200)
    } else {
      // Just remove without animation
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
      {visibleReactions.map((group, idx) => (
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
          className={`relative flex items-center gap-1 bg-white/75 border border-gray-200 rounded-full px-1 py-1 shadow-sm transition-shadow ${
            group.hasCurrentUser ? 'cursor-pointer' : 'cursor-default'
          }`}
          style={{
            animation: removingEmoji === group.emoji 
              ? `popOut 0.2s ease-in forwards` 
              : newReactionEmojis.has(group.emoji) 
                ? `popIn 0.2s ease-out`
                : 'none'
          }}
        >
          <span className="text-md leading-none">{group.emoji}</span>
          {group.count > 1 && (
            <span className="text-xs text-gray-600 font-medium leading-none">
              {group.count}
            </span>
          )}
        </div>
      ))}
      
      {/* Overflow indicator */}
      {hasOverflow && (
        <div 
          ref={overflowRef}
          className="relative flex items-center gap-1 bg-white/75 border border-gray-200 rounded-full px-2 py-1 shadow-sm cursor-default"
          onMouseEnter={(e) => {
            e.stopPropagation()
            setHoveredOverflow(true)
          }}
          onMouseLeave={(e) => {
            e.stopPropagation()
            setHoveredOverflow(false)
          }}
        >
          <span className="text-xs text-gray-600 font-medium leading-none">
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
