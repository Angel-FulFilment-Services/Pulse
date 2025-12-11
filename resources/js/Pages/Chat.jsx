import React, { useState, useEffect } from 'react'
import Sidebar from '../Components/Chat/Sidebar'
import ChatEngine from '../Components/Chat/ChatEngine'
import NotificationToast from '../Components/Chat/NotificationToast'

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState(null) // Can be team or user
  const [chatType, setChatType] = useState(null) // 'team' or 'dm'
  const [notification, setNotification] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [typingUsers, setTypingUsers] = useState({}) // Track who is typing per channel: { channelKey: [users] }
  const [contacts, setContacts] = useState([]) // All user contacts for channel subscriptions
  const [teams, setTeams] = useState([]) // All teams for channel subscriptions
  const [unreadChats, setUnreadChats] = useState(new Set()) // Track which chats have unread messages

  // Fetch current user
  useEffect(() => {
    if (window.Laravel?.user) {
      setCurrentUser(window.Laravel.user)
    } else {
      fetch('/api/user', { credentials: 'same-origin' })
        .then(res => res.json())
        .then(setCurrentUser)
        .catch(console.error)
    }
  }, [])

  // Fetch contacts and teams for global typing listeners
  useEffect(() => {
    if (!currentUser) return

    // Fetch contacts
    fetch('/api/chat/users', { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(() => setContacts([]))

    // Fetch teams
    fetch('/api/chat/teams', { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => setTeams([]))
  }, [currentUser])

  // Set up global typing listeners for all DM channels
  useEffect(() => {
    if (!currentUser?.id || !window.Echo || contacts.length === 0) return

    const channels = []

    // Subscribe to all DM channels
    contacts.forEach(contact => {
      const channelName = `chat.dm.${Math.min(currentUser.id, contact.id)}.${Math.max(currentUser.id, contact.id)}`
      const channelKey = `dm-${contact.id}`
      const channel = window.Echo.join(channelName)
      
      channel.listenForWhisper('typing', (e) => {
        if (e.user_id !== currentUser.id) {
          setTypingUsers(prev => {
            const channelUsers = prev[channelKey] || []
            const filtered = channelUsers.filter(u => u.user_id !== e.user_id)
            return { ...prev, [channelKey]: [...filtered, { user_id: e.user_id, user_name: e.user_name, timestamp: Date.now() }] }
          })
        }
      })
      
      // Listen for new messages to mark as unread
      channel.listen('.MessageSent', (e) => {
        // Only mark as unread if message is from someone else and chat is not currently selected
        if (e.message.sender_id !== currentUser.id && 
            !(selectedChat?.id === contact.id && chatType === 'dm')) {
          setUnreadChats(prev => new Set([...prev, `dm-${contact.id}`]))
        }
      })

      channels.push(channelName)
    })

    // Subscribe to all team channels
    teams.forEach(team => {
      const channelName = `chat.team.${team.id}`
      const channelKey = `team-${team.id}`
      const channel = window.Echo.join(channelName)
      
      channel.listenForWhisper('typing', (e) => {
        if (e.user_id !== currentUser.id) {
          setTypingUsers(prev => {
            const channelUsers = prev[channelKey] || []
            const filtered = channelUsers.filter(u => u.user_id !== e.user_id)
            return { ...prev, [channelKey]: [...filtered, { user_id: e.user_id, user_name: e.user_name, timestamp: Date.now() }] }
          })
        }
      })
      
      // Listen for new messages to mark as unread
      channel.listen('.MessageSent', (e) => {
        // Only mark as unread if message is from someone else and chat is not currently selected
        if (e.message.sender_id !== currentUser.id && 
            !(selectedChat?.id === team.id && chatType === 'team')) {
          setUnreadChats(prev => new Set([...prev, `team-${team.id}`]))
        }
      })

      channels.push(channelName)
    })

    // Cleanup
    return () => {
      channels.forEach(channelName => {
        window.Echo.leave(channelName)
      })
    }
  }, [currentUser, contacts, teams])

  // Remove typing indicators after timeout
  useEffect(() => {
    if (!Object.keys(typingUsers).length) return

    const interval = setInterval(() => {
      setTypingUsers(channels => {
        const updated = {}
        Object.entries(channels).forEach(([key, users]) => {
          const filtered = users.filter(u => Date.now() - u.timestamp < 3000)
          if (filtered.length > 0) {
            updated[key] = filtered
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [typingUsers])

  // Handle chat selection
  const handleChatSelect = (chat, type) => {
    setSelectedChat(chat)
    setChatType(type)
    
    // Clear unread indicator for this chat (only if chat exists, not for compose mode)
    if (chat && type !== 'compose') {
      const chatKey = type === 'team' ? `team-${chat.id}` : `dm-${chat.id}`
      setUnreadChats(prev => {
        const newSet = new Set(prev)
        newSet.delete(chatKey)
        return newSet
      })
    }
  }

  // Clear typing indicator for a specific user (from all channels)
  const clearTypingUser = (userId) => {
    setTypingUsers(prev => {
      const updated = {}
      Object.entries(prev).forEach(([key, users]) => {
        const filtered = users.filter(u => u.user_id !== userId)
        if (filtered.length > 0) {
          updated[key] = filtered
        }
      })
      return updated
    })
  }

  // Clear unread status for current chat
  const clearUnreadForCurrentChat = () => {
    if (!selectedChat) return
    const chatKey = chatType === 'team' ? `team-${selectedChat.id}` : `dm-${selectedChat.id}`
    setUnreadChats(prev => {
      const newSet = new Set(prev)
      newSet.delete(chatKey)
      return newSet
    })
  }

  // Listen for notifications
  useEffect(() => {
    if (!currentUser?.id || !window.Echo) return

    const channel = window.Echo.private(`user.${currentUser.id}`)
    channel.listen('App\\Events\\Chat\\ChatNotification', (e) => {
      let message = 'New message'
      if (e.type === 'mention') message = 'You were mentioned!'
      if (e.type === 'dm') message = 'New direct message!'
      
      setNotification(message)
      setTimeout(() => setNotification(null), 5000)
    })

    return () => channel.stopListening('App\\Events\\Chat\\ChatNotification')
  }, [currentUser])

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        typingUsers={typingUsers}
        unreadChats={unreadChats}
        onChatSelect={handleChatSelect}
        selectedChat={selectedChat}
        chatType={chatType}
      />
      
      {/* Chat Area */}
      <ChatEngine
        selectedChat={selectedChat}
        chatType={chatType}
        currentUser={currentUser}
        onChatSelect={handleChatSelect}
        typingUsers={(() => {
          const channelKey = chatType === 'team' ? `team-${selectedChat?.id}` : `dm-${selectedChat?.id}`
          const users = selectedChat ? (typingUsers[channelKey] || []) : []
          console.log('Passing typing users to ChatEngine:', { channelKey, users, allTypingUsers: typingUsers })
          return users
        })()}
        onClearTypingUser={clearTypingUser}
        onClearUnread={clearUnreadForCurrentChat}
      />
      
      {/* Notifications */}
      {notification && (
        <NotificationToast 
          message={notification} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  )
}
