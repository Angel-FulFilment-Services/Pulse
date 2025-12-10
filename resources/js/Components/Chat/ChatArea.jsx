import React, { useState, useEffect, useRef } from 'react'
import { 
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  UserIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function ChatArea({ selectedChat, chatType, currentUser, onChatSelect, typingUsers = [], onClearTypingUser }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [composeRecipient, setComposeRecipient] = useState(null)
  const [messageReads, setMessageReads] = useState({}) // Track read status by message ID
  const markedAsReadRef = useRef(new Set()) // Track which messages we've already marked as read
  const [pendingMessages, setPendingMessages] = useState(new Set()) // Track messages being sent
  const [recipientSearch, setRecipientSearch] = useState('')
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const messagesEndRef = useRef(null)
  const echoRef = useRef(null)

  // Fetch users and teams for compose functionality
  useEffect(() => {
    if (chatType === 'compose') {
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
    } else {
      // Clear compose state when leaving compose mode
      setComposeRecipient(null)
      setRecipientSearch('')
      setShowRecipientDropdown(false)
      setAllUsers([])
      setAllTeams([])
    }
  }, [chatType])

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch messages when chat changes
  useEffect(() => {
    if (!selectedChat || chatType === 'compose') {
      setMessages([])
      return
    }

    setLoading(true)
    let url = ''
    if (chatType === 'team') {
      url = `/api/chat/messages?team_id=${selectedChat.id}`
    } else if (chatType === 'dm') {
      url = `/api/chat/messages?recipient_id=${selectedChat.id}`
    }

    fetch(url, { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const messageList = Array.isArray(data) ? data : []
        setMessages(messageList)
        
        // Build read status map
        const reads = {}
        messageList.forEach(msg => {
          if (msg.reads && msg.reads.length > 0) {
            reads[msg.id] = msg.reads
          }
        })
        setMessageReads(reads)
        
        setLoading(false)
      })
      .catch(() => {
        setMessages([])
        setLoading(false)
      })
  }, [selectedChat, chatType])

  // Set up real-time listeners
  useEffect(() => {
    if (!selectedChat || !window.Echo || chatType === 'compose') return

    // Leave previous channel
    if (echoRef.current) {
      echoRef.current.stopListening('MessageSent')
      echoRef.current.stopListening('Typing')
      window.Echo.leave(echoRef.current.channelName)
    }

    // Join new channel
    let channelName = ''
    if (chatType === 'team') {
      channelName = `chat.team.${selectedChat.id}`
    } else if (chatType === 'dm') {
      channelName = `chat.dm.${Math.min(currentUser?.id || 0, selectedChat.id)}.${Math.max(currentUser?.id || 0, selectedChat.id)}`
    }

    if (channelName) {
      console.log('Joining channel:', channelName)
      const channel = window.Echo.join(channelName)
      
      console.log('Setting up listeners for channel:', channelName)
      
      // Only listen for messages here - typing is handled globally in Chat.jsx
      channel.listen('.MessageSent', (e) => {
        console.log('.MessageSent event received!', e)
        
        // Clear typing indicator for this user immediately
        if (onClearTypingUser && (e.message.user_id || e.message.sender_id)) {
          const userId = e.message.user_id || e.message.sender_id
          onClearTypingUser(userId)
        }
        
        // Only add if message doesn't already exist (avoid duplicates)
        // Also remove any temporary/optimistic messages when real one arrives
        setMessages(prev => {
          // Remove any temp messages (they should have been replaced already, but just in case)
          const withoutTemp = prev.filter(msg => !String(msg.id).startsWith('temp-'))
          
          const exists = withoutTemp.some(msg => msg.id === e.message.id)
          if (exists) {
            console.log('Message already exists, skipping:', e.message.id)
            return withoutTemp
          }
          console.log('Adding message from broadcast:', e.message.id)
          return [...withoutTemp, e.message]
        })
      })
      
      // Listen for successful subscription
      channel.subscription.bind('pusher:subscription_succeeded', () => {
        console.log('Successfully subscribed to:', channelName)
      })
      
      channel.subscription.bind('pusher:subscription_error', (error) => {
        console.error('Subscription error for', channelName, error)
      })

      echoRef.current = channel
    }

    // Also subscribe to the user's private channel for MessageRead events
    if (currentUser?.id) {
      const userChannelName = `chat.user.${currentUser.id}`
      console.log('Subscribing to user channel for read receipts:', userChannelName)
      
      const userChannel = window.Echo.private(userChannelName)
      
      userChannel.listen('.MessageRead', (e) => {
        console.log('MessageRead event received on user channel:', e)
        if (e.message_read) {
          setMessageReads(prev => ({
            ...prev,
            [e.message_read.message_id]: [...(prev[e.message_read.message_id] || []), e.message_read]
          }))
        }
      })
    }

    return () => {
      if (channelName) {
        window.Echo.leave(channelName)
      }
      if (currentUser?.id) {
        window.Echo.leave(`chat.user.${currentUser.id}`)
      }
    }
  }, [selectedChat, chatType, currentUser])

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (!selectedChat || !currentUser || chatType === 'compose' || messages.length === 0) return

    // Mark all unread messages from others as read
    const unreadMessages = messages.filter(msg => {
      const senderId = msg.sender_id || msg.user_id
      const isFromOther = senderId !== currentUser.id
      const notAlreadyRead = !messageReads[msg.id]
      const notAlreadyMarking = !markedAsReadRef.current.has(msg.id)
      
      return isFromOther && notAlreadyRead && notAlreadyMarking
    })

    if (unreadMessages.length === 0) return

    // Mark each message as read
    unreadMessages.forEach(msg => {
      // Mark as being processed
      markedAsReadRef.current.add(msg.id)
      
      fetch('/api/chat/messages/read', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({ message_id: msg.id })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setMessageReads(prev => ({
              ...prev,
              [msg.id]: [data]
            }))
          }
        })
        .catch(err => {
          console.error('Error marking message as read:', err)
          // Remove from marked set on error so it can be retried
          markedAsReadRef.current.delete(msg.id)
        })
    })
  }, [messages, selectedChat, currentUser, chatType])

  // Shared function for sending messages
  const sendMessageToRecipient = async (message, recipient, recipientType) => {
    if (!message.trim() || !recipient || sending) return false

    setSending(true)
    
    // Create a temporary ID and optimistic message
    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      body: message.trim(),
      sender_id: currentUser?.id,
      user_id: currentUser?.id,
      user: currentUser,
      created_at: new Date().toISOString(),
      attachments: [],
      isPending: true
    }
    
    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage])
    setPendingMessages(prev => new Set([...prev, tempId]))
    
    console.log('Sending message:', { recipient, recipientType })
    
    try {
      // Prepare request data
      const requestData = {
        body: message.trim(),
        type: 'message'
      }
      
      // Set team_id or recipient_id based on recipient type
      if (recipientType === 'team') {
        requestData.team_id = recipient.id
      } else {
        requestData.recipient_id = recipient.id
      }
      
      console.log('Request data:', requestData)
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to send message:', response.status, errorText)
        
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setPendingMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(tempId)
          return newSet
        })
        throw new Error(`Failed to send message: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Message sent successfully:', data)
      
      // Replace optimistic message with real one
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempId)
        const exists = filtered.some(msg => msg.id === data.id)
        if (exists) {
          console.log('Message already exists in state (from broadcast), removing optimistic:', tempId)
          return filtered
        }
        console.log('Replacing optimistic message with real one:', tempId, '->', data.id)
        return [...filtered, data]
      })
      
      // Remove from pending
      setPendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
      setNewMessage('')
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      setPendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      return false
    } finally {
      setSending(false)
    }
  }

  // Send message in existing chat
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    await sendMessageToRecipient(newMessage, selectedChat, chatType)
    // Message will be added via real-time listener
  }

  // Handle typing
  const handleTyping = () => {
    if (!window.Echo || !selectedChat) return

    let channelName = ''
    if (chatType === 'team') {
      channelName = `chat.team.${selectedChat.id}`
    } else if (chatType === 'dm') {
      channelName = `chat.dm.${Math.min(currentUser?.id || 0, selectedChat.id)}.${Math.max(currentUser?.id || 0, selectedChat.id)}`
    }

    if (channelName) {
      window.Echo.join(channelName).whisper('typing', {
        user_id: currentUser?.id,
        user_name: currentUser?.name
      })
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Group messages by sender and time
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1]
    
    // Get sender IDs - messages use sender_id, not user_id
    const currentSenderId = message.sender_id || message.user_id || message.user?.id
    const prevSenderId = prevMessage?.sender_id || prevMessage?.user_id || prevMessage?.user?.id
    
    const shouldGroup = prevMessage && 
      currentSenderId === prevSenderId &&
      new Date(message.created_at) - new Date(prevMessage.created_at) < 300000 // 5 minutes

    if (shouldGroup) {
      groups[groups.length - 1].push(message)
    } else {
      groups.push([message])
    }

    return groups
  }, [])

  // Handle recipient selection in compose mode
  const handleRecipientSelect = (recipient, type) => {
    setComposeRecipient({ ...recipient, type })
    setRecipientSearch(recipient.name)
    setShowRecipientDropdown(false)
    
    if (type === 'dm') {
      // Log for debugging
      console.log('Checking for existing conversation with user:', recipient.id)
      
      // Check if there's an existing conversation with this user
      fetch(`/api/chat/check-conversation?user_id=${recipient.id}`, { 
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            console.error('Error response from check-conversation:', res.status)
            return { exists: false }
          }
          return res.json()
        })
        .then(data => {
          console.log('Check conversation response:', data)
          if (data.exists) {
            // If conversation exists, open it directly
            console.log('Existing conversation found, switching to chat mode')
            onChatSelect(recipient, 'dm')
          }
        })
        .catch(error => {
          console.error('Error checking existing conversation:', error)
        })
    }
  }

  // Filter recipients based on search
  const filteredUsers = allUsers.filter(user => 
    user.name?.toLowerCase().includes(recipientSearch.toLowerCase())
  )
  
  const filteredTeams = allTeams.filter(team => 
    team.name?.toLowerCase().includes(recipientSearch.toLowerCase())
  )

  // Handle sending message in compose mode
  const handleComposeMessageSend = async () => {
    if (!composeRecipient || !newMessage.trim()) return
    
    // Use the shared function to send the message
    const success = await sendMessageToRecipient(
      newMessage, 
      composeRecipient, 
      composeRecipient.type
    )
    
    // If message was sent successfully, switch to the chat view
    if (success) {
      onChatSelect(composeRecipient, composeRecipient.type)
    }
  }

  if (!selectedChat && chatType !== 'compose') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Chat</h3>
          <p className="text-gray-500">Select a team or contact to start messaging</p>
        </div>
      </div>
    )
  }

  // Compose mode UI
  if (chatType === 'compose') {
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
              <div className="flex items-end space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleComposeMessageSend()
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                    rows="1"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <FaceSmileIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleComposeMessageSend}
                  disabled={!newMessage.trim() || !composeRecipient}
                  className={`p-2 rounded-lg transition-colors ${
                    newMessage.trim() && composeRecipient
                      ? 'text-theme-600 hover:bg-theme-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white min-h-[5.31rem]">
        <div className="flex items-center justify-between">
          <div className="flex items-center h-full">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
              {chatType === 'team' ? (
                <UserGroupIcon className="w-5 h-5 text-gray-600" />
              ) : (
                selectedChat.avatar ? (
                  <img src={selectedChat.avatar} alt="" className="w-10 h-10 rounded-lg" />
                ) : (
                  <UserIcon className="w-5 h-5 text-gray-600" />
                )
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedChat.name}</h2>
              {chatType === 'team' && selectedChat.description && (
                <p className="text-sm text-gray-500">{selectedChat.description}</p>
              )}
              {chatType === 'dm' && (
                <p className="text-sm text-gray-500">
                  {selectedChat.is_online ? 'Active now' : 'Away'}
                </p>
              )}
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-600"></div>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIndex) => {
              const senderId = group[0].sender_id || group[0].user_id
              const isMyGroup = senderId === currentUser?.id
              const isLastGroup = groupIndex === groupedMessages.length - 1
              
              return (
              <div key={groupIndex} className="mb-4">
                <div className={`flex ${isMyGroup ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${isMyGroup ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[70%]`}>
                    {/* Avatar - only show for other users */}
                    {!isMyGroup && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        {group[0].user?.avatar ? (
                          <img src={group[0].user.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      {/* User name and timestamp for other users */}
                      {!isMyGroup && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {group[0].user?.name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(group[0].created_at)}
                          </span>
                        </div>
                      )}
                      
                      {/* Messages in the group */}
                      {group.map((message, messageIndex) => {
                        const messageHasReads = messageReads[message.id] && messageReads[message.id].length > 0
                        const isLastMessageInGroup = messageIndex === group.length - 1
                        
                        // Find the last read message across ALL groups
                        let isLastReadMessage = false
                        let isLastUnreadMessage = false
                        let isPending = false
                        
                        if (isMyGroup) {
                          // Find the last message with reads across all messages
                          const allMyMessages = groupedMessages
                            .filter(g => (g[0].sender_id || g[0].user_id) === currentUser?.id)
                            .flatMap(g => g)
                          
                          const messagesWithReads = allMyMessages.filter(m => 
                            messageReads[m.id] && messageReads[m.id].length > 0
                          )
                          
                          if (messagesWithReads.length > 0) {
                            const lastReadMsg = messagesWithReads[messagesWithReads.length - 1]
                            isLastReadMessage = message.id === lastReadMsg.id
                          }
                          
                          // Check if this is the last message overall (for showing sent/pending indicator)
                          const lastMessage = allMyMessages[allMyMessages.length - 1]
                          isLastUnreadMessage = message.id === lastMessage.id
                          
                          // Check if THIS specific message is pending
                          if (isLastUnreadMessage) {
                            isPending = message.isPending || String(message.id).startsWith('temp-')
                          }
                        }
                        
                        // Get readers for this message
                        const readers = messageReads[message.id] || []
                        const readerNames = readers
                          .map(read => {
                            // Try to get the user name from the read object
                            return read.user?.name || read.reader?.name || 'Someone'
                          })
                          .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
                        
                        return (
                          <div key={message.id} className={`flex items-end gap-2 mb-1 ${isMyGroup ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Message bubble */}
                            <div className={`px-4 py-2 rounded-2xl ${
                              isMyGroup
                                ? 'bg-theme-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}>
                              <p>{message.body}</p>
                              {message.attachments?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center p-2 bg-white bg-opacity-10 rounded border border-white border-opacity-20">
                                      <PaperClipIcon className="w-4 h-4 mr-2" />
                                      <span className="text-sm">{attachment.filename}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Read receipt indicator - only on last read or last unread message */}
                            {isMyGroup && (
                              <div className="flex items-center self-end pb-1 relative group/receipt">
                                {isLastReadMessage && readerNames.length > 0 ? (
                                  chatType === 'dm' ? (
                                    <span className="text-xs text-gray-500">Seen</span>
                                  ) : (
                                    <>
                                      <span className="text-xs text-gray-500 max-w-[120px] truncate">
                                        {readerNames.length <= 2 
                                          ? `Seen by ${readerNames.join(', ')}`
                                          : `Seen by ${readerNames.length} people`
                                        }
                                      </span>
                                      {readerNames.length > 2 && (
                                        <div className="absolute bottom-full right-0 mb-1 hidden group-hover/receipt:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                          {readerNames.join(', ')}
                                        </div>
                                      )}
                                    </>
                                  )
                                ) : isLastUnreadMessage ? (
                                  isPending ? (
                                    <PaperAirplaneIcon className="w-4 h-4 text-gray-400" title="Sending" />
                                  ) : (
                                    <PaperAirplaneIcon className="w-4 h-4 text-theme-600" title="Delivered" />
                                  )
                                ) : null}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      
                      {/* Timestamp for my messages at bottom */}
                      {isMyGroup && (
                        <div className="text-xs text-gray-500 text-right mt-1">
                          {formatTime(group[group.length - 1].created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              )
            })}

            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>
                  {typingUsers.map(u => u.user_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                placeholder={`Message ${selectedChat.name}...`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 text-white bg-theme-600 hover:bg-theme-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
