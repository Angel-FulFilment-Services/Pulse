import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import ChatHeader from './engine/ChatHeader'
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
  
  // Track scroll positions for each chat (persists during session)
  const scrollPositionsRef = useRef({})
  const isInitialLoadRef = useRef(true)
  const previousChatRef = useRef(null)

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
    // Skip auto-scroll during initial load (handled in fetch effect)
    if (isInitialLoadRef.current) {
      const mergedMessages = getMergedMessages(messages)
      prevMessageCountRef.current = mergedMessages.length
      return
    }
    
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

    // Save scroll position of the PREVIOUS chat before switching
    if (previousChatRef.current && messageListContainerRef.current) {
      const prevChatKey = previousChatRef.current
      scrollPositionsRef.current[prevChatKey] = messageListContainerRef.current.scrollTop
    }

    // Update the current chat key
    const currentChatKey = chatType === 'team' ? `team-${selectedChat.id}` : `dm-${selectedChat.id}`
    previousChatRef.current = currentChatKey

    isInitialLoadRef.current = true
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
        
        // Restore scroll position or jump to bottom after messages load
        requestAnimationFrame(() => {
          const savedPosition = scrollPositionsRef.current[currentChatKey]
          
          if (savedPosition !== undefined && messageListContainerRef.current) {
            // Restore saved scroll position
            messageListContainerRef.current.scrollTop = savedPosition
            
            // Update scroll state
            const { scrollTop, scrollHeight, clientHeight } = messageListContainerRef.current
            isUserScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100
          } else {
            // First time opening this chat - jump to bottom instantly
            messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
            isUserScrolledUpRef.current = false
          }
          
          isInitialLoadRef.current = false
        })
      })
      .catch(() => {
        setMessages([])
        setLoading(false)
        isInitialLoadRef.current = false
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
        console.log('Message already exists, skipping:', message.id)
        return prev
      }
      console.log('Adding message from broadcast:', message.id, 'reply_to:', message.reply_to_message_id)
      
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
    // Ignore our own reactions (they're already handled optimistically)
    if (reaction.user_id === currentUser.id) {
      return
    }
    
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
    // Ignore our own reaction removals (they're already handled optimistically)
    if (userId === currentUser.id) {
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
    onMessagePinned: (message) => {
      console.log('Message pinned:', message)
      setPinnedMessage(message)
    },
    onMessageUnpinned: (messageId) => {
      console.log('Message unpinned:', messageId)
      if (pinnedMessage?.id === messageId) {
        setPinnedMessage(null)
      }
    },
    onMessageDeleted: (messageId) => {
      console.log('Message deleted:', messageId)
      setMessages(prev => prev.map(msg => 
        msg.id == messageId 
          ? { ...msg, deleted_at: new Date().toISOString() }
          : msg
      ))
    },
    onMessageRestored: (message) => {
      console.log('Message restored:', message)
      setMessages(prev => prev.map(msg => 
        msg.id == message.id 
          ? { ...message, deleted_at: null }
          : msg
      ))
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
        if (msg.status !== 'pending' || processingRef.current.has(msg.id)) continue

        // Mark as being processed
        processingRef.current.add(msg.id)

        try {
          // Prepare request data
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
          
          const response = await fetch('/api/chat/messages', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify(requestData),
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })

          if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('Message sent successfully:', data)
          
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

  // Add message to optimistic queue
  const queueMessage = (messageText, replyToMessageId = null) => {
    if (!messageText.trim() || !selectedChat || sending) return false
    
    // Filter restricted words from message
    const { filteredText, blocked, blockedWords } = filterRestrictedWords(messageText.trim())
    
    // If message is blocked (contains level 3 words), show error and don't send
    if (blocked) {
      toast.error(`Message blocked. Contains prohibited content: ${blockedWords.join(', ')}`, {
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
    
    // Add to optimistic queue with filtered message
    const optimisticMsg = addOptimisticMessage({
      body: filteredText,
      reply_to_message_id: replyToMessageId,
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
  const sendMessageToRecipient = async (message, recipient, recipientType, replyToMessageId = null) => {
    if (!message.trim() || !recipient) return false
    
    // If we're in an existing chat (selectedChat is set and matches recipient), use the optimistic queue
    if (selectedChat && selectedChat.id === recipient.id && chatType === recipientType) {
      return queueMessage(message, replyToMessageId)
    }
    
    // Otherwise, we're sending from compose mode - send directly to API
    // Filter restricted words from message
    const { filteredText, blocked, blockedWords } = filterRestrictedWords(message.trim())
    
    // If message is blocked, show error and don't send
    if (blocked) {
      toast.error(`Message blocked. Contains prohibited content: ${blockedWords.join(', ')}`, {
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
      // Prepare request data
      const requestData = {
        body: filteredText,
        type: 'message'
      }
      
      // Set team_id or recipient_id based on recipient type
      if (recipientType === 'team') {
        requestData.team_id = recipient.id
      } else {
        requestData.recipient_id = recipient.id
      }
      
      // Include reply_to_message_id if replying
      if (replyToMessageId) {
        requestData.reply_to_message_id = replyToMessageId
      }
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Message sent successfully from compose:', data)
      
      return true
    } catch (error) {
      console.error('Error sending message from compose:', error)
      toast.error('Failed to send message', {
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
    if (!newMessage.trim() || !selectedChat) return

    await sendMessageToRecipient(newMessage, selectedChat, chatType, replyingTo?.id)
  }

  // Handle reply button click
  const handleReplyClick = (message) => {
    setReplyingTo(message)
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
                created_at: new Date().toISOString(),
                isNewReaction: true // Mark as new for animation
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
      
      // Update with real data from server, preserving emoji order
      setMessages(prev => prev.map(msg => {
        if (msg.id == messageId) {
          const oldReactions = msg.reactions || []
          const newReactions = data.reactions || []
          
          // Create a map of existing emoji positions
          const emojiPositions = new Map()
          oldReactions.forEach((r, index) => {
            if (!emojiPositions.has(r.emoji)) {
              emojiPositions.set(r.emoji, index)
            }
          })
          
          // Sort new reactions by original position, new emojis go to the end
          const sortedReactions = [...newReactions].sort((a, b) => {
            const posA = emojiPositions.has(a.emoji) ? emojiPositions.get(a.emoji) : Infinity
            const posB = emojiPositions.has(b.emoji) ? emojiPositions.get(b.emoji) : Infinity
            return posA - posB
          })
          
          return { ...msg, reactions: sortedReactions }
        }
        return msg
      }))
      
    } catch (error) {
      console.error('Error adding reaction:', error)
      // Revert optimistic update on error by fetching fresh message state
      try {
        const freshResponse = await fetch(`/api/chat/messages?conversation_id=${selectedChat?.id}&type=${chatType}`)
        if (freshResponse.ok) {
          const freshData = await freshResponse.json()
          setMessages(freshData.messages || [])
        }
      } catch (refreshError) {
        console.error('Failed to refresh messages:', refreshError)
      }
    } finally {
      // Remove from pending set
      pendingReactionsRef.current.delete(reactionKey)
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
          toast.success('Message unpinned', {
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
          toast.success('Message pinned', {
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
    
    console.log('Deleting message:', messageId)
    
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
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id == messageId 
            ? { ...msg, deleted_at: null }
            : msg
        ))
        toast.success('Message restored', {
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
          setPinnedMessage(data || null)
        } else {
          setPinnedMessage(null)
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
        onUnpin={handlePinMessage}
        onClickPinned={handleClickPinned}
      />

      {/* Messages */}
      <div ref={messageListContainerRef} className="flex-1 overflow-y-auto px-6 py-4 relative">
        {/* Load more indicator at top */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-theme-600"></div>
          </div>
        )}
        
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
          onRetryMessage={handleRetryMessage}
          loadingMore={loadingMore}
          hasMore={hasMore}
          messageListContainerRef={messageListContainerRef}
          pendingReactionsRef={pendingReactionsRef}
          onPinMessage={handlePinMessage}
          pinnedMessageId={pinnedMessage?.id}
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
        />
      </div>
    </div>
  )
}
