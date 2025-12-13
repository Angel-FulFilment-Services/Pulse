import React from 'react'
import { DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'

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
          ? 'bg-white bg-opacity-20 border-white border-opacity-40' 
          : 'bg-gray-100 border-gray-400'
      } ${onClickReply ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {isReplyToAttachment ? (
        // Replying to a specific attachment - show attachment info only
        <>
          <div className={`text-xs font-medium mb-1 ${
            isMyMessage ? 'text-white text-opacity-90' : 'text-gray-600'
          }`}>
            {repliedMessage.user?.name || 'Unknown User'}
          </div>
          <div className={`text-sm truncate ${
            isMyMessage ? 'text-white text-opacity-75' : 'text-gray-500'
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
              isMyMessage ? 'text-white text-opacity-90' : 'text-gray-600'
            }`}>
              {repliedMessage.user?.name || 'Unknown User'}
            </div>
            <div className={`text-xs ${
              isMyMessage ? 'text-white text-opacity-70' : 'text-gray-500'
            }`}>
              {formatTimestamp(repliedMessage.created_at)}
            </div>
          </div>
          <div className={`text-sm truncate ${
            isMyMessage ? 'text-white text-opacity-75' : 'text-gray-500'
          } ${repliedMessage.deleted_at || (isAttachmentMessage && attachment?.deleted_at) ? 'italic' : ''}`}>
            {repliedMessage.deleted_at 
              ? 'This message has been deleted' 
              : (isAttachmentMessage && attachment?.deleted_at)
                ? 'This attachment has been deleted'
                : isAttachmentMessage 
                  ? getAttachmentDescription(attachment)
                  : repliedMessage.body
            }
          </div>
        </>
      )}
    </div>
  )
}
