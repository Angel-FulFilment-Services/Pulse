import React, { useState } from 'react';
import { SmartImage } from '../../Utils/imageUtils.jsx';

export default function ImageWithLoading({ 
  filename,
  src, 
  alt, 
  className = "", 
  containerClassName = "",
  loadingContainerClassName = "",
  errorContainerClassName = "",
  showErrorState = true,
  path = 'articles/questions'
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div className={containerClassName}>
      {/* Loading State */}
      {loading && (
        <div className={`flex items-center justify-center ${loadingContainerClassName || className}`}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-theme-500 dark:border-theme-400 mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-dark-400">Loading image...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && showErrorState && (
        <div className={`flex items-center justify-center ${errorContainerClassName || className}`}>
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 dark:text-dark-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-dark-400">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      <SmartImage 
        filename={filename || src}
        alt={alt}
        className={`${className} ${loading || error ? 'hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        path={path}
      />
    </div>
  );
}
