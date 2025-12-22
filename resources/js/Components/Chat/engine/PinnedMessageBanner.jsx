import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, ArrowRightIcon, LinkIcon } from '@heroicons/react/24/outline'
import PinIcon from '../icons/PinIcon'
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

export default function PinnedMessageBanner({ pinnedMessage, pinnedAttachment, onUnpin, onUnpinAttachment, onClickPinned, canPinMessages = false }) {
  // Show pinned message OR pinned attachment
  const hasPinnedMessage = pinnedMessage && pinnedMessage.id
  const hasPinnedAttachment = pinnedAttachment && pinnedAttachment.id
  
  if (!hasPinnedMessage && !hasPinnedAttachment) return null

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    // UK format: dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${day}/${month}/${year} ${time}`
  }

  const getAttachmentIcon = (type) => {
    if (type?.startsWith('image/')) return <PhotoIcon className="w-4 h-4" />
    if (type?.startsWith('video/')) return <VideoCameraIcon className="w-4 h-4" />
    if (type?.startsWith('audio/')) return <MusicalNoteIcon className="w-4 h-4" />
    return <DocumentIcon className="w-4 h-4" />
  }

  const getAttachmentDescription = (attachment) => {
    const fileName = attachment.file_name || 'Attachment'
    const type = attachment.type || attachment.mime_type
    if (type?.startsWith('image/')) return `📷 ${fileName}`
    if (type?.startsWith('video/')) return `🎥 ${fileName}`
    if (type?.startsWith('audio/')) return `🎵 ${fileName}`
    return `📄 ${fileName}`
  }

  // Decide what to display
  const displayItem = hasPinnedMessage ? pinnedMessage : pinnedAttachment
  const isAttachment = !hasPinnedMessage && hasPinnedAttachment
  const message = isAttachment ? pinnedAttachment.message : pinnedMessage
  
  // Check if this is a forwarded message
  const isForwardedMessage = hasPinnedMessage && (pinnedMessage.forwarded_from_message_id || pinnedMessage.forwarded_from_message)
  const forwardedMessage = isForwardedMessage ? pinnedMessage.forwarded_from_message : null
  
  // Check if this is a forwarded attachment
  const isForwardedAttachment = hasPinnedAttachment && (pinnedAttachment.forwarded_from_attachment_id || pinnedAttachment.forwarded_from_attachment)
  
  // Combined check for any forwarded content
  const isForwarded = isForwardedMessage || isForwardedAttachment
  
  // Get the original sender name for forwarded messages
  const originalSenderName = forwardedMessage?.user?.name || 'Unknown'
  
  // Determine the display content
  const getDisplayContent = () => {
    if (isAttachment) {
      const description = getAttachmentDescription(pinnedAttachment)
      if (isForwardedAttachment) {
        return { text: `Forwarded: ${description}`, linkCount: 0 }
      }
      return { text: description, linkCount: 0 }
    }
    
    if (isForwardedMessage && forwardedMessage) {
      // Show forwarded message content with original sender
      const prefix = `From ${originalSenderName}: `
      if (forwardedMessage.body) {
        const { displayText, linkCount } = formatTextWithLinkCount(forwardedMessage.body)
        return { text: prefix + (displayText || 'Link'), linkCount }
      }
      // Check for attachments in forwarded message
      if (forwardedMessage.attachments && forwardedMessage.attachments.length > 0) {
        return { text: prefix + getAttachmentDescription(forwardedMessage.attachments[0]), linkCount: 0 }
      }
      return { text: prefix + 'Message', linkCount: 0 }
    }
    
    // If forwarded message but forwardedMessage not loaded, show indicator
    if (isForwardedMessage && !forwardedMessage) {
      return { text: 'Forwarded message', linkCount: 0 }
    }
    
    const { displayText, linkCount } = formatTextWithLinkCount(pinnedMessage.body)
    return { text: displayText || 'Link', linkCount }
  }
  
  const { text: displayText, linkCount } = getDisplayContent()

  return (
    <div className="bg-theme-50 dark:bg-theme-900/30 border-b border-theme-200 dark:border-theme-800 px-6 py-2">
      <div className="flex items-center gap-3">
        <PinIcon className="w-4 h-4 text-theme-600 dark:text-theme-400 flex-shrink-0" filled={true} />
        
        <button
          onClick={() => onClickPinned(message.id, isAttachment ? pinnedAttachment.id : null)}
          className="flex-1 flex items-center gap-2 rounded px-2 py-1 -mx-2 -my-1 transition-colors text-left"
        >
          <div className="flex-1 min-w-0 max-w-5xl">
            <div className="flex items-center gap-2 text-xs text-theme-600 dark:text-theme-400 font-medium mb-0.5">
              <span>{message.user?.name || 'Someone'}</span>
              <span className="text-theme-400 dark:text-theme-600">•</span>
              <span>{formatTime(message.created_at)}</span>
              {isForwarded && (
                <>
                  <span className="text-theme-400 dark:text-theme-600">•</span>
                  <span className="flex items-center gap-1">
                    <ArrowRightIcon className="w-3 h-3" />
                    Forwarded
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-dark-300 truncate flex items-center gap-1.5">
              <span className="truncate">{displayText}</span>
              {linkCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-theme-600 dark:text-theme-400 flex-shrink-0">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span className="text-xs">+{linkCount} link{linkCount > 1 ? 's' : ''}</span>
                </span>
              )}
            </p>
          </div>
        </button>
        
{canPinMessages && (
          <button
            onClick={() => isAttachment ? onUnpinAttachment(pinnedAttachment.id) : onUnpin(pinnedMessage.id)}
            className="p-1 hover:bg-theme-200 dark:hover:bg-theme-800/50 rounded transition-colors flex-shrink-0"
            title={isAttachment ? "Unpin attachment" : "Unpin message"}
          >
            <XMarkIcon className="w-4 h-4 text-theme-600 dark:text-theme-400" />
          </button>
        )}
      </div>
    </div>
  )
}
