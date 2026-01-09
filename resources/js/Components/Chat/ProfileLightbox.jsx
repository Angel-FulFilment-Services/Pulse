import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ring } from 'ldrs';

// Register the ring spinner
ring.register();

export default function ProfileLightbox({ photoUrl, onClose }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
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

      {/* Loading spinner */}
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

      {/* Profile image */}
      <div 
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photoUrl}
          alt="Profile photo"
          className={`max-w-full max-h-[90vh] object-contain rounded-2xl transition-opacity duration-300 bg-neutral-900 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
    </div>,
    document.body
  );
}
