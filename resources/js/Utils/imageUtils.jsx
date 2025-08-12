import React, { useState, useEffect } from 'react';

/**
 * Get the appropriate image URL for knowledge base images
 * Follows the same logic as the backend getImageUrl method
 * @param {string} filename - The image filename
 * @param {string} path - The path prefix (default: 'articles/questions')
 * @returns {string|Object} The image URL or URL object with fallback info
 */
export function getImageUrl(filename, path = 'articles/questions') {
    if (!filename) return null;
    
    // If it's a new image with dataUrl, return as-is
    if (typeof filename === 'object' && filename.dataUrl) {
        return filename.dataUrl;
    }
    
    // For existing images, try R2 first, then fall back to local storage
    // We'll use a simple check - if the image loads from R2, great; if not, the onError handler can try local
    const r2Url = `https://pulse.cdn.angelfs.co.uk/${path}/${filename}`;
    const localUrl = `/storage/${path}/${filename}`;
    
    return { r2Url, localUrl, primaryUrl: r2Url };
}

/**
 * Get article image URL (uses 'articles' path instead of 'articles/questions')
 * @param {string} filename - The image filename
 * @returns {string|Object} The image URL or URL object with fallback info
 */
export function getArticleImageUrl(filename) {
    return getImageUrl(filename, 'articles');
}

/**
 * Smart image component that handles fallback from R2 to local storage
 * @param {Object} props - Component props
 * @param {string} props.filename - The image filename
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.className - CSS classes
 * @param {Function} props.onLoad - Load event handler
 * @param {Function} props.onError - Error event handler (optional, fallback is handled internally)
 * @param {string} props.path - Custom path prefix
 * @returns {JSX.Element} Image element with fallback logic
 */
export function SmartImage({ filename, alt, className, onLoad, onError, path = 'articles/questions', ...props }) {
    const [currentSrc, setCurrentSrc] = useState(null);
    const [hasTriedFallback, setHasTriedFallback] = useState(false);
    
    useEffect(() => {
        if (!filename) {
            setCurrentSrc(null);
            setHasTriedFallback(false);
            return;
        }
        
        // Reset state for new filename
        setHasTriedFallback(false);
        
        // Handle new images with dataUrl
        if (typeof filename === 'object' && filename.dataUrl) {
            setCurrentSrc(filename.dataUrl);
            return;
        }
        
        // For existing images, start with R2 URL
        const r2Url = `https://pulse.cdn.angelfs.co.uk/${path}/${filename}`;
        setCurrentSrc(r2Url);
    }, [filename, path]);
    
    const handleError = (e) => {
        // If we haven't tried local storage yet and we're currently showing R2 URL, try local
        if (!hasTriedFallback && currentSrc && currentSrc.includes('pulse.cdn.angelfs.co.uk')) {
            setHasTriedFallback(true);
            const localUrl = `/storage/${path}/${filename}`;
            setCurrentSrc(localUrl);
        } else {
            // Both R2 and local failed, call the external error handler if provided
            if (onError) {
                onError(e);
            }
        }
    };
    
    const handleLoad = (e) => {
        // Call the external load handler if provided
        if (onLoad) {
            onLoad(e);
        }
    };
    
    if (!currentSrc) {
        return null;
    }
    
    return (
        <img 
            src={currentSrc}
            alt={alt}
            className={className}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
        />
    );
}
