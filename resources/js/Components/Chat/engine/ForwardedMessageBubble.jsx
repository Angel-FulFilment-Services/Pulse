import React from 'react'
import { ArrowRightIcon, DocumentIcon } from '@heroicons/react/24/outline'

export default function ForwardedMessageBubble({ forwardedMessage, isMyMessage }) {
  if (!forwardedMessage) return null

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const getAttachmentDescription = (attachment) => {
    const fileName = attachment.file_name || 'Attachment'
    const type = attachment.type || attachment.mime_type
    if (type?.startsWith('image/')) return `📷 ${fileName}`
    if (type?.startsWith('video/')) return `🎥 ${fileName}`
    if (type?.startsWith('audio/')) return `🎵 ${fileName}`
    return `📄 ${fileName}`
  }

  // Check if forwarded message has attachments only (no body)
  const hasAttachments = forwardedMessage.attachments && forwardedMessage.attachments.length > 0
  const isAttachmentOnly = hasAttachments && !forwardedMessage.body
  const firstAttachment = hasAttachments ? forwardedMessage.attachments[0] : null
  
  return (
    <div className="mb-2">
      {/* Forwarded label */}
      <div className={`flex items-center gap-1 text-xs mb-1 ${
        isMyMessage ? 'text-white dark:text-dark-200 text-opacity-70' : 'text-gray-500 dark:text-dark-400'
      }`}>
        <ArrowRightIcon className="w-3 h-3" />
        <span>Forwarded message</span>
      </div>
      
      {/* Forwarded message content */}
      <div 
        className={`px-3 py-2 rounded-lg border-l-4 ${
          isMyMessage 
            ? 'bg-white dark:bg-dark-800 bg-opacity-20 dark:bg-opacity-20 border-white dark:border-dark-300 border-opacity-40 dark:border-opacity-40' 
            : 'bg-gray-100 dark:bg-dark-800 border-gray-400 dark:border-dark-600'
        }`}
      >
        {/* Original sender info */}
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className={`text-xs font-medium ${
            isMyMessage ? 'text-white dark:text-dark-50 text-opacity-90' : 'text-gray-600 dark:text-dark-400'
          }`}>
            {forwardedMessage.user?.name || 'Unknown User'}
          </div>
          <div className={`text-xs ${
            isMyMessage ? 'text-white dark:text-dark-200 text-opacity-70' : 'text-gray-500 dark:text-dark-500'
          }`}>
            {formatTimestamp(forwardedMessage.created_at)}
          </div>
        </div>
        
        {/* Message content */}
        <div className={`text-sm ${
          isMyMessage ? 'text-white dark:text-dark-200 text-opacity-75' : 'text-gray-500 dark:text-dark-400'
        } ${forwardedMessage.deleted_at ? 'italic' : ''}`}>
          {forwardedMessage.deleted_at 
            ? 'This message has been deleted' 
            : isAttachmentOnly 
              ? getAttachmentDescription(firstAttachment)
              : forwardedMessage.body
          }
        </div>
        
        {/* Show attachment count if there are multiple */}
        {hasAttachments && forwardedMessage.attachments.length > 1 && (
          <div className={`text-xs mt-1 ${
            isMyMessage ? 'text-white dark:text-dark-300 text-opacity-60' : 'text-gray-400 dark:text-dark-500'
          }`}>
            +{forwardedMessage.attachments.length - 1} more attachment{forwardedMessage.attachments.length > 2 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
