import React, { useState, useEffect, useRef } from 'react'
import { ArrowDownTrayIcon, DocumentIcon, PhotoIcon, PlayIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function AttachmentPreview({ attachment, onImageClick, isDeletable = false, onDelete }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const observerRef = useRef(null)
  const containerRef = useRef(null)

  // Lazy load attachments using Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return

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
  }, [isLoaded])

  const handleImageError = () => {
    setError(true)
  }

  const handleDownload = () => {
    window.open(attachment.url, '_blank')
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

  // Render image attachment
  if (fileType === 'image') {
    return (
      <div 
        ref={containerRef}
        className="cursor-pointer max-w-sm relative"
        onClick={() => !isDeletable && onImageClick?.(attachment)}
      >
        {isLoaded ? (
          <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
              <img
                src={attachment.thumbnail_url || attachment.url || attachment.preview}
                alt={attachment.file_name || attachment.name}
                className="w-full h-full object-contain"
                onError={handleImageError}
                loading="lazy"
              />
              {isDeletable && (
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
              )}
            </div>
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2 absolute bottom-0 left-0 right-0 rounded-b-lg border-theme-500/95 border-x-2 border-b-2" style={{ backdropFilter: 'blur(4px)' }}>
              <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
              <p className="text-xs text-theme-100/50">{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
            </div>
          </div>
        ) : (
          <div className="w-80 bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
            <div className="h-48 bg-gray-100 flex flex-col animate-pulse items-center gap-y-2 justify-center">
              <PhotoIcon className="w-12 h-12 -mt-9 text-gray-400" />
              <p className="text-sm font-medium text-gray-400">Loading Preview...</p>
            </div>
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2 absolute bottom-0 left-0 right-0 rounded-b-lg border-theme-500/95 border-x-2 border-b-2" style={{ backdropFilter: 'blur(4px)' }}>
              <div className="h-4 bg-theme-700/25 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-3 bg-theme-700/25 rounded w-1/4 animate-pulse"></div>
            </div>
          </div>
        )}
        {error && (
          <div className="w-80 bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
            <div className="h-48 bg-gray-100 flex flex-col items-center justify-center">
              <PhotoIcon className="w-12 h-12 -mt-9 text-gray-400" />
              <p className="text-sm font-medium text-gray-400">Failed to load image</p>
                {isDeletable && (
                    <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.()
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-theme-500/80 hover:bg-theme-500/90 text-white rounded transition-colors"
                    style={{ backdropFilter: 'blur(4px)' }}
                    >
                    <XMarkIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2 absolute bottom-0 left-0 right-0 rounded-b-lg border-theme-500/95 border-x-2 border-b-2" style={{ backdropFilter: 'blur(4px)' }}>
              <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
              <p className="text-xs text-theme-100/50">{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render PDF attachment
  if (fileType === 'pdf') {
    // For composer mode, create blob URL from file object
    const pdfUrl = attachment.url || (attachment.file ? URL.createObjectURL(attachment.file) : null)
    
    return (
      <div ref={containerRef} className="max-w-sm relative">
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
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2 flex items-center justify-between rounded-b-lg border-theme-500/95 border-x-2 border-b-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
                <p className="text-xs text-theme-100/50">{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
              </div>
              {!isDeletable && (
                <button
                  onClick={handleDownload}
                  className="h-7 w-7 bg-theme-500/80 hover:bg-theme-600/50 text-white rounded text-xs font-medium transition-colors"
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
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2.5 absolute bottom-0 left-0 right-0 rounded-b-lg border-theme-500/95 border-x-2 border-b-2" style={{ backdropFilter: 'blur(4px)' }}>
              <div className="h-4 bg-theme-700/25 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-3 bg-theme-700/25 rounded w-1/4 animate-pulse"></div>
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
    
    return (
      <div ref={containerRef} className="max-w-sm relative">
        {isLoaded && videoUrl ? (
          <div className="bg-white rounded-lg border-2 border-theme-600 overflow-hidden">
            <div className="bg-black relative">
              <video
                controls
                className="w-full max-h-96"
                preload="metadata"
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
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2 flex items-center justify-between rounded-b-lg border-theme-500/95 border-x-2 border-b-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
                <p className="text-xs text-theme-100/50">{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
              </div>
              {!isDeletable && (
                <button
                  onClick={handleDownload}
                  className="h-7 w-7 bg-theme-500/80 hover:bg-theme-600/50 text-white rounded text-xs font-medium transition-colors"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-80 bg-white rounded-lg overflow-hidden border-2 border-gray-800/10">
            <div className="h-32 bg-gray-100 flex flex-col animate-pulse items-center gap-y-2 justify-center">
              <PlayIcon className="w-12 h-12 -mt-9 text-gray-400" />
              <p className="text-sm font-medium text-gray-400">Loading Preview...</p>
            </div>
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2.5 absolute bottom-0 left-0 right-0 rounded-b-lg border-theme-500/95 border-x-2 border-b-2" style={{ backdropFilter: 'blur(4px)' }}>
              <div className="h-4 bg-theme-700/25 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-3 bg-theme-700/25 rounded w-1/4 animate-pulse"></div>
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
    
    return (
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
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2 flex items-center justify-between rounded-b-lg border-theme-500/95 border-x-2 border-b-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
                <p className="text-xs text-theme-100/50">{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
              </div>
              {!isDeletable && (
                <button
                  onClick={handleDownload}
                  className="h-7 w-7 bg-theme-500/80 hover:bg-theme-600/50 text-white rounded text-xs font-medium transition-colors"
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
              <PlayIcon className="w-12 h-12 -mt-9 text-gray-400 rounded-lg" />
              <p className="text-sm font-medium text-gray-400">Loading Preview...</p>
            </div>
            <div className="bg-theme-500/80 hover:bg-theme-500/85 text-theme-50/95 px-3 py-2.5 absolute bottom-0 left-0 right-0 rounded-b-lg border-theme-500/95 border-x-2 border-b-2" style={{ backdropFilter: 'blur(4px)' }}>
              <div className="h-4 bg-theme-700/25 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-3 bg-theme-700/25 rounded w-1/4 animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render generic file attachment (non-previewable)
  return (
    <div ref={containerRef} className="max-w-sm relative">
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="bg-theme-500/80 min-w-56 text-theme-50/95 px-3 py-2 flex space-x-4 rounded-lg border-2 border-theme-500/95" style={{ backdropFilter: 'blur(4px)' }}>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name || attachment.name}</p>
                <p className="text-xs text-theme-100/50">{attachment.file_size_formatted || formatFileSize(attachment.size || attachment.file_size)}</p>
            </div>
            <div className="flex items-center space-x-2">
                {isDeletable && (
                    <button
                    onClick={handleDownload}
                    className="h-7 w-7 bg-theme-500/80 hover:bg-theme-600/50 text-white rounded text-xs font-medium transition-colors"
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
                    className="h-7 w-7 bg-theme-500/80 hover:bg-theme-600/50 text-white rounded text-xs font-medium transition-colors"
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
