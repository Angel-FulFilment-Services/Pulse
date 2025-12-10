import { useEffect, useRef } from 'react'

/**
 * Custom hook to manage real-time chat subscriptions and event handling
 */
export function useRealtimeChat({
  selectedChat,
  chatType,
  currentUser,
  onMessageReceived,
  onMessageRead,
  onClearTypingUser
}) {
  const echoRef = useRef(null)

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
      
      // Listen for new messages
      channel.listen('.MessageSent', (e) => {
        console.log('.MessageSent event received!', e)
        
        // Clear typing indicator for this user immediately
        if (onClearTypingUser && (e.message.user_id || e.message.sender_id)) {
          const userId = e.message.user_id || e.message.sender_id
          onClearTypingUser(userId)
        }
        
        // Notify parent component
        if (onMessageReceived) {
          onMessageReceived(e.message)
        }
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

    // Subscribe to the user's private channel for MessageRead events
    if (currentUser?.id) {
      const userChannelName = `chat.user.${currentUser.id}`
      console.log('Subscribing to user channel for read receipts:', userChannelName)
      
      const userChannel = window.Echo.private(userChannelName)
      
      userChannel.listen('.MessageRead', (e) => {
        console.log('MessageRead event received on user channel:', e)
        if (e.message_read && onMessageRead) {
          onMessageRead(e.message_read)
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
  }, [selectedChat, chatType, currentUser, onMessageReceived, onMessageRead, onClearTypingUser])

  // Send typing indicator
  const sendTypingIndicator = () => {
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

  return { sendTypingIndicator }
}
