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
  const onMessageReceivedRef = useRef(onMessageReceived)
  const onMessageReadRef = useRef(onMessageRead)
  const onClearTypingUserRef = useRef(onClearTypingUser)

  // Keep refs up to date
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived
    onMessageReadRef.current = onMessageRead
    onClearTypingUserRef.current = onClearTypingUser
  }, [onMessageReceived, onMessageRead, onClearTypingUser])

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
        if (onClearTypingUserRef.current && (e.message.user_id || e.message.sender_id)) {
          const userId = e.message.user_id || e.message.sender_id
          onClearTypingUserRef.current(userId)
        }
        
        // Notify parent component
        if (onMessageReceivedRef.current) {
          onMessageReceivedRef.current(e.message)
        }
      })
      
      // Listen for typing indicators
      channel.listenForWhisper('typing', (e) => {
        console.log('Typing event received:', e)
        // Don't show typing indicator for current user
        if (e.user_id !== currentUser?.id) {
          // Handle typing indicator in parent component
          // This would need to be passed as a callback
          console.log(`${e.user_name} is typing...`)
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
        // Handle both single read and batch reads
        if (e.message_reads && onMessageReadRef.current) {
          // Batch reads
          e.message_reads.forEach(read => {
            onMessageReadRef.current(read)
          })
        } else if (e.message_read && onMessageReadRef.current) {
          // Legacy single read (for backwards compatibility)
          onMessageReadRef.current(e.message_read)
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
