import React, { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import UserIcon from '../UserIcon.jsx'
import MessageInput from './MessageInput'

export default function ComposeMode({ 
  currentUser, 
  onChatSelect,
  onMessageSend,
  onRefreshContacts
}) {
  const [recipientSearch, setRecipientSearch] = useState('')
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)
  const [composeRecipient, setComposeRecipient] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [composeAttachments, setComposeAttachments] = useState([])
  const [clearAttachmentsTrigger, setClearAttachmentsTrigger] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [allTeams, setAllTeams] = useState([])

  // Track when attachments change
  const handleAttachmentsChange = (attachments) => {
    console.log('ComposeMode received attachments:', { count: attachments.length, attachments })
    setComposeAttachments(attachments)
  }

  // Fetch users and teams
  useEffect(() => {
    // Fetch all users (not just ones with existing chats)
    fetch('/api/chat/users/all', { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllUsers(Array.isArray(data) ? data : []))
      .catch(() => setAllUsers([]))

    // Fetch teams
    fetch('/api/chat/teams', { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllTeams(Array.isArray(data) ? data : []))
      .catch(() => setAllTeams([]))
  }, [])

  // Handle recipient selection
  const handleRecipientSelect = async (recipient, type) => {
    setShowRecipientDropdown(false)
    
    if (type === 'dm') {
      // Check if there's an existing conversation with this user
      try {
        const res = await fetch(`/api/chat/check-conversation?user_id=${recipient.id}`, { 
          credentials: 'same-origin',
          headers: {
            'Accept': 'application/json'
          }
        })
        
        const data = res.ok ? await res.json() : { exists: false }
        
        if (data.exists) {
          // If conversation exists, open it directly (don't set compose recipient)
          onChatSelect(recipient, 'dm')
          return
        }
      } catch (error) {
        console.error('Error checking existing conversation:', error)
      }
    }
    
    // No existing conversation or it's a team, set up compose mode
    setComposeRecipient({ ...recipient, type })
    setRecipientSearch(recipient.name)
  }

  // Filter recipients based on search
  const filteredUsers = allUsers.filter(user => 
    user.name?.toLowerCase().includes(recipientSearch.toLowerCase())
  )
  
  const filteredTeams = allTeams.filter(team => 
    team.name?.toLowerCase().includes(recipientSearch.toLowerCase())
  )

  // Handle sending message in compose mode
  const handleComposeMessageSend = async (e) => {
    e?.preventDefault()
    console.log('ComposeMode sending message:', { message: newMessage, attachmentsCount: composeAttachments.length })
    if (!composeRecipient || (!newMessage.trim() && composeAttachments.length === 0)) return
    
    const success = await onMessageSend(newMessage, composeRecipient, composeRecipient.type, composeAttachments)
    
    console.log('ComposeMode send result:', { success })
    if (success) {
      console.log('Clearing compose state and toggling clearAttachmentsTrigger')
      setNewMessage('')
      setComposeAttachments([])
      setClearAttachmentsTrigger(prev => !prev) // Toggle to trigger MessageInput cleanup
      // Refresh contacts list if this was a new DM conversation
      if (composeRecipient.type === 'dm' && onRefreshContacts) {
        onRefreshContacts()
      }
      onChatSelect(composeRecipient, composeRecipient.type)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-dark-900">
      {/* Compose Header */}
      <div className="px-6 py-2 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 min-h-[5.31rem]">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="w-12 h-12 bg-theme-500 dark:bg-theme-600 rounded-lg flex items-center justify-center mr-6">
              <PaperAirplaneIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-50">New Chat</h2>
              
              {/* Recipient Selection */}
              <div className="relative mt-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-dark-400 mr-2">To:</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Type a name, channel, or tag"
                      value={recipientSearch}
                      onChange={(e) => {
                        setRecipientSearch(e.target.value)
                        setShowRecipientDropdown(true)
                      }}
                      onFocus={() => setShowRecipientDropdown(true)}
                      className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                    />
                    
                    {/* Dropdown */}
                    {showRecipientDropdown && recipientSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {/* Users */}
                        {filteredUsers.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-dark-400 bg-gray-50 dark:bg-dark-900">PEOPLE</div>
                            {filteredUsers.map(user => (
                              <button
                                key={`user-${user.id}`}
                                onClick={() => handleRecipientSelect(user, 'dm')}
                                className="w-full flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 text-left"
                              >
                                <div className="w-6 h-6 bg-gray-300 dark:bg-dark-600 rounded-full flex items-center justify-center mr-3">
                                  {user.avatar ? (
                                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                                  ) : (
                                    <UserIcon size="extra-small" contact={user} />
                                  )}
                                </div>
                                <span className="text-sm text-gray-900 dark:text-dark-50">{user.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Teams */}
                        {filteredTeams.length > 0 && (
                          <div>
                            {filteredUsers.length > 0 && <div className="border-t border-gray-200 dark:border-dark-700"></div>}
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-dark-400 bg-gray-50 dark:bg-dark-900">TEAMS</div>
                            {filteredTeams.map(team => (
                              <button
                                key={`team-${team.id}`}
                                onClick={() => handleRecipientSelect(team, 'team')}
                                className="w-full flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 text-left"
                              >
                                <div className="w-6 h-6 bg-theme-500 dark:bg-theme-600 rounded-lg flex items-center justify-center mr-3">
                                  <UserGroupIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-900 dark:text-dark-50">{team.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* No Results */}
                        {filteredUsers.length === 0 && filteredTeams.length === 0 && (
                          <div className="px-3 py-4 text-sm text-gray-500 dark:text-dark-400 text-center">
                            No results found for "{recipientSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compose Content Area */}
      <div className="flex-1 flex flex-col">
        {composeRecipient ? (
          <>
            {/* Selected Recipient Display */}
            <div className="px-6 py-4 bg-theme-50 dark:bg-theme-900/30 border-b border-theme-200 dark:border-theme-800">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-theme-500 dark:bg-theme-600 rounded-lg flex items-center justify-center mr-4">
                  {composeRecipient.type === 'team' ? (
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  ) : (
                    <UserIcon size="medium" contact={composeRecipient} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-50">{composeRecipient.name}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    {composeRecipient.type === 'team' ? 'Team' : 'Direct Message'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setComposeRecipient(null)
                    setRecipientSearch('')
                  }}
                  className="ml-auto p-1 hover:bg-theme-200 dark:hover:bg-theme-800/50 rounded"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-dark-400" />
                </button>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PaperAirplaneIcon className="w-8 h-8 text-gray-400 dark:text-dark-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-50 mb-2">You're starting a new conversation</h3>
                <p className="text-gray-500 dark:text-dark-400">Type your first message below.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400 dark:text-dark-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-50 mb-2">Search for people and teams</h3>
              <p className="text-gray-500 dark:text-dark-400">Start typing in the "To" field above to find someone to message.</p>
            </div>
          </div>
        )}

        {/* Message Input - only show if recipient is selected */}
        {composeRecipient && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 min-h-[73px]">
            <MessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSubmit={handleComposeMessageSend}
              placeholder="Type a message..."
              disabled={false}
              onAttachmentsChange={handleAttachmentsChange}
              clearAttachments={clearAttachmentsTrigger}
            />
          </div>
        )}
      </div>
    </div>
  )
}
