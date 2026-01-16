import React, { useState, useEffect } from 'react'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

// Cache for link metadata to avoid repeated fetches
const metadataCache = new Map()

// Normalize a URL by adding https:// if needed
export function normalizeUrl(url) {
  if (!url) return url
  return url.startsWith('http') ? url : `https://${url}`
}

// Fetch metadata for a URL
export async function fetchLinkMetadata(url) {
  // Normalize URL - add https:// if missing
  const normalizedUrl = normalizeUrl(url)
  
  // Check cache first
  if (metadataCache.has(normalizedUrl)) {
    return metadataCache.get(normalizedUrl)
  }

  try {
    const response = await fetch(`/api/chat/link-preview?url=${encodeURIComponent(normalizedUrl)}`, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      }
    })

    if (response.ok) {
      const data = await response.json()
      metadataCache.set(normalizedUrl, data)
      return data
    }
  } catch (error) {
    console.error('Error fetching link metadata:', error)
  }

  // Return basic metadata on failure
  try {
    const domain = new URL(normalizedUrl).hostname
    const basicMetadata = {
      url: normalizedUrl,
      title: domain,
      description: null,
      image: null,
      favicon: null,
      domain
    }
    metadataCache.set(normalizedUrl, basicMetadata)
    return basicMetadata
  } catch {
    return { url: normalizedUrl, title: url, description: null, image: null, favicon: null, domain: url }
  }
}

// URL regex pattern - matches http://, https://, or www. URLs
// Requires a valid domain structure: at least domain.tld (e.g., youtube.com, gov.uk)
export const URL_REGEX = /(?:https?:\/\/[^\s<>\[\](){}'",]+|www\.[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s<>\[\](){}'",]*)/gi

// Extract URLs from text
export function extractUrls(text) {
  if (!text) return []
  const matches = text.match(URL_REGEX)
  return matches ? [...new Set(matches)] : []
}

// Link preview card component for underneath message bubbles
export function LinkPreviewCard({ url, isMyMessage = false, hasContent = true }) {
  const [metadata, setMetadata] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [faviconError, setFaviconError] = useState(false)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetchLinkMetadata(url).then((data) => {
      setMetadata(data)
      setIsLoading(false)
    })
  }, [url])

  // Get display domain
  const domain = metadata?.domain || (() => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  })()

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`block ${hasContent ? 'mt-2' : ''} rounded-lg overflow-hidden border max-w-xs w-80 animate-pulse ${
          isMyMessage 
            ? 'bg-white/20 border-white/20' 
            : 'bg-gray-100 dark:bg-dark-800 border-gray-300/75 dark:border-dark-500/50'
        }`}
      >
        {/* Skeleton image */}
        <div className={`w-full h-28 ${isMyMessage ? 'bg-white/5' : 'bg-gray-300/75 dark:bg-dark-500/75'}`} />
        
        <div className="p-2.5 space-y-2">
          {/* Skeleton site info */}
          <div className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-sm ${isMyMessage ? 'bg-white/20' : 'bg-gray-300 dark:bg-dark-600'}`} />
            <div className={`h-3 w-20 rounded ${isMyMessage ? 'bg-white/20' : 'bg-gray-300 dark:bg-dark-600'}`} />
          </div>
          {/* Skeleton title */}
          <div className={`h-4 w-full rounded ${isMyMessage ? 'bg-white/20' : 'bg-gray-300 dark:bg-dark-600'}`} />
          {/* Skeleton description */}
          <div className={`h-3 w-3/4 rounded ${isMyMessage ? 'bg-white/20' : 'bg-gray-300 dark:bg-dark-600'}`} />
        </div>
      </div>
    )
  }

  if (!metadata) {
    return null
  }

  // Normalize URL for the link
  const linkUrl = normalizeUrl(url)

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block ${hasContent ? 'mt-2' : ''} rounded-lg overflow-hidden border transition-colors max-w-xs ${
        isMyMessage 
          ? 'bg-white/20 border-white/20 hover:bg-white/25' 
          : 'bg-gray-100 dark:bg-dark-800 border-gray-300/75 dark:border-dark-500/50 hover:bg-gray-100/75 dark:hover:bg-dark-800/50'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Image preview */}
      {metadata.image && !imageError && (
        <div className="w-full h-28 bg-gray-100 dark:bg-dark-700 overflow-hidden">
          <img
            src={metadata.image}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      
      <div className="p-2.5">
        {/* Site info */}
        <div className="flex items-center gap-1.5 mb-1">
          {metadata.favicon && !faviconError ? (
            <img
              src={metadata.favicon}
              alt=""
              className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <GlobeAltIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isMyMessage ? 'text-white/60' : 'text-gray-400 dark:text-dark-400'}`} />
          )}
          <span className={`text-xs truncate ${isMyMessage ? 'text-white/60' : 'text-gray-500 dark:text-dark-400'}`}>
            {metadata.site_name || domain}
          </span>
        </div>
        
        {/* Title */}
        <h4 className={`text-sm font-medium line-clamp-2 ${isMyMessage ? 'text-white' : 'text-gray-900 dark:text-dark-50'}`}>
          {metadata.title || domain}
        </h4>
        
        {/* Description */}
        {metadata.description && (
          <p className={`text-xs line-clamp-2 mt-0.5 ${isMyMessage ? 'text-white/70' : 'text-gray-500 dark:text-dark-400'}`}>
            {metadata.description}
          </p>
        )}
      </div>
    </a>
  )
}

// Compact link preview for message input (no image, horizontal layout)
export function LinkPreviewMini({ url, metadata, onRemove, isLoading = false }) {
  const [faviconError, setFaviconError] = useState(false)
  
  // Get display domain
  const domain = metadata?.domain || (() => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  })()

  const title = metadata?.title || domain
  const truncatedTitle = title.length > 30 ? title.substring(0, 27) + '...' : title

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-2.5 py-1.5 min-w-0 animate-pulse">
        {/* Skeleton favicon */}
        <div className="w-4 h-4 rounded-sm bg-gray-300 dark:bg-dark-600 flex-shrink-0" />
        {/* Skeleton title */}
        <div className="h-3 w-24 rounded bg-gray-300 dark:bg-dark-600" />
        {/* Skeleton remove button */}
        <div className="ml-auto w-3.5 h-3.5 rounded bg-gray-300 dark:bg-dark-600 flex-shrink-0" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-2.5 py-1.5 min-w-0">
      {/* Favicon */}
      {metadata?.favicon && !faviconError ? (
        <img
          src={metadata.favicon}
          alt=""
          className="w-4 h-4 rounded-sm flex-shrink-0"
          onError={() => setFaviconError(true)}
        />
      ) : (
        <GlobeAltIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
      
      {/* Title */}
      <span className="text-xs font-medium text-gray-700 dark:text-dark-200 truncate" title={url}>
        {truncatedTitle}
      </span>
      
      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove(url)
          }}
          className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-dark-300 flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
