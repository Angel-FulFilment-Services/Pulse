import React, { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, ArrowUturnLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import PinIcon from '../icons/PinIcon'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { FLUENT_EMOJI_CDN, QUICK_REACTIONS, ALL_REACTIONS } from '../../../Config/EmojiConfig'
import EmojiPicker from './EmojiPicker'
import ForwardDropdown from './ForwardDropdown'

export default function AttachmentReactions({ attachment, isMyMessage, onAddReaction, isHovered: isAttachmentHovered, attachmentRef, currentUser, onPinAttachment, isPinned, onDeleteAttachment, onReplyClick, isDeleted, showReactionButtons = true, messageId, onForwardAttachment }) {
  // Don't show reactions on optimistic messages
  const isOptimistic = String(messageId).startsWith('temp-')
  if (isOptimistic) {
    return null
  }
  
  const [showQuickReactions, setShowQuickReactions] = useState(false)
  const [showAllReactions, setShowAllReactions] = useState(false)
  const [showForwardDropdown, setShowForwardDropdown] = useState(false)
  const closeTimeoutRef = useRef(null)
  const reactionsControlRef = useRef(null)
  const forwardButtonRef = useRef(null)
  
  // Helper to check if user has already reacted with this emoji
  const hasUserReacted = (emoji) => {
    if (!attachment.reactions || !currentUser) return false
    return attachment.reactions.some(r => r.emoji === emoji && r.user_id === currentUser.id)
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

  // Set the attachment container as the reference element
  useEffect(() => {
    if (attachmentRef) {
      refs.setReference(attachmentRef)
    }
  }, [attachmentRef, refs])

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
      if (totalScrollDistance > scrollThreshold && !isAttachmentHovered && !isHoveringPopover) {
        if (showQuickReactions || showAllReactions) {
          setShowQuickReactions(false)
          setShowAllReactions(false)
        }
      }
    }

    // Find the scroll container (message list)
    const scrollContainer = attachmentRef?.closest('.overflow-y-auto')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [attachmentRef, showQuickReactions, showAllReactions, isAttachmentHovered, isHoveringPopover])
  
  // Failsafe: Close popover if mouse is outside both attachment and popover
  useEffect(() => {
    if (!showQuickReactions || showAllReactions || showForwardDropdown) return
    
    const handleMouseMove = (e) => {
      // Get the popover element
      const popoverEl = refs.floating.current
      const attachmentEl = attachmentRef
      
      if (!popoverEl || !attachmentEl) return
      
      // Check if mouse is over either element (with padding for the invisible bridge area)
      const popoverRect = popoverEl.getBoundingClientRect()
      const attachmentRect = attachmentEl.getBoundingClientRect()
      
      // Add 8px padding to account for the invisible bridge div (top or bottom based on placement)
      const bridgePadding = finalPlacement === 'bottom' ? -40 : 40
      const isOverPopover = (
        e.clientX >= popoverRect.left &&
        e.clientX <= popoverRect.right &&
        e.clientY >= popoverRect.top + (finalPlacement === 'bottom' ? bridgePadding : 0) &&
        e.clientY <= popoverRect.bottom + (finalPlacement === 'bottom' ? 0 : bridgePadding)
      )
      
      const isOverAttachment = (
        e.clientX >= attachmentRect.left &&
        e.clientX <= attachmentRect.right &&
        e.clientY >= attachmentRect.top &&
        e.clientY <= attachmentRect.bottom
      )
      
      // If mouse is not over either, close the popover
      if (!isOverPopover && !isOverAttachment) {
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
  }, [showQuickReactions, showAllReactions, showForwardDropdown, attachmentRef, refs])

  // Show quick reactions when attachment is hovered
  useEffect(() => {
    // Keep reactions open when forward dropdown is showing
    if (showForwardDropdown) {
      setShowQuickReactions(true)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      return
    }
    
    if (isAttachmentHovered && !showAllReactions) {
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
  }, [isAttachmentHovered, isHoveringPopover, showAllReactions, showForwardDropdown])

  const handleReactionClick = (reaction) => {
    onAddReaction?.(attachment.id, reaction)
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
          {/* Invisible padding area to prevent flickering when moving mouse between attachment and popover */}
          <div className={`absolute inset-x-0 h-10 w-[17.25rem] ${finalPlacement === 'bottom' ? '-top-10' : '-bottom-10'}`} />
          
          <div className="flex items-center gap-2">
            {/* Reactions control - only show if showReactionButtons is true */}
            {showReactionButtons && (
              <div ref={reactionsControlRef} className="bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 p-2 flex items-center gap-1">
                  {QUICK_REACTIONS.map((reaction) => (
                    <button
                      key={reaction.name}
                      onClick={() => handleReactionClick(reaction)}
                      className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors text-xl ${
                        hasUserReacted(reaction.emoji) ? 'bg-gray-200 dark:bg-dark-600' : ''
                      }`}
                      title={reaction.label}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                  
                  <div>
                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-200 dark:bg-dark-600 mx-1" />
                  </div>

                  {/* More button */}
                  <button
                    onClick={handleMoreClick}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
                    title="More reactions"
                  >
                    <PlusIcon className="w-5 h-5 text-gray-600 dark:text-dark-300" />
                  </button>
              </div>
            )}
            
            {/* Pin control */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 p-2 flex items-center gap-1">
              <button
                onClick={() => onPinAttachment?.(attachment.id)}
                className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors ${
                  isPinned ? 'text-theme-600 dark:text-theme-400' : 'text-gray-600 dark:text-dark-300'
                }`}
                title={isPinned ? 'Unpin attachment' : 'Pin attachment'}
              >
                <PinIcon className="w-5 h-5 text-gray-500 dark:text-dark-400" filled={isPinned} />
              </button>
              
              {/* Reply button */}
              {onReplyClick && (
                <>
                  <div className="w-px h-6 bg-gray-200 dark:bg-dark-600" />
                  <button
                    onClick={() => onReplyClick({ id: messageId, attachmentId: attachment.id })}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors text-gray-600 dark:text-dark-300"
                    title="Reply"
                  >
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Forward button - hide on already forwarded attachments */}
              {onForwardAttachment && !isDeleted && !attachment.forwarded_from_attachment_id && !attachment.forwarded_from_attachment && (
                <>
                  <div className="w-px h-6 bg-gray-200 dark:bg-dark-600" />
                  <button
                    ref={forwardButtonRef}
                    onClick={() => setShowForwardDropdown(true)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors text-gray-600 dark:text-dark-300"
                    title="Forward"
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Delete button - only show for own attachments that aren't already deleted */}
              {isMyMessage && !isDeleted && (
                <>
                  <div className="w-px h-6 bg-gray-200 dark:bg-dark-600" />
                  <button
                    onClick={() => onDeleteAttachment?.(attachment.id)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors text-gray-600 dark:text-dark-300 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete attachment"
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
          userReactions={attachment.reactions?.filter(r => r.user_id === currentUser?.id).map(r => r.emoji) || []}
        />
      )}
      
      {/* Forward dropdown */}
      <ForwardDropdown
        isOpen={showForwardDropdown}
        onClose={() => setShowForwardDropdown(false)}
        triggerRef={forwardButtonRef}
        isMyMessage={isMyMessage}
        forwardType="attachment"
        itemToForward={attachment}
        onForward={(target) => {
          onForwardAttachment?.(attachment, target)
          setShowForwardDropdown(false)
          setShowQuickReactions(false)
        }}
      />
    </>
  )
}
