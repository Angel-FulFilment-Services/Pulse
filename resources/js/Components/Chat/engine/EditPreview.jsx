import React from 'react'
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline'

export default function EditPreview({ editingMessage, onCancel }) {
  if (!editingMessage) return null

  return (
    <div className="px-6 py-3 bg-theme-50 dark:bg-theme-900/30 border-t border-theme-200 dark:border-theme-800">
      <div className="flex items-start justify-between">
        <div className="flex-1 flex items-start gap-2">
          <PencilIcon className="w-4 h-4 text-theme-600 dark:text-theme-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-theme-600 dark:text-theme-400 mb-1">
              Editing message
            </div>
            <div className="text-sm text-gray-500 dark:text-dark-400 truncate max-w-xl">
              {editingMessage.body}
            </div>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="ml-2 p-1 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
