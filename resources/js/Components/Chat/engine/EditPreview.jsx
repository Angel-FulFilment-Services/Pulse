import React from 'react'
import { XMarkIcon, PencilIcon, LinkIcon } from '@heroicons/react/24/outline'
import { extractUrls } from './LinkPreview'

// Helper to strip URLs from text and return display text + link count
function formatTextWithLinkCount(text) {
  if (!text) return { displayText: '', linkCount: 0 }
  const urls = extractUrls(text)
  if (urls.length === 0) return { displayText: text, linkCount: 0 }
  
  let strippedText = text
  urls.forEach(url => {
    strippedText = strippedText.replace(url, '').replace(/  +/g, ' ')
  })
  return { displayText: strippedText.trim(), linkCount: urls.length }
}

export default function EditPreview({ editingMessage, onCancel }) {
  if (!editingMessage) return null

  const { displayText, linkCount } = formatTextWithLinkCount(editingMessage.body)

  return (
    <div className="px-6 py-3 bg-theme-50 dark:bg-theme-900/30 border-t border-theme-200 dark:border-theme-800">
      <div className="flex items-start justify-between">
        <div className="flex-1 flex items-start gap-2">
          <PencilIcon className="w-4 h-4 text-theme-600 dark:text-theme-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-theme-600 dark:text-theme-400 mb-1">
              Editing message
            </div>
            <div className="text-sm text-gray-500 dark:text-dark-400 truncate max-w-xl flex items-center gap-1.5">
              <span className="truncate">{displayText || 'Link'}</span>
              {linkCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-theme-600 dark:text-theme-400 flex-shrink-0">
                  <LinkIcon className="w-3 h-3" />
                  <span className="text-xs">+{linkCount}</span>
                </span>
              )}
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
