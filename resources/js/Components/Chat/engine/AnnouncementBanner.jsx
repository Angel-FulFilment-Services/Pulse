import React, { useState, useEffect } from 'react'
import { XMarkIcon, MegaphoneIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'

// Local storage key for locally dismissed announcements
const DISMISSED_ANNOUNCEMENTS_KEY = 'pulse_dismissed_announcements'

// Get dismissed announcement IDs from local storage
const getDismissedAnnouncementIds = () => {
  try {
    const stored = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save dismissed announcement ID to local storage
const saveDismissedAnnouncementId = (id) => {
  try {
    const dismissed = getDismissedAnnouncementIds()
    if (!dismissed.includes(id)) {
      dismissed.push(id)
      localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(dismissed))
    }
  } catch {
    // Ignore storage errors
  }
}

export default function AnnouncementBanner({ announcements = [], onDismiss, canDismiss = false, chatId, chatType }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [locallyDismissed, setLocallyDismissed] = useState([])
  
  // Load locally dismissed announcements on mount
  useEffect(() => {
    setLocallyDismissed(getDismissedAnnouncementIds())
  }, [])
  
  // Reset current index when announcements change
  useEffect(() => {
    setCurrentIndex(0)
  }, [announcements.length, chatId, chatType])
  
  // Only show active (non-expired) announcements that haven't been locally dismissed
  const activeAnnouncements = announcements.filter(a => {
    // Check if expired
    if (a.expires_at && new Date(a.expires_at) <= new Date()) return false
    // Check if locally dismissed (for non-authorized users)
    if (locallyDismissed.includes(a.id)) return false
    return true
  })
  
  if (activeAnnouncements.length === 0) return null

  // Ensure current index is valid
  const safeIndex = Math.min(currentIndex, activeAnnouncements.length - 1)
  const announcement = activeAnnouncements[safeIndex]

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return ''
    }
  }

  const getExpiryText = (expiresAt) => {
    if (!expiresAt) return ''
    try {
      const expiry = new Date(expiresAt)
      const now = new Date()
      const hoursRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60))
      
      if (hoursRemaining <= 1) return 'Expires in less than an hour'
      if (hoursRemaining < 24) return `Expires in ${hoursRemaining} hours`
      const daysRemaining = Math.ceil(hoursRemaining / 24)
      return `Expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
    } catch {
      return ''
    }
  }
  
  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }
  
  const handleNext = () => {
    setCurrentIndex(prev => Math.min(activeAnnouncements.length - 1, prev + 1))
  }
  
  const handleDismiss = (announcementId) => {
    if (canDismiss) {
      // User has permission - actually delete from server
      onDismiss?.(announcementId)
    } else {
      // User doesn't have permission - just hide locally
      saveDismissedAnnouncementId(announcementId)
      setLocallyDismissed(prev => [...prev, announcementId])
      // Adjust index if needed
      if (safeIndex >= activeAnnouncements.length - 1) {
        setCurrentIndex(prev => Math.max(0, prev - 1))
      }
    }
  }

  return (
    <div className="bg-theme-50 dark:bg-theme-900/20 border-b border-theme-200 dark:border-theme-800 px-6 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <MegaphoneIcon className="w-5 h-5 text-theme-600 dark:text-theme-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Creator info */}
          <div className="flex items-center gap-2 text-xs text-theme-700 dark:text-theme-400 font-medium mb-1">
            <span className="py-0.5">{announcement.creator?.name || 'Someone'} made an announcement</span>
            <span className="text-theme-500 dark:text-theme-600">•</span>
            <span className="text-theme-600 dark:text-theme-500">{formatTime(announcement.created_at)}</span>
            {announcement.scope === 'global' && (
              <>
                <span className="text-theme-500 dark:text-theme-600">•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-theme-200 dark:bg-theme-800 text-theme-800 dark:text-theme-200">
                  Global
                </span>
              </>
            )}
          </div>
          
          {/* Announcement message */}
          <p className="text-sm text-theme-900 dark:text-theme-100 leading-relaxed">
            {announcement.message}
          </p>
        </div>
        
        {/* Dismiss button - always visible, behavior differs based on permissions */}
        <button
          onClick={() => handleDismiss(announcement.id)}
          className="flex-shrink-0 p-1 rounded text-theme-600 dark:text-theme-400 hover:bg-theme-200 dark:hover:bg-theme-800 transition-colors"
          title={canDismiss ? "Dismiss announcement for everyone" : "Hide announcement"}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Navigation for multiple announcements */}
      {activeAnnouncements.length > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={safeIndex === 0}
              className="p-1 rounded text-theme-600 dark:text-theme-400 hover:bg-theme-200 dark:hover:bg-theme-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-xs text-theme-600 dark:text-theme-400 font-medium">
              {safeIndex + 1} of {activeAnnouncements.length}
            </span>
            <button
              onClick={handleNext}
              disabled={safeIndex === activeAnnouncements.length - 1}
              className="p-1 rounded text-theme-600 dark:text-theme-400 hover:bg-theme-200 dark:hover:bg-theme-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Dot indicators */}
          <div className="flex items-center gap-1 mr-1.5">
            {activeAnnouncements.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === safeIndex 
                    ? 'bg-theme-600 dark:bg-theme-400' 
                    : 'bg-theme-300 dark:bg-theme-700 hover:bg-theme-400 dark:hover:bg-theme-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
