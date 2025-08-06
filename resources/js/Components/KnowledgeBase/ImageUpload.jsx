import React, { useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';

export default function ImageUpload({ currentImage, onImageChange, placeholder = "Drop an image here or click to upload" }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const { props } = usePage();

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG, and GIF files are allowed');
    }
    if (file.size > maxFileSize) {
      throw new Error('File size must be less than 5MB');
    }
    return true;
  };

  const processFile = async (file) => {
    try {
      validateFile(file);
      setUploadError(null);

      // Create a data URL for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        // Pass the file object and data URL to parent
        onImageChange({
          file: file,
          dataUrl: e.target.result,
          isNew: true
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError(error.message);
      console.error('File processing error:', error);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only set dragging to false if we're leaving the container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Image Display */}
      {currentImage && (
        <div className="relative">
          <img 
            src={currentImage.isNew ? currentImage.dataUrl : `https://pulse.cdn.angelfs.co.uk/articles/questions/${currentImage}`}
            alt="Uploaded image"
            className="max-w-md h-auto rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-2 mx-auto block"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <button
            onClick={handleClearImage}
            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
            title="Remove image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Area - Only show when no image is loaded */}
      {!currentImage && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200
            ${isDragging 
              ? 'border-theme-500 bg-theme-50 dark:bg-theme-900/20' 
              : 'border-gray-300 dark:border-dark-600 hover:border-gray-400 dark:hover:border-dark-500'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-2">
            <svg className="w-8 h-8 text-gray-400 dark:text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-dark-400">{placeholder}</p>
            <p className="text-xs text-gray-500 dark:text-dark-500">JPG, PNG, GIF up to 5MB</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadError && (
        <div className="text-red-600 dark:text-red-400 text-sm text-center">
          {uploadError}
        </div>
      )}
    </div>
  );
}
