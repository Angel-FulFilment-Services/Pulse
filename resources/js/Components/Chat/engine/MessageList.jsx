import React, { useRef } from 'react'
import { PaperClipIcon, ArrowUturnLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import ReplyBubble from './ReplyBubble'
import MessageReactions from './MessageReactions'
import MessageReactionBubbles from './MessageReactionBubbles'
import UserIcon from '../UserIcon'

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
  onRetryMessage,
  messageListContainerRef,
  pendingReactionsRef,
  onPinMessage,
  pinnedMessageId,
  onDeleteMessage,
  onRestoreMessage
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
                  <UserIcon contact={group[0].user} size="medium" />
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
                        return read.user?.name || read.reader?.name || 'Someone'
                      })
                      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
                    
                    // Check if previous message has reactions (to add top padding to this message)
                    const prevMessage = group[messageIndex - 1]
                    const prevHasReactions = prevMessage?.reactions && prevMessage.reactions.length > 0
                    
                    // Check if this message has reactions
                    const hasReactions = message.reactions && message.reactions.length > 0
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`mb-1 ${prevHasReactions ? 'mt-5' : ''} ${isMyGroup ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}
                      >
                        {/* Container for bubble, reactions, and reply button */}
                        <div className={`group/message peer relative flex items-center gap-2 max-w-5xl ${isMyGroup ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Message bubble */}
                          <div 
                            ref={el => {
                              messageRefs.current[message.id] = el
                              bubbleRefs.current[message.id] = el
                            }}
                            className={`relative px-4 py-2 transition-all ${
                              isMyGroup
                                ? 'bg-theme-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            } ${
                              isLastInGroup 
                                ? 'rounded-[18px]' 
                                : 'rounded-[18px]'
                            } ${
                              isLastInGroup && isMyGroup ? 'before:content-[""] before:absolute before:z-0 before:bottom-0 before:right-[-8px] before:h-5 before:w-5 before:bg-theme-500 before:rounded-bl-[15px] after:content-[""] after:absolute after:z-[1] after:bottom-0 after:right-[-10px] after:w-[10px] after:h-5 after:bg-white after:rounded-bl-[10px]' : ''
                            } ${
                              isLastInGroup && !isMyGroup ? 'before:content-[""] before:absolute before:z-0 before:bottom-0 before:left-[-8px] before:h-5 before:w-5 before:bg-gray-200 before:rounded-br-[15px] after:content-[""] after:absolute after:z-[1] after:bottom-0 after:left-[-10px] after:w-[10px] after:h-5 after:bg-white after:rounded-br-[10px]' : ''
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
                              {message.reply_to_message && !message.deleted_at && (
                                <ReplyBubble 
                                  repliedMessage={message.reply_to_message} 
                                  isMyMessage={isMyGroup}
                                  onClickReply={scrollToMessage}
                                />
                              )}
                              
                              {message.deleted_at ? (
                                <div className="flex items-center gap-3">
                                  <p className={`italic ${isMyGroup ? 'text-white' : ''} text-gray-500`}>This message has been deleted.</p>
                                  {isMyGroup && (
                                    <button
                                      onClick={() => onRestoreMessage?.(message.id)}
                                      className="text-sm underline text-theme-50 hover:text-theme-200 font-semibold"
                                    >
                                      Undo
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
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
                              isDeleted={!!message.deleted_at}
                            />
                          )}
                          
                          {/* Reply/Retry button - aligned to bubble top, hide for deleted messages */}
                          {!message.deleted_at && (
                            message.status === 'failed' ? (
                              <button
                                onClick={() => onRetryMessage?.(message.id)}
                                className="mt-1 p-1 text-red-500 hover:text-red-700"
                                title="Retry sending"
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                            ) : onReplyClick && (
                              <button
                                onClick={() => onReplyClick(message)}
                                className="opacity-0 group-hover/message:opacity-100 transition-opacity mt-1 p-1 text-gray-400 hover:text-gray-600"
                                title="Reply"
                              >
                                <ArrowUturnLeftIcon className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                        
                        {/* Read receipt - separate from bubble, at message level */}
                        {isMyGroup && (isLastReadMessage || isLastUnreadMessage || message.status === 'pending' || message.status === 'failed') && (
                          <div className={`flex items-center text-xs py-1 ${hasReactions && !message.deleted_at ? 'pt-8' : 'pt-1.5'}`}>
                            {isLastReadMessage && readerNames.length > 0 ? (
                              chatType === 'dm' ? (
                                <span className="text-gray-500">Seen</span>
                              ) : (
                                <div className="group/receipt relative text-gray-500">
                                  <span className="max-w-[120px] truncate">
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
                                </div>
                              )
                            ) : message.status === 'failed' ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <span>Not Delivered</span>
                              </div>
                            ) : message.status === 'pending' || isPending ? (
                              <div className="flex items-center justify-center gap-1 text-gray-500">
                                <span>Sending</span>
                                <span className="typing-dots gap-x-0.5 flex mt-1">
                                  <span className="dot w-1 h-1 bg-gray-400 rounded-full"></span>
                                  <span className="dot w-1 h-1 bg-gray-400 rounded-full"></span>
                                  <span className="dot w-1 h-1 bg-gray-400 rounded-full"></span>
                                </span>
                              </div>
                            ) : isLastUnreadMessage ? (
                              <div className="flex items-center gap-1 text-gray-500">
                                <span>Delivered</span>
                                <PaperAirplaneIcon className="w-4 h-4 text-theme-600 rotate-180" title="Delivered" />
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
                    const hasReactions = lastMsg.reactions?.length > 0
                    
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
                      <div className={`text-xs text-gray-500 text-right ${
                        hasReactions && !lastMsgHasStatus && !lastMsg.deleted_at ? 'mt-7' : 'mt-1'
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
      
      <div ref={messagesEndRef} />
    </>
  )
}
