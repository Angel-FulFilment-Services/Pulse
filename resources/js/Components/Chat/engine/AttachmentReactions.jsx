import React, { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import PinIcon from '../icons/PinIcon'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'

// Microsoft Fluent UI Emoji CDN base URL
const FLUENT_EMOJI_CDN = 'https://cdn.jsdelivr.net/npm/@fluentui-emoji/flat@latest/assets'

// Quick reactions (first 5)
const QUICK_REACTIONS = [
  { emoji: '👍', name: 'thumbs_up', label: 'Thumbs Up' },
  { emoji: '😂', name: 'rolling_on_the_floor_laughing', label: 'Laughing' },
  { emoji: '😊', name: 'smiling_face_with_smiling_eyes', label: 'Smiling' },
  { emoji: '😢', name: 'crying_face', label: 'Sad' },
  { emoji: '❤️', name: 'red_heart', label: 'Heart' }
]

// All available reactions grouped by category
const ALL_REACTIONS = {
  'Smileys & Emotion': [
    { emoji: '😀', name: 'grinning_face', label: 'Grinning' },
    { emoji: '😃', name: 'grinning_face_with_big_eyes', label: 'Grinning Big Eyes' },
    { emoji: '😄', name: 'grinning_face_with_smiling_eyes', label: 'Grinning Smiling Eyes' },
    { emoji: '😁', name: 'beaming_face_with_smiling_eyes', label: 'Beaming' },
    { emoji: '😆', name: 'grinning_squinting_face', label: 'Grinning Squinting' },
    { emoji: '😅', name: 'grinning_face_with_sweat', label: 'Grinning Sweat' },
    { emoji: '🤣', name: 'rolling_on_the_floor_laughing', label: 'ROFL' },
    { emoji: '😂', name: 'face_with_tears_of_joy', label: 'Tears of Joy' },
    { emoji: '🙂', name: 'slightly_smiling_face', label: 'Slightly Smiling' },
    { emoji: '🙃', name: 'upside_down_face', label: 'Upside Down' },
    { emoji: '😉', name: 'winking_face', label: 'Winking' },
    { emoji: '😊', name: 'smiling_face_with_smiling_eyes', label: 'Smiling Eyes' },
    { emoji: '😇', name: 'smiling_face_with_halo', label: 'Halo' },
    { emoji: '🥰', name: 'smiling_face_with_hearts', label: 'Hearts' },
    { emoji: '😍', name: 'smiling_face_with_heart_eyes', label: 'Heart Eyes' },
    { emoji: '🤩', name: 'star_struck', label: 'Star Struck' },
    { emoji: '😘', name: 'face_blowing_a_kiss', label: 'Blowing Kiss' },
    { emoji: '😗', name: 'kissing_face', label: 'Kissing' },
    { emoji: '😚', name: 'kissing_face_with_closed_eyes', label: 'Kissing Closed Eyes' },
    { emoji: '😙', name: 'kissing_face_with_smiling_eyes', label: 'Kissing Smiling Eyes' },
    { emoji: '😋', name: 'face_savoring_food', label: 'Savoring Food' },
    { emoji: '😛', name: 'face_with_tongue', label: 'Tongue' },
    { emoji: '😜', name: 'winking_face_with_tongue', label: 'Winking Tongue' },
    { emoji: '🤪', name: 'zany_face', label: 'Zany' },
    { emoji: '😝', name: 'squinting_face_with_tongue', label: 'Squinting Tongue' },
    { emoji: '🤑', name: 'money_mouth_face', label: 'Money Mouth' },
    { emoji: '🤗', name: 'hugging_face', label: 'Hugging' },
    { emoji: '🤭', name: 'face_with_hand_over_mouth', label: 'Hand Over Mouth' },
    { emoji: '🤫', name: 'shushing_face', label: 'Shushing' },
    { emoji: '🤔', name: 'thinking_face', label: 'Thinking' },
    { emoji: '🤐', name: 'zipper_mouth_face', label: 'Zipper Mouth' },
    { emoji: '🤨', name: 'face_with_raised_eyebrow', label: 'Raised Eyebrow' },
    { emoji: '😐', name: 'neutral_face', label: 'Neutral' },
    { emoji: '😑', name: 'expressionless_face', label: 'Expressionless' },
    { emoji: '😶', name: 'face_without_mouth', label: 'No Mouth' },
    { emoji: '😏', name: 'smirking_face', label: 'Smirking' },
    { emoji: '😒', name: 'unamused_face', label: 'Unamused' },
    { emoji: '🙄', name: 'face_with_rolling_eyes', label: 'Rolling Eyes' },
    { emoji: '😬', name: 'grimacing_face', label: 'Grimacing' },
    { emoji: '🤥', name: 'lying_face', label: 'Lying' },
    { emoji: '😌', name: 'relieved_face', label: 'Relieved' },
    { emoji: '😔', name: 'pensive_face', label: 'Pensive' },
    { emoji: '😪', name: 'sleepy_face', label: 'Sleepy' },
    { emoji: '🤤', name: 'drooling_face', label: 'Drooling' },
    { emoji: '😴', name: 'sleeping_face', label: 'Sleeping' },
    { emoji: '😷', name: 'face_with_medical_mask', label: 'Medical Mask' },
    { emoji: '🤒', name: 'face_with_thermometer', label: 'Thermometer' },
    { emoji: '🤕', name: 'face_with_head_bandage', label: 'Head Bandage' },
    { emoji: '🤢', name: 'nauseated_face', label: 'Nauseated' },
    { emoji: '🤮', name: 'face_vomiting', label: 'Vomiting' },
    { emoji: '🤧', name: 'sneezing_face', label: 'Sneezing' },
    { emoji: '🥵', name: 'hot_face', label: 'Hot' },
    { emoji: '🥶', name: 'cold_face', label: 'Cold' },
    { emoji: '😵', name: 'dizzy_face', label: 'Dizzy' },
    { emoji: '🤯', name: 'exploding_head', label: 'Exploding Head' },
    { emoji: '😎', name: 'smiling_face_with_sunglasses', label: 'Sunglasses' },
    { emoji: '🤓', name: 'nerd_face', label: 'Nerd' },
    { emoji: '🧐', name: 'face_with_monocle', label: 'Monocle' },
    { emoji: '😕', name: 'confused_face', label: 'Confused' },
    { emoji: '😟', name: 'worried_face', label: 'Worried' },
    { emoji: '🙁', name: 'slightly_frowning_face', label: 'Slightly Frowning' },
    { emoji: '☹️', name: 'frowning_face', label: 'Frowning' },
    { emoji: '😮', name: 'face_with_open_mouth', label: 'Open Mouth' },
    { emoji: '😯', name: 'hushed_face', label: 'Hushed' },
    { emoji: '😲', name: 'astonished_face', label: 'Astonished' },
    { emoji: '😳', name: 'flushed_face', label: 'Flushed' },
    { emoji: '🥺', name: 'pleading_face', label: 'Pleading' },
    { emoji: '😦', name: 'frowning_face_with_open_mouth', label: 'Frowning Open Mouth' },
    { emoji: '😧', name: 'anguished_face', label: 'Anguished' },
    { emoji: '😨', name: 'fearful_face', label: 'Fearful' },
    { emoji: '😰', name: 'anxious_face_with_sweat', label: 'Anxious Sweat' },
    { emoji: '😥', name: 'sad_but_relieved_face', label: 'Sad Relieved' },
    { emoji: '😢', name: 'crying_face', label: 'Crying' },
    { emoji: '😭', name: 'loudly_crying_face', label: 'Loudly Crying' },
    { emoji: '😱', name: 'face_screaming_in_fear', label: 'Screaming' },
    { emoji: '😖', name: 'confounded_face', label: 'Confounded' },
    { emoji: '😣', name: 'persevering_face', label: 'Persevering' },
    { emoji: '😞', name: 'disappointed_face', label: 'Disappointed' },
    { emoji: '😓', name: 'downcast_face_with_sweat', label: 'Downcast Sweat' },
    { emoji: '😩', name: 'weary_face', label: 'Weary' },
    { emoji: '😫', name: 'tired_face', label: 'Tired' },
    { emoji: '🥱', name: 'yawning_face', label: 'Yawning' },
    { emoji: '😤', name: 'face_with_steam_from_nose', label: 'Steam From Nose' },
    { emoji: '😡', name: 'pouting_face', label: 'Pouting' },
    { emoji: '😠', name: 'angry_face', label: 'Angry' },
    { emoji: '🤬', name: 'face_with_symbols_on_mouth', label: 'Symbols On Mouth' },
  ],
  'Gestures & Body': [
    { emoji: '👍', name: 'thumbs_up', label: 'Thumbs Up' },
    { emoji: '👎', name: 'thumbs_down', label: 'Thumbs Down' },
    { emoji: '👊', name: 'oncoming_fist', label: 'Fist Bump' },
    { emoji: '✊', name: 'raised_fist', label: 'Raised Fist' },
    { emoji: '🤛', name: 'left_facing_fist', label: 'Left Fist' },
    { emoji: '🤜', name: 'right_facing_fist', label: 'Right Fist' },
    { emoji: '🤞', name: 'crossed_fingers', label: 'Crossed Fingers' },
    { emoji: '✌️', name: 'victory_hand', label: 'Victory' },
    { emoji: '🤟', name: 'love_you_gesture', label: 'Love You' },
    { emoji: '🤘', name: 'sign_of_the_horns', label: 'Rock On' },
    { emoji: '👌', name: 'ok_hand', label: 'OK' },
    { emoji: '🤏', name: 'pinching_hand', label: 'Pinching' },
    { emoji: '👈', name: 'backhand_index_pointing_left', label: 'Point Left' },
    { emoji: '👉', name: 'backhand_index_pointing_right', label: 'Point Right' },
    { emoji: '👆', name: 'backhand_index_pointing_up', label: 'Point Up' },
    { emoji: '👇', name: 'backhand_index_pointing_down', label: 'Point Down' },
    { emoji: '☝️', name: 'index_pointing_up', label: 'Index Up' },
    { emoji: '👋', name: 'waving_hand', label: 'Wave' },
    { emoji: '🤚', name: 'raised_back_of_hand', label: 'Raised Back' },
    { emoji: '🖐️', name: 'hand_with_fingers_splayed', label: 'Splayed Hand' },
    { emoji: '✋', name: 'raised_hand', label: 'Raised Hand' },
    { emoji: '🖖', name: 'vulcan_salute', label: 'Vulcan Salute' },
    { emoji: '👏', name: 'clapping_hands', label: 'Clapping' },
    { emoji: '🙌', name: 'raising_hands', label: 'Raising Hands' },
    { emoji: '🤲', name: 'palms_up_together', label: 'Palms Up' },
    { emoji: '🤝', name: 'handshake', label: 'Handshake' },
    { emoji: '🙏', name: 'folded_hands', label: 'Folded Hands' },
  ],
  'Hearts & Love': [
    { emoji: '❤️', name: 'red_heart', label: 'Red Heart' },
    { emoji: '🧡', name: 'orange_heart', label: 'Orange Heart' },
    { emoji: '💛', name: 'yellow_heart', label: 'Yellow Heart' },
    { emoji: '💚', name: 'green_heart', label: 'Green Heart' },
    { emoji: '💙', name: 'blue_heart', label: 'Blue Heart' },
    { emoji: '💜', name: 'purple_heart', label: 'Purple Heart' },
    { emoji: '🖤', name: 'black_heart', label: 'Black Heart' },
    { emoji: '🤍', name: 'white_heart', label: 'White Heart' },
    { emoji: '🤎', name: 'brown_heart', label: 'Brown Heart' },
    { emoji: '💔', name: 'broken_heart', label: 'Broken Heart' },
    { emoji: '❣️', name: 'heart_exclamation', label: 'Heart Exclamation' },
    { emoji: '💕', name: 'two_hearts', label: 'Two Hearts' },
    { emoji: '💞', name: 'revolving_hearts', label: 'Revolving Hearts' },
    { emoji: '💓', name: 'beating_heart', label: 'Beating Heart' },
    { emoji: '💗', name: 'growing_heart', label: 'Growing Heart' },
    { emoji: '💖', name: 'sparkling_heart', label: 'Sparkling Heart' },
    { emoji: '💘', name: 'heart_with_arrow', label: 'Heart With Arrow' },
    { emoji: '💝', name: 'heart_with_ribbon', label: 'Heart With Ribbon' },
  ],
  'Objects & Symbols': [
    { emoji: '🔥', name: 'fire', label: 'Fire' },
    { emoji: '⭐', name: 'star', label: 'Star' },
    { emoji: '✨', name: 'sparkles', label: 'Sparkles' },
    { emoji: '💯', name: 'hundred_points', label: '100' },
    { emoji: '💢', name: 'anger_symbol', label: 'Anger' },
    { emoji: '💥', name: 'collision', label: 'Collision' },
    { emoji: '💫', name: 'dizzy', label: 'Dizzy' },
    { emoji: '💦', name: 'sweat_droplets', label: 'Sweat' },
    { emoji: '💨', name: 'dashing_away', label: 'Dashing' },
    { emoji: '🎉', name: 'party_popper', label: 'Party' },
    { emoji: '🎊', name: 'confetti_ball', label: 'Confetti' },
    { emoji: '🎈', name: 'balloon', label: 'Balloon' },
    { emoji: '🎁', name: 'wrapped_gift', label: 'Gift' },
    { emoji: '🏆', name: 'trophy', label: 'Trophy' },
    { emoji: '🥇', name: 'first_place_medal', label: '1st Place' },
    { emoji: '🥈', name: 'second_place_medal', label: '2nd Place' },
    { emoji: '🥉', name: 'third_place_medal', label: '3rd Place' },
  ]
}

export default function AttachmentReactions({ attachment, isMyMessage, onAddReaction, isHovered: isAttachmentHovered, attachmentRef, currentUser, onPinAttachment, isPinned, onDeleteAttachment, onReplyClick, isDeleted, showReactionButtons = true, messageId }) {
  const [showQuickReactions, setShowQuickReactions] = useState(false)
  const [showAllReactions, setShowAllReactions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const closeTimeoutRef = useRef(null)
  
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

  // Floating UI for all reactions picker
  const allReactionsFloating = useFloating({
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
      allReactionsFloating.refs.setReference(attachmentRef)
    }
  }, [attachmentRef, refs, allReactionsFloating.refs])

  // Hide popover when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (showQuickReactions || showAllReactions) {
        setShowQuickReactions(false)
        setShowAllReactions(false)
      }
    }

    // Find the scroll container (message list)
    const scrollContainer = attachmentRef?.closest('.overflow-y-auto')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [attachmentRef, showQuickReactions, showAllReactions])
  
  // Failsafe: Close popover if mouse is outside both attachment and popover
  useEffect(() => {
    if (!showQuickReactions || showAllReactions) return
    
    const handleMouseMove = (e) => {
      // Get the popover element
      const popoverEl = refs.floating.current
      const attachmentEl = attachmentRef
      
      if (!popoverEl || !attachmentEl) return
      
      // Check if mouse is over either element (with padding for the invisible bridge area)
      const popoverRect = popoverEl.getBoundingClientRect()
      const attachmentRect = attachmentEl.getBoundingClientRect()
      
      // Add 8px padding to account for the invisible bridge div (top or bottom based on placement)
      const bridgePadding = finalPlacement === 'bottom' ? -8 : 8
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
  }, [showQuickReactions, showAllReactions, attachmentRef, refs])

  // Show quick reactions when attachment is hovered
  useEffect(() => {
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
  }, [isAttachmentHovered, isHoveringPopover, showAllReactions])

  const handleReactionClick = (reaction) => {
    onAddReaction?.(attachment.id, reaction)
    setShowAllReactions(false)
    setSearchTerm('')
    setShowQuickReactions(false)
  }

  const handleMoreClick = (e) => {
    e.stopPropagation()
    setShowAllReactions(true)
  }

  // Filter reactions based on search
  const filteredReactions = searchTerm.trim() === '' 
    ? ALL_REACTIONS 
    : Object.entries(ALL_REACTIONS).reduce((acc, [category, reactions]) => {
        const filtered = reactions.filter(r => 
          r.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.emoji.includes(searchTerm)
        )
        if (filtered.length > 0) {
          acc[category] = filtered
        }
        return acc
      }, {})

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
          <div className={`absolute inset-x-0 h-2 ${finalPlacement === 'bottom' ? '-top-1' : '-bottom-1'}`} />
          
          <div className="flex items-center gap-2">
            {/* Reactions control - only show if showReactionButtons is true */}
            {showReactionButtons && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1">
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
            )}
            
            {/* Pin control */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1">
              <button
                onClick={() => onPinAttachment?.(attachment.id)}
                className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors ${
                  isPinned ? 'text-theme-600' : 'text-gray-600'
                }`}
                title={isPinned ? 'Unpin attachment' : 'Pin attachment'}
              >
                <PinIcon className="w-5 h-5 text-gray-500" filled={isPinned} />
              </button>
              
              {/* Reply button */}
              {onReplyClick && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <button
                    onClick={() => onReplyClick({ id: messageId, attachmentId: attachment.id })}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600"
                    title="Reply"
                  >
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Delete button - only show for own attachments that aren't already deleted */}
              {isMyMessage && !isDeleted && (
                <>
                  <div className="w-px h-6 bg-gray-200" />
                  <button
                    onClick={() => onDeleteAttachment?.(attachment.id)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-red-600"
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
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => {
              setShowAllReactions(false)
              setSearchTerm('')
              setShowQuickReactions(false)
            }}
          />
          {/* Picker */}
          <div
            ref={allReactionsFloating.refs.setFloating}
            style={{
              position: allReactionsFloating.strategy,
              top: allReactionsFloating.y ?? 0,
              left: allReactionsFloating.x ?? 0,
              zIndex: 50,
            }}
          >
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-80">
              {/* Search bar */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Find something fun"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              {/* Reactions grid */}
              <div className="max-h-80 overflow-y-auto p-3">
                {Object.keys(filteredReactions).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No reactions found
                  </div>
                ) : (
                  Object.entries(filteredReactions).map(([category, reactions]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        {category}
                      </h3>
                      <div className="grid grid-cols-8 gap-1">
                        {reactions.map((reaction) => (
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
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
