import React from 'react'

export default function ReplyBubble({ repliedMessage, isMyMessage, onClickReply }) {
  if (!repliedMessage) return null

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return (
    <div 
      onClick={() => onClickReply?.(repliedMessage.id)}
      className={`px-3 py-2 rounded-lg mb-2 border-l-4 ${
        isMyMessage 
          ? 'bg-white bg-opacity-20 border-white border-opacity-40' 
          : 'bg-gray-100 border-gray-400'
      } ${onClickReply ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className={`text-xs font-medium ${
          isMyMessage ? 'text-white text-opacity-90' : 'text-gray-600'
        }`}>
          {repliedMessage.user?.name || 'Unknown User'}
        </div>
        <div className={`text-xs ${
          isMyMessage ? 'text-white text-opacity-70' : 'text-gray-500'
        }`}>
          {formatTimestamp(repliedMessage.created_at)}
        </div>
      </div>
      <div className={`text-sm truncate ${
        isMyMessage ? 'text-white text-opacity-75' : 'text-gray-500'
      } ${repliedMessage.deleted_at ? 'italic' : ''}`}>
        {repliedMessage.deleted_at ? 'This message has been deleted' : repliedMessage.body}
      </div>
    </div>
  )
}
