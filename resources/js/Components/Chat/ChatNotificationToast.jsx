import React, { useState, useRef, useMemo } from 'react'
import { SpeakerXMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { QUICK_REACTIONS } from '../../Config/EmojiConfig'
import UserIcon from './UserIcon'

// Helper to render message body with mentions highlighted
function MessageBodyWithMentions({ body }) {
  const renderWithMentions = useMemo(() => {
    if (!body) return null
    
    // Match @mentions - @word or @Word Word patterns
    // Match @everyone or @Name or @First Last (up to 3 words for names)
    const parts = []
    let remaining = body
    let keyIndex = 0
    
    while (remaining.length > 0) {
      // Find the next @ symbol
      const atIndex = remaining.indexOf('@')
      
      if (atIndex === -1) {
        // No more @, add the rest as plain text
        parts.push(<span key={keyIndex++}>{remaining}</span>)
        break
      }
      
      // Add text before the @
      if (atIndex > 0) {
        parts.push(<span key={keyIndex++}>{remaining.slice(0, atIndex)}</span>)
      }
      
      // Try to match a mention pattern after @
      const afterAt = remaining.slice(atIndex + 1)
      
      // Match: word characters, optionally followed by space + word (for multi-word names)
      // Stop at punctuation, newline, or double space
      const mentionMatch = afterAt.match(/^([A-Za-z][A-Za-z0-9]*(?:\s[A-Za-z][A-Za-z0-9]*)*)/)
      
      if (mentionMatch) {
        const mentionText = mentionMatch[1]
        const endIndex = mentionText.length
        const charAfter = afterAt[endIndex]
        
        // Check if it ends at a proper boundary (space, newline, punctuation, or end)
        if (charAfter === undefined || charAfter === ' ' || charAfter === '\n' || /[.,!?;:]/.test(charAfter)) {
          // Add the mention with bold styling
          parts.push(
            <span 
              key={keyIndex++} 
              className="font-bold text-theme-600 dark:text-theme-400"
            >
              @{mentionText}
            </span>
          )
          remaining = remaining.slice(atIndex + 1 + endIndex)
        } else {
          // Has extra characters attached, not a clean mention
          parts.push(<span key={keyIndex++}>@</span>)
          remaining = remaining.slice(atIndex + 1)
        }
      } else {
        // Not a valid mention pattern, add @ as plain text
        parts.push(<span key={keyIndex++}>@</span>)
        remaining = remaining.slice(atIndex + 1)
      }
    }
    
    return parts.length > 0 ? parts : body
  }, [body])
  
  return <>{renderWithMentions}</>
}

export default function ChatNotificationToast({
  message,
  sender,
  chatId,
  chatType,
  hidePreview,
  isMentioned = false,
  onReply,
  onReact,
  onNavigate,
  onMute,
  onClose,
}) {
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isMuting, setIsMuting] = useState(false)
  const inputRef = useRef(null)

  const handleReply = async () => {
    if (!replyText.trim() || isSending) return
    
    setIsSending(true)
    const success = await onReply(replyText.trim())
    
    if (success) {
      setReplyText('')
      onClose()
    }
    setIsSending(false)
  }

  const handleReact = async (emoji, name) => {
    await onReact(emoji, name)
    onClose()
  }

  const handleMute = async () => {
    setIsMuting(true)
    await onMute()
    setIsMuting(false)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleReply()
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Get team name if team chat
  const teamName = message.team_name || message.team?.name

  return (
    <div className="relative pt-8 mt-4">
      {/* Quick Reactions - Floating bubble at top right */}
      {!hidePreview && (
        <div className="absolute top-0 right-4 flex items-center gap-0.5 px-2 py-1 bg-white dark:bg-dark-800 rounded-full shadow-lg border border-gray-200 dark:border-dark-600 z-10">
          {QUICK_REACTIONS.map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => handleReact(reaction.emoji, reaction.name)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors"
              title={reaction.label}
            >
              <span className="text-sm">{reaction.emoji}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Toast Container */}
      <div className="w-[420px] bg-white dark:bg-dark-800 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-dark-700">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-dark-700">
          <UserIcon contact={sender} size="small" />
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-dark-50 text-sm truncate">
                {sender.name}
              </span>
              {isMentioned && (
                <span className="text-xs font-medium text-theme-600 dark:text-theme-400">
                  mentioned you
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {chatType === 'team' && teamName && (
                <span className="text-xs text-gray-500 dark:text-dark-400 truncate">
                  in {teamName}
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-dark-500">
                {formatTime(message.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="p-3">
            <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg">
                {hidePreview ? (
                    <p className="text-gray-500 dark:text-dark-400 text-sm italic">
                    Message content hidden
                    </p>
                ) : (
                    <>
                    {message.body && (
                        <p className="text-gray-900 dark:text-dark-50 text-sm line-clamp-3">
                          <MessageBodyWithMentions body={message.body} />
                        </p>
                    )}
                    {message.attachments?.length > 0 && !message.body && (
                        <p className="text-gray-500 dark:text-dark-400 text-sm italic">
                        📄 {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                        </p>
                    )}
                    {message.attachments?.length > 0 && message.body && (
                        <p className="text-gray-400 dark:text-dark-500 text-xs mt-1">
                        + {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                        </p>
                    )}
                    </>
                )}
            </div>
        </div>

        {/* Reply Input - Always visible */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a reply..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
              disabled={isSending}
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || isSending}
              className="p-1.5 bg-theme-500 hover:bg-theme-600 disabled:bg-gray-300 dark:disabled:bg-dark-600 text-white rounded-lg transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center border-t border-gray-100 dark:border-dark-700">
          <button
            onClick={onNavigate}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-theme-600 dark:text-theme-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <span>Open Chat</span>
          </button>
          
          <div className="w-px h-8 bg-gray-100 dark:bg-dark-700" />
          
          <button
            onClick={handleMute}
            disabled={isMuting}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            title="Mute this chat"
          >
            <SpeakerXMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
