import React, { useState, useEffect, useMemo } from 'react'
import { ring } from 'ldrs'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon as UserIconOutline, 
  UserGroupIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  SpeakerXMarkIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarIconSolid,
  SpeakerXMarkIcon as SpeakerXMarkIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid'
import UserIcon from './UserIcon.jsx'
import { useUserStates } from '../Context/ActiveStateContext';
import { differenceInMinutes } from 'date-fns'
import ConfirmationDialog from '../Dialogs/ConfirmationDialog.jsx'

// Register the ring spinner
ring.register()

export default function Sidebar({ onChatSelect, selectedChat, chatType, typingUsers = [], unreadChats = new Set(), refreshKey = 0, lastMessageUpdate = null, isLoading = false, onPreferencesChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [teams, setTeams] = useState([])
  const [contacts, setContacts] = useState([])
  const [rawFavorites, setRawFavorites] = useState([])
  const [favorites, setFavorites] = useState([])
  const [chatPreferences, setChatPreferences] = useState([]) // Store mute/unread states
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeSection, setActiveSection] = useState('teams')
  const [selectedContext, setSelectedContext] = useState(null) // Track which specific item was clicked
  const [expandedSections, setExpandedSections] = useState({
    teams: true,
    contacts: true,
    favorites: true
  })
  const [confirmationDialog, setConfirmationDialog] = useState({ isOpen: false, type: null, item: null })
  const { userStates } = useUserStates();

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

  // Get current user first  
  useEffect(() => {
    if (window.Laravel?.user) {
      setCurrentUser(window.Laravel.user)
    } else {
      // Assume user is authenticated since they're on the chat page
      // We'll validate this when we try to fetch chat data
      setCurrentUser({ authenticated: true })
    }
  }, [])

  // Fetch teams
  useEffect(() => {
    if (!currentUser) return
    
    setLoading(true)
    fetch('/api/chat/teams', { 
      credentials: 'same-origin',
      headers: getHeaders()
    })
      .then(res => {
        if (!res.ok) {
          // If we get 401, then the user isn't actually authenticated
          if (res.status === 401) {
            setCurrentUser(null)
          }
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Error fetching teams:', error)
        setTeams([])
      })
      .finally(() => setLoading(false))
  }, [currentUser])

  // Listen for being added to a team
  useEffect(() => {
    if (!currentUser?.id || !window.Echo) return
    
    const userChannel = window.Echo.private(`chat.user.${currentUser.id}`)
    
    const handleTeamAdded = (e) => {
      if (e.team) {
        // Add the new team to the list
        setTeams(prev => {
          // Check if team already exists
          if (prev.some(t => t.id === e.team.id)) {
            return prev
          }
          // Add new team and sort alphabetically
          return [...prev, e.team].sort((a, b) => a.name.localeCompare(b.name))
        })
      }
    }
    
    const handleTeamRemoved = (e) => {
      if (e.team_id) {
        // Remove the team from the list
        setTeams(prev => prev.filter(t => t.id !== e.team_id))
        
        // Also remove from favorites if it was favorited
        setRawFavorites(prev => prev.filter(f => !(f.type === 'team' && f.item?.id === e.team_id)))
        
        // If this team was selected, deselect it
        if (selectedChat?.id === e.team_id && chatType === 'team') {
          onChatSelect(null, 'compose')
        }
      }
    }
    
    userChannel.listen('.TeamMemberAdded', handleTeamAdded)
    userChannel.listen('.TeamMemberRemoved', handleTeamRemoved)
    
    return () => {
      userChannel.stopListening('.TeamMemberAdded')
      userChannel.stopListening('.TeamMemberRemoved')
    }
  }, [currentUser?.id, selectedChat?.id, chatType, onChatSelect])

  // Fetch contacts
  const [rawContacts, setRawContacts] = useState([])
  
  useEffect(() => {
    if (!currentUser) return
    
    fetch('/api/chat/users', { 
      credentials: 'same-origin',
      headers: getHeaders()
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            setCurrentUser(null)
          }
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => setRawContacts(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Error fetching contacts:', error)
        setRawContacts([])
      })
  }, [currentUser, refreshKey])

  // Enhance contacts with active status
  useEffect(() => {
    if (!rawContacts.length) {
      setContacts([])
      return
    }

    const enhancedContacts = rawContacts.map(contact => {
      const userState = userStates ? Object.values(userStates).find(u => u.user_id === contact.id) : null
      const lastActiveAt = userState?.pulse_last_active_at
      
      let activeStatus = 'Offline'
      if (lastActiveAt) {
        const minutesAgo = differenceInMinutes(new Date(), new Date(lastActiveAt))
        if (minutesAgo <= 2.5) {
          activeStatus = 'Active Now'
        } else if (minutesAgo <= 30) {
          activeStatus = 'Away'
        }
      }
      
      return {
        ...contact,
        activeStatus,
        lastActiveAt
      }
    })
    
    setContacts(enhancedContacts)
  }, [rawContacts, userStates])

  // Fetch favorites
  useEffect(() => {
    if (!currentUser) return
    
    fetch('/api/chat/favorites', { 
      credentials: 'same-origin',
      headers: getHeaders()
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            setCurrentUser(null)
          }
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => setRawFavorites(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Error fetching favorites:', error)
        setRawFavorites([])
      })
  }, [currentUser])

  // Enhance favorites with active status for contacts
  useEffect(() => {
    if (!rawFavorites.length) {
      setFavorites([])
      return
    }

    const enhancedFavorites = rawFavorites.map(fav => {
      // Only enhance user-type favorites with active status
      if (fav.type === 'user' && fav.item) {
        const userState = userStates ? Object.values(userStates).find(u => u.user_id === fav.item.id) : null
        const lastActiveAt = userState?.pulse_last_active_at
        
        let activeStatus = 'Offline'
        if (lastActiveAt) {
          const minutesAgo = differenceInMinutes(new Date(), new Date(lastActiveAt))
          if (minutesAgo <= 2.5) {
            activeStatus = 'Active Now'
          } else if (minutesAgo <= 30) {
            activeStatus = 'Away'
          }
        }
        
        return {
          ...fav,
          item: {
            ...fav.item,
            activeStatus,
            lastActiveAt
          }
        }
      }
      
      // Return team favorites unchanged
      return fav
    })
    
    setFavorites(enhancedFavorites)
  }, [rawFavorites, userStates])

  // Fetch chat preferences (mute/unread states)
  useEffect(() => {
    if (!currentUser) return
    
    fetch('/api/chat/preferences/chat', { 
      credentials: 'same-origin',
      headers: getHeaders()
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            setCurrentUser(null)
          }
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => setChatPreferences(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Error fetching chat preferences:', error)
        setChatPreferences([])
      })
  }, [currentUser])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  // Update last_message_at when a new message is sent or received
  useEffect(() => {
    if (!lastMessageUpdate) return

    const { chatType: msgChatType, chatId, timestamp, incrementUnread, resetUnread } = lastMessageUpdate

    if (msgChatType === 'team') {
      setTeams(prev => prev.map(team => {
        if (team.id !== chatId) return team
        
        const updates = {}
        if (timestamp) updates.last_message_at = timestamp
        if (resetUnread) updates.unread_count = 0
        else if (incrementUnread) updates.unread_count = (team.unread_count || 0) + 1
        // If neither resetUnread nor incrementUnread, don't touch unread_count
        
        return { ...team, ...updates }
      }))
    } else if (msgChatType === 'dm') {
      setContacts(prev => prev.map(contact => {
        if (contact.id !== chatId) return contact
        
        const updates = {}
        if (timestamp) updates.last_message_at = timestamp
        if (resetUnread) updates.unread_count = 0
        else if (incrementUnread) updates.unread_count = (contact.unread_count || 0) + 1
        // If neither resetUnread nor incrementUnread, don't touch unread_count
        
        return { ...contact, ...updates }
      }))
    }
  }, [lastMessageUpdate])

  // Helper to check if chat is hidden
  const isChatHidden = (item, type) => {
    return chatPreferences.some(pref => 
      pref.chat_id === item.id && 
      pref.chat_type === (type === 'team' ? 'team' : 'user') &&
      pref.is_hidden
    )
  }

  // Filter items based on search and sort by most recent message
  const filteredTeams = teams
    .filter(team => {
      // If searching, show hidden chats too
      if (searchTerm.trim()) {
        return team.name?.toLowerCase().includes(searchTerm.toLowerCase())
      }
      // Otherwise, hide hidden chats
      return team.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !isChatHidden(team, 'team')
    })
    .sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bTime - aTime // Most recent first
    })
    
  const filteredContacts = contacts
    .filter(contact => {
      // If searching, show hidden chats too
      if (searchTerm.trim()) {
        return contact.name?.toLowerCase().includes(searchTerm.toLowerCase())
      }
      // Otherwise, hide hidden chats
      return contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !isChatHidden(contact, 'user')
    })
    .sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bTime - aTime // Most recent first
    })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handlePopout = () => {
    if (!selectedChat || !chatType) return
    
    const params = new URLSearchParams()
    params.set('type', chatType)
    params.set('id', selectedChat.id)
    
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

  // Refresh chat preferences after actions
  const refreshChatPreferences = async () => {
    if (!currentUser) return
    
    try {
      const response = await fetch('/api/chat/preferences/chat', { 
        credentials: 'same-origin',
        headers: getHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setChatPreferences(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error refreshing chat preferences:', error)
    }
  }

  const toggleFavorite = async (item, type) => {
    if (!currentUser) return
    
    try {
      const response = await fetch('/api/chat/favorites', {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({
          favorite_id: item.id,
          type: type === 'team' ? 'team' : 'user'
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Show appropriate notification based on result
      if (result.status === 'added') {
      } else if (result.status === 'removed') {
      }
      
      // Refresh favorites
      const favData = await fetch('/api/chat/favorites', { 
        credentials: 'same-origin',
        headers: getHeaders()
      })
      
      if (favData.ok) {
        const newFavorites = await favData.json()
        setRawFavorites(Array.isArray(newFavorites) ? newFavorites : [])
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  // Chat options dropdown component
  const ChatOptionsDropdown = ({ item, type, isItemSelected }) => {
    const [isOpen, setIsOpen] = useState(false)
    
    // Check current states
    const isMuted = isChatMuted(item, type)
    const isHidden = isChatHidden(item, type)
    const isUnread = hasUnreadMessages(item, type)
    
    const handleOptionClick = async (action, e) => {
      e.stopPropagation()
      setIsOpen(false)
      
      const chatData = {
        chat_id: item.id,
        chat_type: type === 'team' ? 'team' : 'user'
      }
      
      try {
        let response
        
        // Handle different actions
        switch(action) {
          case 'toggleUnread':
            // Mark as unread or read
            const endpoint = isUnread ? 'mark-read' : 'mark-unread'
            response = await fetch(`/api/chat/preferences/${endpoint}`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: getHeaders(),
              body: JSON.stringify(chatData)
            })
            if (response.ok) {
              const result = await response.json()
              // Update unread count in local state using actual count from backend
              const newUnreadCount = isUnread ? 0 : (result.unread_count || 1)
              if (type === 'team') {
                setTeams(prev => prev.map(team => 
                  team.id === item.id ? { ...team, unread_count: newUnreadCount } : team
                ))
              } else {
                setContacts(prev => prev.map(contact => 
                  contact.id === item.id ? { ...contact, unread_count: newUnreadCount } : contact
                ))
              }
              // Refresh to update unread state
              refreshChatPreferences()
            }
            break
            
          case 'hide':
            // Hide or unhide chat - sets/unsets is_hidden in preferences
            response = await fetch(`/api/chat/preferences/${isHidden ? 'unhide' : 'hide'}`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: getHeaders(),
              body: JSON.stringify(chatData)
            })
            if (response.ok) {
              // Refresh chat preferences to update hidden state
              refreshChatPreferences()
            }
            break
            
          case 'removeHistory':
            // Remove chat history - stores cutoff datetime in preferences
            setConfirmationDialog({
              isOpen: true,
              type: 'removeHistory',
              item,
              chatData
            })
            break
            
          case 'mute':
            // Mute or unmute - sets/unsets is_muted in preferences
            response = await fetch(`/api/chat/preferences/${isMuted ? 'unmute' : 'mute'}`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: getHeaders(),
              body: JSON.stringify(chatData)
            })
            if (response.ok) {
              const result = await response.json()
              // Refresh chat preferences
              refreshChatPreferences()
            }
            break
            
          case 'leaveTeam':
            // Leave team
            setConfirmationDialog({
              isOpen: true,
              type: 'leaveTeam',
              item,
              chatData
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
    
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className={`opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110 p-1 ${isItemSelected ? 'hover:bg-theme-200/50 dark:hover:bg-theme-800/50' : 'hover:bg-gray-200 dark:hover:bg-dark-700'} rounded`}
        >
          <EllipsisVerticalIcon className="w-4 h-4 text-gray-400 dark:text-dark-400" />
        </button>
        
        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
            />
            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 z-20">
              <button
                onClick={(e) => handleOptionClick('toggleUnread', e)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-t-lg flex items-center"
              >
                {isUnread ? (
                  <>
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Mark as read
                  </>
                ) : (
                  <>
                    <EyeSlashIcon className="w-4 h-4 mr-2" />
                    Mark as unread
                  </>
                )}
              </button>
              <button
                onClick={(e) => handleOptionClick('hide', e)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                {isHidden ? 'Unhide' : 'Hide'}
              </button>
              <button
                onClick={(e) => handleOptionClick('removeHistory', e)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Remove Chat History
              </button>
              <button
                onClick={(e) => handleOptionClick('mute', e)}
                className={`w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 ${type === 'team' ? '' : 'rounded-b-lg'} flex items-center`}
              >
                <SpeakerXMarkIcon className="w-4 h-4 mr-2" />
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              {type === 'team' && (
                <button
                  onClick={(e) => handleOptionClick('leaveTeam', e)}
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
    )
  }

  // Favorite button component with hover states
  const FavoriteButton = ({ item, type, isFavorited }) => {
    const [isHovered, setIsHovered] = useState(false)
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleFavorite(item, type)
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110 mb-0.5"
      >
        {isFavorited ? (
          // Currently favorited - show outline on hover to indicate "unfavorite"
          isHovered ? (
            <StarIcon className="w-4 h-4 text-yellow-400" />
          ) : (
            <StarIconSolid className="w-4 h-4 text-yellow-400" />
          )
        ) : (
          // Not favorited - show filled on hover to indicate "favorite"
          isHovered ? (
            <StarIconSolid className="w-4 h-4 text-yellow-400 dark:text-yellow-500" />
          ) : (
            <StarIcon className="w-4 h-4 text-gray-400 dark:text-dark-400" />
          )
        )}
      </button>
    )
  }

  const isFavorite = (item, type) => {
    return favorites.some(fav => 
      fav.favorite_id === item.id && 
      fav.type === (type === 'team' ? 'team' : 'user')
    )
  }

  // Check if chat is muted
  const isChatMuted = (item, type) => {
    return chatPreferences.some(pref => 
      pref.chat_id === item.id && 
      pref.chat_type === (type === 'team' ? 'team' : 'user') &&
      pref.is_muted
    )
  }

  // Check if chat has unread messages (based on actual unread count)
  const hasUnreadMessages = (item, type) => {
    // Check if item has unread_count property
    if (item.unread_count && item.unread_count > 0) {
      return true
    }
    // Fallback to checking unreadChats set
    const chatKey = type === 'team' ? `team-${item.id}` : `dm-${item.id}`
    return unreadChats.has(chatKey)
  }

  // Check if this specific item instance should be highlighted
  const isItemSelected = (item, type, section) => {
    if (!selectedChat || selectedChat.id !== item.id) return false
    if (chatType !== type) return false
    
    // Check if this is the exact context that was clicked
    return selectedContext?.section === section && 
           selectedContext?.id === item.id && 
           selectedContext?.type === type
  }

  // Handle chat selection with context tracking
  const handleChatClick = (chat, type, section) => {
    // Block chat switching while another chat is loading
    if (isLoading) {
      return
    }
    
    setSelectedContext({ id: chat.id, type, section })
    
    // Update URL to reflect current chat
    const params = new URLSearchParams(window.location.search)
    params.set('type', type)
    params.set('id', chat.id)
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState({}, '', newUrl)
    
    // Reset unread count for this chat
    if (type === 'team') {
      setTeams(prev => prev.map(team => 
        team.id === chat.id ? { ...team, unread_count: 0 } : team
      ))
    } else {
      setContacts(prev => prev.map(contact => 
        contact.id === chat.id ? { ...contact, unread_count: 0 } : contact
      ))
    }
    
    onChatSelect(chat, type)
  }

  // Pop out current chat into a new window
  const handlePopOutChat = () => {
    if (!selectedChat || !chatType) return
    
    const chatId = selectedChat.id
    const type = chatType
    const url = `/chat/popout?type=${type}&id=${chatId}`
    
    // Open a new window without Chrome controls
    const features = [
      'width=1000',
      'height=700',
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'scrollbars=yes',
      'resizable=yes'
    ].join(',')
    
    window.open(url, `chat-${type}-${chatId}`, features)
  }

  const renderTeamItem = (team, section = 'teams') => {
    const isUnread = hasUnreadMessages(team, 'team')
    const isMuted = isChatMuted(team, 'team')
    
    return (
      <div 
        key={`${section}-team-${team.id}`}
        className={`flex items-center px-3 py-2 mx-2 rounded-lg group transition-colors ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          isItemSelected(team, 'team', section)
            ? 'bg-theme-50 dark:bg-theme-900/30 text-theme-900 dark:text-theme-100'
            : 'hover:bg-gray-100 dark:hover:bg-dark-800'
        }`}
        onClick={() => handleChatClick(team, 'team', section)}
      >
        {/* Unread indicator dot */}
        <div className="w-2 mr-2 flex justify-center">
          {team.unread_count > 0 && (
            <div className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full animate-sync-pulse"></div>
          )}
        </div>
        
        <div className="w-8 h-8 bg-theme-500 dark:bg-theme-600 rounded-lg flex items-center justify-center mr-3">
          <UserGroupIconSolid className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-900 dark:text-dark-50 truncate ${
            team.unread_count ? 'font-bold text-base' : ''
          }`}>
            {team.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-dark-400 truncate">
            {team.unread_count > 0 
              ? `${team.unread_count} new message${team.unread_count === 1 ? '' : 's'}`
              : team.description
            }
          </p>
        </div>
        <div className="flex items-center space-x-1">
          {/* Mute indicator */}
          {isMuted && (
            <SpeakerXMarkIconSolid className="w-4 h-4 text-gray-500 dark:text-dark-400" />
          )}
          <ChatOptionsDropdown item={team} type="team" isItemSelected={isItemSelected(team, 'team', section)} />
          <FavoriteButton 
            item={team} 
            type="team" 
            isFavorited={isFavorite(team, 'team')} 
          />
        </div>
      </div>
    )
  }

  const renderContactItem = (contact, section = 'contacts') => {
    const isUnread = hasUnreadMessages(contact, 'user')
    const isMuted = isChatMuted(contact, 'user')

    return (
      <div 
        key={`${section}-contact-${contact.id}`}
        className={`flex items-center px-3 py-2 mx-2 rounded-lg group transition-colors ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          isItemSelected(contact, 'dm', section)
            ? 'bg-theme-50 dark:bg-theme-900/30 text-theme-900 dark:text-theme-100'
            : 'hover:bg-gray-100 dark:hover:bg-dark-800'
        }`}
        onClick={() => handleChatClick(contact, 'dm', section)}
      >
        {/* Unread indicator dot */}
        <div className="w-2 mr-2 flex justify-center">
          {contact.unread_count > 0 && (
            <div className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full animate-sync-pulse"></div>
          )}
        </div>
        
        <div className="relative mr-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <UserIcon contact={contact} size="small" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-900 dark:text-dark-50 truncate ${
            contact.unread_count ? 'font-bold text-base' : ''
          }`}>
            {contact.name}
          </p>
          <div className="text-xs text-gray-500 dark:text-dark-400 truncate">
            {(typingUsers[`dm-${contact.id}`] || []).some(u => u.user_id === contact.id) ? (
              <span className="flex gap-x-1.5">
                Typing
                <span className="flex space-x-1 mt-2.5">
                  <div className="w-[0.175rem] h-[0.175rem] bg-gray-400 dark:bg-dark-500 rounded-full animate-bounce"></div>
                  <div className="w-[0.175rem] h-[0.175rem] bg-gray-400 dark:bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-[0.175rem] h-[0.175rem] bg-gray-400 dark:bg-dark-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </span>
              </span>
            ) : contact.unread_count > 0 ? (
              `${contact.unread_count} new message${contact.unread_count === 1 ? '' : 's'}`
            ) : (
              contact.activeStatus || 'Offline'
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {/* Mute indicator */}
          {isMuted && (
            <SpeakerXMarkIconSolid className="w-4 h-4 text-gray-500 dark:text-dark-400" />
          )}
          <ChatOptionsDropdown item={contact} isItemSelected={isItemSelected(contact, 'dm', section)} type="user" />
          <FavoriteButton 
            item={contact} 
            type="user" 
            isFavorited={isFavorite(contact, 'user')} 
          />
        </div>
      </div>
    )
  }

  // Create Team Modal Component
  const CreateTeamModal = () => {
    const [teamName, setTeamName] = useState('')
    const [teamDescription, setTeamDescription] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    
    const handleCreateTeam = async (e) => {
      e.preventDefault()
      if (!teamName.trim() || isCreating) return
      
      setIsCreating(true)
      
      try {
        const response = await fetch('/api/chat/teams', {
          method: 'POST',
          credentials: 'same-origin',
          headers: getHeaders(),
          body: JSON.stringify({
            name: teamName.trim(),
            description: teamDescription.trim() || null
          })
        })
        
        if (response.ok) {
          const newTeam = await response.json()
          
          // Refresh teams list
          const teamsResponse = await fetch('/api/chat/teams', { 
            credentials: 'same-origin',
            headers: getHeaders()
          })
          
          if (teamsResponse.ok) {
            const updatedTeams = await teamsResponse.json()
            setTeams(Array.isArray(updatedTeams) ? updatedTeams : [])
            
            // Open the new team chat
            handleChatClick(newTeam, 'team', 'teams')
          }
          
          // Close modal and reset form
          setShowCreateTeamModal(false)
          setTeamName('')
          setTeamDescription('')
        } else {
          const errorData = await response.json()
          console.error('Error creating team:', errorData)
          alert('Failed to create team. Please try again.')
        }
      } catch (error) {
        console.error('Error creating team:', error)
        alert('Failed to create team. Please try again.')
      } finally {
        setIsCreating(false)
      }
    }
    
    if (!showCreateTeamModal) return null
    
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40"
          onClick={() => setShowCreateTeamModal(false)}
        />
        
        {/* Modal */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-800 rounded-lg shadow-xl z-50 w-96">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50">Create New Team</h3>
            <button
              onClick={() => setShowCreateTeamModal(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400 dark:text-dark-400" />
            </button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleCreateTeam} className="p-6">
            {/* Team Name */}
            <div className="mb-4">
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>
            
            {/* Team Description */}
            <div className="mb-6">
              <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="teamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Enter team description"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                Describe what this team is for
              </p>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateTeamModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!teamName.trim() || isCreating}
                className={`px-4 py-2 text-sm text-white rounded-lg ${
                  teamName.trim() && !isCreating
                    ? 'bg-theme-600 hover:bg-theme-700' 
                    : 'bg-gray-300 dark:bg-dark-700 cursor-not-allowed'
                }`}
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <l-ring
                      size="16"
                      stroke="2"
                      bg-opacity="0"
                      speed="2"
                      color="white"
                    ></l-ring>
                    Creating...
                  </div>
                ) : (
                  'Create Team'
                )}
              </button>
            </div>
          </form>
        </div>
      </>
    )
  }

  return (
    <div className="w-full lg:w-80 bg-white dark:bg-dark-900 border-l border-gray-200 dark:border-dark-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-50">Chat</h1>
          <div className="flex items-center space-x-2">            
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            
            {/* Compose Button */}
            <button 
              onClick={() => onChatSelect(null, 'compose')}
              className="p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 z-10">
                  <button 
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-t-lg flex items-center"
                    onClick={() => {
                      setShowDropdown(false)
                      setShowCreateTeamModal(true)
                    }}
                  >
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Create New Team
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-b-lg flex items-center"
                    onClick={() => setShowDropdown(false)}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Join Team
                  </button>
                </div>
              )}
            </div>


          </div>
        </div>
        
        {/* Collapsible Search */}
        {showSearch && (
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (() => {
          const themeRgb = getComputedStyle(document.body).getPropertyValue('--theme-500').trim()
          const themeColor = themeRgb ? `rgb(${themeRgb})` : 'rgb(249, 115, 22)' // Default to orange-500
          return (
            <div className="flex items-center justify-center p-8">
              <l-ring
                size="40"
                stroke="4"
                bg-opacity="0"
                speed="2"
                color={themeColor}
              ></l-ring>
            </div>
          )
        })() : (
          <>
            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="mb-2">
                <button
                  onClick={() => toggleSection('favorites')}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-800"
                >
                  {expandedSections.favorites ? (
                    <ChevronDownIcon className="w-4 h-4 mr-2" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                  )}
                  <StarIconSolid className="w-4 h-4 mr-2 text-yellow-400 dark:text-yellow-500" />
                  Favorites
                </button>
                {expandedSections.favorites && favorites.length > 0 && (
                  <div className="pb-2">
                    {favorites.map(fav => 
                      fav.type === 'team' 
                        ? renderTeamItem(fav.item, 'favorites')
                        : renderContactItem(fav.item, 'favorites')
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Teams */}
            <div className="mb-2">
              <button
                onClick={() => toggleSection('teams')}
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-800"
              >
                {expandedSections.teams ? (
                  <ChevronDownIcon className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 mr-2" />
                )}
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Teams ({filteredTeams.length})
              </button>
              {expandedSections.teams && filteredTeams.length > 0 && (
                <div className="pb-2">
                  {filteredTeams.map(team => renderTeamItem(team, 'teams'))}
                </div>
              )}
            </div>

            {/* Direct Messages */}
            <div className="mb-2">
              <button
                onClick={() => toggleSection('contacts')}
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-800"
              >
                {expandedSections.contacts ? (
                  <ChevronDownIcon className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 mr-2" />
                )}
                <UserIconOutline className="w-4 h-4 mr-2" />
                Direct Messages ({filteredContacts.length})
              </button>
              {expandedSections.contacts && filteredContacts.length > 0 && (
                <div className="pb-2">
                  {filteredContacts.map(contact => renderContactItem(contact, 'contacts'))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Create Team Modal */}
      <CreateTeamModal />
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => {
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
          setTimeout(() => {
            setConfirmationDialog({ isOpen: false, type: null, item: null })
          }, 300)
        }}
        title={confirmationDialog.type === 'leaveTeam' ? 'Leave Team' : 'Remove Chat History'}
        description={
          confirmationDialog.type === 'leaveTeam'
            ? `Are you sure you want to leave ${confirmationDialog.item?.name}?`
            : `Are you sure you want to remove all chat history with ${confirmationDialog.item?.name}? Messages will not be deleted but won't appear in your history.`
        }
        isYes={async () => {
          try {
            if (confirmationDialog.type === 'leaveTeam') {
              const response = await fetch(`/api/chat/teams/${confirmationDialog.item.id}/leave`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: getHeaders()
              })
              if (response.ok) {
                setTeams(prev => prev.filter(team => team.id !== confirmationDialog.item.id))
                if (selectedChat?.id === confirmationDialog.item.id && chatType === 'team') {
                  onChatSelect(null, 'compose')
                }
              }
            } else if (confirmationDialog.type === 'removeHistory') {
              const response = await fetch('/api/chat/preferences/remove-history', {
                method: 'POST',
                credentials: 'same-origin',
                headers: getHeaders(),
                body: JSON.stringify(confirmationDialog.chatData)
              })
              if (response.ok) {
                // Reset unread count to zero since all history is now hidden
                const itemId = confirmationDialog.item.id
                const isTeam = confirmationDialog.chatData.chat_type === 'team'
                
                if (isTeam) {
                  setTeams(prev => prev.map(team => 
                    team.id === itemId ? { ...team, unread_count: 0 } : team
                  ))
                } else {
                  setContacts(prev => prev.map(contact => 
                    contact.id === itemId ? { ...contact, unread_count: 0 } : contact
                  ))
                }
                
                // If this is the currently selected chat, re-select it to refresh messages
                // The ChatEngine will fetch fresh messages which will exclude history before the cutoff
                if (selectedChat?.id === itemId) {
                  const type = isTeam ? 'team' : 'dm'
                  // Briefly deselect then reselect to force a refresh
                  onChatSelect(null, 'compose')
                  setTimeout(() => {
                    onChatSelect(confirmationDialog.item, type)
                  }, 100)
                }
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
