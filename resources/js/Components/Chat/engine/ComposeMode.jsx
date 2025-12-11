import React, { useState, useEffect } from 'react'
import { 
  PaperAirplaneIcon,
  UserIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
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
  const [allUsers, setAllUsers] = useState([])
  const [allTeams, setAllTeams] = useState([])

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
    if (!composeRecipient || !newMessage.trim()) return
    
    const success = await onMessageSend(newMessage, composeRecipient, composeRecipient.type)
    
    if (success) {
      setNewMessage('')
      // Refresh contacts list if this was a new DM conversation
      if (composeRecipient.type === 'dm' && onRefreshContacts) {
        onRefreshContacts()
      }
      onChatSelect(composeRecipient, composeRecipient.type)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Compose Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="w-10 h-10 bg-theme-100 rounded-lg flex items-center justify-center mr-3">
              <PaperAirplaneIcon className="w-5 h-5 text-theme-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">New Chat</h2>
              
              {/* Recipient Selection */}
              <div className="relative mt-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">To:</span>
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
                      className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                    />
                    
                    {/* Dropdown */}
                    {showRecipientDropdown && recipientSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {/* Users */}
                        {filteredUsers.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">PEOPLE</div>
                            {filteredUsers.map(user => (
                              <button
                                key={`user-${user.id}`}
                                onClick={() => handleRecipientSelect(user, 'dm')}
                                className="w-full flex items-center px-3 py-2 hover:bg-gray-100 text-left"
                              >
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                  {user.avatar ? (
                                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                                  ) : (
                                    <UserIcon className="w-3 h-3 text-gray-600" />
                                  )}
                                </div>
                                <span className="text-sm text-gray-900">{user.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Teams */}
                        {filteredTeams.length > 0 && (
                          <div>
                            {filteredUsers.length > 0 && <div className="border-t border-gray-200"></div>}
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">TEAMS</div>
                            {filteredTeams.map(team => (
                              <button
                                key={`team-${team.id}`}
                                onClick={() => handleRecipientSelect(team, 'team')}
                                className="w-full flex items-center px-3 py-2 hover:bg-gray-100 text-left"
                              >
                                <div className="w-6 h-6 bg-theme-500 rounded-lg flex items-center justify-center mr-3">
                                  <UserGroupIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-900">{team.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* No Results */}
                        {filteredUsers.length === 0 && filteredTeams.length === 0 && (
                          <div className="px-3 py-4 text-sm text-gray-500 text-center">
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
            <div className="px-6 py-4 bg-theme-50 border-b border-theme-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-theme-500 rounded-lg flex items-center justify-center mr-3">
                  {composeRecipient.type === 'team' ? (
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{composeRecipient.name}</p>
                  <p className="text-xs text-gray-500">
                    {composeRecipient.type === 'team' ? 'Team' : 'Direct Message'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setComposeRecipient(null)
                    setRecipientSearch('')
                  }}
                  className="ml-auto p-1 hover:bg-theme-200 rounded"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PaperAirplaneIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">You're starting a new conversation</h3>
                <p className="text-gray-500">Type your first message below.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search for people and teams</h3>
              <p className="text-gray-500">Start typing in the "To" field above to find someone to message.</p>
            </div>
          </div>
        )}

        {/* Message Input - only show if recipient is selected */}
        {composeRecipient && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <MessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSubmit={handleComposeMessageSend}
              placeholder="Type a message..."
              disabled={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
