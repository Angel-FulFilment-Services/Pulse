import React, { useRef, useState, useEffect } from 'react'
import { PaperClipIcon, ArrowUturnLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import ReplyBubble from './ReplyBubble'
import ForwardedMessageBubble from './ForwardedMessageBubble'
import MessageReactions from './MessageReactions'
import MessageReactionBubbles from './MessageReactionBubbles'
import UserIcon from '../UserIcon'
import AttachmentPreview from './AttachmentPreview'
import ImageLightbox from './ImageLightbox'
import PDFLightbox from './PDFLightbox'

export default function MessageList({ 
  messages, 
  currentUser, 
  messageReads, 
  chatType,
  loading,
  messagesEndRef,
  onReplyClick,
  messageRefsRef,
  onAddReaction,
  onAddAttachmentReaction,
  onPinAttachment,
  onDeleteAttachment,
  onRestoreAttachment,
  onRetryMessage,
  messageListContainerRef,
  pendingReactionsRef,
  onPinMessage,
  pinnedMessageId,
  pinnedAttachmentId,
  onDeleteMessage,
  onRestoreMessage,
  onQuickMessage,
  onForwardMessage,
  onForwardAttachment
}) {
  const messageRefs = useRef({})
  const [hoveredMessageId, setHoveredMessageId] = React.useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [lightboxPdf, setLightboxPdf] = useState(null)
  const bubbleRefs = useRef({})
  const seenMessageIds = useRef(new Set())
  const [newMessageIds, setNewMessageIds] = useState(new Set())
  const isInitialLoad = useRef(true)
  
  // Track new messages for animation
  useEffect(() => {
    if (loading) return
    
    // Detect if we've switched to a completely different chat
    // If none of the current messages are in our seen set, it's a new chat
    const currentMessageIds = new Set(messages.map(m => m.id))
    const hasAnySeenMessages = Array.from(currentMessageIds).some(id => seenMessageIds.current.has(id))
    
    // Reset tracking when switching to a new chat
    if (messages.length > 0 && !hasAnySeenMessages && !isInitialLoad.current) {
      seenMessageIds.current.clear()
      isInitialLoad.current = true
    }
    
    // Mark initial load complete after first render with messages
    if (isInitialLoad.current && messages.length > 0) {
      // Add all current message IDs to seen set without animating
      messages.forEach(msg => seenMessageIds.current.add(msg.id))
      isInitialLoad.current = false
      return
    }
    
    // Find truly new messages (not in seen set)
    const newIds = new Set()
    messages.forEach(msg => {
      if (!seenMessageIds.current.has(msg.id)) {
        // For sent messages, only animate optimistic (temp) messages
        const isMine = (msg.sender_id || msg.user_id) === currentUser?.id
        const isOptimistic = String(msg.id).startsWith('temp-')
        
        // Animate if: it's a received message OR it's an optimistic sent message
        if (!isMine || isOptimistic) {
          newIds.add(msg.id)
        }
        
        seenMessageIds.current.add(msg.id)
      }
    })
    
    if (newIds.size > 0) {
      setNewMessageIds(newIds)
      // Remove animation class after animation completes
      setTimeout(() => {
        setNewMessageIds(new Set())
      }, 300)
    }
  }, [messages, loading, currentUser])
  
  // Connect local refs to parent component
  if (messageRefsRef) {
    messageRefsRef.current = messageRefs.current
  }

  // Scroll to a specific message
  const scrollToMessage = (messageId, attachmentId = null) => {
    // If attachmentId is provided, scroll to the specific attachment
    const targetId = attachmentId || messageId
    const element = messageRefs.current[targetId]
    console.log(targetId, element)

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Add a brief highlight effect directly to the element
      // For attachments, also add rounded-lg to ensure the ring has rounded corners
      if (attachmentId) {
        element.classList.add('ring-4', 'ring-theme-400', 'rounded-lg')
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-theme-400', 'rounded-lg')
        }, 2000)
      } else {
        element.classList.add('ring-4', 'ring-theme-400')
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-theme-400')
        }, 2000)
      }
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      // UK format: dd/mm/yyyy
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `${day}/${month}/${year} ${time}`
    }
  }

  // Separate membership events from regular messages
  const membershipEvents = messages.filter(item => item.item_type === 'membership_event')
  const regularMessages = messages.filter(item => item.item_type !== 'membership_event')

  // Group regular messages by sender and time
  const groupedMessages = regularMessages
    // Filter out empty messages (no text, no attachments, not deleted, not forwarded)
    .filter(message => {
      const hasText = message.body && message.body.trim().length > 0
      const hasAttachments = message.attachments && message.attachments.length > 0
      const isDeleted = message.deleted_at
      const isForwarded = message.forwarded_from_message_id || message.forwarded_from_message
      
      // Keep message if it has text, attachments, is deleted, or is forwarded
      return hasText || hasAttachments || isDeleted || isForwarded
    })
    .reduce((groups, message, index, filteredMessages) => {
    const prevMessage = filteredMessages[index - 1]
    
    // Get sender IDs - messages use sender_id, not user_id
    const currentSenderId = message.sender_id || message.user_id || message.user?.id
    const prevSenderId = prevMessage?.sender_id || prevMessage?.user_id || prevMessage?.user?.id
    
    const shouldGroup = prevMessage && 
      currentSenderId === prevSenderId &&
      new Date(message.created_at) - new Date(prevMessage.created_at) < 300000 // 5 minutes

    if (shouldGroup) {
      groups[groups.length - 1].push(message)
    } else {
      groups.push([message])
    }

    return groups
  }, [])
  
  // Sort membership events by time
  const sortedEvents = [...membershipEvents].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  )
  
  // Pre-group membership events that are within 5 minutes of each other and of the same type
  const preGroupedEvents = []
  for (const event of sortedEvents) {
    const lastGroup = preGroupedEvents[preGroupedEvents.length - 1]
    
    if (lastGroup && lastGroup.eventType === event.type) {
      // Check if within 5 minutes of the last event in the group
      const lastEventTime = new Date(lastGroup.events[lastGroup.events.length - 1].created_at)
      const currentEventTime = new Date(event.created_at)
      const timeDiff = currentEventTime - lastEventTime
      
      if (timeDiff < 5 * 60 * 1000) { // 5 minutes
        // Add to existing group
        lastGroup.events.push(event)
        continue
      }
    }
    
    // Start a new group
    preGroupedEvents.push({
      eventType: event.type,
      events: [event],
      // Use the first event's timestamp for timeline positioning
      created_at: event.created_at
    })
  }
  
  // Now interleave message groups with pre-grouped events
  const timeline = []
  let groupIndex = 0
  let eventGroupIndex = 0
  
  while (groupIndex < groupedMessages.length || eventGroupIndex < preGroupedEvents.length) {
    const currentGroup = groupedMessages[groupIndex]
    const currentEventGroup = preGroupedEvents[eventGroupIndex]
    
    if (!currentEventGroup) {
      // No more events, add remaining message groups
      timeline.push({ type: 'group', data: currentGroup, key: `group-${currentGroup[0].id}` })
      groupIndex++
    } else if (!currentGroup) {
      // No more message groups, add remaining event groups
      const eg = currentEventGroup
      if (eg.events.length === 1) {
        timeline.push({ type: 'event', data: eg.events[0], key: eg.events[0].id })
      } else {
        timeline.push({
          type: 'eventGroup',
          eventType: eg.eventType,
          events: eg.events,
          key: `event-group-${eg.events[0].id}-${eg.events[eg.events.length - 1].id}`
        })
      }
      eventGroupIndex++
    } else {
      // Compare times - use the first message in the group vs first event in event group
      const groupTime = new Date(currentGroup[0].created_at)
      const eventTime = new Date(currentEventGroup.created_at)
      
      if (groupTime <= eventTime) {
        timeline.push({ type: 'group', data: currentGroup, key: `group-${currentGroup[0].id}` })
        groupIndex++
      } else {
        const eg = currentEventGroup
        if (eg.events.length === 1) {
          timeline.push({ type: 'event', data: eg.events[0], key: eg.events[0].id })
        } else {
          timeline.push({
            type: 'eventGroup',
            eventType: eg.eventType,
            events: eg.events,
            key: `event-group-${eg.events[0].id}-${eg.events[eg.events.length - 1].id}`
          })
        }
        eventGroupIndex++
      }
    }
  }
  
  // Timeline is now ready - no need for secondary grouping
  const groupedTimeline = timeline

  if (loading) {
    // Get theme color from CSS variable (RGB values need wrapping)
    const themeRgb = getComputedStyle(document.body).getPropertyValue('--theme-500').trim()
    const themeColor = themeRgb ? `rgb(${themeRgb})` : 'rgb(249, 115, 22)' // Default to orange-500
    
    return (
      <div className="flex items-center justify-center h-32">
        <l-ring
          size="40"
          stroke="4"
          bg-opacity="0"
          speed="2"
          color={themeColor}
        ></l-ring>
      </div>
    )
  }

  // Helper to render a membership event (single)
  const renderMembershipEvent = (event) => {
    const isJoin = event.type === 'member_joined'
    const isMe = event.user_id === currentUser?.id
    
    return (
      <div key={event.id} className="flex justify-center my-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 rounded-full text-sm text-gray-600 dark:text-dark-300">
          {isJoin ? (
            <>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span><strong>{isMe ? 'You' : event.user_name}</strong> {isMe ? 'joined' : 'has joined'} the team</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
              <span><strong>{isMe ? 'You' : event.user_name}</strong> {isMe ? 'left' : 'has left'} the team</span>
            </>
          )}
          <span className="text-xs text-gray-400 dark:text-dark-500">
            {formatTime(event.created_at)}
          </span>
        </div>
      </div>
    )
  }
  
  // Helper to render a grouped membership event (multiple people)
  // Extracted component for grouped membership events with FloatingUI tooltip
  const GroupedMembershipEvent = ({ eventGroup, formatTime }) => {
    const [isHovering, setIsHovering] = useState(false)
    const isJoin = eventGroup.eventType === 'member_joined'
    const events = eventGroup.events
    const names = events.map(e => e.user_name)
    const lastEvent = events[events.length - 1]
    
    // Check if current user is in the group
    const currentUserEvent = events.find(e => e.user_id === currentUser?.id)
    const otherEvents = events.filter(e => e.user_id !== currentUser?.id)
    const othersCount = otherEvents.length

    const { refs, floatingStyles } = useFloating({
      placement: 'top',
      middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
      whileElementsMounted: autoUpdate,
    })
    
    // Build the display text
    const getDisplayText = () => {
      if (currentUserEvent && othersCount > 0) {
        // "You and X others have joined/left the team"
        return (
          <span>
            <strong>You</strong> and <strong>{othersCount} {othersCount === 1 ? 'other' : 'others'}</strong> have {isJoin ? 'joined' : 'left'} the team
          </span>
        )
      } else if (currentUserEvent && othersCount === 0) {
        // Just the current user (shouldn't happen in grouped, but handle it)
        return <span><strong>You</strong> {isJoin ? 'joined' : 'left'} the team</span>
      } else {
        // No current user in group
        return <span><strong>{events.length} people</strong> have {isJoin ? 'joined' : 'left'} the team</span>
      }
    }

    return (
      <div className="flex justify-center my-4">
        <div className="relative">
          <div 
            ref={refs.setReference}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 rounded-full text-sm text-gray-600 dark:text-dark-300 cursor-default"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {isJoin ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
            )}
            {getDisplayText()}
            <span className="text-xs text-gray-400 dark:text-dark-500">
              {formatTime(lastEvent.created_at)}
            </span>
          </div>
          
          {/* Floating tooltip showing all names */}
          {isHovering && (
            <div 
              ref={refs.setFloating}
              style={floatingStyles}
              className="px-3 py-2 bg-gray-800 dark:bg-dark-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
            >
              <div className="flex flex-col gap-1">
                {currentUserEvent && (
                  <span className="font-medium">You</span>
                )}
                {otherEvents.map((event, idx) => (
                  <span key={idx} className="font-medium">{event.user_name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {groupedTimeline.map((item) => {
        // Render grouped membership events
        if (item.type === 'eventGroup') {
          return <GroupedMembershipEvent key={item.key} eventGroup={item} formatTime={formatTime} />
        }
        
        // Render single membership events
        if (item.type === 'event') {
          return renderMembershipEvent(item.data)
        }
        
        // Render message groups
        const group = item.data
        const senderId = group[0].sender_id || group[0].user_id
        const isMyGroup = senderId === currentUser?.id
        
        return (
          <div key={item.key} className="mb-4">
            <div className={`flex ${isMyGroup ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex ${isMyGroup ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[70%]`}>
                {/* Avatar - only show for other users, aligned with name/timestamp */}
                {!isMyGroup && (
                  <div className="-mt-[10px]">
                    <UserIcon 
                      contact={group[0].user} 
                      size="medium" 
                      showContactCard={true}
                      onSendMessage={onQuickMessage}
                      contactCardPlacement="right-start"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  {/* User name and timestamp for other users */}
                  {!isMyGroup && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-dark-50 text-sm">
                        {group[0].user?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-dark-400">
                        {formatTime(group[0].created_at)}
                      </span>
                    </div>
                  )}
                  
                  {/* Messages in the group */}
                  {group.map((message, messageIndex) => {
                    const isLastInGroup = messageIndex === group.length - 1
                    
                    // Find the last read message across ALL groups
                    let isLastReadMessage = false
                    let isLastUnreadMessage = false
                    let isPending = false
                    
                    if (isMyGroup) {
                      // Find the last message with reads across all messages
                      const allMyMessages = groupedMessages
                        .filter(g => (g[0].sender_id || g[0].user_id) === currentUser?.id)
                        .flatMap(g => g)
                      
                      const messagesWithReads = allMyMessages.filter(m => 
                        messageReads[m.id] && messageReads[m.id].length > 0
                      )
                      
                      if (messagesWithReads.length > 0) {
                        const lastReadMsg = messagesWithReads[messagesWithReads.length - 1]
                        isLastReadMessage = message.id === lastReadMsg.id
                      }
                      
                      // Check if this is the last message overall (for showing sent/pending indicator)
                      const lastMessage = allMyMessages[allMyMessages.length - 1]
                      isLastUnreadMessage = message.id === lastMessage.id
                      
                      // Check if THIS specific message is pending
                      if (isLastUnreadMessage) {
                        isPending = message.isPending || String(message.id).startsWith('temp-')
                      }
                    }
                    
                    // Get readers for this message
                    const readers = messageReads[message.id] || []
                    const readerNames = readers
                      .filter(read => {
                        // Exclude the current user from the readers list (don't show your own read receipt on your own messages)
                        const readerId = read.user_id || read.reader_id || read.user?.id
                        return readerId !== currentUser?.id
                      })
                      .map(read => {
                        // Try to get the user name from the read object
                        // user_name is from broadcast, user.name is from initial load
                        return read.user_name || read.user?.name || read.reader?.name || 'Someone'
                      })
                      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
                    
                    // Check if previous message has reactions (to add top padding to this message)
                    const prevMessage = group[messageIndex - 1]
                    const prevHasMessageReactions = prevMessage?.reactions && prevMessage.reactions.length > 0
                    const prevHasAttachmentReactions = prevMessage?.attachments?.some(att => att.reactions && att.reactions.length > 0)
                    // Only add top padding if previous message has MESSAGE reactions (not attachment reactions, since those already have mb-7)
                    const prevHasReactions = prevHasMessageReactions
                    
                    // Check if this message has reactions (message or attachments)
                    const hasMessageReactions = message.reactions && message.reactions.length > 0
                    const hasAttachmentReactions = message.attachments?.some(att => att.reactions && att.reactions.length > 0)
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`mb-1 ${prevHasReactions ? 'mt-5' : ''} ${isMyGroup ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}
                      >
                        {/* Attachments above the bubble */}
                        {!message.deleted_at && message.attachments?.length > 0 && (
                          <div 
                            ref={el => {
                              // Set ref for attachment-only messages (no body text)
                              if (!message.body) {
                                messageRefs.current[message.id] = el
                              }
                            }}
                            className={`flex items-center gap-2 max-w-5xl ${isMyGroup ? 'flex-row-reverse' : 'flex-row'} ${hasAttachmentReactions ? 'mb-7' : 'mb-2'} ${newMessageIds.has(message.id) ? (isMyGroup ? 'animate-message-slide-in-sent' : 'animate-message-slide-in-received') : ''}`}
                          >
                            <div>
                              {message.attachments.map((attachment, index) => {
                                // Check if previous attachment has reactions (for spacing between attachments)
                                const prevAttachment = message.attachments[index - 1]
                                const prevAttachmentHasReactions = prevAttachment?.reactions && prevAttachment.reactions.length > 0
                                
                                // Use a stable key that combines message ID and attachment ID
                                const attachmentKey = attachment.id ? `msg-${message.id}-att-${attachment.id}` : `msg-${message.id}-att-${index}`
                                
                                return (
                                  <div 
                                    key={attachmentKey} 
                                    className={prevAttachmentHasReactions ? 'mt-7' : 'mt-2'}
                                  >
                                    <AttachmentPreview
                                      attachment={attachment}
                                      onImageClick={setLightboxImage}
                                      onPdfClick={setLightboxPdf}
                                      // Always show reaction buttons on all attachments
                                      showReactions={true}
                                      isMyMessage={isMyGroup}
                                      currentUserId={currentUser?.id}
                                      onAddReaction={onAddAttachmentReaction}
                                      onPinAttachment={onPinAttachment}
                                      onDeleteAttachment={onDeleteAttachment}
                                      onRestoreAttachment={onRestoreAttachment}
                                      onReplyClick={onReplyClick}
                                      onForwardAttachment={onForwardAttachment}
                                      isPinned={pinnedAttachmentId === attachment.id}
                                      isDeleted={attachment.deleted_at != null}
                                      pendingReactionsRef={pendingReactionsRef}
                                      boundaryRef={messageListContainerRef}
                                      messageId={message.id}
                                      contentRef={el => {
                                        // Store ref to the actual attachment content
                                        if (el && attachment.id) {
                                          messageRefs.current[attachment.id] = el
                                        }
                                      }}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                            {/* Retry button for attachment-only failed messages */}
                            {message.status === 'failed' && !message.body && (
                              <button
                                onClick={() => onRetryMessage?.(message.id)}
                                className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
                                title="Retry sending"
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Container for bubble, reactions, and reply button - only show if there's text, it's deleted, or it's a forwarded message */}
                        {(message.body || message.deleted_at || message.forwarded_from_message) && (
                          <div className={`group/message peer relative flex items-center gap-2 max-w-5xl ${isMyGroup ? 'flex-row-reverse' : 'flex-row'} ${newMessageIds.has(message.id) ? (isMyGroup ? 'animate-message-slide-in-sent' : 'animate-message-slide-in-received') : ''}`}>
                            {/* Message bubble */}
                            <div 
                              ref={el => {
                                messageRefs.current[message.id] = el
                                bubbleRefs.current[message.id] = el
                              }}
                              className={`relative px-4 py-2 transition-all ${
                                isMyGroup
                                  ? 'bg-theme-500 dark:bg-theme-600 text-white'
                                  : 'bg-gray-200 dark:bg-dark-700 text-gray-900 dark:text-dark-50'
                              } ${
                                isLastInGroup 
                                  ? 'rounded-[18px]' 
                                  : 'rounded-[18px]'
                              } ${
                                isLastInGroup && isMyGroup ? 'before:content-[""] before:absolute before:z-0 before:bottom-0 before:right-[-8px] before:h-5 before:w-5 before:bg-theme-500 dark:before:bg-theme-600 before:rounded-bl-[15px] after:content-[""] after:absolute after:z-[1] after:bottom-0 after:right-[-10px] after:w-[10px] after:h-5 after:bg-white dark:after:bg-dark-900 after:rounded-bl-[10px]' : ''
                              } ${
                                isLastInGroup && !isMyGroup ? 'before:content-[""] before:absolute before:z-0 before:bottom-0 before:left-[-8px] before:h-5 before:w-5 before:bg-gray-200 dark:before:bg-dark-700 before:rounded-br-[15px] after:content-[""] after:absolute after:z-[1] after:bottom-0 after:left-[-10px] after:w-[10px] after:h-5 after:bg-white dark:after:bg-dark-900 after:rounded-br-[10px]' : ''
                              }`}
                              style={{ wordBreak: 'break-all' }}
                              onMouseEnter={() => setHoveredMessageId(message.id)}
                              onMouseLeave={() => setHoveredMessageId(null)}
                            >
                            {/* Gradient overlay for depth */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/[0.01] pointer-events-none rounded-[18px]" />
                            
                            {/* Reaction bubbles - hide for deleted messages */}
                            {!message.deleted_at && (
                              <MessageReactionBubbles 
                                reactions={message.reactions}
                                isMyMessage={isMyGroup}
                                currentUserId={currentUser?.id}
                                onRemoveReaction={onAddReaction}
                                messageId={message.id}
                                onHoverChange={(shouldShow) => {
                                  if (!shouldShow) {
                                    setHoveredMessageId(null)
                                  } else if (hoveredMessageId !== message.id) {
                                    setHoveredMessageId(message.id)
                                  }
                                }}
                                boundaryRef={messageListContainerRef}
                                pendingReactionsRef={pendingReactionsRef}
                              />
                            )}
                            
                            {/* Content wrapper with relative positioning to appear above gradient */}
                            <div className="relative z-10">
                              {/* Show replied message context if this is a reply and not deleted */}
                              {message.reply_to_message && !message.deleted_at && (() => {
                                // Look up the current state of the replied message from the messages array
                                let currentRepliedMessage = messages.find(m => m.id === message.reply_to_message.id) || message.reply_to_message
                                
                                // If this message has a reply_to_attachment, add it to the replied message
                                if (message.reply_to_attachment) {
                                  currentRepliedMessage = {
                                    ...currentRepliedMessage,
                                    reply_to_attachment: message.reply_to_attachment
                                  }
                                }
                                
                                return (
                                  <ReplyBubble 
                                    repliedMessage={currentRepliedMessage} 
                                    isMyMessage={isMyGroup}
                                    onClickReply={scrollToMessage}
                                  />
                                )
                              })()}
                              
                              {/* Show forwarded message context if this is a forwarded message and not deleted */}
                              {message.forwarded_from_message && !message.deleted_at && (
                                <ForwardedMessageBubble 
                                  forwardedMessage={message.forwarded_from_message} 
                                  isMyMessage={isMyGroup}
                                />
                              )}
                              
                              {message.deleted_at ? (
                                <div className="flex items-center gap-3">
                                  <p className={`italic ${isMyGroup ? 'text-white' : 'text-gray-500 dark:text-dark-400'}`}>This message has been deleted.</p>
                                  {isMyGroup && (
                                    <button
                                      onClick={() => onRestoreMessage?.(message.id)}
                                      className="text-sm underline text-theme-600 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-300 font-semibold"
                                    >
                                      Undo
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {message.body && <p>{message.body}</p>}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Reactions tooltip - hide for deleted messages */}
                          {!message.deleted_at && (
                            <MessageReactions 
                              message={message}
                              isMyMessage={isMyGroup}
                              onAddReaction={onAddReaction}
                              isHovered={hoveredMessageId === message.id}
                              bubbleRef={bubbleRefs.current[message.id]}
                              currentUser={currentUser}
                              messageStatus={message.status}
                              onPinMessage={onPinMessage}
                              isPinned={message.id === pinnedMessageId}
                              onDeleteMessage={onDeleteMessage}
                              onReplyClick={onReplyClick}
                              isDeleted={!!message.deleted_at}
                              onForwardMessage={onForwardMessage}
                            />
                          )}
                          
                          {/* Retry button for failed messages - aligned to bubble top */}
                          {!message.deleted_at && message.status === 'failed' && (
                            <button
                              onClick={() => onRetryMessage?.(message.id)}
                              className="mt-1 p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              title="Retry sending"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        )}
                        
                        {/* Read receipt - separate from bubble, at message level */}
                        {isMyGroup && (isLastReadMessage || isLastUnreadMessage || message.status === 'pending' || message.status === 'failed') && (
                          <div className={`flex items-center text-xs py-1 ${hasMessageReactions && !message.deleted_at ? 'pt-8' : 'pt-1.5'}`}>
                            {isLastReadMessage && readerNames.length > 0 ? (
                              chatType === 'dm' ? (
                                <span className="text-gray-500 dark:text-dark-400">Seen</span>
                              ) : (
                                <div className="group/receipt relative text-gray-500 dark:text-dark-400">
                                  <span className="max-w-[120px] truncate">
                                    {readerNames.length <= 2 
                                      ? `Seen by ${readerNames.join(', ')}`
                                      : `Seen by ${readerNames.length} people`
                                    }
                                  </span>
                                  {readerNames.length > 2 && (
                                    <div className="absolute bottom-full right-0 mb-1 hidden group-hover/receipt:block bg-gray-800 dark:bg-dark-700 text-white dark:text-dark-50 text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                      {readerNames.join(', ')}
                                    </div>
                                  )}
                                </div>
                              )
                            ) : message.status === 'failed' ? (
                              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <span>Not Delivered</span>
                              </div>
                            ) : message.status === 'pending' || isPending ? (
                              <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-dark-400">
                                <span>Sending</span>
                                <span className="typing-dots gap-x-0.5 flex mt-1">
                                  <span className="dot w-1 h-1 bg-gray-400 dark:bg-dark-500 rounded-full"></span>
                                  <span className="dot w-1 h-1 bg-gray-400 dark:bg-dark-500 rounded-full"></span>
                                  <span className="dot w-1 h-1 bg-gray-400 dark:bg-dark-500 rounded-full"></span>
                                </span>
                              </div>
                            ) : isLastUnreadMessage ? (
                              <div className="flex items-center gap-1 text-gray-500 dark:text-dark-400">
                                <span>Delivered</span>
                                <PaperAirplaneIcon className="w-4 h-4 text-theme-600 dark:text-theme-400 rotate-180" title="Delivered" />
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Timestamp for my messages at bottom */}
                  {isMyGroup && (() => {
                    const lastMsg = group[group.length - 1]
                    const hasMessageReactions = lastMsg.reactions?.length > 0
                    const hasAttachmentReactions = lastMsg.attachments?.some(att => att.reactions && att.reactions.length > 0)
                    const hasReactions = hasMessageReactions || hasAttachmentReactions
                    
                    // Check if last message has a status showing (which would already provide padding for reactions)
                    const allMyMessages = groupedMessages
                      .filter(g => (g[0].sender_id || g[0].user_id) === currentUser?.id)
                      .flatMap(g => g)
                    
                    const messagesWithReads = allMyMessages.filter(m => 
                      messageReads[m.id] && messageReads[m.id].length > 0
                    )
                    
                    const lastReadMsg = messagesWithReads.length > 0 ? messagesWithReads[messagesWithReads.length - 1] : null
                    const lastMessage = allMyMessages[allMyMessages.length - 1]
                    
                    const lastMsgHasStatus = (
                      (lastReadMsg && lastMsg.id === lastReadMsg.id) ||
                      (lastMessage && lastMsg.id === lastMessage.id) ||
                      lastMsg.status === 'pending' || 
                      lastMsg.status === 'failed'
                    )
                    
                    return (
                      <div className={`text-xs text-gray-500 dark:text-dark-400 text-right ${
                        (hasMessageReactions) && !lastMsgHasStatus && !lastMsg.deleted_at ? 'mt-7' : 'mt-1'
                      }`}>
                        {formatTime(lastMsg.created_at)}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      <div ref={messagesEndRef} style={{ overflowAnchor: 'auto' }} />
      
      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          attachment={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* PDF Lightbox */}
      {lightboxPdf && (
        <PDFLightbox
          attachment={lightboxPdf}
          onClose={() => setLightboxPdf(null)}
        />
      )}
    </>
  )
}
