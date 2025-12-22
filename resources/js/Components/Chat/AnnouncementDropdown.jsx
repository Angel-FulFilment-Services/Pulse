import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { XMarkIcon, MegaphoneIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import TextAreaInput from '../Forms/TextAreaInput'
import SelectInput from '../Forms/SelectInput'

const DURATION_OPTIONS = [
  { id: '1h', value: '1 Hour' },
  { id: '3h', value: '3 Hours' },
  { id: '6h', value: '6 Hours' },
  { id: '12h', value: '12 Hours' },
  { id: '1d', value: '1 Day' },
  { id: '3d', value: '3 Days' },
  { id: '7d', value: '1 Week' },
]

const MAX_MESSAGE_LENGTH = 500

export default function AnnouncementDropdown({ 
  isOpen, 
  onClose, 
  triggerRef, 
  scope = 'global', // 'global' or 'team'
  teamId = null,
  onAnnouncementCreated
}) {
  const [message, setMessage] = useState('')
  const [duration, setDuration] = useState('1d')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // FloatingUI positioning
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-end',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  
  // Sync trigger ref with floating UI
  useEffect(() => {
    if (triggerRef?.current) {
      refs.setReference(triggerRef.current)
    }
  }, [triggerRef, refs])
  
  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      setMessage('')
      setDuration('1d')
      setIsSubmitting(false)
    }
  }, [isOpen])
  
  // Close on escape
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])
  
  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e) => {
      if (refs.floating.current && !refs.floating.current.contains(e.target) &&
          triggerRef?.current && !triggerRef.current.contains(e.target)) {
        onClose()
      }
    }
    
    // Delay to prevent immediate close on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, refs.floating, triggerRef])
  
  const getHeaders = () => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!message.trim() || isSubmitting) return
    
    if (scope === 'team' && !teamId) {
      toast.error('Team ID is required for team announcements', {
        position: 'top-center',
        autoClose: 3000,
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/chat/announcements', {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({
          message: message.trim(),
          scope,
          team_id: scope === 'team' ? teamId : null,
          duration,
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(scope === 'global' ? 'Global announcement created!' : 'Team announcement created!', {
          position: 'top-center',
          autoClose: 3000,
        })
        onAnnouncementCreated?.(data.announcement)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create announcement', {
          position: 'top-center',
          autoClose: 3000,
        })
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast.error('Failed to create announcement', {
        position: 'top-center',
        autoClose: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!isOpen) return null
  
  const dropdown = (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-[9999] bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-700 w-80"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center gap-2">
          <MegaphoneIcon className="w-5 h-5 text-theme-500 dark:text-theme-400" />
          <h3 className="font-semibold text-gray-900 dark:text-dark-50">
            {scope === 'global' ? 'Global Announcement' : 'Team Announcement'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-dark-400" />
        </button>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Message */}
        <div>
          <TextAreaInput
            id="announcement-message"
            label="Message"
            placeholder="Enter your announcement..."
            currentState={message}
            onTextChange={(changes) => {
              const newValue = changes[0]?.value || ''
              setMessage(newValue.slice(0, MAX_MESSAGE_LENGTH))
            }}
            maxLength={MAX_MESSAGE_LENGTH}
            warnMaxLength={true}
            height="h-24"
          />
        </div>
        
        {/* Duration */}
        <div>
          <SelectInput
            id="announcement-duration"
            label="Duration"
            placeholder="Select duration..."
            currentState={DURATION_OPTIONS.find(opt => opt.id === duration)?.value || '1 Day'}
            items={DURATION_OPTIONS}
            onSelectChange={(changes) => {
              const selectedItem = DURATION_OPTIONS.find(opt => opt.value === changes[0]?.value)
              if (selectedItem) {
                setDuration(selectedItem.id)
              }
            }}
          />
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
            The announcement will automatically expire after this time
          </p>
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-theme-500 hover:bg-theme-600 disabled:bg-gray-300 dark:disabled:bg-dark-600 disabled:cursor-not-allowed text-white font-medium rounded-md shadow-sm transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            <>
              <MegaphoneIcon className="w-4 h-4" />
              Create Announcement
            </>
          )}
        </button>
      </form>
    </div>
  )
  
  return createPortal(dropdown, document.body)
}
