import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import UserIcon from '../UserIcon'

export default function MentionPicker({ 
  isOpen, 
  onSelect, 
  onClose, 
  searchTerm = '', 
  members = [], 
  referenceElement,
  currentUserId 
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPositioned, setIsPositioned] = useState(false)
  const listRef = useRef(null)
  
  const { refs, floatingStyles } = useFloating({
    placement: 'top-start',
    strategy: 'fixed',
    middleware: [
      offset(8), 
      flip({ padding: 8 }), 
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate,
  })

  // Set reference element
  useEffect(() => {
    if (referenceElement) {
      refs.setReference(referenceElement)
    }
  }, [referenceElement, refs])
  
  // Wait for positioning to settle before showing
  useEffect(() => {
    if (!isOpen) {
      setIsPositioned(false)
      return
    }
    
    // Small delay to let floating UI calculate position
    const timer = setTimeout(() => {
      setIsPositioned(true)
    }, 10)
    
    return () => clearTimeout(timer)
  }, [isOpen, referenceElement])

  // Filter members based on search term (excluding current user)
  const filteredMembers = members.filter(member => {
    if (member.id === currentUserId) return false
    if (!searchTerm) return true
    return member.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Sort members alphabetically
  const sortedMembers = [...filteredMembers].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  )

  // Check if @everyone should be shown
  const showEveryone = !searchTerm || 'everyone'.includes(searchTerm.toLowerCase())

  // Combined list: @everyone first, then sorted filtered members
  const allOptions = [
    ...(showEveryone ? [{ id: 'everyone', name: 'everyone', isEveryone: true }] : []),
    ...sortedMembers
  ]

  // Reset selected index when options change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchTerm, members.length])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && allOptions.length > 0) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < allOptions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : allOptions.length - 1
          )
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          if (allOptions[selectedIndex]) {
            onSelect(allOptions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, allOptions, onSelect, onClose])

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      const floatingEl = refs.floating.current
      if (floatingEl && !floatingEl.contains(e.target)) {
        onClose()
      }
    }

    // Delay to avoid catching the @ keypress
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, refs, onClose])

  if (!isOpen || allOptions.length === 0) {
    return null
  }

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        opacity: isPositioned ? 1 : 0,
        visibility: isPositioned ? 'visible' : 'hidden',
        transition: 'opacity 0.1s ease-out'
      }}
      className="w-72 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
        <p className="text-xs font-medium text-gray-500 dark:text-dark-300">
          Mention someone
        </p>
      </div>
      
      {/* Member List */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto min-h-0"
        style={{ maxHeight: '208px' }}
      >
        {allOptions.map((option, index) => (
          <button
            key={option.id}
            data-index={index}
            onClick={() => onSelect(option)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex 
                ? 'bg-theme-100 dark:bg-theme-900/30' 
                : 'hover:bg-gray-50 dark:hover:bg-dark-700'
            }`}
          >
            {option.isEveryone ? (
              <>
                <div className="w-8 h-8 rounded-full bg-theme-500 dark:bg-theme-600 flex items-center justify-center flex-shrink-0">
                  <UserGroupIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                    @everyone
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    Notify all team members
                  </p>
                </div>
              </>
            ) : (
              <>
                <UserIcon contact={option} size="small" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-50 truncate">
                    {option.name}
                  </p>
                  {option.role && (
                    <p className={`text-xs ${
                      option.role === 'owner' 
                        ? 'text-theme-600 dark:text-theme-400' 
                        : option.role === 'admin'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-dark-400'
                    }`}>
                      {option.role === 'owner' ? 'Owner' : option.role === 'admin' ? 'Admin' : 'Member'}
                    </p>
                  )}
                </div>
              </>
            )}
          </button>
        ))}
      </div>
      
      {/* Footer hint */}
      <div className="flex-shrink-0 px-3 py-1.5 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
        <p className="text-xs text-gray-400 dark:text-dark-300">
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-dark-600 rounded text-xs">↑↓</kbd> to navigate,{' '}
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-dark-600 rounded text-xs">Enter</kbd> to select,{' '}
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-dark-600 rounded text-xs">Esc</kbd> to dismiss
        </p>
      </div>
    </div>
  )
}
