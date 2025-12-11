import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import PinIcon from '../icons/PinIcon'

export default function PinnedMessageBanner({ pinnedMessage, onUnpin, onClickPinned }) {
  // Check if pinnedMessage is truly valid (not null, undefined, or empty object)
  if (!pinnedMessage || !pinnedMessage.id) return null

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="bg-theme-50 border-b border-theme-200 px-6 py-2">
      <div className="flex items-center gap-3">
        <PinIcon className="w-4 h-4 text-theme-600 flex-shrink-0" filled={true} />
        
        <button
          onClick={() => onClickPinned(pinnedMessage.id)}
          className="flex-1 flex items-center gap-2 rounded px-2 py-1 -mx-2 -my-1 transition-colors text-left"
        >
          <div className="flex-1 min-w-0 max-w-5xl">
            <div className="flex items-center gap-2 text-xs text-theme-600 font-medium mb-0.5">
              <span>{pinnedMessage.user?.name || 'Someone'}</span>
              <span className="text-theme-400">•</span>
              <span>{formatTime(pinnedMessage.created_at)}</span>
            </div>
            <p className="text-sm text-gray-700 truncate">
              {pinnedMessage.body || 'Message'}
            </p>
          </div>
        </button>
        
        <button
          onClick={() => onUnpin(pinnedMessage.id)}
          className="p-1 hover:bg-theme-200 rounded transition-colors flex-shrink-0"
          title="Unpin message"
        >
          <XMarkIcon className="w-4 h-4 text-theme-600" />
        </button>
      </div>
    </div>
  )
}
