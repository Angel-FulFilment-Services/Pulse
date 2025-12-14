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
  onAttachmentsChange,
  clearAttachments = false // New prop to trigger clearing attachments
}) {
  const typingTimeoutRef = useRef(null)
  const lastTypingTimeRef = useRef(0)
  const emojiButtonRef = useRef(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverlayStyle, setDragOverlayStyle] = useState({})

  // Clear attachments when parent requests it
  React.useEffect(() => {
    if (clearAttachments && attachments.length > 0) {
      // Clean up preview URLs
      attachments.forEach(att => {
        if (att.preview) {
          URL.revokeObjectURL(att.preview)
        }
      })
      setAttachments([])
      onAttachmentsChange?.([])
    }
  }, [clearAttachments])

  // Update drag overlay position when dragging starts
  React.useEffect(() => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDragOverlayStyle({
        left: `${rect.left - 24}px`,
        width: `${rect.width + 48}px`,
      })
    }
  }, [isDragging])

  // Listen for drag events on the window to detect files being dragged from outside
  React.useEffect(() => {
    const handleWindowDragEnter = (e) => {
      // Check if dragging files
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDragging(true)
      }
    }

    const handleWindowDragOver = (e) => {
      // Keep drag state active and prevent default
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault()
      }
    }

    const handleWindowDragLeave = (e) => {
      // Only set to false if leaving the window entirely
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false)
      }
    }

    const handleWindowDrop = (e) => {
      setIsDragging(false)
    }

    window.addEventListener('dragenter', handleWindowDragEnter)
    window.addEventListener('dragover', handleWindowDragOver)
    window.addEventListener('dragleave', handleWindowDragLeave)
    window.addEventListener('drop', handleWindowDrop)

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter)
      window.removeEventListener('dragover', handleWindowDragOver)
      window.removeEventListener('dragleave', handleWindowDragLeave)
      window.removeEventListener('drop', handleWindowDrop)
    }
  }, [])

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

  const handleEmojiSelect = (reaction) => {
    onChange(value + reaction.emoji)
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
        toastId: `max-files-error`
      })
      return
    }
    
    // Check for duplicate files (same name and size)
    const duplicates = []
    const newFiles = []
    
    for (const file of fileArray) {
      const isDuplicate = attachments.some(att => 
        att.name === file.name && att.size === file.size
      )
      
      if (isDuplicate) {
        duplicates.push(file.name)
      } else {
        newFiles.push(file)
      }
    }
    
    // Show error for duplicates
    if (duplicates.length > 0) {
      const fileList = duplicates.length > 3 
        ? duplicates.slice(0, 3).join(', ') + ` and ${duplicates.length - 3} more`
        : duplicates.join(', ')
      
      toast.error(`This file has already been added`, {
        position: 'top-center',
        autoClose: 3000,
        toastId: `duplicate-files-${fileList}` // Prevent multiple toasts
      })
      
      // If all files are duplicates, return early
      if (newFiles.length === 0) {
        return
      }
    }
    
    // Validate file sizes
    const maxFileSize = 20 * 1024 * 1024 // 20MB
    const maxVideoSize = 500 * 1024 * 1024 // 500MB for videos
    const maxTotalSize = 1024 * 1024 * 1024 // 1GB total
    let totalSize = attachments.reduce((sum, att) => sum + att.file.size, 0)
    
    for (const file of newFiles) {
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? maxVideoSize : maxFileSize
      const sizeLimit = isVideo ? '500MB' : '20MB'
      
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds ${sizeLimit} limit`, {
          position: 'top-center',
          autoClose: 3000,
          toastId: `file-size-error-${file.name}`
        })
        return
      }
      totalSize += file.size
    }
    
    if (totalSize > maxTotalSize) {
      toast.error('Total upload size exceeds 1GB', {
        position: 'top-center',
        autoClose: 3000,
        toastId: `total-size-error`
      })
      return
    }
    
    // Create attachment objects with preview URLs
    const newAttachments = newFiles.map(file => ({
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
    
    // Clear the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
    <>
      {/* Chat window drag container */}
      {isDragging && !attachments.length && (
        <div 
          className="fixed top-0 left-0 h-screen z-50 bg-theme-800/10 border-2 border-dashed border-theme-500 rounded-lg flex items-center justify-center"
          style={dragOverlayStyle}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <PhotoIcon className="w-12 h-12 mx-auto text-theme-600 mb-2" />
            <p className="text-theme-600 font-medium">Drop files here</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative"
      >

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 relative">
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-theme-500/10 border-2 border-dashed border-theme-500 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PhotoIcon className="w-12 h-12 mx-auto text-theme-600 mb-2" />
                    <p className="text-theme-600 font-medium">Drop files here</p>
                  </div>
                </div>
            )}
            <div className='flex items-center space-x-2 mb-3'>
              <PaperClipIcon className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm text-gray-600 font-medium">Attachments ({attachments.length})</h4>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              {attachments.map(attachment => (
                <AttachmentPreview
                  key={attachment.id}
                  attachment={attachment}
                  isDeletable={true}
                  onDelete={() => removeAttachment(attachment.id)}
                />
              ))}
            </div>
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
              className="p-2 text-white bg-theme-500 hover:bg-theme-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker 
              referenceElement={emojiButtonRef.current}
              onSelectEmoji={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
              userReactions={[]}
            />
          )}
        </form>
      </div>
    </>
  )
}
