import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../Components/Chat/Sidebar'
import ChatEngine from '../Components/Chat/ChatEngine'
import NotificationToast from '../Components/Chat/NotificationToast'

export default function ChatPopout() {
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatType, setChatType] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [typingUsers, setTypingUsers] = useState({})
  const [contacts, setContacts] = useState([])
  const [teams, setTeams] = useState([])
  const [unreadChats, setUnreadChats] = useState(new Set())
  const [contactsRefreshKey, setContactsRefreshKey] = useState(0)
  const [lastMessageUpdate, setLastMessageUpdate] = useState(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(true)
  const [chatPreferences, setChatPreferences] = useState([])
  
  const selectedChatRef = useRef(selectedChat)
  const chatTypeRef = useRef(chatType)
  
  useEffect(() => {
    selectedChatRef.current = selectedChat
    chatTypeRef.current = chatType
  }, [selectedChat, chatType])

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

  // Fetch contacts and teams
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
  }, [currentUser, contactsRefreshKey])

  // Read URL parameters on mount to load the specific chat
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chatType = params.get('type')
    const chatId = params.get('id')
    
    if (chatType && chatId) {
      const endpoint = chatType === 'team' ? '/api/chat/teams' : '/api/chat/users'
      
      fetch(endpoint, { credentials: 'same-origin' })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const items = Array.isArray(data) ? data : []
          const chat = items.find(item => item.id === parseInt(chatId))
          
          if (chat) {
            setSelectedChat(chat)
            setChatType(chatType)
            
            // Set window title
            document.title = `Chat - ${chat.name}`
          } else {
            document.title = 'Chat Not Found'
          }
        })
        .catch(console.error)
    }
  }, [])

  // Set up global typing listeners for all DM channels and teams
  useEffect(() => {
    if (!currentUser?.id || !window.Echo) return

    const subscribedContactsRef = new Set()
    const subscribedTeamsRef = new Set()

    // Subscribe to all DM channels
    contacts.forEach(contact => {
      if (subscribedContactsRef.has(contact.id)) return
      subscribedContactsRef.add(contact.id)
      
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
      
      channel.listen('.MessageNotification', (e) => {
        const shouldIncrementUnread = e.sender_id !== currentUser.id && 
          !(selectedChatRef.current?.id === contact.id && chatTypeRef.current === 'dm')
        
        setLastMessageUpdate({
          chatType: 'dm',
          chatId: contact.id,
          timestamp: e.timestamp || new Date().toISOString(),
          incrementUnread: shouldIncrementUnread
        })
        
        if (shouldIncrementUnread) {
          setUnreadChats(prev => new Set([...prev, `dm-${contact.id}`]))
        }
      })
    })

    // Subscribe to all team channels
    teams.forEach(team => {
      if (subscribedTeamsRef.has(team.id)) return
      subscribedTeamsRef.add(team.id)
      
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
      
      channel.listen('.MessageNotification', (e) => {
        const shouldIncrementUnread = e.sender_id !== currentUser.id && 
          !(selectedChatRef.current?.id === team.id && chatTypeRef.current === 'team')
        
        setLastMessageUpdate({
          chatType: 'team',
          chatId: team.id,
          timestamp: e.timestamp || new Date().toISOString(),
          incrementUnread: shouldIncrementUnread
        })
        
        if (shouldIncrementUnread) {
          setUnreadChats(prev => new Set([...prev, `team-${team.id}`]))
        }
      })
    })
  }, [currentUser, contacts, teams])

  // Set up typing listeners for the specific chat
  useEffect(() => {
    if (!currentUser?.id || !selectedChat || !window.Echo) return

    let channelName = ''
    let channelKey = ''

    if (chatType === 'dm') {
      channelName = `chat.dm.${Math.min(currentUser.id, selectedChat.id)}.${Math.max(currentUser.id, selectedChat.id)}`
      channelKey = `dm-${selectedChat.id}`
    } else if (chatType === 'team') {
      channelName = `chat.team.${selectedChat.id}`
      channelKey = `team-${selectedChat.id}`
    }

    if (channelName) {
      const channel = window.Echo.join(channelName)
      
      channel.listenForWhisper('typing', (e) => {
        if (e.user_id !== currentUser.id) {
          setTypingUsers(prev => {
            const channelUsers = prev[channelKey] || []
            const filtered = channelUsers.filter(u => u.user_id !== e.user_id)
            return { 
              ...prev, 
              [channelKey]: [...filtered, { 
                user_id: e.user_id, 
                user_name: e.user_name, 
                timestamp: Date.now() 
              }] 
            }
          })
        }
      })
    }

    return () => {
      if (channelName) {
        // Clean up typing listener
        window.Echo.leave(channelName)
      }
    }
  }, [currentUser, selectedChat, chatType])

  // Clear typing users after timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => {
        const updated = {}
        Object.keys(prev).forEach(key => {
          const activeUsers = prev[key].filter(u => now - u.timestamp < 3000)
          if (activeUsers.length > 0) {
            updated[key] = activeUsers
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const clearTypingUser = (userId) => {
    setTypingUsers(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => {
        updated[key] = prev[key].filter(u => u.user_id !== userId)
      })
      return updated
    })
  }

  const handleChatSelect = (chat, type) => {
    setSelectedChat(chat)
    setChatType(type)
    
    // On mobile, switch to chat view when a chat is selected (not compose mode)
    if (chat && type !== 'compose') {
      setShowMobileSidebar(false)
    }
    
    // Update URL
    if (chat) {
      const params = new URLSearchParams(window.location.search)
      params.set('type', type)
      params.set('id', chat.id)
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
      document.title = `Chat - ${chat.name}`
    }
  }
  
  const handleBackToSidebar = () => {
    setShowMobileSidebar(true)
  }

  const refreshContacts = () => {
    setContactsRefreshKey(prev => prev + 1)
  }

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

    return () => {
      channel.stopListening('App\\Events\\Chat\\ChatNotification')
    }
  }, [currentUser])

  return (
    <div className="h-screen flex flex-row-reverse bg-gray-50 dark:bg-dark-800">
      {/* Sidebar - Full screen on mobile when showing, fixed width on desktop */}
      <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80`}>
        <Sidebar
          typingUsers={typingUsers}
          unreadChats={unreadChats}
          onChatSelect={handleChatSelect}
          selectedChat={selectedChat}
          chatType={chatType}
          refreshKey={contactsRefreshKey}
          lastMessageUpdate={lastMessageUpdate}
          isLoading={chatLoading}
          onPreferencesChange={setChatPreferences}
        />
      </div>
      
      {/* Chat Area - Hidden on mobile when sidebar is showing, always visible on desktop */}
      <div className={`${showMobileSidebar ? 'hidden' : 'flex'} md:flex flex-1`}>
        <ChatEngine
          selectedChat={selectedChat}
          chatType={chatType}
          currentUser={currentUser}
          onChatSelect={handleChatSelect}
          onRefreshContacts={refreshContacts}
          typingUsers={(() => {
            const channelKey = chatType === 'team' ? `team-${selectedChat?.id}` : `dm-${selectedChat?.id}`
            const users = selectedChat ? (typingUsers[channelKey] || []) : []
            return users
          })()}
          onClearTypingUser={clearTypingUser}
          onClearUnread={clearUnreadForCurrentChat}
          onLoadingChange={setChatLoading}
          onBackToSidebar={handleBackToSidebar}
          chatPreferences={chatPreferences}
        />
      </div>
      
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
