import React, { useState, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { SmartImage } from '../../Utils/imageUtils.jsx';

export default function ImageUpload({ currentImage, onImageChange, placeholder = "Drop an image here or click to upload", disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef(null);
  const { props } = usePage();

  // Reset image load error when currentImage changes
  useEffect(() => {
    setImageLoadError(false);
  }, [currentImage]);

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
      setImageLoading(true);

      // Create a data URL for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        // Pass the file object and data URL to parent
        onImageChange({
          file: file,
          dataUrl: e.target.result,
          isNew: true
        });
        setImageLoading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError(error.message);
      setImageLoading(false);
      console.error('File processing error:', error);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging && !disabled) {
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
    if (disabled) return;
    
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleClearImage = () => {
    if (!disabled) {
      setImageLoading(false);
      setImageLoadError(false);
      onImageChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Loading State */}
      {imageLoading && (
        <div className="relative">
          <div className="max-w-md h-48 rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-2 mx-auto flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-theme-500 dark:border-theme-400 mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-dark-400">Processing image...</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Image Display */}
      {currentImage && !imageLoading && (
        <div className="relative">
          {!imageLoadError ? (
            <>
              <SmartImage 
                filename={currentImage.isNew ? currentImage : currentImage}
                alt="Uploaded image"
                className="max-w-md h-auto rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-2 mx-auto block"
                onLoad={() => setImageLoadError(false)}
                onError={(e) => {
                  setImageLoadError(true);
                  console.error('Image failed to load:', e.target.src);
                }}
              />
              <button
                onClick={handleClearImage}
                disabled={disabled}
                className={`absolute top-1 right-1 rounded-full p-2 shadow-lg transition-all duration-200 ${
                  disabled 
                    ? 'bg-red-400 dark:bg-red-500 text-white opacity-50 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <div className="max-w-md h-48 rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-2 mx-auto flex items-center justify-center relative">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 dark:text-dark-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-dark-400">Failed to load image</p>
              </div>
              <button
                onClick={handleClearImage}
                disabled={disabled}
                className={`absolute top-1 right-1 rounded-full p-2 shadow-lg transition-all duration-200 ${
                  disabled 
                    ? 'bg-red-400 dark:bg-red-500 text-white opacity-50 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Area - Only show when no image is loaded and not loading */}
      {!currentImage && !imageLoading && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${disabled 
              ? 'border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 opacity-50 cursor-not-allowed' 
              : isDragging 
                ? 'border-theme-500 bg-theme-50 dark:bg-theme-900/20 cursor-pointer' 
                : 'border-gray-300 dark:border-dark-600 hover:border-gray-400 dark:hover:border-dark-500 cursor-pointer'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-2">
            <svg className={`w-8 h-8 transition-all ${
              disabled ? 'text-gray-400 dark:text-dark-500 opacity-60' : 'text-gray-400 dark:text-dark-500'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className={`text-sm transition-all ${
              disabled ? 'text-gray-500 dark:text-dark-500 opacity-60' : 'text-gray-600 dark:text-dark-400'
            }`}>{disabled ? 'Upload disabled during save' : placeholder}</p>
            <p className={`text-xs transition-all ${
              disabled ? 'text-gray-400 dark:text-dark-600 opacity-60' : 'text-gray-500 dark:text-dark-500'
            }`}>JPG, PNG, GIF up to 5MB</p>
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
