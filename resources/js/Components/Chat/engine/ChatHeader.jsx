import React from 'react'
import { UserIcon, UserGroupIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'

export default function ChatHeader({ chat, chatType }) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-white min-h-[5.31rem]">
      <div className="flex items-center justify-between">
        <div className="flex items-center h-full">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
            {chatType === 'team' ? (
              <UserGroupIcon className="w-5 h-5 text-gray-600" />
            ) : (
              chat.avatar ? (
                <img src={chat.avatar} alt="" className="w-10 h-10 rounded-lg" />
              ) : (
                <UserIcon className="w-5 h-5 text-gray-600" />
              )
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{chat.name}</h2>
            {chatType === 'team' && chat.description && (
              <p className="text-sm text-gray-500">{chat.description}</p>
            )}
            {chatType === 'dm' && (
              <p className="text-sm text-gray-500">
                {chat.is_online ? 'Active now' : 'Away'}
              </p>
            )}
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <EllipsisVerticalIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
