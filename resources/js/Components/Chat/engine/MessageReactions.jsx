import React, { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import PinIcon from '../icons/PinIcon'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { FLUENT_EMOJI_CDN, QUICK_REACTIONS, ALL_REACTIONS } from '../../../config/EmojiConfig'
import EmojiPicker from './EmojiPicker'

export default function MessageReactions({ message, isMyMessage, onAddReaction, isHovered: isMessageHovered, bubbleRef, currentUser, messageStatus, onPinMessage, isPinned, onDeleteMessage, onReplyClick, isDeleted }) {
  // Don't show reactions on optimistic messages
  const isOptimistic = String(message.id).startsWith('temp-') || message.isPending
  if (isOptimistic) {
    return null
  }
  
  const [showQuickReactions, setShowQuickReactions] = useState(false)
  const [showAllReactions, setShowAllReactions] = useState(false)
  const closeTimeoutRef = useRef(null)
  const reactionsControlRef = useRef(null)
  
  // Helper to check if user has already reacted with this emoji
  const hasUserReacted = (emoji) => {
    if (!message.reactions || !currentUser) return false
    return message.reactions.some(r => r.emoji === emoji && r.user_id === currentUser.id)
  }
  const [isHoveringPopover, setIsHoveringPopover] = useState(false)

  // Floating UI for quick reactions
  const { x, y, strategy, refs, placement: finalPlacement } = useFloating({
    placement: 'top',
    strategy: 'absolute',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate,
  })

  // Set the bubble as the reference element
  useEffect(() => {
    if (bubbleRef) {
      refs.setReference(bubbleRef)
    }
  }, [bubbleRef, refs])

  // Hide popover when scrolling
  useEffect(() => {
    let initialScrollTop = null
    const scrollThreshold = 150 // Don't close if scrolled less than 150px
    
    const handleScroll = (e) => {
      const scrollContainer = e.target
      const scrollTop = scrollContainer.scrollTop
      
      // Initialize on first scroll
      if (initialScrollTop === null) {
        initialScrollTop = scrollTop
        return
      }
      
      // Calculate total accumulated scroll distance
      const totalScrollDistance = Math.abs(scrollTop - initialScrollTop)
      
      // Only close if scrolled more than threshold and not hovering
      if (totalScrollDistance > scrollThreshold && !isMessageHovered && !isHoveringPopover) {
        if (showQuickReactions || showAllReactions) {
          setShowQuickReactions(false)
          setShowAllReactions(false)
        }
      }
    }

    // Find the scroll container (message list)
    const scrollContainer = bubbleRef?.closest('.overflow-y-auto')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [bubbleRef, showQuickReactions, showAllReactions, isMessageHovered, isHoveringPopover])
  
  // Failsafe: Close popover if mouse is outside both bubble and popover
  useEffect(() => {
    if (!showQuickReactions || showAllReactions) return
    
    const handleMouseMove = (e) => {
      // Get the popover element
      const popoverEl = refs.floating.current
      const bubbleEl = bubbleRef
      
      if (!popoverEl || !bubbleEl) return
      
      // Check if mouse is over either element (with padding for the invisible bridge area)
      const popoverRect = popoverEl.getBoundingClientRect()
      const bubbleRect = bubbleEl.getBoundingClientRect()
      
      // Add 8px padding to account for the invisible bridge div (top or bottom based on placement)
      const bridgePadding = finalPlacement === 'bottom' ? -40 : 40
      const isOverPopover = (
        e.clientX >= popoverRect.left &&
        e.clientX <= popoverRect.right &&
        e.clientY >= popoverRect.top + (finalPlacement === 'bottom' ? bridgePadding : 0) &&
        e.clientY <= popoverRect.bottom + (finalPlacement === 'bottom' ? 0 : bridgePadding)
      )
      
      const isOverBubble = (
        e.clientX >= bubbleRect.left &&
        e.clientX <= bubbleRect.right &&
        e.clientY >= bubbleRect.top &&
        e.clientY <= bubbleRect.bottom
      )
      
      // If mouse is not over either, close the popover
      if (!isOverPopover && !isOverBubble) {
        setShowQuickReactions(false)
        setIsHoveringPopover(false)
      }
    }
    
    // Add listener with slight delay to avoid immediate triggers
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousemove', handleMouseMove)
    }, 50)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [showQuickReactions, showAllReactions, bubbleRef, refs])

  // Show quick reactions when message is hovered
  useEffect(() => {
    // Don't show reactions for failed or pending messages
    if (messageStatus === 'failed' || messageStatus === 'pending') {
      setShowQuickReactions(false)
      return
    }
    
    if (isMessageHovered && !showAllReactions) {
      setShowQuickReactions(true)
      // Clear any pending close timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    } else if (isHoveringPopover && !showAllReactions) {
      setShowQuickReactions(true)
      // Clear any pending close timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    } else if (!showAllReactions) {
      // Delay closing to prevent flickering
      closeTimeoutRef.current = setTimeout(() => {
        setShowQuickReactions(false)
      }, 100)
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [isMessageHovered, isHoveringPopover, showAllReactions, messageStatus])

  const handleReactionClick = (reaction) => {
    onAddReaction?.(message.id, reaction)
    setShowAllReactions(false)
    setShowQuickReactions(false)
  }

  const handleMoreClick = (e) => {
    e.stopPropagation()
    setShowAllReactions(true)
  }

  return (
    <>
      {/* Quick reactions popover */}
      {showQuickReactions && (
        <div
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            zIndex: 50,
          }}
          onMouseEnter={() => setIsHoveringPopover(true)}
          onMouseLeave={() => setIsHoveringPopover(false)}
        >
          {/* Invisible padding area to prevent flickering when moving mouse between bubble and popover */}
          <div className={`absolute inset-x-0 h-10 w-[17.25rem] ${finalPlacement === 'bottom' ? '-top-10' : '-bottom-10'}`} />
          
          <div className="flex items-center gap-2">
            {/* Reactions control */}
            <div ref={reactionsControlRef} className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1">
                {QUICK_REACTIONS.map((reaction) => (
                  <button
                    key={reaction.name}
                    onClick={() => handleReactionClick(reaction)}
                    className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-xl ${
                      hasUserReacted(reaction.emoji) ? 'bg-gray-200' : ''
                    }`}
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                ))}
                
                <div>
                  {/* Separator */}
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                </div>

                {/* More button */}
                <button
                  onClick={handleMoreClick}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                  title="More reactions"
                >
                  <PlusIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>
            
            {/* Pin control */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1">
              <button
                onClick={() => onPinMessage?.(message.id)}
                className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors ${
                  isPinned ? 'text-theme-600' : 'text-gray-600'
                }`}
                title={isPinned ? 'Unpin message' : 'Pin message'}
              >
                <PinIcon className="w-5 h-5 text-gray-500" filled={isPinned} />
              </button>
              
              {/* Reply button */}
              {onReplyClick && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <button
                    onClick={() => onReplyClick(message)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600"
                    title="Reply"
                  >
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Delete button - only show for own messages that aren't already deleted */}
              {isMyMessage && !isDeleted && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <button
                    onClick={() => onDeleteMessage?.(message.id)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-red-600"
                    title="Delete message"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All reactions picker */}
      {showAllReactions && (
        <EmojiPicker
          referenceElement={reactionsControlRef.current}
          onSelectEmoji={handleReactionClick}
          onClose={() => setShowAllReactions(false)}
          userReactions={message.reactions?.filter(r => r.user_id === currentUser?.id).map(r => r.emoji) || []}
        />
      )}
    </>
  )
}
