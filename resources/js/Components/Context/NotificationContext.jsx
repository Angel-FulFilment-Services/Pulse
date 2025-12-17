import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import { usePage } from '@inertiajs/react'
import ChatNotificationToast from '../Chat/ChatNotificationToast'

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
  const channelRef = useRef(null)

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

  // Load preferences on mount
  useEffect(() => {
    fetchChatPreferences()
    fetchGlobalSettings()
  }, [fetchChatPreferences, fetchGlobalSettings])

  // Check if chat is muted
  const isChatMuted = useCallback((chatId, chatType) => {
    // Check global mute first
    if (globalSettings.global_mute) return true
    
    // Check per-chat mute
    const preference = chatPreferences.find(
      p => p.chat_id === chatId && p.chat_type === chatType
    )
    return preference?.is_muted || false
  }, [chatPreferences, globalSettings.global_mute])

  // Check if preview should be hidden
  const shouldHidePreview = useCallback((chatId, chatType) => {
    // Check global setting first
    if (globalSettings.global_hide_preview) return true
    
    // Check per-chat setting
    const preference = chatPreferences.find(
      p => p.chat_id === chatId && p.chat_type === chatType
    )
    return preference?.hide_preview || false
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
  const showPushNotification = useCallback((message, sender, chatId, chatType, hidePreview) => {
    if (notificationPermission !== 'granted') return
    if (isWindowVisible && isWindowFocused) return
    
    const title = chatType === 'team' ? `${sender.name} in ${message.team_name}` : sender.name
    const body = hidePreview ? 'New message' : (message.body || 'Sent an attachment')
    
    const notification = new Notification(title, {
      body,
      icon: sender.profile_photo_url || '/images/default-avatar.png',
      tag: `chat-${chatType}-${chatId}`,
      requireInteraction: false,
    })
    
    notification.onclick = () => {
      window.focus()
      navigateToChat(chatId, chatType)
      notification.close()
    }
    
    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000)
  }, [notificationPermission, isWindowVisible, isWindowFocused, navigateToChat])

  // Show in-app toast notification
  const showToastNotification = useCallback((message, sender, chatId, chatType, hidePreview) => {
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
    
    // Check if muted
    if (isChatMuted(chatId, chatType)) return
    
    // Check if preview should be hidden
    const hidePreview = shouldHidePreview(chatId, chatType)
    
    // Show appropriate notification
    if (!isWindowVisible || !isWindowFocused) {
      // Window not visible - show push notification
      showPushNotification(message, sender, chatId, chatType, hidePreview)
    }
    
    // Always show toast notification (unless viewing the chat)
    showToastNotification(message, sender, chatId, chatType, hidePreview)
  }, [currentUser, isChatMuted, shouldHidePreview, isWindowVisible, isWindowFocused, showPushNotification, showToastNotification])

  // Subscribe to notifications channel
  useEffect(() => {
    if (!currentUser?.id || !window.Echo) return
    
    // Wait for preferences to load
    if (!preferencesLoaded) return
    
    const channel = window.Echo.private(`chat.user.${currentUser.id}`)
    channelRef.current = channel
    
    channel.listen('.NewChatMessage', handleMessageNotification)
    
    return () => {
      if (channelRef.current) {
        channelRef.current.stopListening('.NewChatMessage')
      }
    }
  }, [currentUser?.id, handleMessageNotification, preferencesLoaded])

  const value = {
    currentUser,
    chatPreferences,
    globalSettings,
    isWindowFocused,
    isWindowVisible,
    notificationPermission,
    preferencesLoaded,
    isChatMuted,
    shouldHidePreview,
    isViewingChat,
    muteChat,
    sendQuickReply,
    addQuickReaction,
    navigateToChat,
    fetchChatPreferences,
    fetchGlobalSettings,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
