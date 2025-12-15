import React, { useState } from 'react'
import { UserGroupIcon, EllipsisVerticalIcon, ArrowTopRightOnSquareIcon, ChevronLeftIcon, EyeIcon, EyeSlashIcon, TrashIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline'
import UserIcon from '../UserIcon.jsx'
import ConfirmationDialog from '../../Dialogs/ConfirmationDialog.jsx'

export default function ChatHeader({ chat, chatType, onBackToSidebar, onChatPreferenceChange, chatPreferences = [] }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [confirmationDialog, setConfirmationDialog] = useState({ isOpen: false, type: null })
  
  // Check current states
  const isMuted = chatPreferences.some(pref => 
    pref.chat_id === chat?.id && 
    pref.chat_type === (chatType === 'team' ? 'team' : 'user') &&
    pref.is_muted
  )
  
  const isHidden = chatPreferences.some(pref => 
    pref.chat_id === chat?.id && 
    pref.chat_type === (chatType === 'team' ? 'team' : 'user') &&
    pref.is_hidden
  )
  
  // Check if we're already in popout mode
  const isPopout = window.location.pathname === '/chat/popout'
  
  // Helper function to get API headers
  const getHeaders = () => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
    }
  }
  
  const handleOptionClick = async (action) => {
    setShowDropdown(false)
    
    const chatData = {
      chat_id: chat.id,
      chat_type: chatType === 'team' ? 'team' : 'user'
    }
    
    try {
      let response
      
      switch(action) {
        case 'markUnread':
          response = await fetch('/api/chat/preferences/mark-unread', {
            method: 'POST',
            credentials: 'same-origin',
            headers: getHeaders(),
            body: JSON.stringify(chatData)
          })
          if (response.ok) {
            onChatPreferenceChange?.()
          }
          break
          
        case 'markRead':
          response = await fetch('/api/chat/preferences/mark-read', {
            method: 'POST',
            credentials: 'same-origin',
            headers: getHeaders(),
            body: JSON.stringify(chatData)
          })
          if (response.ok) {
            onChatPreferenceChange?.()
          }
          break
          
        case 'hide':
          response = await fetch(`/api/chat/preferences/${isHidden ? 'unhide' : 'hide'}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: getHeaders(),
            body: JSON.stringify(chatData)
          })
          if (response.ok) {
            onChatPreferenceChange?.()
            // Navigate away if hiding
            if (!isHidden) {
              window.location.href = '/chat'
            }
          }
          break
          
        case 'removeHistory':
          setConfirmationDialog({
            isOpen: true,
            type: 'removeHistory'
          })
          break
          
        case 'mute':
          response = await fetch(`/api/chat/preferences/${isMuted ? 'unmute' : 'mute'}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: getHeaders(),
            body: JSON.stringify(chatData)
          })
          if (response.ok) {
            onChatPreferenceChange?.()
          }
          break
          
        case 'leaveTeam':
          setConfirmationDialog({
            isOpen: true,
            type: 'leaveTeam'
          })
          break
      }
      
      if (response && !response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
    }
  }
  
  const handlePopout = () => {
    if (!chat || !chatType) return
    
    const params = new URLSearchParams()
    params.set('type', chatType)
    params.set('id', chat.id)
    
    // Open chromeless window
    const width = 1200
    const height = 800
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    
    window.open(
      `/chat/popout?${params.toString()}`,
      'chat-popout',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    )
  }

  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 min-h-[5.31rem]">
      <div className="flex items-center justify-between">
        <div className="flex items-center h-full">
          {/* Back button for mobile */}
          {onBackToSidebar && (
            <button
              onClick={onBackToSidebar}
              className="lg:hidden p-2 mr-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
              title="Back to conversations"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}
          
          {chatType === 'team' ? (
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-dark-700 flex items-center justify-center mr-6">
              <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-dark-400" />
            </div>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center mr-6">
              <UserIcon size="large" contact={chat} />
            </div>
          )}
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-50">{chat.name}</h2>
            {chatType === 'team' && chat.description && (
              <p className="text-sm text-gray-500 dark:text-dark-400">{chat.description}</p>
            )}
            {chatType === 'dm' && (
              <p className="text-sm text-gray-500 dark:text-dark-400">
                {chat.activeStatus ?? 'Offline'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isPopout && (
            <button
              onClick={handlePopout}
              className="p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
              title="Pop out chat in new window"
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5" />
            </button>
          )}
          
          {/* Options Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            
            {showDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                {/* Dropdown menu */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 z-20">
                  <button
                    onClick={() => handleOptionClick('markUnread')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-t-lg flex items-center"
                  >
                    <EyeSlashIcon className="w-4 h-4 mr-2" />
                    Mark as unread
                  </button>
                  <button
                    onClick={() => handleOptionClick('hide')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    {isHidden ? 'Unhide' : 'Hide'}
                  </button>
                  <button
                    onClick={() => handleOptionClick('removeHistory')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Remove Chat History
                  </button>
                  <button
                    onClick={() => handleOptionClick('mute')}
                    className={`w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 ${chatType === 'team' ? '' : 'rounded-b-lg'} flex items-center`}
                  >
                    <SpeakerXMarkIcon className="w-4 h-4 mr-2" />
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  {chatType === 'team' && (
                    <button
                      onClick={() => handleOptionClick('leaveTeam')}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-b-lg flex items-center"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Leave Team
                    </button>
                  )}  
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => {
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
          setTimeout(() => {
            setConfirmationDialog({ isOpen: false, type: null })
          }, 300)
        }}
        title={confirmationDialog.type === 'leaveTeam' ? 'Leave Team' : 'Remove Chat History'}
        description={
          confirmationDialog.type === 'leaveTeam'
            ? `Are you sure you want to leave ${chat?.name}?`
            : `Are you sure you want to remove all chat history with ${chat?.name}? Messages will not be deleted but won't appear in your history.`
        }
        isYes={async () => {
          try {
            const chatData = {
              chat_id: chat.id,
              chat_type: chatType === 'team' ? 'team' : 'user'
            }
            
            if (confirmationDialog.type === 'leaveTeam') {
              const response = await fetch(`/api/chat/teams/${chat.id}/leave`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: getHeaders()
              })
              if (response.ok) {
                window.location.href = '/chat'
              }
            } else if (confirmationDialog.type === 'removeHistory') {
              const response = await fetch('/api/chat/preferences/remove-history', {
                method: 'POST',
                credentials: 'same-origin',
                headers: getHeaders(),
                body: JSON.stringify(chatData)
              })
              if (response.ok) {
                window.location.reload()
              }
            }
          } catch (error) {
            console.error('Error:', error)
          }
        }}
        type="warning"
        yesText={confirmationDialog.type === 'leaveTeam' ? 'Leave' : 'Remove'}
        cancelText="Cancel"
      />
    </div>
  )
}
