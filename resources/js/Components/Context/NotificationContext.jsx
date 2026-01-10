import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import { usePage } from '@inertiajs/react'
import ChatNotificationToast from '../Chat/ChatNotificationToast'
import ProfilePhotoPromptDialog, { shouldShowProfilePhotoPrompt, clearProfilePhotoDismissal } from '../Dialogs/ProfilePhotoPromptDialog'

const NotificationContext = createContext(null)

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }) {
  // Get current user from Inertia props or window.Laravel
  const { auth } = usePage().props
  const currentUser = auth?.user || window.Laravel?.user || null
  
  const [chatPreferences, setChatPreferences] = useState([])
  const [globalSettings, setGlobalSettings] = useState({
    global_mute: false,
    global_hide_preview: false,
  })
  const [isWindowFocused, setIsWindowFocused] = useState(true)
  const [isWindowVisible, setIsWindowVisible] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [totalUnreadCount, setTotalUnreadCount] = useState(0) // Total unread messages for nav badge
  const [navTeams, setNavTeams] = useState([]) // Teams for nav sidebar
  const channelRef = useRef(null)
  const handleMessageNotificationRef = useRef(null) // Ref to always have latest handler
  
  // Profile photo prompt state
  const [showProfilePhotoPrompt, setShowProfilePhotoPrompt] = useState(false)
  const [profilePhotoPromptData, setProfilePhotoPromptData] = useState({
    maskedPhone: '',
    userName: ''
  })
  const profilePhotoCheckRef = useRef(false) // Prevent multiple checks

  // Track window focus state
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true)
    const handleBlur = () => setIsWindowFocused(false)
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Track window visibility state
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsWindowVisible(!document.hidden)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [])

  // Fetch chat preferences
  const fetchChatPreferences = useCallback(async () => {
    if (!currentUser) return
    
    try {
      const response = await fetch('/api/chat/preferences/chat', {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setChatPreferences(Array.isArray(data) ? data : [])
        setPreferencesLoaded(true)
      }
    } catch (error) {
      console.error('Error fetching chat preferences:', error)
      setPreferencesLoaded(true) // Still mark as loaded even on error
    }
  }, [currentUser])

  // Fetch global notification settings
  const fetchGlobalSettings = useCallback(async () => {
    if (!currentUser) return
    
    try {
      const response = await fetch('/api/chat/preferences/global', {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setGlobalSettings(data || { global_mute: false, global_hide_preview: false })
      }
    } catch (error) {
      console.error('Error fetching global settings:', error)
    }
  }, [currentUser])

  // Fetch total unread count for teams the user is a member of
  const fetchTotalUnreadCount = useCallback(async () => {
    if (!currentUser) return
    
    try {
      // Fetch teams (only ones user is a member of - no ?all=true param)
      const teamsResponse = await fetch('/api/chat/teams', {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
      
      // Fetch contacts (use /api/chat/users which includes unread_count)
      const contactsResponse = await fetch('/api/chat/users', {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
      
      let total = 0
      let fetchedTeams = []
      
      if (teamsResponse.ok) {
        const teams = await teamsResponse.json()
        fetchedTeams = teams
        total += teams.reduce((sum, team) => sum + (team.unread_count || 0), 0)
      }
      
      if (contactsResponse.ok) {
        const contacts = await contactsResponse.json()
        total += contacts.reduce((sum, contact) => sum + (contact.unread_count || 0), 0)
      }
      
      setNavTeams(fetchedTeams)
      setTotalUnreadCount(total)
    } catch (error) {
      console.error('Error fetching total unread count:', error)
    }
  }, [currentUser])

  // Increment unread count (called when new message arrives)
  const incrementUnreadCount = useCallback(() => {
    setTotalUnreadCount(prev => prev + 1)
  }, [])

  // Increment a specific team's unread count in navTeams
  const incrementTeamUnreadCount = useCallback((teamId) => {
    setNavTeams(prev => prev.map(team => 
      team.id === teamId 
        ? { ...team, unread_count: (team.unread_count || 0) + 1 }
        : team
    ))
  }, [])

  // Decrement a specific team's unread count (or reset to 0)
  const decrementTeamUnreadCount = useCallback((teamId, amount = null) => {
    setNavTeams(prev => prev.map(team => 
      team.id === teamId 
        ? { ...team, unread_count: amount === null ? 0 : Math.max(0, (team.unread_count || 0) - amount) }
        : team
    ))
  }, [])

  // Decrement unread count by a specific amount
  const decrementUnreadCount = useCallback((amount = 1) => {
    setTotalUnreadCount(prev => Math.max(0, prev - amount))
  }, [])

  // Refresh unread count from server
  const refreshUnreadCount = useCallback(() => {
    fetchTotalUnreadCount()
  }, [fetchTotalUnreadCount])

  // Load preferences on mount
  useEffect(() => {
    fetchChatPreferences()
    fetchGlobalSettings()
    fetchTotalUnreadCount()
  }, [fetchChatPreferences, fetchGlobalSettings, fetchTotalUnreadCount])

  // Check if user needs profile photo on app load
  useEffect(() => {
    // Check if feature is enabled via environment variable
    if (import.meta.env.VITE_PROFILE_PHOTO_PROMPT_ENABLED !== 'true') return
    
    // Only run once per session and only if user is logged in
    if (!currentUser || profilePhotoCheckRef.current) return
    
    const checkProfilePhotoStatus = async () => {
      // Double-check the ref in case of race condition
      if (profilePhotoCheckRef.current) return
      profilePhotoCheckRef.current = true
      
      // Only check if we should show the prompt (not dismissed in last 48h)
      if (!shouldShowProfilePhotoPrompt()) return
      
      try {
        const response = await fetch('/api/profile/photo/sms/status', {
          credentials: 'same-origin',
          headers: {
            'Accept': 'application/json',
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Only show prompt if user needs photo AND has mobile number
          if (data.needs_photo && data.has_mobile) {
            setProfilePhotoPromptData({
              maskedPhone: data.masked_phone,
              userName: data.user_name
            })
            setShowProfilePhotoPrompt(true)
          }
        }
      } catch (error) {
        console.error('Error checking profile photo status:', error)
      }
    }
    
    // Small delay to not block initial render
    const timer = setTimeout(checkProfilePhotoStatus, 1500)
    return () => clearTimeout(timer)
  }, [currentUser])

  // Handle sending SMS for profile photo
  const handleProfilePhotoSendSms = useCallback(async () => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      const response = await fetch('/api/profile/photo/sms/send', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        return { success: true, maskedPhone: data.masked_phone }
      } else {
        return { success: false, message: data.message || 'Failed to send SMS' }
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      return { success: false, message: 'An unexpected error occurred' }
    }
  }, [])

  // Check if chat is muted
  const isChatMuted = useCallback((chatId, chatType) => {
    // Check global mute first
    if (globalSettings.global_mute) return true
    
    // Check per-chat mute - convert IDs to numbers for consistent comparison
    const numericChatId = Number(chatId)
    const preference = chatPreferences.find(
      p => Number(p.chat_id) === numericChatId && p.chat_type === chatType
    )
    return preference?.is_muted === true
  }, [chatPreferences, globalSettings.global_mute])

  // Check if preview should be hidden
  const shouldHidePreview = useCallback((chatId, chatType) => {
    // Check global setting first
    if (globalSettings.global_hide_preview) return true
    
    // Check per-chat setting - convert IDs to numbers for consistent comparison
    const numericChatId = Number(chatId)
    const preference = chatPreferences.find(
      p => Number(p.chat_id) === numericChatId && p.chat_type === chatType
    )
    return preference?.hide_preview === true
  }, [chatPreferences, globalSettings.global_hide_preview])

  // Check if user is currently viewing the specified chat
  const isViewingChat = useCallback((chatId, chatType) => {
    const url = new URL(window.location.href)
    const pathname = url.pathname
    const params = url.searchParams
    
    // Map internal chatType to URL type
    // Backend uses 'user' for DMs, but URL uses 'dm'
    const urlTypeMapping = chatType === 'user' ? 'dm' : chatType
    
    // Check main chat page
    if (pathname === '/chat') {
      const urlType = params.get('type')
      const urlId = params.get('id')
      
      if (urlType === urlTypeMapping && urlId === String(chatId)) {
        return true
      }
    }
    
    // Check popout window
    if (pathname === '/chat/popout') {
      const urlType = params.get('type')
      const urlId = params.get('id')
      
      if (urlType === urlTypeMapping && urlId === String(chatId)) {
        return true
      }
    }
    
    return false
  }, [])

  // Mute a chat
  const muteChat = useCallback(async (chatId, chatType) => {
    try {
      const response = await fetch('/api/chat/preferences/mute', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({
          chat_id: chatId,
          chat_type: chatType
        })
      })
      
      if (response.ok) {
        // Refresh preferences
        await fetchChatPreferences()
        return true
      }
    } catch (error) {
      console.error('Error muting chat:', error)
    }
    return false
  }, [fetchChatPreferences])

  // Send a quick reply
  const sendQuickReply = useCallback(async (message, chatId, chatType) => {
    try {
      const formData = new FormData()
      formData.append('body', message)
      formData.append('type', 'message')
      
      if (chatType === 'team') {
        formData.append('team_id', chatId)
      } else {
        formData.append('recipient_id', chatId)
      }
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: formData
      })
      
      return response.ok
    } catch (error) {
      console.error('Error sending quick reply:', error)
      return false
    }
  }, [])

  // Add a quick reaction
  const addQuickReaction = useCallback(async (messageId, emoji, name) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({ emoji, name })
      })
      
      return response.ok
    } catch (error) {
      console.error('Error adding reaction:', error)
      return false
    }
  }, [])

  // Navigate to chat
  const navigateToChat = useCallback((chatId, chatType) => {
    // Map internal chatType to URL type - 'user' becomes 'dm' for URLs
    const urlType = chatType === 'user' ? 'dm' : chatType
    const url = `/chat?type=${urlType}&id=${chatId}`
    window.location.href = url
  }, [])

  // Show browser push notification
  const showPushNotification = useCallback((message, sender, chatId, chatType, hidePreview, isMentioned = false) => {
    if (notificationPermission !== 'granted') return
    if (isWindowVisible && isWindowFocused) return
    
    // Build notification title and body
    let title = chatType === 'team' ? `${sender.name} in ${message.team_name}` : sender.name
    let body
    
    if (isMentioned) {
      // Special notification text for mentions
      title = `${sender.name} mentioned you`
      if (chatType === 'team' && message.team_name) {
        title += ` in ${message.team_name}`
      }
      body = hidePreview ? 'You were mentioned' : (message.body || 'You were mentioned')
    } else {
      body = hidePreview ? 'New message' : (message.body || 'Sent an attachment')
    }
    
    const notification = new Notification(title, {
      body,
      icon: sender.profile_photo_url || '/images/default-avatar.png',
      tag: `chat-${chatType}-${chatId}`,
      requireInteraction: isMentioned, // Mentions require interaction
    })
    
    notification.onclick = () => {
      window.focus()
      navigateToChat(chatId, chatType)
      notification.close()
    }
    
    // Auto-close after 5 seconds (10 for mentions)
    setTimeout(() => notification.close(), isMentioned ? 10000 : 5000)
  }, [notificationPermission, isWindowVisible, isWindowFocused, navigateToChat])

  // Show in-app toast notification
  const showToastNotification = useCallback((message, sender, chatId, chatType, hidePreview, isMentioned = false) => {
    // Don't show if viewing the chat
    if (isViewingChat(chatId, chatType)) return
    
    // Use a single toast ID so only one notification shows at a time
    const toastId = 'chat-notification'
    
    const toastContent = (
      <ChatNotificationToast
        message={message}
        sender={sender}
        chatId={chatId}
        chatType={chatType}
        hidePreview={hidePreview}
        isMentioned={isMentioned}
        onReply={(replyText) => sendQuickReply(replyText, chatId, chatType)}
        onReact={(emoji, name) => addQuickReaction(message.id, emoji, name)}
        onNavigate={() => navigateToChat(chatId, chatType)}
        onMute={() => muteChat(chatId, chatType)}
        onClose={() => toast.dismiss(toastId)}
      />
    )
    
    // If toast already exists, update it in place
    if (toast.isActive(toastId)) {
      toast.update(toastId, {
        render: toastContent,
        autoClose: 10000, // Reset the timer
      })
    } else {
      // Show new toast
      toast(toastContent, {
        toastId,
        position: 'bottom-right',
        autoClose: 10000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        pauseOnFocusLoss: false,
        draggable: true,
        closeButton: false,
        className: 'chat-notification-toast',
      })
    }
  }, [isViewingChat, sendQuickReply, addQuickReaction, navigateToChat, muteChat])

  // Handle incoming message notification
  const handleMessageNotification = useCallback((data) => {
    if (!data || !data.message || !data.sender) return
    
    const { message, sender } = data
    
    // Don't notify for own messages
    if (sender.id === currentUser?.id) return
    
    // Determine chat type and ID
    // Use 'user' for DMs to match backend API expectations
    const chatType = message.team_id ? 'team' : 'user'
    const chatId = message.team_id || message.sender_id
    
    // Increment the global unread count (unless user is viewing this chat)
    if (!isViewingChat(chatId, chatType)) {
      incrementUnreadCount()
      
      // Also increment the specific team's unread count in navTeams
      if (chatType === 'team') {
        incrementTeamUnreadCount(chatId)
      }
    }
    
    // Check if this message mentions the current user
    const isMentioned = message.mentions_user || 
      (message.mentions && Array.isArray(message.mentions) && 
        (message.mentions.includes(currentUser?.id) || message.mentions.includes('everyone')))
    
    // Check if muted - but mentions override mute setting
    if (isChatMuted(chatId, chatType) && !isMentioned) return
    
    // Check if preview should be hidden
    const hidePreview = shouldHidePreview(chatId, chatType)
    
    // Show appropriate notification
    if (!isWindowVisible || !isWindowFocused) {
      // Window not visible - show push notification
      showPushNotification(message, sender, chatId, chatType, hidePreview, isMentioned)
    }
    
    // Always show toast notification (unless viewing the chat)
    showToastNotification(message, sender, chatId, chatType, hidePreview, isMentioned)
  }, [currentUser, isChatMuted, shouldHidePreview, isWindowVisible, isWindowFocused, showPushNotification, showToastNotification, isViewingChat, incrementUnreadCount, incrementTeamUnreadCount])

  // Keep the handler ref updated so websocket callback always uses latest handler
  useEffect(() => {
    handleMessageNotificationRef.current = handleMessageNotification
  }, [handleMessageNotification])

  // Subscribe to notifications channel
  useEffect(() => {
    if (!currentUser?.id || !window.Echo) return
    
    // Wait for preferences to load
    if (!preferencesLoaded) return
    
    const channel = window.Echo.private(`chat.user.${currentUser.id}`)
    channelRef.current = channel
    
    // Use a wrapper function that calls the ref, ensuring we always use the latest handler
    const notificationHandler = (data) => {
      if (handleMessageNotificationRef.current) {
        handleMessageNotificationRef.current(data)
      }
    }
    
    channel.listen('.NewChatMessage', notificationHandler)
    
    return () => {
      if (channelRef.current) {
        channelRef.current.stopListening('.NewChatMessage')
      }
    }
  }, [currentUser?.id, preferencesLoaded]) // Removed handleMessageNotification - we use ref to always get latest

  const value = {
    currentUser,
    chatPreferences,
    globalSettings,
    isWindowFocused,
    isWindowVisible,
    notificationPermission,
    preferencesLoaded,
    totalUnreadCount,
    navTeams,
    isChatMuted,
    shouldHidePreview,
    isViewingChat,
    muteChat,
    sendQuickReply,
    addQuickReaction,
    navigateToChat,
    fetchChatPreferences,
    fetchGlobalSettings,
    incrementUnreadCount,
    decrementUnreadCount,
    incrementTeamUnreadCount,
    decrementTeamUnreadCount,
    refreshUnreadCount,
    clearProfilePhotoDismissal, // Export for use when user sets photo
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Profile Photo Prompt Dialog - shown on first app load if user needs photo */}
      <ProfilePhotoPromptDialog
        isOpen={showProfilePhotoPrompt}
        onClose={() => setShowProfilePhotoPrompt(false)}
        maskedPhone={profilePhotoPromptData.maskedPhone}
        userName={profilePhotoPromptData.userName}
        onSendSms={handleProfilePhotoSendSms}
      />
    </NotificationContext.Provider>
  )
}
