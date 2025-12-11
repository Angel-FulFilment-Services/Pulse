import React, { useRef, useState } from 'react'
import { PaperAirplaneIcon, FaceSmileIcon, PaperClipIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import EmojiPicker from './EmojiPicker'
import AttachmentPreview from './AttachmentPreview'

export default function MessageInput({ 
  value, 
  onChange, 
  onSubmit, 
  onTyping,
  placeholder,
  disabled = false,
  replyingTo = null,
  inputRef = null,
  onAttachmentsChange
}) {
  const typingTimeoutRef = useRef(null)
  const lastTypingTimeRef = useRef(0)
  const emojiButtonRef = useRef(null)
  const fileInputRef = useRef(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  const handleChange = (e) => {
    onChange(e.target.value)
    
    // Throttle typing indicator - only send every 3 seconds
    const now = Date.now()
    if (now - lastTypingTimeRef.current > 3000) {
      onTyping?.()
      lastTypingTimeRef.current = now
    }
  }

  const handleEmojiSelect = (emoji) => {
    onChange(value + emoji)
    setShowEmojiPicker(false)
  }

  // Handle file selection
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files)
    
    // Validate file count
    if (attachments.length + fileArray.length > 10) {
      toast.error('Maximum 10 files per message', {
        position: 'top-center',
        autoClose: 3000,
      })
      return
    }
    
    // Validate file sizes
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    const maxTotalSize = 50 * 1024 * 1024 // 50MB
    let totalSize = attachments.reduce((sum, att) => sum + att.file.size, 0)
    
    for (const file of fileArray) {
      if (file.size > maxFileSize) {
        toast.error(`${file.name} exceeds 10MB limit`, {
          position: 'top-center',
          autoClose: 3000,
        })
        return
      }
      totalSize += file.size
    }
    
    if (totalSize > maxTotalSize) {
      toast.error('Total upload size exceeds 50MB', {
        position: 'top-center',
        autoClose: 3000,
      })
      return
    }
    
    // Create attachment objects with preview URLs
    const newAttachments = fileArray.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }))
    
    const updated = [...attachments, ...newAttachments]
    setAttachments(updated)
    onAttachmentsChange?.(updated)
  }

  // Remove attachment
  const removeAttachment = (id) => {
    const attachment = attachments.find(att => att.id === id)
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview)
    }
    const updated = attachments.filter(att => att.id !== id)
    setAttachments(updated)
    onAttachmentsChange?.(updated)
  }

  // Handle drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  // Handle paste
  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    const files = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }
    
    if (files.length > 0) {
      e.preventDefault()
      handleFileSelect(files)
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Update placeholder based on reply context
  const effectivePlaceholder = replyingTo 
    ? `Replying to ${replyingTo.user?.name || 'Unknown User'}...`
    : placeholder

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative"
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-theme-500/10 border-2 border-dashed border-theme-500 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <PhotoIcon className="w-12 h-12 mx-auto text-theme-600 mb-2" />
            <p className="text-theme-600 font-medium">Drop files here</p>
          </div>
        </div>
      )}
      
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              isDeletable={true}
              onDelete={() => removeAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <div className="relative w-full flex">
            <textarea
              ref={inputRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={effectivePlaceholder}
              className="w-full px-4 py-1.5 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 relative"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={(!value.trim() && attachments.length === 0) || disabled}
            className="p-2 text-white bg-theme-600 hover:bg-theme-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowEmojiPicker(false)}
            />
            {/* Picker */}
            <EmojiPicker 
              onSelectEmoji={handleEmojiSelect}
              buttonRef={emojiButtonRef}
            />
          </>
        )}
      </form>
    </div>
  )
}
