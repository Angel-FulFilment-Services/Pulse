import React, { useState, useEffect } from 'react'
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
  XMarkIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarIconSolid,
  SpeakerXMarkIcon as SpeakerXMarkIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid'
import UserIcon from './UserIcon.jsx'

export default function Sidebar({ onChatSelect, selectedChat, chatType, typingUsers = [], unreadChats = new Set() }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [teams, setTeams] = useState([])
  const [contacts, setContacts] = useState([])
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

  // Fetch contacts
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
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Error fetching contacts:', error)
        setContacts([])
      })
  }, [currentUser])

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
      .then(data => setFavorites(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Error fetching favorites:', error)
        setFavorites([])
      })
  }, [currentUser])

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

  // Filter items based on search
  const filteredTeams = teams.filter(team => 
    team.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
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
        console.log(`${type === 'team' ? 'Team' : 'User'} added to favorites`)
      } else if (result.status === 'removed') {
        console.log(`${type === 'team' ? 'Team' : 'User'} removed from favorites`)
      }
      
      // Refresh favorites
      const favData = await fetch('/api/chat/favorites', { 
        credentials: 'same-origin',
        headers: getHeaders()
      })
      
      if (favData.ok) {
        const newFavorites = await favData.json()
        setFavorites(Array.isArray(newFavorites) ? newFavorites : [])
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
            response = await fetch('/api/chat/mark-unread', {
              method: 'POST',
              credentials: 'same-origin',
              headers: getHeaders(),
              body: JSON.stringify(chatData)
            })
            if (response.ok) {
              const result = await response.json()
              console.log(`Message ${result.status}:`, item.name)
              // Refresh data to update unread counts
              window.location.reload() // Simple refresh for now
            }
            break
            
          case 'hide':
            response = await fetch('/api/chat/hide', {
              method: 'POST',
              credentials: 'same-origin',
              headers: getHeaders(),
              body: JSON.stringify(chatData)
            })
            if (response.ok) {
              console.log('Chat hidden:', item.name)
              // TODO: Remove from current view or refresh data
            }
            break
            
          case 'removeHistory':
            if (confirm(`Are you sure you want to remove all chat history with ${item.name}? This action cannot be undone.`)) {
              response = await fetch('/api/chat/history', {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: getHeaders(),
                body: JSON.stringify(chatData)
              })
              if (response.ok) {
                console.log('Chat history removed:', item.name)
              }
            }
            break
            
          case 'mute':
            response = await fetch('/api/chat/toggle-mute', {
              method: 'POST',
              credentials: 'same-origin',
              headers: getHeaders(),
              body: JSON.stringify(chatData)
            })
            if (response.ok) {
              const result = await response.json()
              console.log(`Chat ${result.status}:`, item.name)
              // Refresh chat preferences
              refreshChatPreferences()
            }
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
          className={`opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110 p-1 ${isItemSelected ? 'hover:bg-theme-200/50' : 'hover:bg-gray-200'} rounded`}
        >
          <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
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
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <button
                onClick={(e) => handleOptionClick('toggleUnread', e)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center"
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
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Hide
              </button>
              <button
                onClick={(e) => handleOptionClick('removeHistory', e)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Remove Chat History
              </button>
              <button
                onClick={(e) => handleOptionClick('mute', e)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg flex items-center"
              >
                <SpeakerXMarkIcon className="w-4 h-4 mr-2" />
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
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
        className="opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110"
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
            <StarIconSolid className="w-4 h-4 text-yellow-400" />
          ) : (
            <StarIcon className="w-4 h-4 text-gray-400" />
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
    // Check if this chat is in the unreadChats set
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
    setSelectedContext({ id: chat.id, type, section })
    onChatSelect(chat, type)
  }

  const renderTeamItem = (team, section = 'teams') => {
    const isUnread = hasUnreadMessages(team, 'team')
    const isMuted = isChatMuted(team, 'team')
    
    return (
      <div 
        key={`${section}-team-${team.id}`}
        className={`flex items-center px-3 py-2 mx-2 rounded-lg cursor-pointer group transition-colors ${
          isItemSelected(team, 'team', section)
            ? 'bg-theme-100 text-theme-900'
            : 'hover:bg-gray-100'
        }`}
        onClick={() => handleChatClick(team, 'team', section)}
      >
        {/* Unread indicator dot */}
        <div className="w-2 mr-2 flex justify-center">
          {isUnread && (
            <div className="w-2 h-2 bg-theme-500 rounded-full"></div>
          )}
        </div>
        
        <div className="w-8 h-8 bg-theme-500 rounded-lg flex items-center justify-center mr-3">
          <UserGroupIconSolid className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-900 truncate ${
            isUnread ? 'font-bold text-base' : ''
          }`}>
            {team.name}
          </p>
          <p className="text-xs text-gray-500 truncate">{team.description}</p>
        </div>
        <div className="flex items-center space-x-1">
          {/* Mute indicator */}
          {isMuted && (
            <SpeakerXMarkIconSolid className="w-4 h-4 text-gray-500" />
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
        className={`flex items-center px-3 py-2 mx-2 rounded-lg cursor-pointer group transition-colors ${
          isItemSelected(contact, 'dm', section)
            ? 'bg-theme-100 text-theme-900'
            : 'hover:bg-gray-100'
        }`}
        onClick={() => handleChatClick(contact, 'dm', section)}
      >
        {/* Unread indicator dot */}
        <div className="w-2 mr-2 flex justify-center">
          {isUnread && (
            <div className="w-2 h-2 bg-theme-500 rounded-full"></div>
          )}
        </div>
        
        <div className="relative mr-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <UserIcon contact={contact} size="small" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-900 truncate ${
            isUnread ? 'font-bold text-base' : ''
          }`}>
            {contact.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {typingUsers.some(u => u.user_id === contact.id) ? (
              <span className="text-theme-600 font-medium">
                typing
                <span className="typing-dots">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </span>
              </span>
            ) : (
              contact.is_online ? 'Active' : 'Away'
            )}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          {/* Mute indicator */}
          {isMuted && (
            <SpeakerXMarkIconSolid className="w-4 h-4 text-gray-500" />
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
          console.log('Team created successfully:', newTeam)
          
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowCreateTeamModal(false)}
        />
        
        {/* Modal */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-96">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Create New Team</h3>
            <button
              onClick={() => setShowCreateTeamModal(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleCreateTeam} className="p-6">
            {/* Team Name */}
            <div className="mb-4">
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>
            
            {/* Team Description */}
            <div className="mb-6">
              <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="teamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Enter team description"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe what this team is for
              </p>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateTeamModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
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
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isCreating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
          <div className="flex items-center space-x-2">
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            
            {/* Compose Button */}
            <button 
              onClick={() => onChatSelect(null, 'compose')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button 
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center"
                    onClick={() => {
                      setShowDropdown(false)
                      setShowCreateTeamModal(true)
                    }}
                  >
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Create New Team
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg flex items-center"
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
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!currentUser ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Please log in to access chat</p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 text-sm font-medium text-white bg-theme-600 hover:bg-theme-700 rounded-lg"
              >
                Login
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-600"></div>
          </div>
        ) : (
          <>
            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="mb-2">
                <button
                  onClick={() => toggleSection('favorites')}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {expandedSections.favorites ? (
                    <ChevronDownIcon className="w-4 h-4 mr-2" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 mr-2" />
                  )}
                  <StarIconSolid className="w-4 h-4 mr-2 text-yellow-400" />
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
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
    </div>
  )
}
