import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'chat_optimistic_messages'
const MESSAGE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

export function useOptimisticMessages(selectedChat, chatType, currentUser) {
  const [optimisticQueue, setOptimisticQueue] = useState([])
  const processingRef = useRef(new Set()) // Track which messages are currently being sent

  // Load optimistic messages from sessionStorage on mount
  useEffect(() => {
    if (!selectedChat || !currentUser) return

    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const allMessages = JSON.parse(stored)
        const now = Date.now()
        
        // Filter messages for this chat and remove expired ones
        const chatKey = chatType === 'team' ? `team-${selectedChat.id}` : `dm-${selectedChat.id}`
        const validMessages = allMessages.filter(msg => {
          const isForThisChat = msg.chatKey === chatKey
          const notExpired = (now - msg.createdAt) < MESSAGE_EXPIRY_MS
          return isForThisChat && notExpired
        })
        
        setOptimisticQueue(validMessages)
        
        // Clean up expired messages from storage
        const allValid = allMessages.filter(msg => 
          (now - msg.createdAt) < MESSAGE_EXPIRY_MS
        )
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(allValid))
      } catch (e) {
        console.error('Error loading optimistic messages:', e)
      }
    }
  }, [selectedChat, chatType, currentUser])

  // Save to sessionStorage whenever queue changes
  useEffect(() => {
    if (!selectedChat) return // Don't save if no chat selected
    
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      const allMessages = stored ? JSON.parse(stored) : []
      
      // Remove old messages for this chat
      const chatKey = chatType === 'team' ? `team-${selectedChat.id}` : `dm-${selectedChat.id}`
      const otherChats = allMessages.filter(msg => msg.chatKey !== chatKey)
      
      if (optimisticQueue.length === 0) {
        // Clear storage for this chat if no pending messages
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(otherChats))
      } else {
        // Add current queue
        const updated = [...otherChats, ...optimisticQueue]
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
    } catch (e) {
      console.error('Error saving optimistic messages:', e)
    }
  }, [optimisticQueue, selectedChat, chatType])

  // Add a message to the queue
  const addOptimisticMessage = (messageData) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const chatKey = chatType === 'team' ? `team-${selectedChat.id}` : `dm-${selectedChat.id}`
    
    const optimisticMsg = {
      id: tempId,
      chatKey,
      body: messageData.body,
      sender_id: currentUser.id,
      user_id: currentUser.id,
      user: currentUser,
      created_at: new Date().toISOString(),
      createdAt: Date.now(),
      attachments: [],
      reply_to_message_id: messageData.reply_to_message_id,
      reply_to_message: messageData.reply_to_message,
      status: 'pending', // pending, failed, sent
      retryCount: 0,
    }
    
    setOptimisticQueue(prev => [...prev, optimisticMsg])
    return optimisticMsg
  }

  // Update message status
  const updateMessageStatus = (tempId, status, realMessage = null) => {
    setOptimisticQueue(prev => 
      prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status, realMessage, lastAttempt: Date.now() }
          : msg
      )
    )
    
    // Remove from processing set when done
    if (status !== 'pending') {
      processingRef.current.delete(tempId)
    }
  }

  // Remove message from queue (successfully sent)
  const removeOptimisticMessage = (tempId) => {
    setOptimisticQueue(prev => prev.filter(msg => msg.id !== tempId))
    processingRef.current.delete(tempId)
  }

  // Retry a failed message
  const retryMessage = (tempId) => {
    processingRef.current.delete(tempId) // Clear processing flag
    setOptimisticQueue(prev => 
      prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'pending', retryCount: msg.retryCount + 1 }
          : msg
      )
    )
  }

  // Get all messages including optimistic ones (for display)
  const getMergedMessages = (serverMessages) => {
    // Create a Set of server message IDs for quick lookup
    const serverMessageIds = new Set(serverMessages.map(m => m.id))
    
    // Filter out optimistic messages that have been successfully sent
    const pendingOptimistic = optimisticQueue.filter(msg => {
      // If marked as sent and the real message exists in server messages, don't show optimistic
      if (msg.status === 'sent' && msg.realMessage && serverMessageIds.has(msg.realMessage.id)) {
        console.log('Filtering out sent optimistic message:', msg.id, '-> real:', msg.realMessage.id)
        return false
      }
      
      // Also check if there's a server message with matching body, timestamp, sender, AND reply context
      // This handles race conditions where broadcast arrives before status update
      const isDuplicate = serverMessages.some(sm => {
        const timeDiff = Math.abs(new Date(sm.created_at).getTime() - new Date(msg.created_at).getTime())
        const sameBody = sm.body === msg.body
        const sameSender = sm.sender_id === msg.sender_id
        const sameReply = sm.reply_to_message_id === msg.reply_to_message_id
        const withinTimeWindow = timeDiff < 2000 // Within 2 seconds
        
        const matches = sameBody && sameSender && sameReply && withinTimeWindow
        
        if (matches) {
          console.log('Found duplicate:', {
            optimistic: { id: msg.id, body: msg.body, reply_to: msg.reply_to_message_id },
            server: { id: sm.id, body: sm.body, reply_to: sm.reply_to_message_id },
            timeDiff
          })
        }
        
        return matches
      })
      
      if (isDuplicate) return false
      
      // Show pending and failed messages
      return msg.status === 'pending' || msg.status === 'failed'
    })
    
    return [...serverMessages, ...pendingOptimistic]
  }

  return {
    optimisticQueue,
    addOptimisticMessage,
    updateMessageStatus,
    removeOptimisticMessage,
    retryMessage,
    getMergedMessages,
    processingRef, // Expose for external tracking
  }
}
