import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../../Components/Chat/Sidebar'
import ChatEngine from '../../Components/Chat/ChatEngine'
import NotificationToast from '../../Components/Chat/NotificationToast'
import { usePermission } from '../../Utils/Permissions'

export default function ChatPopout() {
  const [selectedChat, setSelectedChat] = useState(null) // Can be team or user
  const [chatType, setChatType] = useState(null) // 'team' or 'dm'
  const [notification, setNotification] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [typingUsers, setTypingUsers] = useState({}) // Track who is typing per channel: { channelKey: [users] }
  const [contacts, setContacts] = useState([]) // All user contacts for channel subscriptions
  const [teams, setTeams] = useState([]) // All teams for channel subscriptions
  const [unreadChats, setUnreadChats] = useState(new Set()) // Track which chats have unread messages
  const [contactsRefreshKey, setContactsRefreshKey] = useState(0)
  const [teamsRefreshKey, setTeamsRefreshKey] = useState(0)
  const [lastMessageUpdate, setLastMessageUpdate] = useState(null) // Track last message for sidebar reordering
  const [chatLoading, setChatLoading] = useState(false) // Track when a chat is loading
  const [showMobileSidebar, setShowMobileSidebar] = useState(true) // Track mobile view state
  const [chatPreferences, setChatPreferences] = useState([]) // Track chat preferences for all chats
  const [teamsDeepLinkChat, setTeamsDeepLinkChat] = useState(null) // Deep link from Teams notification
  
  // Spy mode permission and state
  const canMonitorAllTeams = usePermission('pulse_monitor_all_teams')
  const [spyMode, setSpyMode] = useState(() => {
    const stored = localStorage.getItem('chat_spy_mode')
    return stored !== null ? stored === 'true' : true
  })
  const effectiveSpyMode = canMonitorAllTeams ? spyMode : false
  
  // Listen for spy mode changes from Sidebar (via localStorage)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'chat_spy_mode') {
        setSpyMode(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])
  
  // Use refs to track current selected chat without causing re-subscriptions
  const selectedChatRef = useRef(selectedChat)
  const chatTypeRef = useRef(chatType)
  const subscribedContactsRef = useRef(new Set())
  const subscribedTeamsRef = useRef(new Set())
  const previousSpyModeRef = useRef(effectiveSpyMode)
  
  useEffect(() => {
    selectedChatRef.current = selectedChat
    chatTypeRef.current = chatType
  }, [selectedChat, chatType])
  
  // Handle spy mode toggle - unsubscribe from non-member teams when disabled
  useEffect(() => {
    if (!currentUser?.id || !window.Echo) return
    
    // If spy mode was just disabled, we need to leave non-member team channels
    if (previousSpyModeRef.current && !effectiveSpyMode) {
      // Get current member teams to know which to keep
      fetch('/api/chat/teams', { credentials: 'same-origin' })
        .then(res => res.ok ? res.json() : [])
        .then(memberTeams => {
          const memberTeamIds = new Set((memberTeams || []).map(t => t.id))
          
          // Leave channels for teams we're not a member of
          subscribedTeamsRef.current.forEach(teamId => {
            if (!memberTeamIds.has(teamId)) {
              const channelName = `chat.team.${teamId}`
              if (window.Echo.connector.channels[channelName]) {
                window.Echo.connector.channels[channelName].stopListening('.MessageNotification')
              }
              window.Echo.leave(channelName)
              subscribedTeamsRef.current.delete(teamId)
            }
          })
        })
        .catch(console.error)
    }
    
    previousSpyModeRef.current = effectiveSpyMode
  }, [effectiveSpyMode, currentUser])

  // Initialize Microsoft Teams SDK and handle deep linking from notifications
  useEffect(() => {
    const initTeamsContext = async () => {
      // Check if we're in Teams context (query param or cookie)
      const params = new URLSearchParams(window.location.search)
      const inTeams = params.get('teams') === 'true' || document.cookie.includes('in_teams=true')
      
      if (!inTeams) return

      // Dynamically load Teams SDK if not already loaded
      if (!window.microsoftTeams) {
        try {
          const script = document.createElement('script')
          script.src = 'https://res.cdn.office.net/teams-js/2.22.0/js/MicrosoftTeams.min.js'
          script.async = true
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        } catch (error) {
          console.error('Failed to load Teams SDK:', error)
          return
        }
      }

      try {
        // Initialize the Teams SDK
        await window.microsoftTeams.app.initialize()

        // Get context to check for deep link (subPageId = subEntityId from notification)
        const context = await window.microsoftTeams.app.getContext()
        
        if (context.page?.subPageId) {
          // Parse the subPageId format: "team-{id}" or "dm-{id}"
          const match = context.page.subPageId.match(/^(team|dm)-(\d+)$/)
          if (match) {
            const [, type, id] = match
            setTeamsDeepLinkChat({ type, id: parseInt(id) })
          }
        }

        // Notify Teams that app loaded successfully
        window.microsoftTeams.app.notifySuccess()
      } catch (error) {
        console.error('Teams SDK initialization error:', error)
      }
    }

    initTeamsContext()
  }, [])

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

  // Read URL parameters on mount to restore chat selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chatType = params.get('type')
    const chatId = params.get('id')
    
    if (chatType && chatId) {
      // Fetch the specific chat based on URL parameters
      const endpoint = chatType === 'team' ? '/api/chat/teams' : '/api/chat/users'
      
      fetch(endpoint, { credentials: 'same-origin' })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const items = Array.isArray(data) ? data : []
          const chat = items.find(item => item.id === parseInt(chatId))
          
          if (chat) {
            setSelectedChat(chat)
            setChatType(chatType)
            // Set window title for popout
            document.title = `Chat - ${chat.name}`
          } else {
            document.title = 'Chat Not Found'
          }
        })
        .catch(console.error)
    }
  }, [])

  // Handle Teams deep link navigation when contacts/teams are loaded
  useEffect(() => {
    if (!teamsDeepLinkChat || !currentUser) return

    const { type, id } = teamsDeepLinkChat
    
    // Fetch the specific chat based on deep link
    const endpoint = type === 'team' ? '/api/chat/teams' : '/api/chat/users'
    
    fetch(endpoint, { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const items = Array.isArray(data) ? data : []
        const chat = items.find(item => item.id === id)
        
        if (chat) {
          setSelectedChat(chat)
          setChatType(type)
          setShowMobileSidebar(false) // Show the chat, not sidebar
          document.title = `Chat - ${chat.name}`
          
          // Clear the deep link so we don't keep re-navigating
          setTeamsDeepLinkChat(null)
        }
      })
      .catch(console.error)
  }, [teamsDeepLinkChat, currentUser])

  // Fetch contacts and teams for global typing listeners
  useEffect(() => {
    if (!currentUser) return

    // Fetch contacts
    fetch('/api/chat/users', { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(() => setContacts([]))

    // Fetch teams - include all teams if in spy mode for channel subscriptions
    const teamsUrl = effectiveSpyMode ? '/api/chat/teams?all=true' : '/api/chat/teams'
    fetch(teamsUrl, { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => setTeams([]))
  }, [currentUser, contactsRefreshKey, effectiveSpyMode])

  // Set up global typing listeners for all DM channels
  useEffect(() => {
    if (!currentUser?.id || !window.Echo) return

    const channels = []

    // Subscribe to all DM channels (only new ones)
    contacts.forEach(contact => {
      // Skip if already subscribed
      if (subscribedContactsRef.current.has(contact.id)) return
      
      subscribedContactsRef.current.add(contact.id)
      
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
      
      // Listen for new message notifications (not the full message, just notification)
      channel.listen('.MessageNotification', (e) => {
        const shouldIncrementUnread = e.sender_id !== currentUser.id && 
          !(selectedChatRef.current?.id === contact.id && chatTypeRef.current === 'dm')
        
        // Update last message timestamp for sidebar reordering
        setLastMessageUpdate({
          chatType: 'dm',
          chatId: contact.id,
          timestamp: e.timestamp || new Date().toISOString(),
          incrementUnread: shouldIncrementUnread
        })
        
        // Only mark as unread if message is from someone else and chat is not currently selected
        if (shouldIncrementUnread) {
          setUnreadChats(prev => new Set([...prev, `dm-${contact.id}`]))
        }
      })

      channels.push(channelName)
    })

    // Also listen to user's private channel for DM notifications (including from new contacts)
    const userPrivateChannel = window.Echo.private(`user.${currentUser.id}`)
    userPrivateChannel.listen('.MessageNotification', (e) => {
      // Check if this is from a contact not in our current contacts list
      const isNewContact = !contacts.some(c => c.id === e.sender_id)
      if (isNewContact) {
        // Refresh contacts to add the new contact
        setContactsRefreshKey(prev => prev + 1)
      }
    })

    // Subscribe to all team channels (only new ones)
    teams.forEach(team => {
      // Skip if already subscribed
      if (subscribedTeamsRef.current.has(team.id)) return
      
      subscribedTeamsRef.current.add(team.id)
      
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
      
      // Listen for new message notifications (not the full message, just notification)
      channel.listen('.MessageNotification', (e) => {
        const shouldIncrementUnread = e.sender_id !== currentUser.id && 
          !(selectedChatRef.current?.id === team.id && chatTypeRef.current === 'team')
        
        // Update last message timestamp for sidebar reordering
        setLastMessageUpdate({
          chatType: 'team',
          chatId: team.id,
          timestamp: e.timestamp || new Date().toISOString(),
          incrementUnread: shouldIncrementUnread
        })
        
        // Only mark as unread if message is from someone else and chat is not currently selected
        if (shouldIncrementUnread) {
          setUnreadChats(prev => new Set([...prev, `team-${team.id}`]))
        }
      })

      channels.push(channelName)
    })

    // Cleanup function to remove listeners when effect re-runs
    return () => {
      // Note: We can't properly clean up whisper listeners, so we rely on Echo
      // to handle duplicate prevention. Just clean up regular listeners.
      contacts.forEach(contact => {
        const channelName = `chat.dm.${Math.min(currentUser.id, contact.id)}.${Math.max(currentUser.id, contact.id)}`
        if (window.Echo.connector.channels[channelName]) {
          window.Echo.connector.channels[channelName].stopListening('.MessageNotification')
        }
      })
      
      teams.forEach(team => {
        const channelName = `chat.team.${team.id}`
        if (window.Echo.connector.channels[channelName]) {
          window.Echo.connector.channels[channelName].stopListening('.MessageNotification')
        }
      })
      
      const privateChannelName = `private-user.${currentUser.id}`
      if (window.Echo.connector.channels[privateChannelName]) {
        window.Echo.connector.channels[privateChannelName].stopListening('.MessageNotification')
      }
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
    
    // On mobile, switch to chat view when a chat is selected (not compose mode)
    if (chat && type !== 'compose') {
      setShowMobileSidebar(false)
    }
    
    // Update URL to reflect current chat (for non-compose selections)
    if (chat && type && type !== 'compose') {
      const params = new URLSearchParams(window.location.search)
      params.set('type', type)
      params.set('id', chat.id)
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.pushState({}, '', newUrl)
      document.title = `Chat - ${chat.name}`
    } else if (type === 'compose' || !chat) {
      // Clear URL params when entering compose mode or deselecting
      window.history.pushState({}, '', window.location.pathname)
      document.title = 'Chat'
    }
    
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
  
  // Handle back to sidebar on mobile
  const handleBackToSidebar = () => {
    setShowMobileSidebar(true)
  }

  // Refresh contacts list (for when a new conversation is created)
  const refreshContacts = () => {
    setContactsRefreshKey(prev => prev + 1)
  }

  // Refresh teams list (for when a new team is created)
  const refreshTeams = () => {
    setTeamsRefreshKey(prev => prev + 1)
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
    
    // Also reset the unread count in the sidebar (without updating timestamp)
    setLastMessageUpdate({
      chatType: chatType,
      chatId: selectedChat.id,
      incrementUnread: false,
      resetUnread: true
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
          teamsRefreshKey={teamsRefreshKey}
          lastMessageUpdate={lastMessageUpdate}
          isLoading={chatLoading}
          onPreferencesChange={setChatPreferences}
          currentUser={currentUser}
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
          onRefreshTeams={refreshTeams}
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
