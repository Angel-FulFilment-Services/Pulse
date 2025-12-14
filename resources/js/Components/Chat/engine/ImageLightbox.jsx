import React, { useEffect, useState } from 'react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { ring } from 'ldrs'

// Register the ring spinner
ring.register()

export default function ImageLightbox({ attachment, onClose }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const handleDownload = async () => {
    try {
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.file_name || 'download'
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

  if (!attachment) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Close (Esc)"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {/* Download button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDownload()
        }}
        className="absolute top-4 right-16 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Download"
      >
        <ArrowDownTrayIcon className="w-6 h-6" />
      </button>

      {/* Loading spinner - centered on screen */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <l-ring
            size="60"
            stroke="5"
            bg-opacity="0"
            speed="2"
            color="white"
          ></l-ring>
        </div>
      )}

      {/* Image */}
      <div 
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image and caption wrapper */}
        <div className="relative inline-block">
          <img
            src={attachment.url}
            alt={attachment.file_name}
            className={`max-w-full max-h-[90vh] object-contain rounded-2xl transition-opacity duration-300 bg-neutral-900 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Filename caption - positioned relative to image */}
          {imageLoaded && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 rounded-b-2xl">
              <p className="text-sm font-medium truncate">{attachment.file_name}</p>
              <p className="text-xs text-gray-300">{attachment.file_size_formatted}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
