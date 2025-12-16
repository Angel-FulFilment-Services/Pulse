import React, { useState, useRef, useEffect } from 'react'
import { useFloating, offset, flip, shift as shiftMiddleware, autoUpdate } from '@floating-ui/react'
import { EnvelopeIcon, PaperAirplaneIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { UserIcon } from '@heroicons/react/24/solid'
import { differenceInMinutes, differenceInHours, differenceInDays, format, isToday, isTomorrow, parseISO } from 'date-fns'
import { useUserStates } from '../Context/ActiveStateContext'

// Format the last active time in a human-readable way
const formatLastActive = (lastActiveAt) => {
  if (!lastActiveAt) return 'Offline'
  
  const now = new Date()
  const lastActive = new Date(lastActiveAt)
  const minutesAgo = differenceInMinutes(now, lastActive)
  const hoursAgo = differenceInHours(now, lastActive)
  const daysAgo = differenceInDays(now, lastActive)
  
  if (minutesAgo <= 2) {
    return 'Active now'
  } else if (minutesAgo < 60) {
    return `Last seen ${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
  } else if (hoursAgo < 24) {
    return `Last seen ${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
  } else if (daysAgo < 7) {
    return `Last seen ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
  } else {
    return `Last seen ${format(lastActive, 'MMM d, yyyy')}`
  }
}

// Get the status indicator color
const getStatusColor = (lastActiveAt) => {
  if (!lastActiveAt) return 'bg-gray-300 dark:bg-gray-500'
  
  const minutesAgo = differenceInMinutes(new Date(), new Date(lastActiveAt))
  if (minutesAgo <= 2.5) {
    return 'bg-green-500'
  } else if (minutesAgo <= 30) {
    return 'bg-yellow-500'
  } else {
    return 'bg-gray-300 dark:bg-gray-500'
  }
}

// Format shift time (HH:MM:SS to HH:MM)
const formatShiftTime = (time) => {
  if (!time) return ''
  return time.substring(0, 5)
}

// Format shift info for display
const formatShiftInfo = (shift) => {
  if (!shift) return null
  
  const shiftDate = parseISO(shift.date)
  const timeRange = `${formatShiftTime(shift.start)} - ${formatShiftTime(shift.end)}`
  
  if (shift.is_current) {
    return { label: 'Working now', time: timeRange, icon: 'clock', color: 'text-green-600 dark:text-green-400' }
  }
  
  if (shift.is_upcoming) {
    if (isToday(shiftDate)) {
      return { label: 'Today', time: timeRange, icon: 'calendar', color: 'text-theme-600 dark:text-theme-400' }
    } else if (isTomorrow(shiftDate)) {
      return { label: 'Tomorrow', time: timeRange, icon: 'calendar', color: 'text-gray-600 dark:text-dark-400' }
    } else {
      return { label: format(shiftDate, 'EEE, MMM d'), time: timeRange, icon: 'calendar', color: 'text-gray-600 dark:text-dark-400' }
    }
  }
  
  if (shift.is_past) {
    if (isToday(shiftDate)) {
      return { label: 'Finished today', time: timeRange, icon: 'clock', color: 'text-gray-500 dark:text-dark-500' }
    } else {
      return { label: `Last worked ${format(shiftDate, 'MMM d')}`, time: timeRange, icon: 'clock', color: 'text-gray-500 dark:text-dark-500' }
    }
  }
  
  return null
}

// Helper function to get API headers
const getHeaders = () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
  }
}

export default function ContactCard({ 
  contact, 
  children, 
  onSendMessage,
  disabled = false,
  placement = 'right-start'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [shift, setShift] = useState(null)
  const [shiftLoading, setShiftLoading] = useState(false)
  const hoverTimeoutRef = useRef(null)
  const leaveTimeoutRef = useRef(null)
  const inputRef = useRef(null)
  
  const { userStates } = useUserStates()
  
  // Get user state from context
  const userState = React.useMemo(() => {
    if (contact?.id && userStates && typeof userStates === 'object') {
      return Object.values(userStates).find(u => u.user_id === contact.id)
    }
    return undefined
  }, [userStates, contact?.id])
  
  const profilePhoto = userState?.profile_photo || null
  const lastActiveAt = userState?.pulse_last_active_at || null
  const jobTitle = userState?.job_title || contact?.job_title || null
  const email = contact?.email || userState?.email || null
  
  const { refs, floatingStyles } = useFloating({
    placement,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shiftMiddleware({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate,
  })
  
  // Fetch shift data when card opens
  useEffect(() => {
    if (isOpen && contact?.id && !shift && !shiftLoading) {
      setShiftLoading(true)
      fetch(`/api/chat/users/${contact.id}/shift`, {
        credentials: 'same-origin',
        headers: getHeaders()
      })
        .then(res => res.ok ? res.json() : { shift: null })
        .then(data => setShift(data.shift))
        .catch(() => setShift(null))
        .finally(() => setShiftLoading(false))
    }
  }, [isOpen, contact?.id])
  
  // Reset shift when contact changes
  useEffect(() => {
    setShift(null)
    setShiftLoading(false)
  }, [contact?.id])
  
  const handleMouseEnter = () => {
    if (disabled) return
    
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    
    // Set a small delay before showing the card
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true)
    }, 300)
  }
  
  const handleMouseLeave = () => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    // Add a small delay before hiding to allow moving to the card
    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setMessage('') // Clear message when closing
    }, 150)
  }
  
  const handleCardMouseEnter = () => {
    // Clear any pending leave timeout when entering the card
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }
  
  const handleCardMouseLeave = () => {
    // Hide the card when leaving
    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setMessage('') // Clear message when closing
    }, 150)
  }
  
  const handleSendMessage = async (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    if (!message.trim() || isSending || !contact?.id) return
    
    setIsSending(true)
    
    try {
      // Send the message directly via API
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({
          recipient_id: contact.id,
          body: message.trim()
        })
      })
      
      if (response.ok) {
        setMessage('')
        setIsOpen(false)
        // Optionally notify parent that a message was sent
        onSendMessage?.(contact, message.trim())
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
    }
  }, [])
  
  const shiftInfo = formatShiftInfo(shift)
  
  return (
    <>
      {/* Trigger element (wraps children) */}
      <div
        ref={refs.setReference}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex"
      >
        {children}
      </div>
      
      {/* Contact Card */}
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-[100]"
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-700 w-72 overflow-hidden">
            {/* Header with profile photo */}
            <div className="bg-gradient-to-br from-theme-500 to-theme-600 p-4">
              <div className="flex items-center gap-3">
                {/* Profile Photo */}
                <div className="relative flex-shrink-0">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    {profilePhoto && !imageError ? (
                      <img
                        src={`https://pulse-cdn.angelfs.co.uk/profile/images/${profilePhoto}`}
                        className="w-full h-full object-cover"
                        alt={contact?.name}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <UserIcon className="w-10 h-10 text-white/60" />
                    )}
                  </div>
                  {/* Status indicator */}
                  <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full border-2 border-white dark:border-dark-800">
                    <span className={`block h-full w-full rounded-full ${getStatusColor(lastActiveAt)}`} />
                  </span>
                </div>
                
                {/* Name and Job Title */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">
                    {contact?.name || 'Unknown User'}
                  </h3>
                  {jobTitle && (
                    <p className="text-white/80 text-sm truncate">
                      {jobTitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-3 space-y-2">
              {/* Activity Status */}
              <div className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${getStatusColor(lastActiveAt)}`} />
                <span className="text-gray-600 dark:text-dark-400">
                  {formatLastActive(lastActiveAt)}
                </span>
              </div>
              
              {/* Shift Info */}
              {shiftLoading ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-600 animate-pulse flex-shrink-0" />
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-600 animate-pulse" />
                </div>
              ) : shiftInfo ? (
                <div className="flex items-center gap-2 text-sm">
                  {shiftInfo.icon === 'clock' ? (
                    <ClockIcon className={`h-4 w-4 flex-shrink-0 ${shiftInfo.color}`} />
                  ) : (
                    <CalendarIcon className={`h-4 w-4 flex-shrink-0 ${shiftInfo.color}`} />
                  )}
                  <span className={shiftInfo.color}>
                    {shiftInfo.label}: {shiftInfo.time}
                  </span>
                </div>
              ) : null}
              
              {/* Email */}
              {email && (
                <div className="flex items-center gap-2 text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-dark-500 flex-shrink-0" />
                  <a 
                    href={`mailto:${email}`}
                    className="text-gray-600 dark:text-dark-400 hover:text-theme-600 dark:hover:text-theme-400 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {email}
                  </a>
                </div>
              )}
            </div>
            
            {/* Quick Message Input */}
            <div className="border-t border-gray-200 dark:border-dark-700 p-2">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a quick message..."
                  className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                  disabled={isSending}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className="p-2 text-white bg-theme-500 hover:bg-theme-600 disabled:bg-gray-300 dark:disabled:bg-dark-600 disabled:cursor-not-allowed rounded-md transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
