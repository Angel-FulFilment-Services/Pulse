import React, { useState, useEffect, useRef } from 'react'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { MagnifyingGlassIcon, XMarkIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import UserIcon from '../UserIcon'
import { ring } from 'ldrs'

// Register the ring spinner
ring.register()

export default function ForwardDropdown({ 
  isOpen, 
  onClose, 
  onForward,
  triggerRef,
  placement = 'bottom',
  forwardType = 'message', // 'message' or 'attachment'
  itemToForward = null, // message or attachment object
  isMyMessage = false // determines horizontal offset direction
}) {
  const [search, setSearch] = useState('')
  const [contacts, setContacts] = useState([])
  const [teams, setTeams] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isForwarding, setIsForwarding] = useState(false)
  const [isSearchingAll, setIsSearchingAll] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const inputRef = useRef(null)
  
  // FloatingUI setup
  const { refs, floatingStyles, x, y } = useFloating({
    placement: placement,
    middleware: [
      offset({ mainAxis: 16, crossAxis: isMyMessage ? -94 : 52.5 }),
      flip({ padding: 8 }),
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate,
  })
  
  // Sync external trigger ref with FloatingUI reference when dropdown opens
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      refs.setReference(triggerRef.current)
    }
  }, [isOpen, triggerRef, refs])
  
  // Show dropdown after position is calculated
  useEffect(() => {
    if (isOpen && x !== null && y !== null) {
      setIsPositioned(true)
    } else if (!isOpen) {
      setIsPositioned(false)
    }
  }, [isOpen, x, y])
  
  // Handle click outside and escape key (like EmojiPicker)
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e) => {
      const floatingEl = refs.floating.current
      const refEl = triggerRef?.current
      
      if (!floatingEl) return
      
      // Check if click is outside both the dropdown and the trigger element
      if (!floatingEl.contains(e.target) && (!refEl || !refEl.contains(e.target))) {
        onClose?.()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    // Delay adding the click listener to avoid catching the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    document.addEventListener('keydown', handleEscape)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, refs, triggerRef, onClose])
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setIsSearchingAll(false)
    }
  }, [isOpen])
  
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
  
  // Fetch contacts and teams when opened
  useEffect(() => {
    if (!isOpen) return
    
    setIsLoading(true)
    
    // Fetch contacts
    Promise.all([
      fetch('/api/chat/users', { credentials: 'same-origin', headers: getHeaders() })
        .then(res => res.ok ? res.json() : []),
      fetch('/api/chat/teams', { credentials: 'same-origin', headers: getHeaders() })
        .then(res => res.ok ? res.json() : [])
    ])
      .then(([contactsData, teamsData]) => {
        setContacts(Array.isArray(contactsData) ? contactsData : [])
        setTeams(Array.isArray(teamsData) ? teamsData : [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [isOpen])
  
  // Search all users when typing (debounced)
  useEffect(() => {
    if (!search.trim()) {
      setAllUsers([])
      setIsSearchingAll(false)
      return
    }
    
    setIsSearchingAll(true)
    const timer = setTimeout(() => {
      fetch('/api/chat/users/all', { credentials: 'same-origin', headers: getHeaders() })
        .then(res => res.ok ? res.json() : [])
        .then(data => setAllUsers(Array.isArray(data) ? data : []))
        .catch(() => setAllUsers([]))
        .finally(() => setIsSearchingAll(false))
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])
  
  // Filter contacts based on search
  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase())
  )
  
  // Filter teams based on search
  const filteredTeams = teams.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase())
  )
  
  // Filter all users (exclude already shown contacts)
  const contactIds = contacts.map(c => c.id)
  const filteredAllUsers = search.trim() 
    ? allUsers.filter(u => 
        !contactIds.includes(u.id) &&
        u.name?.toLowerCase().includes(search.toLowerCase())
      )
    : []
  
  // Handle forward to user
  const handleForwardToUser = async (user) => {
    setIsForwarding(true)
    try {
      await onForward?.({ type: 'dm', recipientId: user.id, recipientName: user.name })
      onClose()
    } catch (error) {
      console.error('Forward failed:', error)
    } finally {
      setIsForwarding(false)
    }
  }
  
  // Handle forward to team
  const handleForwardToTeam = async (team) => {
    setIsForwarding(true)
    try {
      await onForward?.({ type: 'team', teamId: team.id, teamName: team.name })
      onClose()
    } catch (error) {
      console.error('Forward failed:', error)
    } finally {
      setIsForwarding(false)
    }
  }
  
  if (!isOpen || !isPositioned) return null
  
  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-[60]"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <ArrowRightIcon className="w-5 h-5 text-theme-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50">
              Forward {forwardType === 'attachment' ? 'Attachment' : 'Message'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400 dark:text-dark-400" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="p-2 border-b border-gray-200 dark:border-dark-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search contacts or all users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <l-ring size="24" stroke="3" color="currentColor" className="text-theme-500" />
            </div>
          ) : (
            <>
              {/* Teams Section */}
              {filteredTeams.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider bg-gray-50 dark:bg-dark-900">
                    Teams
                  </div>
                  {filteredTeams.map(team => (
                    <button
                      key={`team-${team.id}`}
                      onClick={() => handleForwardToTeam(team)}
                      disabled={isForwarding}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 text-left disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-theme-100 dark:bg-theme-900/30 flex items-center justify-center flex-shrink-0">
                        <UserGroupIcon className="w-4 h-4 text-theme-600 dark:text-theme-400" />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-dark-50 truncate">{team.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Contacts Section */}
              {filteredContacts.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider bg-gray-50 dark:bg-dark-900">
                    Contacts
                  </div>
                  {filteredContacts.map(contact => (
                    <button
                      key={`contact-${contact.id}`}
                      onClick={() => handleForwardToUser(contact)}
                      disabled={isForwarding}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 text-left disabled:opacity-50"
                    >
                      <UserIcon contact={contact} size="small" />
                      <span className="text-sm text-gray-900 dark:text-dark-50 truncate">{contact.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* All Users Section (only when searching) */}
              {search.trim() && filteredAllUsers.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider bg-gray-50 dark:bg-dark-900">
                    All Users
                  </div>
                  {filteredAllUsers.map(user => (
                    <button
                      key={`user-${user.id}`}
                      onClick={() => handleForwardToUser(user)}
                      disabled={isForwarding}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 text-left disabled:opacity-50"
                    >
                      <UserIcon contact={user} size="small" />
                      <span className="text-sm text-gray-900 dark:text-dark-50 truncate">{user.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Loading indicator for user search */}
              {isSearchingAll && (
                <div className="flex items-center justify-center py-4">
                  <l-ring size="20" stroke="2" color="currentColor" className="text-gray-400" />
                </div>
              )}
              
              {/* Empty state */}
              {!isLoading && !isSearchingAll && filteredTeams.length === 0 && filteredContacts.length === 0 && filteredAllUsers.length === 0 && (
                <div className="px-3 py-8 text-sm text-gray-500 dark:text-dark-400 text-center">
                  {search ? 'No results found' : 'No contacts available'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
  )
}
