import React, { useRef } from 'react'
import { PaperAirplaneIcon, FaceSmileIcon, PaperClipIcon } from '@heroicons/react/24/outline'

export default function MessageInput({ 
  value, 
  onChange, 
  onSubmit, 
  onTyping,
  placeholder,
  disabled = false,
  replyingTo = null,
  inputRef = null
}) {
  const typingTimeoutRef = useRef(null)
  const lastTypingTimeRef = useRef(0)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  const handleChange = (e) => {
    onChange(e.target.value)
    
    // Throttle typing indicator - only send every 3 seconds
    const now = Date.now()
    if (now - lastTypingTimeRef.current > 3000) {
      onTyping?.()
      lastTypingTimeRef.current = now
    }
  }

  // Update placeholder based on reply context
  const effectivePlaceholder = replyingTo 
    ? `Replying to ${replyingTo.user?.name || 'Unknown User'}...`
    : placeholder

  return (
    <form onSubmit={onSubmit} className="flex items-end space-x-3">
      <div className="flex-1">
        <div className="relative w-full flex">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={effectivePlaceholder}
            className="w-full px-4 py-1.5 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <FaceSmileIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="p-2 text-white bg-theme-600 hover:bg-theme-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  )
}
