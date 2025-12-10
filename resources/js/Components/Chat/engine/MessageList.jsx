import React, { useRef } from 'react'
import { UserIcon, PaperClipIcon, PaperAirplaneIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import ReplyBubble from './ReplyBubble'
import MessageReactions from './MessageReactions'

export default function MessageList({ 
  messages, 
  currentUser, 
  messageReads, 
  chatType,
  loading,
  messagesEndRef,
  onReplyClick,
  messageRefsRef,
  onAddReaction
}) {
  const messageRefs = useRef({})
  const [hoveredMessageId, setHoveredMessageId] = React.useState(null)
  const bubbleRefs = useRef({})
  
  // Connect local refs to parent component
  if (messageRefsRef) {
    messageRefsRef.current = messageRefs.current
  }

  // Scroll to a specific message
  const scrollToMessage = (messageId) => {
    const element = messageRefs.current[messageId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add a brief highlight effect to the bubble
      element.classList.add('ring-2', 'ring-theme-400')
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-theme-400')
      }, 2000)
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Group messages by sender and time
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1]
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-600"></div>
      </div>
    )
  }

  return (
    <>
      {groupedMessages.map((group, groupIndex) => {
        const senderId = group[0].sender_id || group[0].user_id
        const isMyGroup = senderId === currentUser?.id
        
        return (
          <div key={groupIndex} className="mb-4">
            <div className={`flex ${isMyGroup ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex ${isMyGroup ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[70%]`}>
                {/* Avatar - only show for other users */}
                {!isMyGroup && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    {group[0].user?.avatar ? (
                      <img src={group[0].user.avatar} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                )}
                
                <div className="flex-1">
                  {/* User name and timestamp for other users */}
                  {!isMyGroup && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {group[0].user?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(group[0].created_at)}
                      </span>
                    </div>
                  )}
                  
                  {/* Messages in the group */}
                  {group.map((message, messageIndex) => {
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
                      .map(read => {
                        // Try to get the user name from the read object
                        return read.user?.name || read.reader?.name || 'Someone'
                      })
                      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`mb-1 ${isMyGroup ? 'flex flex-row-reverse items-center gap-2' : 'flex items-center gap-2'}`}
                      >
                        {/* Container for bubble, reactions, and reply button */}
                        <div className={`group/message peer relative flex items-center gap-2 ${isMyGroup ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Message bubble */}
                          <div 
                            ref={el => {
                              messageRefs.current[message.id] = el
                              bubbleRefs.current[message.id] = el
                            }}
                            className={`px-4 py-2 rounded-2xl transition-all max-w-[66%] ${
                            isMyGroup
                              ? 'bg-theme-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                            onMouseEnter={() => {
                              // Immediately clear any other hovered message
                              setHoveredMessageId(message.id)
                            }}
                            onMouseLeave={() => setHoveredMessageId(null)}
                          >
                            {/* Show replied message context if this is a reply */}
                            {message.reply_to_message && (
                              <ReplyBubble 
                                repliedMessage={message.reply_to_message} 
                                isMyMessage={isMyGroup}
                                onClickReply={scrollToMessage}
                              />
                            )}
                            
                            <p>{message.body}</p>
                            {message.attachments?.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.attachments.map((attachment) => (
                                  <div key={attachment.id} className="flex items-center p-2 bg-white bg-opacity-10 rounded border border-white border-opacity-20">
                                    <PaperClipIcon className="w-4 h-4 mr-2" />
                                    <span className="text-sm">{attachment.filename}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Reactions tooltip - shown on hover */}
                          <MessageReactions 
                            message={message}
                            isMyMessage={isMyGroup}
                            onAddReaction={onAddReaction}
                            isHovered={hoveredMessageId === message.id}
                            bubbleRef={bubbleRefs.current[message.id]}
                          />
                          
                          <div className="flex flex-col items-center justify-center">
                            {/* Reply button - shown on hover, centered vertically */}
                            {onReplyClick && (
                              <button
                                onClick={() => onReplyClick(message)}
                                className="opacity-100 group-hover/message:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                                title="Reply"
                              >
                                <ArrowUturnLeftIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Read receipt indicator - only on last read or last unread message */}
                          {isMyGroup && (
                            <div className="flex justify-end pb-1 group/receipt transition-all peer-hover:hidden self-end">
                              {isLastReadMessage && readerNames.length > 0 ? (
                                  chatType === 'dm' ? (
                                    <span className="text-xs text-gray-500">Seen</span>
                                  ) : (
                                    <>
                                      <span className="text-xs text-gray-500 max-w-[120px] truncate">
                                        {readerNames.length <= 2 
                                          ? `Seen by ${readerNames.join(', ')}`
                                          : `Seen by ${readerNames.length} people`
                                        }
                                      </span>
                                      {readerNames.length > 2 && (
                                        <div className="absolute bottom-full right-0 mb-1 hidden group-hover/receipt:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                          {readerNames.join(', ')}
                                        </div>
                                      )}
                                    </>
                                  )
                                ) : isLastUnreadMessage ? (
                                  isPending ? (
                                    <PaperAirplaneIcon className="w-4 h-4 text-gray-400" title="Sending" />
                                  ) : (
                                    <PaperAirplaneIcon className="w-4 h-4 text-theme-600" title="Delivered" />
                                  )
                                ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Timestamp for my messages at bottom */}
                  {isMyGroup && (
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {formatTime(group[group.length - 1].created_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      <div ref={messagesEndRef} />
    </>
  )
}
