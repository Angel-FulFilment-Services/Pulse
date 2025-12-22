import React from 'react'
import { DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, LinkIcon } from '@heroicons/react/24/outline'
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

export default function ReplyBubble({ repliedMessage, isMyMessage, onClickReply }) {
  if (!repliedMessage) return null

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

  // Check if there's a reply_to_attachment (specific attachment reply)
  const replyToAttachment = repliedMessage.reply_to_attachment
  const isReplyToAttachment = !!replyToAttachment
  const isAttachmentDeleted = replyToAttachment?.deleted_at != null
  
  // For regular messages, check if it's attachment-only
  const isAttachmentMessage = !isReplyToAttachment && repliedMessage.attachments && repliedMessage.attachments.length > 0 && !repliedMessage.body
  const attachment = isReplyToAttachment ? replyToAttachment : (isAttachmentMessage ? repliedMessage.attachments[0] : null)
  
  return (
    <div 
      onClick={() => onClickReply?.(repliedMessage.id, replyToAttachment?.id)}
      className={`px-3 py-2 rounded-lg mb-2 border-l-4 ${
        isMyMessage 
          ? 'bg-white dark:bg-dark-800 bg-opacity-20 dark:bg-opacity-20 border-white dark:border-dark-300 border-opacity-40 dark:border-opacity-40' 
          : 'bg-gray-100 dark:bg-dark-800 border-gray-400 dark:border-dark-600'
      } ${onClickReply ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {isReplyToAttachment ? (
        // Replying to a specific attachment - show attachment info only
        <>
          <div className={`text-xs font-medium mb-1 ${
            isMyMessage ? 'text-white dark:text-dark-50 text-opacity-90' : 'text-gray-600 dark:text-dark-400'
          }`}>
            {repliedMessage.user?.name || 'Unknown User'}
          </div>
          <div className={`text-sm truncate max-w-lg ${
            isMyMessage ? 'text-white dark:text-dark-200 text-opacity-75' : 'text-gray-500 dark:text-dark-400'
          } ${isAttachmentDeleted ? 'italic' : ''}`}>
            {isAttachmentDeleted
              ? 'This attachment has been deleted'
              : getAttachmentDescription(replyToAttachment)
            }
          </div>
        </>
      ) : (
        // Replying to a message - show user and message/attachment
        <>
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className={`text-xs font-medium ${
              isMyMessage ? 'text-white dark:text-dark-50 text-opacity-90' : 'text-gray-600 dark:text-dark-400'
            }`}>
              {repliedMessage.user?.name || 'Unknown User'}
            </div>
            <div className={`text-xs ${
              isMyMessage ? 'text-white dark:text-dark-200 text-opacity-70' : 'text-gray-500 dark:text-dark-500'
            }`}>
              {formatTimestamp(repliedMessage.created_at)}
            </div>
          </div>
          <div className={`text-sm truncate max-w-lg flex items-center gap-1.5 ${
            isMyMessage ? 'text-white dark:text-dark-200 text-opacity-75' : 'text-gray-500 dark:text-dark-400'
          } ${repliedMessage.deleted_at || (isAttachmentMessage && attachment?.deleted_at) ? 'italic' : ''}`}>
            {(() => {
              if (repliedMessage.deleted_at) return 'This message has been deleted'
              if (isAttachmentMessage && attachment?.deleted_at) return 'This attachment has been deleted'
              if (isAttachmentMessage) return getAttachmentDescription(attachment)
              
              const { displayText, linkCount } = formatTextWithLinkCount(repliedMessage.body)
              return (
                <>
                  <span className="truncate">{displayText || 'Link'}</span>
                  {linkCount > 0 && (
                    <span className={`inline-flex items-center gap-0.5 flex-shrink-0 ${isMyMessage ? 'text-theme-200' : 'text-theme-600 dark:text-theme-400'}`}>
                      <LinkIcon className="w-3 h-3" />
                      <span className="text-xs">+{linkCount}</span>
                    </span>
                  )}
                </>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}
