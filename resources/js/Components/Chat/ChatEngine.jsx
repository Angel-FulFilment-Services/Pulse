import React, { useState, useEffect, useRef } from 'react'
import ChatHeader from './engine/ChatHeader'
import MessageList from './engine/MessageList'
import MessageInput from './engine/MessageInput'
import TypingIndicator from './engine/TypingIndicator'
import EmptyState from './engine/EmptyState'
import ComposeMode from './engine/ComposeMode'
import ReplyPreview from './engine/ReplyPreview'
import { useRealtimeChat } from './engine/useRealtimeChat'

export default function ChatEngine({ 
  selectedChat, 
  chatType, 
  currentUser, 
  onChatSelect, 
  typingUsers = [], 
  onClearTypingUser 
}) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageReads, setMessageReads] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const markedAsReadRef = useRef(new Set())
  const [pendingMessages, setPendingMessages] = useState(new Set())
  const messagesEndRef = useRef(null)
  const replyPreviewRef = useRef(null)
  const messageListContainerRef = useRef(null)
  const messageRefsRef = useRef(null) // Will hold the refs from MessageList
  const messageInputRef = useRef(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll to ensure reply preview and replied message are visible
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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch messages when chat changes
  useEffect(() => {
    if (!selectedChat || chatType === 'compose') {
      setMessages([])
      return
    }

    setLoading(true)
    let url = ''
    if (chatType === 'team') {
      url = `/api/chat/messages?team_id=${selectedChat.id}`
    } else if (chatType === 'dm') {
      url = `/api/chat/messages?recipient_id=${selectedChat.id}`
    }

    fetch(url, { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const messageList = Array.isArray(data) ? data : []
        setMessages(messageList)
        
        // Build read status map
        const reads = {}
        messageList.forEach(msg => {
          if (msg.reads && msg.reads.length > 0) {
            reads[msg.id] = msg.reads
          }
        })
        setMessageReads(reads)
        
        setLoading(false)
      })
      .catch(() => {
        setMessages([])
        setLoading(false)
      })
  }, [selectedChat, chatType])

  // Handle incoming messages from realtime
  const handleMessageReceived = (message) => {
    // Only add if message doesn't already exist (avoid duplicates)
    setMessages(prev => {
      // Remove any temp messages (they should have been replaced already, but just in case)
      const withoutTemp = prev.filter(msg => !String(msg.id).startsWith('temp-'))
      
      const exists = withoutTemp.some(msg => msg.id === message.id)
      if (exists) {
        console.log('Message already exists, skipping:', message.id)
        return withoutTemp
      }
      console.log('Adding message from broadcast:', message.id)
      return [...withoutTemp, message]
    })
  }

  // Handle read receipt updates
  const handleMessageRead = (messageRead) => {
    setMessageReads(prev => ({
      ...prev,
      [messageRead.message_id]: [...(prev[messageRead.message_id] || []), messageRead]
    }))
  }

  // Set up real-time listeners
  const { sendTypingIndicator } = useRealtimeChat({
    selectedChat,
    chatType,
    currentUser,
    onMessageReceived: handleMessageReceived,
    onMessageRead: handleMessageRead,
    onClearTypingUser
  })

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (!selectedChat || !currentUser || chatType === 'compose' || messages.length === 0) return

    // Mark all unread messages from others as read
    const unreadMessages = messages.filter(msg => {
      const senderId = msg.sender_id || msg.user_id
      const isFromOther = senderId !== currentUser.id
      const notAlreadyRead = !messageReads[msg.id]
      const notAlreadyMarking = !markedAsReadRef.current.has(msg.id)
      
      return isFromOther && notAlreadyRead && notAlreadyMarking
    })

    if (unreadMessages.length === 0) return

    // Mark each message as read
    unreadMessages.forEach(msg => {
      // Mark as being processed
      markedAsReadRef.current.add(msg.id)
      
      fetch('/api/chat/messages/read', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({ message_id: msg.id })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setMessageReads(prev => ({
              ...prev,
              [msg.id]: [data]
            }))
          }
        })
        .catch(err => {
          console.error('Error marking message as read:', err)
          // Remove from marked set on error so it can be retried
          markedAsReadRef.current.delete(msg.id)
        })
    })
  }, [messages, selectedChat, currentUser, chatType])

  // Shared function for sending messages
  const sendMessageToRecipient = async (message, recipient, recipientType, replyToMessageId = null) => {
    if (!message.trim() || !recipient || sending) return false

    setSending(true)
    
    // Create a temporary ID and optimistic message
    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      body: message.trim(),
      sender_id: currentUser?.id,
      user_id: currentUser?.id,
      user: currentUser,
      created_at: new Date().toISOString(),
      attachments: [],
      isPending: true,
      reply_to_message_id: replyToMessageId,
      reply_to_message: replyToMessageId ? messages.find(m => m.id === replyToMessageId) : null
    }
    
    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage])
    setPendingMessages(prev => new Set([...prev, tempId]))
    
    console.log('Sending message:', { recipient, recipientType })
    
    try {
      // Prepare request data
      const requestData = {
        body: message.trim(),
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
      
      console.log('Request data:', requestData)
      
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
        const errorText = await response.text()
        console.error('Failed to send message:', response.status, errorText)
        
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setPendingMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(tempId)
          return newSet
        })
        throw new Error(`Failed to send message: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Message sent successfully:', data)
      
      // Replace optimistic message with real one
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempId)
        const exists = filtered.some(msg => msg.id === data.id)
        if (exists) {
          console.log('Message already exists in state (from broadcast), removing optimistic:', tempId)
          return filtered
        }
        console.log('Replacing optimistic message with real one:', tempId, '->', data.id)
        return [...filtered, data]
      })
      
      // Remove from pending
      setPendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
      setNewMessage('')
      setReplyingTo(null) // Clear reply state after sending
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      setPendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      return false
    } finally {
      setSending(false)
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
    try {
      console.log('Adding reaction:', reaction.emoji, 'to message:', messageId)
      // TODO: Implement backend API call to save reaction
      // await axios.post(`/api/app/chat/messages/${messageId}/reactions`, {
      //   emoji: reaction.emoji,
      //   name: reaction.name
      // })
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  // Compose mode
  if (chatType === 'compose') {
    return (
      <ComposeMode 
        currentUser={currentUser}
        onChatSelect={onChatSelect}
        onMessageSend={sendMessageToRecipient}
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

      {/* Messages */}
      <div ref={messageListContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
        <MessageList
          messages={messages}
          currentUser={currentUser}
          messageReads={messageReads}
          chatType={chatType}
          loading={loading}
          messagesEndRef={messagesEndRef}
          onReplyClick={handleReplyClick}
          messageRefsRef={messageRefsRef}
          onAddReaction={handleAddReaction}
        />
        
        <TypingIndicator typingUsers={typingUsers} />
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
          disabled={sending}
          replyingTo={replyingTo}
          inputRef={messageInputRef}
        />
      </div>
    </div>
  )
}
