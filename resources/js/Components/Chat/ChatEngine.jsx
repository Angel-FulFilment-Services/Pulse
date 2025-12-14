import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { ring } from 'ldrs'
import ChatHeader from './engine/ChatHeader'

// Register the ring spinner
ring.register()
import MessageList from './engine/MessageList'
import MessageInput from './engine/MessageInput'
import TypingIndicator from './engine/TypingIndicator'
import ScrollToNewMessages from './engine/ScrollToNewMessages'
import EmptyState from './engine/EmptyState'
import ComposeMode from './engine/ComposeMode'
import ReplyPreview from './engine/ReplyPreview'
import PinnedMessageBanner from './engine/PinnedMessageBanner'
import { useRealtimeChat } from './engine/useRealtimeChat'
import { useOptimisticMessages } from './engine/useOptimisticMessages'
import { useRestrictedWords } from './engine/useRestrictedWords'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 10000 // 10 seconds
const MAX_MESSAGES_PER_WINDOW = 10 // 10 messages per 10 seconds

export default function ChatEngine({ 
  selectedChat, 
  chatType, 
  currentUser, 
  onChatSelect, 
  onRefreshContacts,
  typingUsers = [], 
  onClearTypingUser,
  onClearUnread
}) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageReads, setMessageReads] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [pinnedMessage, setPinnedMessage] = useState(null)
  const [pinnedAttachment, setPinnedAttachment] = useState(null)
  const [pendingAttachments, setPendingAttachments] = useState([]) // Attachments waiting to be sent
  const [uploadedAttachmentData, setUploadedAttachmentData] = useState([]) // Uploaded attachment metadata
  const [clearAttachmentsTrigger, setClearAttachmentsTrigger] = useState(false) // Trigger to clear MessageInput attachments
  const markedAsReadRef = useRef(new Set())
  const loadedMessageIdsRef = useRef(new Set()) // Track which messages we've already loaded
  const messagesEndRef = useRef(null)
  const replyPreviewRef = useRef(null)
  const messageListContainerRef = useRef(null)
  const messageRefsRef = useRef(null) // Will hold the refs from MessageList
  const messageInputRef = useRef(null)
  const [unreadMessagesNotInView, setUnreadMessagesNotInView] = useState(0)
  const lastUnreadMessageRef = useRef(null)
  const isUserScrolledUpRef = useRef(false)
  const readBatchTimeoutRef = useRef(null)
  const pendingReadMessagesRef = useRef([])
  
  // Rate limiting
  const messageSentTimestamps = useRef([])
  const [isRateLimited, setIsRateLimited] = useState(false)
  
  // Track pending reactions to prevent double-clicks
  const pendingReactionsRef = useRef(new Set())

  // Use optimistic messages hook
  const {
    optimisticQueue,
    addOptimisticMessage,
    updateMessageStatus,
    removeOptimisticMessage,
    retryMessage,
    getMergedMessages,
    processingRef,
  } = useOptimisticMessages(selectedChat, chatType, currentUser)

  // Use restricted words hook
  const { filterRestrictedWords } = useRestrictedWords()

  // Scroll to bottom when messages change
  const scrollToBottom = (instant = false) => {
    if (instant) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Track if user has scrolled up
  useEffect(() => {
    const container = messageListContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // Consider user scrolled up if they're more than 100px from bottom
      isUserScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll only if user hasn't scrolled up - track message count to detect new messages
  const prevMessageCountRef = useRef(0)
  const isLoadingMoreRef = useRef(false)
  
  useEffect(() => {
    // Skip auto-scroll when loading more messages (pagination)
    if (isLoadingMoreRef.current) {
      const mergedMessages = getMergedMessages(messages)
      prevMessageCountRef.current = mergedMessages.length
      isLoadingMoreRef.current = false
      return
    }
    
    const mergedMessages = getMergedMessages(messages)
    
    // Only auto-scroll if:
    // 1. User is at bottom (not scrolled up)
    // 2. Message count increased (new message arrived)
    if (!isUserScrolledUpRef.current && mergedMessages.length > prevMessageCountRef.current) {
      scrollToBottom()
    }
    
    prevMessageCountRef.current = mergedMessages.length
  }, [messages, optimisticQueue])

  useEffect(() => {
    if (replyingTo && replyPreviewRef.current && messageListContainerRef.current && messageRefsRef.current) {
      // Wait for the reply preview to render
      requestAnimationFrame(() => {
        const replyPreviewHeight = replyPreviewRef.current?.offsetHeight || 0
        const container = messageListContainerRef.current
        const messageElement = messageRefsRef.current[replyingTo.id]
        
        if (container && messageElement && replyPreviewHeight > 0) {
          // Get the container's viewport bounds
          const containerRect = container.getBoundingClientRect()
          const messageRect = messageElement.getBoundingClientRect()
          
          // Calculate where the bottom of the container will be after the reply preview appears
          const newContainerBottom = containerRect.bottom - replyPreviewHeight
          
          // Check if the message bottom would be hidden by the reply preview
          if (messageRect.bottom > newContainerBottom) {
            // Calculate scroll amount needed
            const scrollAmount = messageRect.bottom - newContainerBottom - 32
            
            // Only scroll down, never up
            if (scrollAmount > 0) {
              container.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
              })
            }
          }
        }
      })
    }
  }, [replyingTo])

  // Check for unread messages not in view
  useEffect(() => {
    if (!messageListContainerRef.current || !messageRefsRef.current || !currentUser) return

    const checkUnreadInView = () => {
      const container = messageListContainerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      let unreadCount = 0
      let lastUnreadId = null

      messages.forEach(msg => {
        const senderId = msg.sender_id || msg.user_id
        const isFromOther = senderId !== currentUser.id
        const isUnread = !messageReads[msg.id]
        const notBeingMarked = !markedAsReadRef.current.has(msg.id)
        
        if (isFromOther && isUnread && notBeingMarked) {
          const messageElement = messageRefsRef.current?.[msg.id]
          if (messageElement) {
            const messageRect = messageElement.getBoundingClientRect()
            // Check if message is below the visible area
            if (messageRect.top > containerRect.bottom) {
              unreadCount++
              // Keep updating to get the LAST unread message
              lastUnreadId = msg.id
            }
          }
        }
      })

      setUnreadMessagesNotInView(unreadCount)
      lastUnreadMessageRef.current = lastUnreadId
    }

    checkUnreadInView()

    // Re-check on scroll
    const container = messageListContainerRef.current
    container?.addEventListener('scroll', checkUnreadInView)

    return () => {
      container?.removeEventListener('scroll', checkUnreadInView)
    }
  }, [messages, messageReads, currentUser])

  // Scroll to last unread message
  const scrollToLastUnread = () => {
    if (lastUnreadMessageRef.current && messageRefsRef.current) {
      const element = messageRefsRef.current[lastUnreadMessageRef.current]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Reset scroll tracking so we know user is going to bottom
        isUserScrolledUpRef.current = false
      }
    }
  }

  // Fetch messages when chat changes
  useEffect(() => {
    if (!selectedChat || chatType === 'compose') {
      setMessages([])
      setHasMore(true)
      loadedMessageIdsRef.current.clear() // Clear loaded IDs when changing chats
      return
    }

    setLoading(true)
    loadedMessageIdsRef.current.clear() // Clear for new chat
    
    let url = ''
    if (chatType === 'team') {
      url = `/api/chat/messages?team_id=${selectedChat.id}&per_page=50`
    } else if (chatType === 'dm') {
      url = `/api/chat/messages?recipient_id=${selectedChat.id}&per_page=50`
    }

    fetch(url, { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : { messages: [], has_more: false })
      .then(data => {
        const messageList = Array.isArray(data) ? data : (data.messages || [])
        const hasMoreMessages = data.has_more !== undefined ? data.has_more : false
        
        setMessages(messageList)
        setHasMore(hasMoreMessages)
        
        // Track loaded message IDs
        messageList.forEach(msg => loadedMessageIdsRef.current.add(msg.id))
        
        // Build read status map
        const reads = {}
        messageList.forEach(msg => {
          if (msg.reads && msg.reads.length > 0) {
            reads[msg.id] = msg.reads
          }
        })
        setMessageReads(reads)
        
        setLoading(false)
        
        // Always scroll to bottom when opening a chat
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
          isUserScrolledUpRef.current = false
        }, 50)
      })
      .catch(() => {
        setMessages([])
        setLoading(false)
      })
  }, [selectedChat, chatType])

  // Load more messages when scrolling to top
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !selectedChat || messages.length === 0) return
    
    isLoadingMoreRef.current = true
    setLoadingMore(true)
    const oldestMessageId = messages[0].id
    const container = messageListContainerRef.current
    
    // Save the current scroll position and the element at the top of the viewport
    const scrollBefore = container?.scrollTop || 0
    const scrollHeightBefore = container?.scrollHeight || 0
    
    let url = ''
    if (chatType === 'team') {
      url = `/api/chat/messages?team_id=${selectedChat.id}&per_page=50&before_id=${oldestMessageId}`
    } else if (chatType === 'dm') {
      url = `/api/chat/messages?recipient_id=${selectedChat.id}&per_page=50&before_id=${oldestMessageId}`
    }
    
    try {
      const res = await fetch(url, { credentials: 'same-origin' })
      const data = await res.json()
      const olderMessages = data.messages || []
      const hasMoreMessages = data.has_more !== undefined ? data.has_more : false
      
      // Filter out messages we've already loaded (prevent duplicates)
      const newMessages = olderMessages.filter(msg => !loadedMessageIdsRef.current.has(msg.id))
      
      if (newMessages.length > 0) {
        // Track newly loaded message IDs
        newMessages.forEach(msg => loadedMessageIdsRef.current.add(msg.id))
        
        setMessages(prev => [...newMessages, ...prev])
        setHasMore(hasMoreMessages)
        
        // Restore scroll position after new messages are rendered
        setTimeout(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight
            const heightDifference = scrollHeightAfter - scrollHeightBefore
            container.scrollTop = scrollBefore + heightDifference
          }
        }, 0)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Detect scroll to top for infinite scroll
  useEffect(() => {
    const container = messageListContainerRef.current
    if (!container) return

    const handleScroll = () => {
      // If scrolled near the top (within 200px), load more
      if (container.scrollTop < 200 && hasMore && !loadingMore) {
        loadMoreMessages()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, messages, selectedChat, chatType])

  // Handle incoming messages from realtime
  const handleMessageReceived = (message) => {
    // Only add if message doesn't already exist (avoid duplicates)
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id)
      if (exists) {
        return prev
      }
      
      // If this is a reply, ensure we have the replied message in context
      if (message.reply_to_message_id && !message.reply_to_message) {
        // Try to find the replied message in our current messages
        const repliedMessage = prev.find(m => m.id === message.reply_to_message_id)
        if (repliedMessage) {
          message.reply_to_message = repliedMessage
        }
      }
      
      return [...prev, message]
    })
  }

  // Handle read receipt updates
  const handleMessageRead = (messageRead) => {
    setMessageReads(prev => ({
      ...prev,
      [messageRead.message_id]: [...(prev[messageRead.message_id] || []), messageRead]
    }))
  }

  // Handle reaction added from broadcast
  const handleReactionAdded = (reaction) => {
    setMessages(prev => prev.map(msg => {
      // Convert both to numbers for comparison (message_id might be string from broadcast)
      if (msg.id == reaction.message_id) {
        const existingReactions = msg.reactions || []
        // Check if this exact reaction already exists
        const exists = existingReactions.some(
          r => r.user_id === reaction.user_id && r.emoji === reaction.emoji
        )
        if (!exists) {
          // Mark as new for animation purposes
          const newReaction = { ...reaction, isNewReaction: true }
          return { ...msg, reactions: [...existingReactions, newReaction] }
        }
      }
      return msg
    }))
  }

  // Handle reaction removed from broadcast
  const handleReactionRemoved = (messageId, userId, emoji) => {
    // Ignore if this is our own reaction and it's still pending
    const reactionKey = `${messageId}-${userId}-${emoji}`
    if (pendingReactionsRef.current.has(reactionKey)) {
      return
    }
    
    setMessages(prev => prev.map(msg => {
      // Convert both to numbers for comparison
      if (msg.id == messageId) {
        const updatedReactions = (msg.reactions || []).filter(
          r => !(r.user_id === userId && r.emoji === emoji)
        )
        return { ...msg, reactions: updatedReactions }
      }
      return msg
    }))
  }

  // Handle attachment reaction added via broadcast
  const handleAttachmentReactionAdded = (reaction) => {
    // Ignore if this is our own reaction and it's still pending
    const reactionKey = `attachment-${reaction.attachment_id}-${reaction.user_id}-${reaction.emoji}`
    if (pendingReactionsRef.current.has(reactionKey)) {
      return
    }
    
    setMessages(prev => prev.map(msg => {
      const attachmentIndex = msg.attachments?.findIndex(a => a.id == reaction.attachment_id)
      if (attachmentIndex === -1 || attachmentIndex === undefined) return msg
      
      const updatedAttachments = [...msg.attachments]
      const attachment = updatedAttachments[attachmentIndex]
      const existingReactions = attachment.reactions || []
      
      // Check if this exact reaction already exists
      const alreadyExists = existingReactions.some(
        r => r.user_id === reaction.user_id && r.emoji === reaction.emoji
      )
      
      if (alreadyExists) return msg
      
      // Add the new reaction with animation flag
      updatedAttachments[attachmentIndex] = {
        ...attachment,
        reactions: [...existingReactions, { ...reaction, isNewReaction: true }]
      }
      
      return { ...msg, attachments: updatedAttachments }
    }))
  }

  // Handle attachment reaction removed via broadcast
  const handleAttachmentReactionRemoved = (attachmentId, userId, emoji) => {
    // Ignore if this is our own reaction and it's still pending
    const reactionKey = `attachment-${attachmentId}-${userId}-${emoji}`
    if (pendingReactionsRef.current.has(reactionKey)) {
      return
    }
    
    setMessages(prev => prev.map(msg => {
      const attachmentIndex = msg.attachments?.findIndex(a => a.id == attachmentId)
      if (attachmentIndex === -1 || attachmentIndex === undefined) return msg
      
      const updatedAttachments = [...msg.attachments]
      const attachment = updatedAttachments[attachmentIndex]
      const existingReactions = attachment.reactions || []
      
      // Remove the specific reaction
      const updatedReactions = existingReactions.filter(
        r => !(r.user_id === userId && r.emoji === emoji)
      )
      
      updatedAttachments[attachmentIndex] = {
        ...attachment,
        reactions: updatedReactions
      }
      
      return { ...msg, attachments: updatedAttachments }
    }))
  }

  // Set up real-time listeners
  const { sendTypingIndicator } = useRealtimeChat({
    selectedChat,
    chatType,
    currentUser,
    onMessageReceived: handleMessageReceived,
    onMessageRead: handleMessageRead,
    onClearTypingUser,
    onReactionAdded: handleReactionAdded,
    onReactionRemoved: handleReactionRemoved,
    onAttachmentReactionAdded: handleAttachmentReactionAdded,
    onAttachmentReactionRemoved: handleAttachmentReactionRemoved,
    onMessagePinned: (message) => {
      setPinnedMessage(message)
    },
    onMessageUnpinned: (messageId) => {
      if (pinnedMessage?.id === messageId) {
        setPinnedMessage(null)
      }
    },
    onMessageDeleted: (messageId) => {
      setMessages(prev => prev.map(msg => 
        msg.id == messageId 
          ? { ...msg, deleted_at: new Date().toISOString() }
          : msg
      ))
    },
    onMessageRestored: (message) => {
      setMessages(prev => prev.map(msg => 
        msg.id == message.id 
          ? { ...message, deleted_at: null }
          : msg
      ))
    },
    onAttachmentPinned: (attachment) => {
      setPinnedAttachment(attachment)
      setPinnedMessage(null)
    },
    onAttachmentUnpinned: (attachmentId) => {
      if (pinnedAttachment?.id == attachmentId) {
        setPinnedAttachment(null)
      }
    },
    onAttachmentDeleted: (attachmentId) => {
      // Mark attachment as deleted in messages
      setMessages(prev => prev.map(msg => ({
        ...msg,
        attachments: msg.attachments?.map(att => 
          att.id == attachmentId 
            ? { ...att, deleted_at: new Date().toISOString() }
            : att
        )
      })))
      // Clear from pinned if it was pinned
      if (pinnedAttachment?.id == attachmentId) {
        setPinnedAttachment(null)
      }
    },
    onAttachmentRestored: (attachment) => {
      // Mark attachment as restored in messages
      setMessages(prev => prev.map(msg => ({
        ...msg,
        attachments: msg.attachments?.map(att => 
          att.id == attachment.id 
            ? { ...att, deleted_at: null }
            : att
        )
      })))
    }
  })

  // Mark messages as read when viewing chat - only if visible in viewport
  useEffect(() => {
    if (!selectedChat || !currentUser || chatType === 'compose' || messages.length === 0) return
    if (!messageListContainerRef.current || !messageRefsRef.current) return

    // Batch process read receipts
    const processBatchedReads = () => {
      // Skip sending reads if there are pending messages being sent
      const hasPendingMessages = optimisticQueue.some(msg => msg.status === 'pending')
      if (hasPendingMessages) {
        // Don't clear the pending list, we'll retry when messages finish sending
        return
      }
      
      if (pendingReadMessagesRef.current.length === 0) return

      const messageIds = [...pendingReadMessagesRef.current]
      pendingReadMessagesRef.current = []

      // Send batch request
      fetch('/api/chat/messages/read-batch', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({ message_ids: messageIds })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.reads) {
            // Update read status for all messages
            setMessageReads(prev => {
              const updated = { ...prev }
              data.reads.forEach(read => {
                updated[read.message_id] = [...(updated[read.message_id] || []), read]
              })
              return updated
            })
            // Clear unread indicator when marking as read
            onClearUnread?.()
          }
        })
        .catch(err => {
          console.error('Error marking messages as read:', err)
          // Remove from marked set on error so they can be retried
          messageIds.forEach(id => markedAsReadRef.current.delete(id))
        })
    }

    const checkAndMarkVisibleMessages = () => {
      // Skip marking as read if there are pending messages being sent
      const hasPendingMessages = optimisticQueue.some(msg => msg.status === 'pending')
      if (hasPendingMessages) {
        return
      }
      
      const container = messageListContainerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()

      // Mark all unread messages from others as read IF they're visible
      const unreadMessages = messages.filter(msg => {
        const senderId = msg.sender_id || msg.user_id
        const isFromOther = senderId !== currentUser.id
        const notAlreadyRead = !messageReads[msg.id]
        const notAlreadyMarking = !markedAsReadRef.current.has(msg.id)
        
        if (!isFromOther || !notAlreadyRead || !notAlreadyMarking) return false

        // Check if message is in viewport
        const messageElement = messageRefsRef.current?.[msg.id]
        if (!messageElement) return false

        const messageRect = messageElement.getBoundingClientRect()
        
        // Message is visible if any part of it is within the container's viewport
        const isVisible = 
          messageRect.bottom >= containerRect.top &&
          messageRect.top <= containerRect.bottom

        return isVisible
      })

      if (unreadMessages.length === 0) return

      // Mark each visible message as being processed and add to batch
      unreadMessages.forEach(msg => {
        markedAsReadRef.current.add(msg.id)
        pendingReadMessagesRef.current.push(msg.id)
      })

      // Clear existing timeout
      if (readBatchTimeoutRef.current) {
        clearTimeout(readBatchTimeoutRef.current)
      }

      // Set timeout to batch process in 300ms
      readBatchTimeoutRef.current = setTimeout(processBatchedReads, 300)
    }

    // Check initially
    checkAndMarkVisibleMessages()

    // Re-check on scroll
    const container = messageListContainerRef.current
    container?.addEventListener('scroll', checkAndMarkVisibleMessages)

    return () => {
      container?.removeEventListener('scroll', checkAndMarkVisibleMessages)
      if (readBatchTimeoutRef.current) {
        clearTimeout(readBatchTimeoutRef.current)
      }
    }
  }, [messages, selectedChat, currentUser, chatType, messageReads, optimisticQueue])

  // Background processor for optimistic messages
  useEffect(() => {
    if (!selectedChat || optimisticQueue.length === 0) return

    const processPendingMessages = async () => {
      for (const msg of optimisticQueue) {
        // Skip if not pending or already being processed
        if (msg.status !== 'pending' || processingRef.current.has(msg.id)) {
          continue
        }

        // Mark as being processed
        processingRef.current.add(msg.id)

        try {
          // Check if message has attachments - if so, they must be File objects
          // After page refresh, File objects are lost, so we can't send the message
          if (msg.attachments && msg.attachments.length > 0) {
            const hasValidFiles = msg.attachments.every(att => att.file instanceof File)
            if (!hasValidFiles) {
              updateMessageStatus(msg.id, 'failed')
              processingRef.current.delete(msg.id)
              continue
            }
          }
          
          // Use FormData if we have attachments, otherwise use JSON
          let response
          
          if (msg.attachments && msg.attachments.length > 0) {
            // Use FormData for messages with attachments
            const formData = new FormData()
            formData.append('body', msg.body || '')
            formData.append('type', 'message')
            
            // Set team_id or recipient_id based on chat type
            if (chatType === 'team') {
              formData.append('team_id', selectedChat.id)
            } else {
              formData.append('recipient_id', selectedChat.id)
            }
            
            // Include reply_to_message_id if replying
            if (msg.reply_to_message_id) {
              formData.append('reply_to_message_id', msg.reply_to_message_id)
            }
            
            // Include reply_to_attachment_id if replying to specific attachment
            if (msg.reply_to_attachment_id) {
              formData.append('reply_to_attachment_id', msg.reply_to_attachment_id)
            }
            
            // Add attachments
            msg.attachments.forEach((attachment, index) => {
              formData.append(`attachments[${index}]`, attachment.file)
            })
            
            response = await fetch('/api/chat/messages', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
              },
              body: formData,
              signal: AbortSignal.timeout(10000)
            })
          } else {
            // Use JSON for text-only messages
            const requestData = {
              body: msg.body,
              type: 'message'
            }
            
            // Set team_id or recipient_id based on chat type
            if (chatType === 'team') {
              requestData.team_id = selectedChat.id
            } else {
              requestData.recipient_id = selectedChat.id
            }
            
            // Include reply_to_message_id if replying
            if (msg.reply_to_message_id) {
              requestData.reply_to_message_id = msg.reply_to_message_id
            }
            
            // Include reply_to_attachment_id if replying to specific attachment
            if (msg.reply_to_attachment_id) {
              requestData.reply_to_attachment_id = msg.reply_to_attachment_id
            }
            
            response = await fetch('/api/chat/messages', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
              },
              body: JSON.stringify(requestData),
              signal: AbortSignal.timeout(10000)
            })
          }

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Server error response:', response.status, errorText)
            throw new Error(`Failed to send message: ${response.status}`)
          }
          
          const data = await response.json()
          
          // Check if attachments were included in request but missing from response
          if (msg.attachments && msg.attachments.length > 0) {
            const responseAttachments = data.message?.attachments || data.attachments || []
            if (responseAttachments.length === 0) {
              console.error('WARNING: Message sent with attachments but server returned no attachments!')
              // Mark as failed since attachments didn't upload
              updateMessageStatus(msg.id, 'failed')
              return
            }
          }
          
          // Mark as sent and remove from queue immediately
          updateMessageStatus(msg.id, 'sent', data)
          removeOptimisticMessage(msg.id)
          
          // If this was the last pending message, trigger any pending read receipts
          const remainingPending = optimisticQueue.filter(m => 
            m.id !== msg.id && m.status === 'pending'
          )
          if (remainingPending.length === 0 && pendingReadMessagesRef.current.length > 0) {
            // Trigger read receipt processing after a short delay
            if (readBatchTimeoutRef.current) {
              clearTimeout(readBatchTimeoutRef.current)
            }
            readBatchTimeoutRef.current = setTimeout(() => {
              const processBatchedReads = () => {
                if (pendingReadMessagesRef.current.length === 0) return
                
                const messageIds = [...pendingReadMessagesRef.current]
                pendingReadMessagesRef.current = []
                
                fetch('/api/chat/messages/read-batch', {
                  method: 'POST',
                  credentials: 'same-origin',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                  },
                  body: JSON.stringify({ message_ids: messageIds })
                })
                  .then(res => res.ok ? res.json() : null)
                  .then(data => {
                    if (data && data.reads) {
                      setMessageReads(prev => {
                        const updated = { ...prev }
                        data.reads.forEach(read => {
                          updated[read.message_id] = [...(updated[read.message_id] || []), read]
                        })
                        return updated
                      })
                      onClearUnread?.()
                    }
                  })
                  .catch(err => {
                    console.error('Error marking messages as read:', err)
                    messageIds.forEach(id => markedAsReadRef.current.delete(id))
                  })
              }
              processBatchedReads()
            }, 500)
          }
          
        } catch (error) {
          console.error('Error sending message:', msg.id, error)
          // Mark as failed
          updateMessageStatus(msg.id, 'failed')
        }
      }
    }

    processPendingMessages()
  }, [optimisticQueue, selectedChat, chatType])

  // Check rate limiting
  const checkRateLimit = () => {
    const now = Date.now()
    
    // Remove timestamps outside the window
    messageSentTimestamps.current = messageSentTimestamps.current.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    )
    
    // Check if we've hit the limit
    if (messageSentTimestamps.current.length >= MAX_MESSAGES_PER_WINDOW) {
      setIsRateLimited(true)
      toast.warning('Slow down! You\'re sending messages too quickly.', {
        toastId: 'rate-limit-warning',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      
      // Reset rate limit after cooldown
      setTimeout(() => {
        setIsRateLimited(false)
      }, RATE_LIMIT_WINDOW - (now - messageSentTimestamps.current[0]))
      
      return false
    }
    
    return true
  }

  // Handle attachments change from MessageInput
  const handleAttachmentsChange = (attachments) => {
    setPendingAttachments(attachments)
  }

  // Upload attachments before sending message
  const uploadAttachments = async (attachments) => {
    if (attachments.length === 0) return []

    const formData = new FormData()
    attachments.forEach(att => {
      formData.append('files[]', att.file)
    })

    const uploadPromise = fetch('/api/chat/attachments/upload', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      },
      body: formData
    }).then(res => res.json())

    // Show toast with upload progress
    toast.promise(
      uploadPromise,
      {
        pending: `Uploading ${attachments.length} file(s)...`,
        success: 'Files uploaded successfully',
        error: 'Failed to upload files'
      },
      {
        position: 'top-center',
        autoClose: 2000,
      }
    )

    const result = await uploadPromise
    
    if (result.errors && Object.keys(result.errors).length > 0) {
      console.error('Upload errors:', result.errors)
    }

    return result.attachments || []
  }


  // Add message to optimistic queue
  const queueMessage = (messageText, replyToMessageId = null, replyToAttachmentId = null, attachments = []) => {
    if ((!messageText.trim() && attachments.length === 0) || !selectedChat || sending) return false
    
    // Filter restricted words from message
    const { filteredText, blocked, blockedWords } = filterRestrictedWords(messageText.trim())
    
    // If message is blocked (contains level 3 words), show error and don't send
    if (blocked) {
      toast.error(`Message blocked. Contains prohibited content: ${blockedWords.join(', ')}`, {
        toastId: 'blocked-content',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      return false
    }
    
    // Check rate limiting
    if (!checkRateLimit()) {
      return false
    }

    setSending(true)
    
    // Record timestamp for rate limiting
    messageSentTimestamps.current.push(Date.now())
    
    // Get the full merged messages list to find the reply target
    const allMessages = getMergedMessages(messages)
    const replyToMessage = replyToMessageId ? allMessages.find(m => m.id === replyToMessageId) : null
    
    // If replying to an attachment, find the specific attachment
    let replyToAttachment = null
    if (replyToAttachmentId && replyToMessage) {
      replyToAttachment = replyToMessage.attachments?.find(a => a.id === replyToAttachmentId)
    }
    
    // Add to optimistic queue with filtered message and attachments
    const optimisticMsg = addOptimisticMessage({
      body: filteredText,
      attachments: attachments,
      reply_to_message_id: replyToMessageId,
      reply_to_attachment_id: replyToAttachmentId,
      reply_to_attachment: replyToAttachment,
      reply_to_message: replyToMessage ? {
        id: replyToMessage.id,
        body: replyToMessage.body,
        user: replyToMessage.user,
        sender_id: replyToMessage.sender_id,
        created_at: replyToMessage.created_at,
      } : null,
    })
    
    // Clear input immediately for instant feedback
    setNewMessage('')
    setReplyingTo(null)
    
    // Clear pending attachments and trigger MessageInput cleanup
    setPendingAttachments([])
    setClearAttachmentsTrigger(prev => !prev)
    
    // Scroll to bottom instantly when sending
    setTimeout(() => {
      scrollToBottom(true)
      isUserScrolledUpRef.current = false
      setSending(false)
    }, 100)
    
    return true
  }

  // Retry a failed message
  const handleRetryMessage = (messageId) => {
    retryMessage(messageId)
  }

  // Shared function for sending messages (legacy, now just queues)
  const sendMessageToRecipient = async (message, recipient, recipientType, attachments = [], replyToMessageId = null, replyToAttachmentId = null) => {
    if ((!message.trim() && attachments.length === 0) || !recipient) return false
    
    // If we're in an existing chat (selectedChat is set and matches recipient), use the optimistic queue
    if (selectedChat && selectedChat.id === recipient.id && chatType === recipientType) {
      return queueMessage(message, replyToMessageId, replyToAttachmentId, attachments)
    }
    
    // Otherwise, we're sending from compose mode - send directly to API
    // Filter restricted words from message
    const { filteredText, blocked, blockedWords } = filterRestrictedWords(message.trim())
    
    // If message is blocked, show error and don't send
    if (blocked) {
      toast.error(`Message blocked. Contains prohibited content: ${blockedWords.join(', ')}`, {
        toastId: 'blocked-content',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      return false
    }
    
    try {
      // Use FormData for file uploads
      const formData = new FormData()
      formData.append('body', filteredText)
      formData.append('type', 'message')
      
      // Set team_id or recipient_id based on recipient type
      if (recipientType === 'team') {
        formData.append('team_id', recipient.id)
      } else {
        formData.append('recipient_id', recipient.id)
      }
      
      // Include reply_to_message_id if replying to a message
      if (replyToMessageId) {
        formData.append('reply_to_message_id', replyToMessageId)
      }
      
      // Include reply_to_attachment_id if replying to a specific attachment
      if (replyToAttachmentId) {
        formData.append('reply_to_attachment_id', replyToAttachmentId)
      }
      
      // Add attachments
      if (attachments && attachments.length > 0) {
        attachments.forEach((attachment, index) => {
          formData.append(`attachments[${index}]`, attachment.file)
        })
      }
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }
      
      const data = await response.json()
      
      return true
    } catch (error) {
      console.error('Error sending message from compose:', error)
      toast.error('Failed to send message', {
        toastId: 'send-failed',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      return false
    }
  }

  // Send message in existing chat
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !selectedChat) return

    const success = await sendMessageToRecipient(newMessage, selectedChat, chatType, pendingAttachments, replyingTo?.id, replyingTo?.attachmentId)
    
    if (success) {
      // Clear pending attachments and trigger MessageInput cleanup
      setPendingAttachments([])
      setClearAttachmentsTrigger(prev => !prev)
    }
  }

  // Handle reply button click
  const handleReplyClick = (messageOrRef) => {
    // If this is an attachment reply (has attachmentId), find the full message
    if (messageOrRef.attachmentId) {
      const allMessages = getMergedMessages(messages)
      const fullMessage = allMessages.find(m => m.id === messageOrRef.id)
      if (fullMessage) {
        // Find the specific attachment
        const attachment = fullMessage.attachments?.find(a => a.id === messageOrRef.attachmentId)
        setReplyingTo({
          ...fullMessage,
          attachmentId: messageOrRef.attachmentId,
          replyAttachment: attachment // Store the specific attachment for preview
        })
      }
    } else {
      // Regular message reply
      setReplyingTo(messageOrRef)
    }
    
    // Focus the message input after a brief delay to ensure state update
    setTimeout(() => {
      messageInputRef.current?.focus()
    }, 0)
  }

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  // Handle adding reaction to a message
  const handleAddReaction = async (messageId, reaction) => {
    // Create a unique key for this reaction action
    const reactionKey = `${messageId}-${currentUser.id}-${reaction.emoji}`
    
    // Prevent duplicate requests
    if (pendingReactionsRef.current.has(reactionKey)) {
      return
    }
    
    try {
      // Mark as pending
      pendingReactionsRef.current.add(reactionKey)
      
      // Optimistically update UI
      setMessages(prev => prev.map(msg => {
        if (msg.id == messageId) {
          const existingReactions = msg.reactions || []
          
          // Check if user already reacted with this emoji
          const userReactionIndex = existingReactions.findIndex(
            r => r.user_id === currentUser.id && r.emoji === reaction.emoji
          )
          
          let updatedReactions
          if (userReactionIndex >= 0) {
            // Remove reaction if already exists (toggle off)
            updatedReactions = existingReactions.filter((_, i) => i !== userReactionIndex)
          } else {
            // Add new reaction
            updatedReactions = [
              ...existingReactions,
              {
                id: `temp-${Date.now()}`,
                message_id: messageId,
                user_id: currentUser.id,
                user: currentUser,
                emoji: reaction.emoji,
                name: reaction.name,
                created_at: new Date().toISOString()
              }
            ]
          }
          
          return { ...msg, reactions: updatedReactions }
        }
        return msg
      }))
      
      // Send to backend
      const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({
          emoji: reaction.emoji,
          name: reaction.name
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add reaction')
      }
      
      const data = await response.json()
      
      // Remove from pending set BEFORE updating
      pendingReactionsRef.current.delete(reactionKey)
      
      // DON'T update from server response - we already did optimistic update
      // The server response is just confirmation. Broadcasts will handle other users.
      // This prevents flickering from server responses conflicting with optimistic updates
      
    } catch (error) {
      console.error('Error adding reaction:', error)
      
      // Remove from pending on error too
      pendingReactionsRef.current.delete(reactionKey)
      
      // Revert optimistic update on error
      setMessages(prev => prev.map(msg => {
        if (msg.id == messageId) {
          const revertedReactions = (msg.reactions || []).filter(
            r => !(r.user_id === currentUser.id && r.emoji === reaction.emoji && r.id?.startsWith('temp-'))
          )
          return { ...msg, reactions: revertedReactions }
        }
        return msg
      }))
    }
  }

  // Handle adding reaction to an attachment
  const handleAddAttachmentReaction = async (attachmentId, reaction) => {
    // Create a unique key for this reaction action
    const reactionKey = `attachment-${attachmentId}-${currentUser.id}-${reaction.emoji}`
    
    // Prevent duplicate requests
    if (pendingReactionsRef.current.has(reactionKey)) {
      return
    }
    
    try {
      // Mark as pending
      pendingReactionsRef.current.add(reactionKey)
      
      // Optimistically update UI
      setMessages(prev => prev.map(msg => {
        // Find the message containing this attachment
        const attachmentIndex = msg.attachments?.findIndex(a => a.id === attachmentId)
        if (attachmentIndex === -1 || attachmentIndex === undefined) return msg
        
        const updatedAttachments = [...msg.attachments]
        const attachment = updatedAttachments[attachmentIndex]
        const existingReactions = attachment.reactions || []
        
        // Check if user already reacted with this emoji
        const userReactionIndex = existingReactions.findIndex(
          r => r.user_id === currentUser.id && r.emoji === reaction.emoji
        )
        
        let updatedReactions
        if (userReactionIndex >= 0) {
          // Remove reaction if already exists (toggle off)
          updatedReactions = existingReactions.filter((_, i) => i !== userReactionIndex)
          } else {
            // Add new reaction
            updatedReactions = [
              ...existingReactions,
              {
                id: `temp-${Date.now()}`,
                attachment_id: attachmentId,
                user_id: currentUser.id,
                user: currentUser,
                emoji: reaction.emoji,
                name: reaction.name,
                created_at: new Date().toISOString()
              }
            ]
          }        updatedAttachments[attachmentIndex] = {
          ...attachment,
          reactions: updatedReactions
        }
        
        return { ...msg, attachments: updatedAttachments }
      }))
      
      // Send to backend
      const response = await fetch(`/api/chat/attachments/${attachmentId}/reactions`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({
          emoji: reaction.emoji,
          name: reaction.name
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Attachment reaction API error:', response.status, errorData)
        throw new Error(`Failed to add attachment reaction: ${errorData.message || response.statusText}`)
      }
      
      const data = await response.json()
      
      // Remove from pending set BEFORE updating
      pendingReactionsRef.current.delete(reactionKey)
      
      // DON'T update from server response - we already did optimistic update
      // The server response is just confirmation. Broadcasts will handle other users.
      // This prevents flickering from server responses conflicting with optimistic updates
      
    } catch (error) {
      console.error('Error adding attachment reaction:', error)
      
      // Remove from pending on error too
      pendingReactionsRef.current.delete(reactionKey)
      
      // Revert optimistic update on error
      setMessages(prev => prev.map(msg => {
        const attachmentIndex = msg.attachments?.findIndex(a => a.id === attachmentId)
        if (attachmentIndex === -1 || attachmentIndex === undefined) return msg
        
        const updatedAttachments = [...msg.attachments]
        const attachment = updatedAttachments[attachmentIndex]
        const revertedReactions = (attachment.reactions || []).filter(
          r => !(r.user_id === currentUser.id && r.emoji === reaction.emoji && r.id?.startsWith('temp-'))
        )
        
        updatedAttachments[attachmentIndex] = {
          ...attachment,
          reactions: revertedReactions
        }
        
        return { ...msg, attachments: updatedAttachments }
      }))
    }
  }

  // Pin/Unpin message
  const handlePinMessage = async (messageId) => {
    if (!selectedChat) return
    
    try {
      if (pinnedMessage?.id === messageId) {
        // Unpin
        const response = await fetch(`/api/chat/messages/${messageId}/pin`, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          }
        })
        
        if (response.ok) {
          setPinnedMessage(null)
          setPinnedAttachment(null)
          toast.success('Message unpinned', {
            toastId: 'message-unpinned',
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
          })
        }
      } else {
        // Pin
        const response = await fetch(`/api/chat/messages/${messageId}/pin`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setPinnedMessage(data.message)
          setPinnedAttachment(null)
          toast.success('Message pinned', {
            toastId: 'message-pinned',
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
          })
        }
      }
    } catch (error) {
      console.error('Error pinning message:', error)
      toast.error('Failed to pin message', {
        toastId: 'pin-failed',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }

  // Scroll to pinned message
  const handleClickPinned = (messageId) => {
    const messageEl = messageRefsRef.current?.[messageId]
    if (messageEl) {
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      messageEl.classList.add('ring-2', 'ring-theme-400')
      setTimeout(() => {
        messageEl.classList.remove('ring-2', 'ring-theme-400')
      }, 2000)
    } else {
      // Message not loaded, need to fetch it
      // For now, just scroll to top and load more
      toast.info('Loading pinned message...', {
        toastId: 'loading-pinned',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      if (messageListContainerRef.current) {
        messageListContainerRef.current.scrollTop = 0
      }
    }
  }

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!selectedChat) return
    
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
      })
      
      console.log('Delete response:', response.status, response.statusText)
      
      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id == messageId 
            ? { ...msg, deleted_at: new Date().toISOString() }
            : msg
        ))
        toast.success('Message deleted', {
          toastId: 'message-deleted',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Delete failed:', errorData)
        toast.error(errorData.error || 'Failed to delete message', {
          toastId: 'delete-failed',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }

  // Restore deleted message
  const handleRestoreMessage = async (messageId) => {
    if (!selectedChat) return
    
    console.log('Restoring message:', messageId)
    
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/restore`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
      })
      
      console.log('Restore response:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Restore data:', data)
        // Update local state - use the full message data from response to restore attachments too
        setMessages(prev => prev.map(msg => 
          msg.id == messageId 
            ? { ...msg, ...data.message, deleted_at: null }
            : msg
        ))
        toast.success('Message restored', {
          toastId: 'message-restored',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Restore failed:', errorData)
        toast.error(errorData.error || 'Failed to restore message', {
          toastId: 'restore-failed',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error restoring message:', error)
      toast.error('Failed to restore message', {
        toastId: 'restore-failed',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }

  // Pin/Unpin attachment
  const handlePinAttachment = async (attachmentId) => {
    if (!selectedChat) return
    
    try {
      if (pinnedAttachment?.id === attachmentId) {
        // Unpin
        const response = await fetch(`/api/chat/attachments/${attachmentId}/pin`, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          }
        })
        
        if (response.ok) {
          setPinnedAttachment(null)
          setPinnedMessage(null)
          toast.success('Attachment unpinned', {
            toastId: 'attachment-unpinned',
            position: 'top-center',
            autoClose: 2000,
            theme: 'light',
          })
        }
      } else {
        // Pin
        const response = await fetch(`/api/chat/attachments/${attachmentId}/pin`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setPinnedAttachment(data.attachment)
          setPinnedMessage(null)
          toast.success('Attachment pinned', {
            toastId: 'attachment-pinned',
            position: 'top-center',
            autoClose: 2000,
            theme: 'light',
          })
        }
      }
    } catch (error) {
      console.error('Error pinning/unpinning attachment:', error)
      toast.error('Failed to pin/unpin attachment', {
        toastId: 'attachment-pin-failed',
        position: 'top-center',
        autoClose: 3000,
        theme: 'light',
      })
    }
  }

  // Delete attachment
  const handleDeleteAttachment = async (attachmentId) => {
    if (!selectedChat) return
    
    try {
      const response = await fetch(`/api/chat/attachments/${attachmentId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
      })
      
      if (response.ok) {
        // Update local state - mark attachment as deleted
        setMessages(prev => prev.map(msg => ({
          ...msg,
          attachments: msg.attachments?.map(att => 
            att.id === attachmentId 
              ? { ...att, deleted_at: new Date().toISOString() }
              : att
          )
        })))
        
        // If this was the pinned attachment, clear it
        if (pinnedAttachment?.id === attachmentId) {
          setPinnedAttachment(null)
        }
        
        toast.success('Attachment deleted', {
          toastId: 'attachment-deleted',
          position: 'top-center',
          autoClose: 3000,
          theme: 'light',
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Delete failed:', errorData)
        toast.error(errorData.error || 'Failed to delete attachment', {
          toastId: 'attachment-delete-failed',
          position: 'top-center',
          autoClose: 3000,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast.error('Failed to delete attachment', {
        toastId: 'attachment-delete-failed',
        position: 'top-center',
        autoClose: 3000,
        theme: 'light',
      })
    }
  }

  // Restore deleted attachment
  const handleRestoreAttachment = async (attachmentId) => {
    if (!selectedChat) return
    
    try {
      const response = await fetch(`/api/chat/attachments/${attachmentId}/restore`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
      })
      
      if (response.ok) {
        // Update local state - remove deleted_at
        setMessages(prev => prev.map(msg => ({
          ...msg,
          attachments: msg.attachments?.map(att => 
            att.id === attachmentId 
              ? { ...att, deleted_at: null }
              : att
          )
        })))
        
        toast.success('Attachment restored', {
          toastId: 'attachment-restored',
          position: 'top-center',
          autoClose: 3000,
          theme: 'light',
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Restore failed:', errorData)
        toast.error(errorData.error || 'Failed to restore attachment', {
          position: 'top-center',
          autoClose: 3000,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error restoring attachment:', error)
      toast.error('Failed to restore attachment', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'light',
      })
    }
  }

  // Fetch pinned message
  useEffect(() => {
    // Clear pinned message immediately when chat changes
    setPinnedMessage(null)
    
    if (!selectedChat || chatType === 'compose') {
      return
    }
    
    const fetchPinnedMessage = async () => {
      try {
        const params = new URLSearchParams()
        if (chatType === 'team') {
          params.append('team_id', selectedChat.id)
        } else {
          params.append('recipient_id', selectedChat.id)
        }
        
        const response = await fetch(`/api/chat/messages/pinned?${params}`, {
          credentials: 'same-origin'
        })
        
        if (response.ok) {
          const data = await response.json()
          setPinnedMessage(data?.message || null)
          setPinnedAttachment(data?.attachment || null)
        } else {
          setPinnedMessage(null)
          setPinnedAttachment(null)
        }
      } catch (error) {
        console.error('Error fetching pinned message:', error)
      }
    }
    
    fetchPinnedMessage()
  }, [selectedChat, chatType])

  // Compose mode
  if (chatType === 'compose') {
    return (
      <ComposeMode 
        currentUser={currentUser}
        onChatSelect={onChatSelect}
        onMessageSend={sendMessageToRecipient}
        onRefreshContacts={onRefreshContacts}
      />
    )
  }

  // Empty state
  if (!selectedChat) {
    return <EmptyState />
  }

  // Main chat view
  return (
    <div className="flex-1 flex flex-col bg-white">
      <ChatHeader chat={selectedChat} chatType={chatType} />
      
      {/* Pinned Message Banner */}
      <PinnedMessageBanner 
        pinnedMessage={pinnedMessage}
        pinnedAttachment={pinnedAttachment}
        onUnpin={handlePinMessage}
        onUnpinAttachment={handlePinAttachment}
        onClickPinned={handleClickPinned}
      />

      {/* Messages */}
      <div ref={messageListContainerRef} className="flex-1 overflow-y-auto px-6 py-4 relative">
        {/* Load more indicator at top */}
        {loadingMore && !loading && (() => {
          const themeRgb = getComputedStyle(document.body).getPropertyValue('--theme-500').trim()
          const themeColor = themeRgb ? `rgb(${themeRgb})` : 'rgb(249, 115, 22)' // Default to orange-500
          return (
            <div className="flex justify-center py-2">
              <l-ring
                size="30"
                stroke="3"
                bg-opacity="0"
                speed="2"
                color={themeColor}
              ></l-ring>
            </div>
          )
        })()}
        
        {/* Show "No more messages" if at the top */}
        {!hasMore && messages.length > 0 && !loading && (
          <div className="text-center py-2 text-xs text-gray-400">
            Beginning of conversation
          </div>
        )}
        
        <MessageList
          messages={getMergedMessages(messages)}
          currentUser={currentUser}
          messageReads={messageReads}
          chatType={chatType}
          loading={loading}
          messagesEndRef={messagesEndRef}
          onReplyClick={handleReplyClick}
          messageRefsRef={messageRefsRef}
          onAddReaction={handleAddReaction}
          onAddAttachmentReaction={handleAddAttachmentReaction}
          onPinAttachment={handlePinAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onRestoreAttachment={handleRestoreAttachment}
          onRetryMessage={handleRetryMessage}
          loadingMore={loadingMore}
          hasMore={hasMore}
          messageListContainerRef={messageListContainerRef}
          pendingReactionsRef={pendingReactionsRef}
          onPinMessage={handlePinMessage}
          pinnedMessageId={pinnedMessage?.id}
          pinnedAttachmentId={pinnedAttachment?.id}
          onDeleteMessage={handleDeleteMessage}
          onRestoreMessage={handleRestoreMessage}
        />
        
        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />
        
        {/* Scroll to new messages button - sticky at bottom */}
        {unreadMessagesNotInView > 0 && (
          <div className="sticky bottom-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <ScrollToNewMessages count={unreadMessagesNotInView} onClick={scrollToLastUnread} />
            </div>
          </div>
        )}
      </div>

      {/* Reply Preview */}
      <div ref={replyPreviewRef}>
        <ReplyPreview replyingTo={replyingTo} onCancel={handleCancelReply} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <MessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSubmit={handleSendMessage}
          onTyping={sendTypingIndicator}
          placeholder={`Message ${selectedChat.name}...`}
          disabled={sending || isRateLimited}
          replyingTo={replyingTo}
          inputRef={messageInputRef}
          onAttachmentsChange={handleAttachmentsChange}
          clearAttachments={clearAttachmentsTrigger}
        />
      </div>
    </div>
  )
}
