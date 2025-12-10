import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ReplyPreview({ replyingTo, onCancel }) {
  if (!replyingTo) return null

  return (
    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-600 mb-1">
            Replying to {replyingTo.user?.name || 'Unknown User'}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {replyingTo.body}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
