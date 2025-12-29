import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { ring } from 'ldrs'
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { useRestrictedWords } from './engine/useRestrictedWords'

// Register the ring spinner
ring.register()

export default function CreateTeamDropdown({ 
  isOpen, 
  onClose, 
  onTeamCreated, 
  triggerRef,
  initialMember = null, // User to automatically add as member (for DM context)
  placement = 'bottom-end'
}) {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef(null)
  
  // Restricted words hook
  const { containsRestrictedWords, ensureWordsLoaded } = useRestrictedWords()
  
  // FloatingUI setup
  const { refs, floatingStyles } = useFloating({
    placement: placement,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  
  // Sync external trigger ref with FloatingUI reference when dropdown opens
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      refs.setReference(triggerRef.current)
    }
  }, [isOpen, triggerRef, refs])
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Load restricted words when dropdown opens
  useEffect(() => {
    if (isOpen) {
      ensureWordsLoaded()
    }
  }, [isOpen, ensureWordsLoaded])
  
  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setTeamName('')
      setTeamDescription('')
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
  
  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!teamName.trim() || isCreating) return
    
    // Check for restricted words in team name and description
    const nameHasRestricted = containsRestrictedWords(teamName.trim())
    const descHasRestricted = teamDescription.trim() && containsRestrictedWords(teamDescription.trim())
    
    if (nameHasRestricted || descHasRestricted) {
      toast.error('Team name or description contains restricted words. Please revise and try again.', {
        toastId: 'team-restricted-words',
        position: 'top-center',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      return
    }
    
    setIsCreating(true)
    
    try {
      // Create the team
      const response = await fetch('/api/chat/teams', {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({
          name: teamName.trim(),
          description: teamDescription.trim() || null
        })
      })
      
      if (response.ok) {
        const newTeam = await response.json()
        
        // If there's an initial member to add (from DM context), add them
        if (initialMember?.id) {
          try {
            await fetch(`/api/chat/teams/${newTeam.id}/members`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: getHeaders(),
              body: JSON.stringify({ user_id: initialMember.id })
            })
          } catch (error) {
            console.error('Error adding initial member:', error)
          }
        }
        
        toast.success(`Team "${newTeam.name}" created`, {
          toastId: 'team-created',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
        
        // Callback to parent with the new team
        onTeamCreated?.(newTeam)
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Error creating team:', errorData)
        toast.error('Failed to create team. Please try again.', {
          toastId: 'team-create-failed',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error('Failed to create team. Please try again.', {
        toastId: 'team-create-failed',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    } finally {
      setIsCreating(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[55]"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-[60]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-theme-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50">Create New Team</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400 dark:text-dark-400" />
          </button>
        </div>
        
        {/* Content */}
        <form onSubmit={handleCreateTeam} className="p-4">
          {/* Initial member indicator */}
          {initialMember && (
            <div className="mb-3 p-2 bg-theme-50 dark:bg-theme-900/20 rounded-lg">
              <p className="text-xs text-theme-700 dark:text-theme-300">
                <span className="font-medium">{initialMember.name}</span> will be added to this team
              </p>
            </div>
          )}
          
          {/* Team Name */}
          <div className="mb-3">
            <label htmlFor="teamNameDropdown" className="block text-xs font-medium text-gray-700 dark:text-dark-300 mb-1">
              Team Name *
            </label>
            <input
              ref={inputRef}
              type="text"
              id="teamNameDropdown"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
              required
            />
          </div>
          
          {/* Team Description */}
          <div className="mb-4">
            <label htmlFor="teamDescDropdown" className="block text-xs font-medium text-gray-700 dark:text-dark-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="teamDescDropdown"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Enter team description"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent resize-none"
            />
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!teamName.trim() || isCreating}
              className={`px-3 py-1.5 text-sm text-white rounded-lg ${
                teamName.trim() && !isCreating
                  ? 'bg-theme-600 hover:bg-theme-700' 
                  : 'bg-gray-300 dark:bg-dark-700 cursor-not-allowed'
              }`}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <l-ring
                    size="14"
                    stroke="2"
                    bg-opacity="0"
                    speed="2"
                    color="white"
                  ></l-ring>
                  Creating...
                </div>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
