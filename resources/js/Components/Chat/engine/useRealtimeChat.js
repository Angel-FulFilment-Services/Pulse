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
  onClearTypingUser,
  onReactionAdded,
  onReactionRemoved,
  onAttachmentReactionAdded,
  onAttachmentReactionRemoved,
  onMessagePinned,
  onMessageUnpinned,
  onMessageDeleted,
  onMessageRestored,
  onAttachmentPinned,
  onAttachmentUnpinned,
  onAttachmentDeleted,
  onAttachmentRestored
}) {
  const echoRef = useRef(null)
  const currentUserRef = useRef(currentUser)
  const onMessageReceivedRef = useRef(onMessageReceived)
  const onMessageReadRef = useRef(onMessageRead)
  const onClearTypingUserRef = useRef(onClearTypingUser)
  const onReactionAddedRef = useRef(onReactionAdded)
  const onReactionRemovedRef = useRef(onReactionRemoved)
  const onAttachmentReactionAddedRef = useRef(onAttachmentReactionAdded)
  const onAttachmentReactionRemovedRef = useRef(onAttachmentReactionRemoved)
  const onMessagePinnedRef = useRef(onMessagePinned)
  const onMessageUnpinnedRef = useRef(onMessageUnpinned)
  const onMessageDeletedRef = useRef(onMessageDeleted)
  const onMessageRestoredRef = useRef(onMessageRestored)
  const onAttachmentPinnedRef = useRef(onAttachmentPinned)
  const onAttachmentUnpinnedRef = useRef(onAttachmentUnpinned)
  const onAttachmentDeletedRef = useRef(onAttachmentDeleted)
  const onAttachmentRestoredRef = useRef(onAttachmentRestored)

  // Keep refs up to date
  useEffect(() => {
    currentUserRef.current = currentUser
    onMessageReceivedRef.current = onMessageReceived
    onMessageReadRef.current = onMessageRead
    onClearTypingUserRef.current = onClearTypingUser
    onReactionAddedRef.current = onReactionAdded
    onReactionRemovedRef.current = onReactionRemoved
    onAttachmentReactionAddedRef.current = onAttachmentReactionAdded
    onAttachmentReactionRemovedRef.current = onAttachmentReactionRemoved
    onMessagePinnedRef.current = onMessagePinned
    onMessageUnpinnedRef.current = onMessageUnpinned
    onMessageDeletedRef.current = onMessageDeleted
    onMessageRestoredRef.current = onMessageRestored
    onAttachmentPinnedRef.current = onAttachmentPinned
    onAttachmentUnpinnedRef.current = onAttachmentUnpinned
    onAttachmentDeletedRef.current = onAttachmentDeleted
    onAttachmentRestoredRef.current = onAttachmentRestored
  }, [onMessageReceived, onMessageRead, onClearTypingUser, onReactionAdded, onReactionRemoved, onAttachmentReactionAdded, onAttachmentReactionRemoved, onMessagePinned, onMessageUnpinned, onMessageDeleted, onMessageRestored, onAttachmentPinned, onAttachmentUnpinned, onAttachmentDeleted, onAttachmentRestored])

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
      
      // Listen for reaction added
      channel.listen('.MessageReactionAdded', (e) => {
        // Ignore our own reactions
        if (e.reaction && e.reaction.user_id !== currentUserRef.current?.id && onReactionAddedRef.current) {
          onReactionAddedRef.current(e.reaction)
        }
      })
      
      // Listen for reaction removed
      channel.listen('.MessageReactionRemoved', (e) => {
        // Ignore our own reactions
        if (e.user_id !== currentUserRef.current?.id && onReactionRemovedRef.current) {
          onReactionRemovedRef.current(e.message_id, e.user_id, e.emoji)
        }
      })
      
      // Listen for attachment reaction added
      channel.listen('.AttachmentReactionAdded', (e) => {
        // Ignore our own reactions
        if (e.reaction && e.reaction.user_id !== currentUserRef.current?.id && onAttachmentReactionAddedRef.current) {
          onAttachmentReactionAddedRef.current(e.reaction)
        }
      })
      
      // Listen for attachment reaction removed
      channel.listen('.AttachmentReactionRemoved', (e) => {
        // Ignore our own reactions
        if (e.user_id !== currentUserRef.current?.id && onAttachmentReactionRemovedRef.current) {
          onAttachmentReactionRemovedRef.current(e.attachment_id, e.user_id, e.emoji)
        }
      })
      
      // Listen for message pinned
      channel.listen('.MessagePinned', (e) => {
        console.log('.MessagePinned event received!', e)
        if (onMessagePinnedRef.current && e.message) {
          onMessagePinnedRef.current(e.message)
        }
      })
      
      // Listen for message unpinned
      channel.listen('.MessageUnpinned', (e) => {
        console.log('.MessageUnpinned event received!', e)
        if (onMessageUnpinnedRef.current && e.message_id) {
          onMessageUnpinnedRef.current(e.message_id)
        }
      })
      
      // Listen for message deleted
      channel.listen('.MessageDeleted', (e) => {
        console.log('.MessageDeleted event received!', e)
        if (onMessageDeletedRef.current && e.message_id) {
          onMessageDeletedRef.current(e.message_id)
        }
      })
      
      // Listen for message restored
      channel.listen('.MessageRestored', (e) => {
        console.log('.MessageRestored event received!', e)
        if (onMessageRestoredRef.current && e.message) {
          onMessageRestoredRef.current(e.message)
        }
      })
      
      // Listen for attachment pinned
      channel.listen('.AttachmentPinned', (e) => {
        console.log('.AttachmentPinned event received!', e)
        if (onAttachmentPinnedRef.current && e.attachment) {
          onAttachmentPinnedRef.current(e.attachment)
        }
      })
      
      // Listen for attachment unpinned
      channel.listen('.AttachmentUnpinned', (e) => {
        console.log('.AttachmentUnpinned event received!', e)
        if (onAttachmentUnpinnedRef.current && e.attachment_id) {
          onAttachmentUnpinnedRef.current(e.attachment_id)
        }
      })
      
      // Listen for attachment deleted
      channel.listen('.AttachmentDeleted', (e) => {
        console.log('.AttachmentDeleted event received!', e)
        if (onAttachmentDeletedRef.current && e.attachment_id) {
          onAttachmentDeletedRef.current(e.attachment_id)
        }
      })
      
      // Listen for attachment restored
      channel.listen('.AttachmentRestored', (e) => {
        console.log('.AttachmentRestored event received!', e)
        if (onAttachmentRestoredRef.current && e.attachment) {
          onAttachmentRestoredRef.current(e.attachment)
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
