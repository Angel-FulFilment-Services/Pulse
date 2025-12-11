import React, { useEffect } from 'react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function ImageLightbox({ attachment, onClose }) {
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

  const handleDownload = () => {
    window.open(attachment.url, '_blank')
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

      {/* Image */}
      <div 
        className="relative max-w-7xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={attachment.url}
          alt={attachment.file_name}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
        
        {/* Filename caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 rounded-b-lg">
          <p className="text-sm font-medium truncate">{attachment.file_name}</p>
          <p className="text-xs text-gray-300">{attachment.file_size_formatted}</p>
        </div>
      </div>
    </div>
  )
}
