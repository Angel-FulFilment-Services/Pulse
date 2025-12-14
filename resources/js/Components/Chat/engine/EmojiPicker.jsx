import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { ALL_REACTIONS } from '../../../config/EmojiConfig'

export default function EmojiPicker({ onSelectEmoji, referenceElement, onClose, userReactions = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isPositioned, setIsPositioned] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [referenceWidth, setReferenceWidth] = useState(null)
  
  const { refs, strategy, x, y } = useFloating({
    placement: 'top',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  // Set reference element when it changes and get its width
  useEffect(() => {
    if (referenceElement) {
      refs.setReference(referenceElement)
      
      // Get the width of the reference element
      const rect = referenceElement.getBoundingClientRect()
      setReferenceWidth(rect.width)
    }
  }, [referenceElement, refs])

  // Show picker after position is calculated
  useEffect(() => {
    if (x !== null && y !== null) {
      setIsPositioned(true)
      // Add extra delay to ensure layout is stable
      setTimeout(() => {
        setIsVisible(true)
      }, 50)
    }
  }, [x, y])

  // Handle click outside and escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      const floatingEl = refs.floating.current
      const refEl = referenceElement
      
      if (!floatingEl || !refEl) return
      
      // Check if click is outside both the picker and the reference element
      if (!floatingEl.contains(e.target) && !refEl.contains(e.target)) {
        onClose?.()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    // Delay adding the click listener to avoid catching the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    // Add escape key listener immediately
    document.addEventListener('keydown', handleEscape)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [refs, referenceElement, onClose])

  // Don't render content until we have a valid position
  if (!isPositioned) {
    return null
  }

  // Helper to check if user has already reacted with this emoji
  const hasUserReacted = (emoji) => {
    return userReactions.includes(emoji)
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

  const handleEmojiClick = (reaction) => {
    onSelectEmoji(reaction)
    setSearchTerm('')
    onClose?.()
  }

  return (
    <div
      ref={refs.setFloating}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
        zIndex: 50,
        visibility: isVisible ? 'visible' : 'hidden',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.1s ease-in',
        maxWidth: '100vw',
        backgroundColor: 'transparent',
      }}
    >
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden`} style={{ width: Math.max(referenceWidth || 277, 277) }}>
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
              No emojis found
            </div>
          ) : (
            Object.entries(filteredReactions).map(([category, reactions]) => (
              <div key={category} className="mb-4 last:mb-0">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.name}
                      onClick={() => handleEmojiClick(reaction)}
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
  )
}
