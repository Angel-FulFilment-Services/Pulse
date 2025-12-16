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
        const validMessages = allMessages
          .filter(msg => {
            const isForThisChat = msg.chatKey === chatKey
            const notExpired = (now - msg.createdAt) < MESSAGE_EXPIRY_MS
            
            // Remove messages that have attachments (File objects are lost after refresh)
            const hasAttachments = msg.attachments && msg.attachments.length > 0
            if (hasAttachments) {
              return false
            }
            
            // Remove failed messages that have no text (can't be recovered)
            const hasText = msg.body && msg.body.trim().length > 0
            const shouldKeep = msg.status !== 'failed' || hasText
            
            return isForThisChat && notExpired && shouldKeep
          })
          .map(msg => {
            // Mark any pending messages as failed on page load - they need manual retry
            if (msg.status === 'pending') {
              return { ...msg, status: 'failed' }
            }
            return msg
          })
        
        setOptimisticQueue(validMessages)
        
        // Clean up expired and invalid messages from storage
        // Also mark any pending messages as failed for ALL chats
        const allValid = allMessages
          .filter(msg => {
            const notExpired = (now - msg.createdAt) < MESSAGE_EXPIRY_MS
            
            // Remove messages with attachments
            const hasAttachments = msg.attachments && msg.attachments.length > 0
            if (hasAttachments) {
              return false
            }
            
            const hasText = msg.body && msg.body.trim().length > 0
            const shouldKeep = msg.status !== 'failed' || hasText
            return notExpired && shouldKeep
          })
          .map(msg => {
            // Mark any pending messages as failed on page load
            if (msg.status === 'pending') {
              return { ...msg, status: 'failed' }
            }
            return msg
          })
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
      attachments: messageData.attachments || [],
      reply_to_message_id: messageData.reply_to_message_id,
      reply_to_attachment_id: messageData.reply_to_attachment_id,
      reply_to_attachment: messageData.reply_to_attachment,
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
    // Filter out optimistic messages that match server messages
    // This must happen synchronously to prevent flash
    const pendingOptimistic = optimisticQueue.filter(msg => {
      // Only show pending and failed messages
      if (msg.status !== 'pending' && msg.status !== 'failed') {
        return false
      }
      
      // Check if there's a matching server message
      const isDuplicate = serverMessages.some(sm => {
        const timeDiff = Math.abs(new Date(sm.created_at).getTime() - new Date(msg.created_at).getTime())
        const sameBody = (sm.body || '') === (msg.body || '')
        const sameSender = sm.sender_id === msg.sender_id
        const sameReply = sm.reply_to_message_id === msg.reply_to_message_id
        const withinTimeWindow = timeDiff < 5000
        
        // For messages with attachments, also check attachment count
        const optimisticAttachmentCount = msg.attachments?.length || 0
        const serverAttachmentCount = sm.attachments?.length || 0
        const sameAttachmentCount = optimisticAttachmentCount === serverAttachmentCount
        
        // For attachment-only messages (no body text), be more lenient with timing
        const isAttachmentOnly = !msg.body || msg.body.trim() === ''
        const attachmentOnlyMatch = isAttachmentOnly && sameAttachmentCount > 0 && sameSender && withinTimeWindow
        
        const matches = (sameBody && sameSender && sameReply && withinTimeWindow && sameAttachmentCount) || attachmentOnlyMatch
        
        return matches
      })
      
      // If duplicate found, schedule removal from queue
      if (isDuplicate) {
        // Use setTimeout to clean up queue immediately but asynchronously
        setTimeout(() => {
          removeOptimisticMessage(msg.id)
        }, 0)
        return false // Don't include in merged messages
      }
      
      return true
    })
    
    // Merge and sort by created_at timestamp to maintain chronological order
    const merged = [...serverMessages, ...pendingOptimistic]
    return merged.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateA - dateB
    })
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
