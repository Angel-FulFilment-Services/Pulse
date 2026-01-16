import React from 'react'
import { XMarkIcon, LinkIcon } from '@heroicons/react/24/outline'
import { DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'
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
    <div className="px-6 py-3 bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-600 dark:text-dark-400 mb-1">
            Replying to {replyingTo.user?.name || 'Unknown User'}
          </div>
          {(isReplyToSpecificAttachment || isAttachmentOnlyReply) ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-300">
              <span className="truncate">{getAttachmentDescription(attachment)}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-dark-400 truncate max-w-xl flex items-center gap-1.5">
              {(() => {
                const { displayText, linkCount } = formatTextWithLinkCount(replyingTo.body)
                return (
                  <>
                    <span className="truncate">{displayText || 'Link'}</span>
                    {linkCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-theme-600 dark:text-theme-400 flex-shrink-0">
                        <LinkIcon className="w-3 h-3" />
                        <span className="text-xs">+{linkCount}</span>
                      </span>
                    )}
                  </>
                )
              })()}
            </div>
          )}
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
