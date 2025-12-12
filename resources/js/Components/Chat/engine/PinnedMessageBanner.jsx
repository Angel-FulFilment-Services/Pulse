import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'
import PinIcon from '../icons/PinIcon'

export default function PinnedMessageBanner({ pinnedMessage, pinnedAttachment, onUnpin, onUnpinAttachment, onClickPinned }) {
  // Show pinned message OR pinned attachment
  const hasPinnedMessage = pinnedMessage && pinnedMessage.id
  const hasPinnedAttachment = pinnedAttachment && pinnedAttachment.id
  
  if (!hasPinnedMessage && !hasPinnedAttachment) return null

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

  const getAttachmentIcon = (type) => {
    if (type?.startsWith('image/')) return <PhotoIcon className="w-4 h-4" />
    if (type?.startsWith('video/')) return <VideoCameraIcon className="w-4 h-4" />
    if (type?.startsWith('audio/')) return <MusicalNoteIcon className="w-4 h-4" />
    return <DocumentIcon className="w-4 h-4" />
  }

  const getAttachmentDescription = (attachment) => {
    const fileName = attachment.file_name || 'Attachment'
    const type = attachment.type
    if (type?.startsWith('image/')) return `📷 ${fileName}`
    if (type?.startsWith('video/')) return `🎥 ${fileName}`
    if (type?.startsWith('audio/')) return `🎵 ${fileName}`
    return `📄 ${fileName}`
  }

  // Decide what to display
  const displayItem = hasPinnedMessage ? pinnedMessage : pinnedAttachment
  const isAttachment = !hasPinnedMessage && hasPinnedAttachment
  const message = isAttachment ? pinnedAttachment.message : pinnedMessage

  return (
    <div className="bg-theme-50 border-b border-theme-200 px-6 py-2">
      <div className="flex items-center gap-3">
        <PinIcon className="w-4 h-4 text-theme-600 flex-shrink-0" filled={true} />
        
        <button
          onClick={() => onClickPinned(message.id)}
          className="flex-1 flex items-center gap-2 rounded px-2 py-1 -mx-2 -my-1 transition-colors text-left"
        >
          <div className="flex-1 min-w-0 max-w-5xl">
            <div className="flex items-center gap-2 text-xs text-theme-600 font-medium mb-0.5">
              <span>{message.user?.name || 'Someone'}</span>
              <span className="text-theme-400">•</span>
              <span>{formatTime(message.created_at)}</span>
            </div>
            <p className="text-sm text-gray-700 truncate">
              {isAttachment ? getAttachmentDescription(pinnedAttachment) : (pinnedMessage.body || 'Message')}
            </p>
          </div>
        </button>
        
        <button
          onClick={() => isAttachment ? onUnpinAttachment(pinnedAttachment.id) : onUnpin(pinnedMessage.id)}
          className="p-1 hover:bg-theme-200 rounded transition-colors flex-shrink-0"
          title={isAttachment ? "Unpin attachment" : "Unpin message"}
        >
          <XMarkIcon className="w-4 h-4 text-theme-600" />
        </button>
      </div>
    </div>
  )
}
