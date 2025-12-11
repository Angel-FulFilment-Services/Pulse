import React from 'react'

export default function TypingIndicator({ typingUsers = [] }) {
  console.log('TypingIndicator received:', typingUsers)
  
  // Always render with minimal fixed height to prevent layout shift
  return (
    <div className="min-h-[24px] flex items-center space-x-2 text-sm text-gray-500">
      {typingUsers.length > 0 && (
        <>
          <span>
            {typingUsers.length > 3 
              ? 'Multiple people are typing...'
              : typingUsers.length === 1
                ? <><span className="font-semibold">{typingUsers[0].user_name}</span> is typing</>
                : <><span className="font-semibold">{typingUsers.map(u => u.user_name).join(', ')}</span> are typing</>
            }
          </span>
          <div className="flex space-x-1 mt-2">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </>
      )}
    </div>
  )
}
