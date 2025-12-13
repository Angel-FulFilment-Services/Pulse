import React, { useState, useEffect, useRef } from 'react'
import { ArrowDownTrayIcon, DocumentIcon, PhotoIcon, PlayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import AttachmentReactionBubbles from './AttachmentReactionBubbles'
import AttachmentReactions from './AttachmentReactions'

export default function AttachmentPreview({ 
  attachment, 
  onImageClick,
  onPdfClick, 
  isDeletable = false, 
  onDelete,
  // Reaction props (only used when !message.body - attachment-only messages)
  showReactions = false,
  isMyMessage = false,
  currentUserId = null,
  onAddReaction = null,
  onPinAttachment = null,
  onDeleteAttachment = null,
  onRestoreAttachment = null,
  onReplyClick = null,
  isPinned = false,
  isDeleted = false,
  pendingReactionsRef = null,
  boundaryRef = null,
  messageId = null
}) {
  // Show deleted state if attachment has been deleted
  if (isDeleted) {
    return (
      <div className="flex items-center gap-3 py-2">
        <p className="italic text-gray-500">This attachment has been deleted.</p>
        {isMyMessage && onRestoreAttachment && (
          <button
            onClick={() => onRestoreAttachment(attachment.id)}
            className="text-sm underline text-theme-600 hover:text-theme-700 font-semibold"
          >
            Undo
          </button>
        )}
      </div>
    )
  }

  // For composer mode (isDeletable), load immediately since we have file objects
  // For existing messages, use lazy loading
  const shouldLoadImmediately = isDeletable || attachment.preview || attachment.file
  const [isLoaded, setIsLoaded] = useState(shouldLoadImmediately)
  const [error, setError] = useState(false)
  const observerRef = useRef(null)
  const containerRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const attachmentRef = useRef(null)

  // Reset state when attachment changes
  useEffect(() => {
    setIsLoaded(shouldLoadImmediately)
    setError(false)
  }, [attachment.id, attachment.url, shouldLoadImmediately])

  // Lazy load attachments using Intersection Observer (only for server-loaded attachments)
  useEffect(() => {
    if (!containerRef.current || shouldLoadImmediately) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isLoaded) {
            setIsLoaded(true)
          }
        })
      },
      {
        rootMargin: '50px'
      }
    )

    observer.observe(containerRef.current)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isLoaded, shouldLoadImmediately])

  const handleImageError = () => {
    setError(true)
  }

  const handleDownload = async (e) => {
    e?.stopPropagation()
    try {
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.file_name || attachment.name || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to opening in new tab
      window.open(attachment.url, '_blank')
    }
  }

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Determine file type from preview data or existing type
  const determineFileType = () => {
    // If file_type is already set, use it
    if (attachment.file_type) return attachment.file_type
    
    // Check mime_type or type field
    const mimeType = attachment.mime_type || attachment.type
    if (!mimeType) return 'file'
    
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    
    // Fallback: if there's a preview URL, assume it's an image
    if (attachment.preview) return 'image'
    
    return 'file'
  }
  
  const fileType = determineFileType()

  // Helper function to wrap content with reactions/controls
  const wrapWithReactions = (content) => {
    // Only wrap if we have controls to show and it's not in composer mode
    const hasControls = onPinAttachment || onDeleteAttachment || onAddReaction
    if (!hasControls || isDeletable) {
      return content
    }

    // Check if we have reactions to display
    const hasReactions = showReactions && attachment.reactions && attachment.reactions.length > 0

    return (
      <div 
        ref={attachmentRef}
        className="relative" 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
        
        {/* Reaction bubbles - only shown when reactions exist and showReactions is true */}
        {showReactions && attachment.reactions && attachment.reactions.length > 0 && (
          <AttachmentReactionBubbles
            reactions={attachment.reactions}
            isMyMessage={isMyMessage}
            currentUserId={currentUserId}
            onRemoveReaction={onAddReaction}
            attachmentId={attachment.id}
            pendingReactionsRef={pendingReactionsRef}
            boundaryRef={boundaryRef}
          />
        )}
        
        {/* Attachment Reactions (controls + optional reaction buttons) */}
        <AttachmentReactions
          attachment={attachment}
          isMyMessage={isMyMessage}
          onAddReaction={onAddReaction}
          isHovered={isHovered}
          attachmentRef={attachmentRef.current}
          currentUser={{ id: currentUserId }}
          onPinAttachment={onPinAttachment}
          isPinned={isPinned}
          onDeleteAttachment={onDeleteAttachment}
          onReplyClick={onReplyClick}
          isDeleted={isDeleted}
          showReactionButtons={showReactions}
          messageId={messageId}
        />
      </div>
    )
  }

  // Don't render anything if image failed to load and it's not deletable (sent messages)
  // if (error && !isDeletable && fileType === 'image') {
  //   return null
  // }

  // Render image attachment
  if (fileType === 'image') {
    // For composer mode with file object, create/use blob URL
    const imageUrl = isDeletable 
      ? (attachment.preview || (attachment.file ? URL.createObjectURL(attachment.file) : attachment.url))
      : (attachment.thumbnail_url || attachment.url || attachment.preview)
    
    // Only add version param to non-blob URLs, and use proper query string format
    const isBlobUrl = imageUrl?.startsWith('blob:')
    const imageUrlWithVersion = isBlobUrl 
      ? imageUrl 
      : (attachment.id && !isDeletable 
          ? imageUrl + (imageUrl.includes('?') ? '&' : '?') + `v=${attachment.id}`
          : imageUrl)
    
    return wrapWithReactions(
      <div 
        ref={containerRef}
        className="cursor-pointer max-w-sm relative"
        onClick={() => !isDeletable && onImageClick?.(attachment)}
      >
        {isDeletable ? (
          // Composer mode - with borders and banner
          <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
              {!error && imageUrl ? (
                <img
                  key={attachment.id || attachment.preview || attachment.url}
                  src={imageUrlWithVersion}
                  alt={attachment.file_name || attachment.name}
                  className="w-full h-full object-contain"
                  onError={handleImageError}
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                  <p className="text-sm font-medium text-gray-400 mt-2">Failed to load image</p>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.()
                }}
                className="absolute top-2 right-2 p-1.5 bg-theme-500/80 hover:bg-theme-500/85 text-white rounded transition-colors"
                style={{ backdropFilter: 'blur(4px)' }}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2 absolute bottom-0 left-0 right-0 rounded-b-lg border-theme-500/95 border-x-2 border-b-2" style={{ backdropFilter: 'blur(4px)' }}>
              <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
              <p className="text-xs text-theme-100/50">{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
            </div>
          </div>
        ) : (
          // Chat feed mode - just rounded image
          !error && imageUrl ? (
            <img
              key={attachment.id || attachment.url}
              src={imageUrlWithVersion}
              alt={attachment.file_name || attachment.name}
              className="max-w-sm max-h-96 object-contain rounded-lg"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-80 bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
              <div className="h-48 bg-gray-100 flex flex-col items-center justify-center relative">
                <PhotoIcon className="w-12 h-12 -mt-9 text-gray-400" />
                <p className="text-sm font-medium text-gray-400">Failed to load image</p>
              </div>
              <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2 absolute bottom-0 left-0 right-0 rounded-b-lg border-theme-500/95 border-x-2 border-b-2" style={{ backdropFilter: 'blur(4px)' }}>
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
                <p className="text-xs text-theme-100/50">{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
              </div>
            </div>
          )
        )}
        {/* Removed duplicate error display - now handled inline above */}
      </div>
    )
  }

  // Render PDF attachment
  if (fileType === 'pdf') {
    // For composer mode, create blob URL from file object
    const pdfUrl = attachment.url || (attachment.file ? URL.createObjectURL(attachment.file) : null)
    
    return wrapWithReactions(
      <div 
        ref={containerRef} 
        className={`max-w-sm relative ${!isDeletable ? 'cursor-pointer' : ''}`}
        onClick={() => !isDeletable && onPdfClick?.(attachment)}
      >
        {isLoaded && pdfUrl ? (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="h-48 rounded-t-lg flex items-center justify-center relative border-x-2 border-t-2 border-gray-800/10 bg-gray-100">
              <embed
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                type="application/pdf"
                className="w-full h-full"
                style={{ border: 'none', outline: 'none' }}
              />
              {/* Delete button for composer */}
              {isDeletable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.()
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-theme-500/80 hover:bg-theme-500/90 text-white rounded transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className={`${isDeletable || isMyMessage ? 'bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 border-theme-500/95' : 'bg-gray-200 hover:bg-gray-200/80 text-gray-900 border-gray-300'} px-3 py-2 flex items-center justify-between rounded-b-lg border-x-2 border-b-2`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
                <p className={`text-xs ${isDeletable || isMyMessage ? 'text-theme-100/50' : 'text-gray-600'}`}>{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
              </div>
              {!isDeletable && (
                <button
                  onClick={handleDownload}
                  className={`h-7 w-7 ${isMyMessage ? 'bg-theme-500/80 hover:bg-theme-600/50 text-white' : 'bg-gray-300 hover:bg-gray-400/50 text-gray-800'} rounded text-xs flex items-center justify-center font-medium transition-colors`}
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-80 bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
            <div className="h-48 bg-gray-100 flex flex-col animate-pulse items-center gap-y-2 justify-center">
              <DocumentIcon className="w-12 h-12 -mt-9 text-gray-400" />
              <p className="text-sm font-medium text-gray-400">Loading Preview...</p>
            </div>
            <div className={`${isDeletable || isMyMessage ? 'bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 border-theme-500/95' : 'bg-gray-200 hover:bg-gray-200/80 text-gray-900 border-gray-300'} px-3 py-2.5 absolute bottom-0 left-0 right-0 rounded-b-lg border-x-2 border-b-2`} style={{ backdropFilter: 'blur(4px)' }}>
              <div className={`h-4 ${isDeletable || isMyMessage ? 'bg-theme-700/25' : 'bg-gray-400/25'} rounded w-3/4 mb-1 animate-pulse`}></div>
              <div className={`h-3 ${isDeletable || isMyMessage ? 'bg-theme-700/25' : 'bg-gray-400/25'} rounded w-1/4 animate-pulse`}></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render video attachment
  if (fileType === 'video') {
    // For composer mode, create blob URL from file object
    const videoUrl = attachment.url || (attachment.file ? URL.createObjectURL(attachment.file) : null)
    
    return wrapWithReactions(
      <div ref={containerRef} className="max-w-sm relative">
        {isLoaded && videoUrl ? (
          <div className="bg-white rounded-lg border-x-2 border-t-2 border-gray-800/10 overflow-hidden">
            <div className="bg-black relative">
              <video
                controls
                className="w-full min-h-96 max-h-96"
                preload="metadata"
                controlsList="nodownload noremoteplayback"
              >
                <source src={videoUrl} type={attachment.mime_type || attachment.type} />
                Your browser does not support the video tag.
              </video>
              {/* Delete button for composer */}
              {isDeletable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.()
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-theme-500/80 hover:bg-theme-500/90 text-white rounded transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className={`${isDeletable || isMyMessage ? 'bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 border-theme-500/95' : 'bg-gray-200 hover:bg-gray-200/80 text-gray-900 border-gray-300'} px-3 py-2 flex items-center justify-between rounded-b-lg border-x-2 border-b-2 gap-x-2`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name} testing testing testing testing testing</p>
                <p className={`text-xs ${isDeletable || isMyMessage ? 'text-theme-100/50' : 'text-gray-600'}`}>{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
              </div>
              {!isDeletable && (
                <button
                  onClick={handleDownload}
                  className={`h-7 w-7 ${isMyMessage ? 'bg-theme-500/80 hover:bg-theme-600/50 text-white' : 'bg-gray-300 hover:bg-gray-400/50 text-gray-800'} rounded text-xs flex items-center justify-center font-medium transition-colors`}
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-80 bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
            <div className="h-40 bg-gray-100 flex flex-col animate-pulse items-center gap-y-2 justify-center">
              <PlayIcon className="w-12 h-12 -mt-14 text-gray-400" />
              <p className="text-sm font-medium text-gray-400">Loading Preview...</p>
            </div>
            <div className={`${isDeletable || isMyMessage ? 'bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 border-theme-500/95' : 'bg-gray-200 hover:bg-gray-200/80 text-gray-900 border-gray-300'} px-3 py-2.5 absolute bottom-0 left-0 right-0 rounded-b-lg border-x-2 border-b-2`} style={{ backdropFilter: 'blur(4px)' }}>
              <div className={`h-4 ${isDeletable || isMyMessage ? 'bg-theme-700/25' : 'bg-gray-400/25'} rounded w-3/4 mb-1 animate-pulse`}></div>
              <div className={`h-3 ${isDeletable || isMyMessage ? 'bg-theme-700/25' : 'bg-gray-400/25'} rounded w-1/4 animate-pulse`}></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render audio attachment
  if (fileType === 'audio') {
    // For composer mode, create blob URL from file object
    const audioUrl = attachment.url || (attachment.file ? URL.createObjectURL(attachment.file) : null)
    
    return wrapWithReactions(
      <div ref={containerRef} className="max-w-sm relative">
        {isLoaded && audioUrl ? (
          <div className="w-80 bg-white rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 relative rounded-t-lg border-x-2 border-t-2 border-gray-800/10">
              {/* Disable download on this audio element */}
              <audio
                controls
                className="w-full"
                preload="metadata"
                controlsList="nodownload nofullscreen noremoteplayback"
              >
                <source src={audioUrl} type={attachment.mime_type || attachment.type} />
                Your browser does not support the audio tag.
              </audio>
              {/* Delete button for composer */}
              {isDeletable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.()
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-theme-500/80 hover:bg-theme-500/90 text-white rounded transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className={`${isDeletable || isMyMessage ? 'bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 border-theme-500/95' : 'bg-gray-200 hover:bg-gray-200/80 text-gray-900 border-gray-300'} px-3 py-2 flex items-center justify-between rounded-b-lg border-x-2 border-b-2`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name} testing testing</p>
                <p className={`text-xs ${isDeletable || isMyMessage ? 'text-theme-100/50' : 'text-gray-600'}`}>{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
              </div>
              {!isDeletable && (
                <button
                  onClick={handleDownload}
                  className={`h-7 w-7 ${isMyMessage ? 'bg-theme-500/80 hover:bg-theme-600/50 text-white' : 'bg-gray-300 hover:bg-gray-400/50 text-gray-800'} rounded text-xs flex items-center justify-center font-medium transition-colors`}
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-80 bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
            <div className="h-[8.6rem] bg-gray-100 flex flex-col animate-pulse items-center gap-y-2 justify-center">
              <PlayIcon className="w-12 h-12 -mt-14 text-gray-400 rounded-lg" />
              <p className="text-sm font-medium text-gray-400">Loading Preview...</p>
            </div>
            <div className={`${isDeletable || isMyMessage ? 'bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 border-theme-500/95' : 'bg-gray-200 hover:bg-gray-200/80 text-gray-900 border-gray-300'} px-3 py-2.5 absolute bottom-0 left-0 right-0 rounded-b-lg border-x-2 border-b-2`} style={{ backdropFilter: 'blur(4px)' }}>
              <div className={`h-4 ${isDeletable || isMyMessage ? 'bg-theme-700/25' : 'bg-gray-400/25'} rounded w-3/4 mb-1 animate-pulse`}></div>
              <div className={`h-3 ${isDeletable || isMyMessage ? 'bg-theme-700/25' : 'bg-gray-400/25'} rounded w-1/4 animate-pulse`}></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render generic file attachment (non-previewable)
  return wrapWithReactions(
    <div ref={containerRef} className="max-w-sm relative">
      <div className="bg-white rounded-lg overflow-hidden">
        <div className={`${isDeletable || isMyMessage ? 'bg-theme-500/80 border-theme-500/95 text-theme-50/95' : 'bg-gray-200 border-gray-300 text-gray-900'} min-w-56 px-3 py-2 flex space-x-4 rounded-lg border-2`} style={{ backdropFilter: 'blur(4px)' }}>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
                <p className={`text-xs ${isDeletable || isMyMessage ? 'text-theme-100/50' : 'text-gray-600'}`}>{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
            </div>
            <div className="flex items-center space-x-2">
                {!isDeletable && (
                    <button
                    onClick={handleDownload}
                    className={`h-7 w-7 ${isMyMessage ? 'bg-theme-500/80 hover:bg-theme-600/50 text-white' : 'bg-gray-300 hover:bg-gray-400/50 text-gray-800'} rounded text-xs flex items-center justify-center font-medium transition-colors`}
                    >
                        <ArrowDownTrayIcon className="w-4 h-4 inline-block" />
                    </button>
                )}
                {isDeletable && (
                    <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.()
                    }}
                    className={`h-7 w-7 ${isDeletable || isMyMessage ? 'bg-theme-500/80 hover:bg-theme-600/50' : 'bg-gray-300 hover:bg-gray-400'} text-white rounded text-xs font-medium transition-colors`}
                    >
                        <XMarkIcon className="w-4 h-4 inline-block" />
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
