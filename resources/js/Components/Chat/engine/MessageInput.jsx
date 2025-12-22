import React, { useRef, useState, useEffect, useCallback } from 'react'
import { PaperAirplaneIcon, FaceSmileIcon, PaperClipIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import EmojiPicker from './EmojiPicker'
import AttachmentPreview from './AttachmentPreview'
import MentionPicker from './MentionPicker'
import { URL_REGEX, fetchLinkMetadata, LinkPreviewMini } from './LinkPreview'

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
  clearAttachments = false, // New prop to trigger clearing attachments
  allowAttachments = true, // Permission-based prop to control attachment functionality
  teamMembers = [], // Team members for mentions (only for team chats)
  chatType = null, // 'team' or 'dm' - mentions only work in teams
  currentUserId = null, // Current user ID to exclude from mentions
  onMentionsChange = null, // Callback to track mentions for sending
  onLinksChange = null, // Callback to track links for sending
  initialLinks = [] // Initial links when editing a message
}) {
  const typingTimeoutRef = useRef(null)
  const lastTypingTimeRef = useRef(0)
  const emojiButtonRef = useRef(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const textareaRef = useRef(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverlayStyle, setDragOverlayStyle] = useState({})
  
  // Mention state
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionSearchTerm, setMentionSearchTerm] = useState('')
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)
  const [trackedMentions, setTrackedMentions] = useState([]) // Track mentioned user IDs
  const [mentionVirtualRef, setMentionVirtualRef] = useState(null) // Virtual ref for @ position
  const backdropRef = useRef(null) // Ref for the formatted overlay
  
  // URL tracking state
  const [trackedUrls, setTrackedUrls] = useState([]) // { url, metadata, isLoading }
  const urlFetchTimeoutRef = useRef(null)
  const prevInitialLinksRef = useRef(initialLinks)
  
  // Use provided ref or internal ref
  const effectiveInputRef = inputRef || textareaRef

  // Populate trackedUrls from initialLinks when editing a message
  useEffect(() => {
    const prevLinks = prevInitialLinksRef.current
    prevInitialLinksRef.current = initialLinks
    
    if (initialLinks && initialLinks.length > 0) {
      // Add links with loading state and fetch metadata
      const loadingUrls = initialLinks.map(url => ({ url, metadata: null, isLoading: true }))
      setTrackedUrls(loadingUrls)
      
      // Fetch metadata for all initial links
      Promise.all(
        initialLinks.map(async (url) => {
          const metadata = await fetchLinkMetadata(url)
          return { url, metadata, isLoading: false }
        })
      ).then(urlsWithMetadata => {
        setTrackedUrls(urlsWithMetadata)
      })
    } else if (prevLinks && prevLinks.length > 0) {
      // Only clear if we're transitioning from having initial links to not having them
      // (i.e., cancelling edit mode)
      setTrackedUrls([])
    }
    // Don't clear if initialLinks was already empty - user might have added URLs manually
  }, [initialLinks])

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
    // Also clear mentions and URLs when message is sent
    if (clearAttachments) {
      setTrackedMentions([])
      setTrackedUrls([])
      setShowMentionPicker(false)
      setMentionStartIndex(-1)
      setMentionSearchTerm('')
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
    // If mention picker is open, let it handle navigation keys
    if (showMentionPicker && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      // These are handled by MentionPicker
      return
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  // Get caret coordinates in textarea
  const getCaretCoordinates = useCallback((textarea, position) => {
    // Create a mirror div to measure text
    const mirror = document.createElement('div')
    const computed = window.getComputedStyle(textarea)
    
    // Copy styles that affect text layout
    const stylesToCopy = [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
      'textTransform', 'wordSpacing', 'lineHeight', 'paddingTop', 'paddingRight',
      'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth',
      'borderBottomWidth', 'borderLeftWidth', 'boxSizing'
    ]
    
    stylesToCopy.forEach(style => {
      mirror.style[style] = computed[style]
    })
    
    mirror.style.position = 'absolute'
    mirror.style.top = '0'
    mirror.style.left = '0'
    mirror.style.visibility = 'hidden'
    mirror.style.whiteSpace = 'pre-wrap'
    mirror.style.wordWrap = 'break-word'
    mirror.style.width = `${textarea.offsetWidth}px`
    mirror.style.overflow = 'hidden'
    
    // Add text up to position
    const textBeforeCaret = textarea.value.substring(0, position)
    mirror.textContent = textBeforeCaret
    
    // Add a span to mark the caret position
    const caretSpan = document.createElement('span')
    caretSpan.textContent = '|'
    mirror.appendChild(caretSpan)
    
    document.body.appendChild(mirror)
    
    const caretRect = caretSpan.getBoundingClientRect()
    const textareaRect = textarea.getBoundingClientRect()
    
    document.body.removeChild(mirror)
    
    return {
      left: textareaRect.left + caretRect.left - mirror.getBoundingClientRect().left,
      top: textareaRect.top + caretRect.top - mirror.getBoundingClientRect().top
    }
  }, [])

  // Create virtual reference element for floating UI
  const createVirtualReference = useCallback((x, y) => {
    return {
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: x,
          y: y,
          top: y,
          left: x,
          right: x,
          bottom: y,
        }
      }
    }
  }, [])

  // Detect @ mentions in the input
  const detectMentionTrigger = useCallback((text, cursorPosition) => {
    // Only allow mentions in team chats
    if (chatType !== 'team') return null
    
    // Look backwards from cursor to find @
    let atIndex = -1
    for (let i = cursorPosition - 1; i >= 0; i--) {
      const char = text[i]
      // Stop if we hit a newline before finding @
      if (char === '\n') break
      if (char === '@') {
        atIndex = i
        break
      }
    }
    
    if (atIndex === -1) return null
    
    // Check that @ is at start of word (beginning of text or after space/newline)
    if (atIndex > 0 && text[atIndex - 1] !== ' ' && text[atIndex - 1] !== '\n') {
      return null
    }
    
    // Extract the search term (everything after @ up to cursor)
    const searchTerm = text.slice(atIndex + 1, cursorPosition)
    
    // If the search term starts with a space, the user typed "@ " - close the picker
    if (searchTerm.startsWith(' ')) {
      return null
    }
    
    return { atIndex, searchTerm }
  }, [chatType])

  const handleChange = (e) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart
    
    onChange(newValue)
    
    // Auto-detect manually typed mentions that match team members
    // Look for @name patterns followed by space/newline that match a team member
    if (teamMembers.length > 0 || chatType === 'team') {
      const valueLower = newValue.toLowerCase()
      const newTrackedMentions = [...trackedMentions]
      let mentionsChanged = false
      
      // Check for @everyone
      const everyonePattern = '@everyone'
      let everyoneIndex = valueLower.indexOf(everyonePattern)
      while (everyoneIndex !== -1) {
        const endIndex = everyoneIndex + everyonePattern.length
        // Check if followed by space, newline, or end of string
        if (endIndex >= newValue.length || newValue[endIndex] === ' ' || newValue[endIndex] === '\n') {
          // Check if not already tracked
          if (!newTrackedMentions.some(m => m.id === 'everyone')) {
            newTrackedMentions.push({ id: 'everyone', name: 'everyone', isEveryone: true })
            mentionsChanged = true
          }
        }
        everyoneIndex = valueLower.indexOf(everyonePattern, everyoneIndex + 1)
      }
      
      // Check for team member mentions
      teamMembers.forEach(member => {
        if (member.id === currentUserId) return // Skip current user
        
        const pattern = `@${member.name.toLowerCase()}`
        let index = valueLower.indexOf(pattern)
        while (index !== -1) {
          const endIndex = index + pattern.length
          // Check if followed by space, newline, or end of string
          if (endIndex >= newValue.length || newValue[endIndex] === ' ' || newValue[endIndex] === '\n') {
            // Check if not already tracked
            if (!newTrackedMentions.some(m => m.id === member.id)) {
              newTrackedMentions.push({ id: member.id, name: member.name, isEveryone: false })
              mentionsChanged = true
            }
          }
          index = valueLower.indexOf(pattern, index + 1)
        }
      })
      
      // Now validate - remove any tracked mentions that are no longer valid
      const stillValidMentions = newTrackedMentions.filter(mention => {
        const pattern = `@${mention.name}`
        const patternLower = pattern.toLowerCase()
        
        // Find all occurrences of this mention pattern (case-insensitive)
        let index = valueLower.indexOf(patternLower)
        while (index !== -1) {
          const endIndex = index + pattern.length
          // Check if the character after the mention is a valid terminator (space, newline, or end of string)
          if (endIndex >= newValue.length || 
              newValue[endIndex] === ' ' || 
              newValue[endIndex] === '\n') {
            return true // This mention is still valid
          }
          // Look for next occurrence
          index = valueLower.indexOf(patternLower, index + 1)
        }
        return false // No valid occurrence found
      })
      
      if (mentionsChanged || stillValidMentions.length !== trackedMentions.length) {
        setTrackedMentions(stillValidMentions)
        onMentionsChange?.(stillValidMentions)
      }
    }
    
    // Check for mention trigger
    const mentionTrigger = detectMentionTrigger(newValue, cursorPosition)
    
    if (mentionTrigger && teamMembers.length > 0) {
      // Filter members to check if there are any results
      const searchLower = mentionTrigger.searchTerm.toLowerCase()
      const hasResults = teamMembers.some(member => 
        member.name?.toLowerCase().includes(searchLower)
      ) || 'everyone'.includes(searchLower)
      
      if (hasResults) {
        setShowMentionPicker(true)
        setMentionStartIndex(mentionTrigger.atIndex)
        setMentionSearchTerm(mentionTrigger.searchTerm)
        
        // Calculate position of @ symbol for floating UI
        const textarea = effectiveInputRef.current
        if (textarea) {
          const coords = getCaretCoordinates(textarea, mentionTrigger.atIndex)
          setMentionVirtualRef(createVirtualReference(coords.left, coords.top))
        }
      } else {
        // No results - close the picker
        setShowMentionPicker(false)
        setMentionStartIndex(-1)
        setMentionSearchTerm('')
        setMentionVirtualRef(null)
      }
    } else {
      setShowMentionPicker(false)
      setMentionStartIndex(-1)
      setMentionSearchTerm('')
      setMentionVirtualRef(null)
    }
    
    // Throttle typing indicator - only send every 3 seconds
    const now = Date.now()
    if (now - lastTypingTimeRef.current > 3000) {
      onTyping?.()
      lastTypingTimeRef.current = now
    }
    
    // Detect URLs in the text - debounced to wait for user to stop typing
    clearTimeout(urlFetchTimeoutRef.current)
    urlFetchTimeoutRef.current = setTimeout(() => {
      const urlMatches = newValue.match(URL_REGEX) || []
      if (urlMatches.length > 0) {
        // Get current value from the input (may have changed during debounce)
        const currentValue = effectiveInputRef.current?.value || newValue
        const currentUrlMatches = currentValue.match(URL_REGEX) || []
        
        if (currentUrlMatches.length > 0) {
          // Strip URLs from the text
          let strippedValue = currentValue
          currentUrlMatches.forEach(url => {
            // Remove URL and any trailing space
            strippedValue = strippedValue.replace(url, '').replace(/  +/g, ' ')
          })
          strippedValue = strippedValue.trim()
          
          // Only update if we actually stripped something
          if (strippedValue !== currentValue) {
            onChange(strippedValue)
          }
          
          // Add URLs to tracked list
          addUrlsToTracked(currentUrlMatches)
        }
      }
    }, 800) // Wait 800ms after user stops typing
  }
  
  // Add URLs to tracked list and fetch metadata
  const addUrlsToTracked = useCallback(async (urls) => {
    const uniqueUrls = [...new Set(urls)]
    
    // Find new URLs that need fetching
    const existingUrlSet = new Set(trackedUrls.map(t => t.url))
    const newUrls = uniqueUrls.filter(url => !existingUrlSet.has(url))
    
    if (newUrls.length === 0) return
    
    // Add URLs immediately with loading state
    const loadingUrls = newUrls.map(url => ({ url, metadata: null, isLoading: true }))
    const updatedUrlsWithLoading = [...trackedUrls, ...loadingUrls]
    setTrackedUrls(updatedUrlsWithLoading)
    onLinksChange?.(updatedUrlsWithLoading.map(u => u.url))
    
    // Fetch metadata for new URLs
    const newUrlData = await Promise.all(
      newUrls.map(async (url) => {
        const metadata = await fetchLinkMetadata(url)
        return { url, metadata, isLoading: false }
      })
    )
    
    // Update tracked URLs with fetched metadata
    setTrackedUrls(prev => {
      const updated = prev.map(tracked => {
        const fetched = newUrlData.find(n => n.url === tracked.url)
        if (fetched) {
          return fetched
        }
        return tracked
      })
      return updated
    })
  }, [trackedUrls, onLinksChange])

  // Handle mention selection from picker
  const handleMentionSelect = useCallback((member) => {
    if (mentionStartIndex === -1) return
    
    // Build the mention text
    const mentionText = `@${member.name}`
    
    // Replace the @searchTerm with the mention
    const beforeMention = value.slice(0, mentionStartIndex)
    const afterCursor = value.slice(mentionStartIndex + 1 + mentionSearchTerm.length)
    const newValue = beforeMention + mentionText + ' ' + afterCursor
    
    onChange(newValue)
    
    // Track the mention
    const newMention = {
      id: member.id,
      name: member.name,
      isEveryone: member.isEveryone || false
    }
    
    // Add to tracked mentions if not already present
    setTrackedMentions(prev => {
      const alreadyMentioned = prev.some(m => m.id === member.id)
      if (alreadyMentioned) return prev
      const updated = [...prev, newMention]
      onMentionsChange?.(updated)
      return updated
    })
    
    // Close the picker
    setShowMentionPicker(false)
    setMentionStartIndex(-1)
    setMentionSearchTerm('')
    
    // Focus back on input and set cursor position
    setTimeout(() => {
      const textarea = effectiveInputRef.current
      if (textarea) {
        textarea.focus()
        const newCursorPos = mentionStartIndex + mentionText.length + 1
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }, [value, mentionStartIndex, mentionSearchTerm, onChange, onMentionsChange, effectiveInputRef])

  // Close mention picker
  const handleMentionClose = useCallback(() => {
    setShowMentionPicker(false)
    setMentionStartIndex(-1)
    setMentionSearchTerm('')
    setMentionVirtualRef(null)
  }, [])

  // Render formatted text with highlighted mentions for the overlay
  const renderFormattedText = useCallback(() => {
    if (!value) return null
    
    // Collect all highlight positions (mentions only - URLs are stripped from text)
    const highlights = []
    const valueLower = value.toLowerCase()
    
    // Find mention positions
    trackedMentions.forEach(m => {
      const pattern = `@${m.name}`
      const patternLower = pattern.toLowerCase()
      let startIndex = 0
      let index
      while ((index = valueLower.indexOf(patternLower, startIndex)) !== -1) {
        const endIndex = index + pattern.length
        // Only highlight if followed by space, newline, or end of string
        if (endIndex >= value.length || value[endIndex] === ' ' || value[endIndex] === '\n') {
          highlights.push({
            type: 'mention',
            start: index,
            end: endIndex,
            text: value.slice(index, endIndex),
            data: m
          })
        }
        startIndex = index + 1
      }
    })
    
    if (highlights.length === 0) {
      // No highlights, just return the text with a trailing space to match textarea
      return <>{value}<span style={{ opacity: 0 }}>.</span></>
    }
    
    // Sort by position and filter out overlapping highlights
    highlights.sort((a, b) => a.start - b.start)
    const nonOverlapping = []
    let lastEnd = 0
    highlights.forEach(h => {
      if (h.start >= lastEnd) {
        nonOverlapping.push(h)
        lastEnd = h.end
      }
    })
    
    // Build the formatted output
    const parts = []
    let lastIndex = 0
    
    nonOverlapping.forEach((highlight, idx) => {
      // Add text before this highlight
      if (highlight.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{value.slice(lastIndex, highlight.start)}</span>
        )
      }
      
      if (highlight.type === 'mention') {
        // Render mention pill
        parts.push(
          <span 
            key={`mention-${idx}`}
            className="text-theme-600 dark:text-theme-400 bg-theme-100 dark:bg-theme-900/30 rounded px-0.5 -mx-0.5"
          >
            {highlight.text}
          </span>
        )
      }
      
      lastIndex = highlight.end
    })
    
    // Add remaining text after last highlight
    if (lastIndex < value.length) {
      parts.push(<span key="text-end">{value.slice(lastIndex)}</span>)
    }
    
    // Add invisible character to ensure proper sizing
    parts.push(<span key="spacer" style={{ opacity: 0 }}>.</span>)
    
    return parts
  }, [value, trackedMentions])

  // Sync scroll between textarea and backdrop
  const handleScroll = useCallback((e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.target.scrollTop
      backdropRef.current.scrollLeft = e.target.scrollLeft
    }
  }, [])

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
    
    if (!allowAttachments) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  // Handle paste
  const handlePaste = (e) => {
    if (!allowAttachments) return
    
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
      {allowAttachments && isDragging && !attachments.length && (
        <div 
          className="fixed top-0 left-0 h-screen z-50 bg-theme-800/10 dark:bg-theme-800/20 border-2 border-dashed border-theme-500 dark:border-theme-400 rounded-lg flex items-center justify-center"
          style={dragOverlayStyle}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <PhotoIcon className="w-12 h-12 mx-auto text-theme-600 dark:text-theme-400 mb-2" />
            <p className="text-theme-600 dark:text-theme-400 font-medium">Drop files here</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        onDragEnter={allowAttachments ? handleDragEnter : undefined}
        onDragLeave={allowAttachments ? handleDragLeave : undefined}
        onDragOver={allowAttachments ? handleDragOver : undefined}
        onDrop={allowAttachments ? handleDrop : undefined}
        className="relative"
      >

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-3 mb-3 relative">
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-theme-500/10 dark:bg-theme-500/20 border-2 border-dashed border-theme-500 dark:border-theme-400 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PhotoIcon className="w-12 h-12 mx-auto text-theme-600 dark:text-theme-400 mb-2" />
                    <p className="text-theme-600 dark:text-theme-400 font-medium">Drop files here</p>
                  </div>
                </div>
            )}
            <div className='flex items-center space-x-2 mb-3'>
              <PaperClipIcon className="w-4 h-4 text-gray-500 dark:text-dark-400" />
              <h4 className="text-sm text-gray-600 dark:text-dark-300 font-medium">Attachments ({attachments.length})</h4>
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
              {/* Backdrop overlay for formatted mentions */}
              {trackedMentions.length > 0 && (
                <div
                  ref={backdropRef}
                  className="absolute inset-0 px-4 py-1.5 pointer-events-none overflow-hidden whitespace-pre-wrap break-words text-gray-900 dark:text-dark-50 rounded-lg"
                  style={{ 
                    minHeight: '24px', 
                    maxHeight: '120px',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    border: '1px solid transparent'
                  }}
                  aria-hidden="true"
                >
                  {renderFormattedText()}
                </div>
              )}
              <textarea
                ref={effectiveInputRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onScroll={handleScroll}
                placeholder={effectivePlaceholder}
                className={`w-full px-4 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent ${
                  trackedMentions.length > 0 
                    ? 'bg-transparent text-transparent caret-gray-900 dark:caret-dark-50' 
                    : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50'
                } placeholder-gray-400 dark:placeholder-dark-500`}
                rows={1}
                style={{ minHeight: '24px', maxHeight: '120px' }}
              />
              
              {/* Mention Picker */}
              {showMentionPicker && chatType === 'team' && (
                <MentionPicker
                  isOpen={showMentionPicker}
                  onSelect={handleMentionSelect}
                  onClose={handleMentionClose}
                  searchTerm={mentionSearchTerm}
                  members={teamMembers}
                  referenceElement={mentionVirtualRef || effectiveInputRef.current}
                  currentUserId={currentUserId}
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {allowAttachments && (
              <>
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
                  className="p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 relative"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={(!value.trim() && attachments.length === 0 && trackedUrls.length === 0) || disabled}
              className="p-2 text-white bg-theme-500 hover:bg-theme-600 disabled:bg-gray-300 dark:disabled:bg-dark-700 disabled:cursor-not-allowed rounded-lg transition-colors"
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

        {/* Link previews - shown below input */}
        {trackedUrls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {trackedUrls.map(({ url, metadata, isLoading }, idx) => (
              <div key={`link-preview-${idx}`} className="flex-shrink-0" style={{ width: 'calc(25% - 6px)', minWidth: '160px' }}>
                <LinkPreviewMini 
                  url={url} 
                  metadata={metadata}
                  isLoading={isLoading}
                  onRemove={(removedUrl) => {
                    const newUrls = trackedUrls.filter(t => t.url !== removedUrl)
                    setTrackedUrls(newUrls)
                    onLinksChange?.(newUrls.map(u => u.url))
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
