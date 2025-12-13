import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'

export default function ReplyPreview({ replyingTo, onCancel }) {
  if (!replyingTo) return null

  const getAttachmentIcon = (type) => {
    if (type?.startsWith('image/')) return <PhotoIcon className="w-4 h-4" />
    if (type?.startsWith('video/')) return <VideoCameraIcon className="w-4 h-4" />
    if (type?.startsWith('audio/')) return <MusicalNoteIcon className="w-4 h-4" />
    return <DocumentIcon className="w-4 h-4" />
  }

  const getAttachmentDescription = (attachment) => {
    const fileName = attachment.file_name || attachment.name || 'Attachment'
    const type = attachment.type || attachment.mime_type
    if (type?.startsWith('image/')) return `📷 ${fileName}`
    if (type?.startsWith('video/')) return `🎥 ${fileName}`
    if (type?.startsWith('audio/')) return `🎵 ${fileName}`
    return `📄 ${fileName}`
  }

  // Check if replying to a specific attachment (has replyAttachment property)
  const isReplyToSpecificAttachment = !!replyingTo.replyAttachment
  const specificAttachment = replyingTo.replyAttachment
  
  // Check if replying to an attachment-only message (no body text)
  const isAttachmentOnlyReply = !isReplyToSpecificAttachment && replyingTo.attachments && replyingTo.attachments.length > 0 && !replyingTo.body
  const attachment = isReplyToSpecificAttachment ? specificAttachment : (isAttachmentOnlyReply ? replyingTo.attachments[0] : null)

  return (
    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-600 mb-1">
            Replying to {replyingTo.user?.name || 'Unknown User'}
          </div>
          {(isReplyToSpecificAttachment || isAttachmentOnlyReply) ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="truncate">{getAttachmentDescription(attachment)}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500 truncate">
              {replyingTo.body}
            </div>
          )}
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
