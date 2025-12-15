import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { UserGroupIcon, EllipsisVerticalIcon, ArrowTopRightOnSquareIcon, ChevronLeftIcon, EyeIcon, EyeSlashIcon, TrashIcon, SpeakerXMarkIcon, UserPlusIcon, XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { UserGroupIcon as UserGroupIconSolid } from '@heroicons/react/24/solid'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import UserIcon from '../UserIcon.jsx'
import ConfirmationDialog from '../../Dialogs/ConfirmationDialog.jsx'
import CreateTeamDropdown from '../CreateTeamDropdown.jsx'

export default function ChatHeader({ chat, chatType, onBackToSidebar, onChatPreferenceChange, chatPreferences = [], onMembersChange, currentUser, onTeamCreated, loading = false }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMembersPanel, setShowMembersPanel] = useState(false)
  const [showAddUserPopover, setShowAddUserPopover] = useState(false)
  const [showCreateTeamDropdown, setShowCreateTeamDropdown] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [roleDropdownMemberId, setRoleDropdownMemberId] = useState(null)
  const [confirmationDialog, setConfirmationDialog] = useState({ isOpen: false, type: null })
  
  // Ref for create team button
  const createTeamButtonRef = useRef(null)
  
  // FloatingUI for members popover
  const { refs: membersRefs, floatingStyles: membersFloatingStyles } = useFloating({
    placement: 'bottom-end',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  
  // FloatingUI for add user popover (attached to add member button, same width as parent)
  const { refs: addUserRefs, floatingStyles: addUserFloatingStyles } = useFloating({
    placement: 'bottom',
    middleware: [offset(15), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  
  // FloatingUI for role dropdown
  const { refs: roleRefs, floatingStyles: roleFloatingStyles } = useFloating({
    placement: 'bottom-end',
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  
  // Helper to check if current user can change a member's role
  const canChangeRole = (member) => {
    if (!currentUserRole || member.id === currentUser?.id) return false
    const roleHierarchy = { owner: 3, admin: 2, member: 1 }
    const myLevel = roleHierarchy[currentUserRole] || 0
    const theirLevel = roleHierarchy[member.role] || 0
    // Can only change roles of users below you
    return myLevel > theirLevel
  }
  
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
  
  // Fetch current user's role in team on mount (for showing/hiding management button)
  useEffect(() => {
    if (chatType === 'team' && chat?.id) {
      fetch(`/api/chat/teams/${chat.id}`, { 
        credentials: 'same-origin',
        headers: getHeaders()
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.current_user_role) {
            setCurrentUserRole(data.current_user_role)
          }
        })
        .catch(console.error)
    }
  }, [chat?.id, chatType])
  
  // Fetch team members when panel opens
  useEffect(() => {
    if (showMembersPanel && chatType === 'team' && chat?.id) {
      fetch(`/api/chat/teams/${chat.id}`, { 
        credentials: 'same-origin',
        headers: getHeaders()
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.members) {
            setTeamMembers(data.members)
          }
          if (data?.current_user_role) {
            setCurrentUserRole(data.current_user_role)
          }
        })
        .catch(console.error)
    }
  }, [showMembersPanel, chat?.id, chatType])
  
  // Fetch all users when add user popover opens
  useEffect(() => {
    if (showAddUserPopover) {
      fetch('/api/chat/users/all', { 
        credentials: 'same-origin',
        headers: getHeaders()
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setAllUsers(Array.isArray(data) ? data : []))
        .catch(() => setAllUsers([]))
    }
  }, [showAddUserPopover])
  
  // Listen for role changes
  useEffect(() => {
    if (chatType !== 'team' || !chat?.id || !window.Echo) return
    
    const teamChannel = window.Echo.join(`chat.team.${chat.id}`)
    
    const handleRoleChanged = (event) => {
      // Update member role in local state
      setTeamMembers(prev => prev.map(m => 
        m.id === event.user_id ? { ...m, role: event.new_role } : m
      ))
      
      // If current user's role changed, update it
      if (event.user_id === currentUser?.id) {
        setCurrentUserRole(event.new_role)
      }
      
      // If ownership transferred, trigger refresh
      if (event.new_owner_id) {
        onMembersChange?.()
      }
    }
    
    teamChannel.listen('.TeamMemberRoleChanged', handleRoleChanged)
    
    return () => {
      teamChannel.stopListening('.TeamMemberRoleChanged')
    }
  }, [chat?.id, chatType, currentUser?.id, onMembersChange])
  
  // Filter users - exclude current team members
  const memberIds = teamMembers.map(m => m.id)
  const filteredUsers = allUsers.filter(user => 
    !memberIds.includes(user.id) &&
    user.name?.toLowerCase().includes(userSearch.toLowerCase())
  )
  
  // Add member to team
  const handleAddMember = async (userId) => {
    try {
      const response = await fetch(`/api/chat/teams/${chat.id}/members`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({ user_id: userId })
      })
      
      if (response.ok) {
        // Find the user we just added to get their name
        const addedUser = allUsers.find(u => u.id === userId)
        // Refresh members list
        const teamResponse = await fetch(`/api/chat/teams/${chat.id}`, { 
          credentials: 'same-origin',
          headers: getHeaders()
        })
        if (teamResponse.ok) {
          const data = await teamResponse.json()
          if (data?.members) {
            setTeamMembers(data.members)
          }
        }
        setShowAddUserPopover(false)
        setUserSearch('')
        onMembersChange?.()
        toast.success(`${addedUser?.name || 'Member'} added to team`, {
          toastId: 'member-added',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      } else {
        toast.error('Failed to add member', {
          toastId: 'member-add-failed',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member', {
        toastId: 'member-add-failed',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }
  
  // Remove member from team
  const handleRemoveMember = async (userId) => {
    try {
      // Find member name before removing
      const removedMember = teamMembers.find(m => m.id === userId)
      const response = await fetch(`/api/chat/teams/${chat.id}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: getHeaders()
      })
      
      if (response.ok) {
        setTeamMembers(prev => prev.filter(m => m.id !== userId))
        onMembersChange?.()
        toast.success(`${removedMember?.name || 'Member'} removed from team`, {
          toastId: 'member-removed',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      } else {
        toast.error('Failed to remove member', {
          toastId: 'member-remove-failed',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member', {
        toastId: 'member-remove-failed',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }
  
  // Update member role
  const handleUpdateRole = async (userId, newRole) => {
    // If changing to owner, show confirmation
    if (newRole === 'owner') {
      const member = teamMembers.find(m => m.id === userId)
      setConfirmationDialog({
        isOpen: true,
        type: 'transferOwnership',
        member: member,
        newRole: newRole
      })
      setRoleDropdownMemberId(null)
      return
    }
    
    try {
      const response = await fetch(`/api/chat/teams/${chat.id}/members/${userId}/role`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Find member name
        const member = teamMembers.find(m => m.id === userId)
        // Update local state
        setTeamMembers(prev => prev.map(m => 
          m.id === userId ? { ...m, role: newRole } : m
        ))
        setRoleDropdownMemberId(null)
        onMembersChange?.()
        toast.success(`${member?.name || 'Member'}'s role changed to ${newRole}`, {
          toastId: 'role-updated',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      } else {
        toast.error('Failed to update role', {
          toastId: 'role-update-failed',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role', {
        toastId: 'role-update-failed',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }
  
  // Execute ownership transfer
  const executeOwnershipTransfer = async (userId) => {
    try {
      // Find member name before transfer
      const newOwner = teamMembers.find(m => m.id === userId)
      const response = await fetch(`/api/chat/teams/${chat.id}/members/${userId}/role`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({ role: 'owner' })
      })
      
      if (response.ok) {
        // Refresh members from server to get accurate state
        const teamResponse = await fetch(`/api/chat/teams/${chat.id}`, { 
          credentials: 'same-origin',
          headers: getHeaders()
        })
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          if (teamData?.members) {
            setTeamMembers(teamData.members)
          }
          if (teamData?.current_user_role) {
            setCurrentUserRole(teamData.current_user_role)
          }
        }
        onMembersChange?.()
        toast.success(`Ownership transferred to ${newOwner?.name || 'new owner'}`, {
          toastId: 'ownership-transferred',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      } else {
        toast.error('Failed to transfer ownership', {
          toastId: 'ownership-transfer-failed',
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
      }
    } catch (error) {
      console.error('Error transferring ownership:', error)
      toast.error('Failed to transfer ownership', {
        toastId: 'ownership-transfer-failed',
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }
  
  // Check if current user can manage members (admin or owner)
  const canManageMembers = currentUserRole === 'admin' || currentUserRole === 'owner'
  
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
          
        case 'deleteTeam':
          setConfirmationDialog({
            isOpen: true,
            type: 'deleteTeam'
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
            <div className="w-12 h-12 rounded-lg bg-theme-500 dark:bg-theme-600 flex items-center justify-center mr-6">
              <UserGroupIconSolid className="w-9 h-9 text-white" />
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
          {/* Team Members Button - only show for teams and admins/owners */}
          {chatType === 'team' && canManageMembers && (
            <div className="relative">
              <button
                ref={membersRefs.setReference}
                onClick={() => {
                  setShowMembersPanel(!showMembersPanel)
                  if (showMembersPanel) setShowAddUserPopover(false)
                }}
                disabled={loading}
                className={`p-2 rounded-lg ${showMembersPanel ? 'text-theme-600 dark:text-theme-400 bg-theme-100 dark:bg-theme-900/30' : 'text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Manage team members"
              >
                <UserGroupIcon className="w-5 h-5" />
              </button>
              
              {/* Members Popover */}
              {showMembersPanel && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setShowMembersPanel(false)
                      setShowAddUserPopover(false)
                    }}
                  />
                  
                  <div
                    ref={membersRefs.setFloating}
                    style={membersFloatingStyles}
                    className="w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-50"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50">Team Members</h3>
                      <button
                        onClick={() => {
                          setShowMembersPanel(false)
                          setShowAddUserPopover(false)
                        }}
                        className="p-1 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Members List */}
                    <div className="max-h-64 overflow-y-auto">
                      {teamMembers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-dark-400">
                          No members found
                        </div>
                      ) : (
                        <div className="py-1">
                          {teamMembers.map(member => (
                            <div 
                              key={member.id}
                              className="px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700"
                            >
                              <div className="flex items-center gap-3">
                                <UserIcon contact={member} size="small" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-dark-50">{member.name}</p>
                                  <span className={`text-xs ${
                                    member.role === 'owner' 
                                      ? 'text-theme-600 dark:text-theme-400' 
                                      : member.role === 'admin'
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-500 dark:text-dark-400'
                                  }`}>
                                    {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Role and Remove buttons - only show for admins/owners */}
                              {canManageMembers && member.id !== currentUser?.id && (
                                <div className="flex items-center gap-1">
                                  {/* Role dropdown - only show for members you can change */}
                                  {canChangeRole(member) && (
                                    <button
                                      ref={roleDropdownMemberId === member.id ? roleRefs.setReference : null}
                                      onClick={() => setRoleDropdownMemberId(
                                        roleDropdownMemberId === member.id ? null : member.id
                                      )}
                                      className="p-1 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 rounded hover:bg-gray-100 dark:hover:bg-dark-600"
                                      title="Change role"
                                    >
                                      <ChevronDownIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Remove button - don't show for owner */}
                                  {member.role !== 'owner' && (
                                    <button
                                      onClick={() => setConfirmationDialog({
                                        isOpen: true,
                                        type: 'removeMember',
                                        member: member
                                      })}
                                      className="p-1 text-gray-400 dark:text-dark-400 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-dark-600"
                                      title="Remove from team"
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Add User Section */}
                    <div className="px-3 py-2 border-t border-gray-200 dark:border-dark-700">
                      <button
                        ref={addUserRefs.setReference}
                        onClick={() => setShowAddUserPopover(!showAddUserPopover)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-theme-500 hover:bg-theme-600 dark:bg-theme-600 dark:hover:bg-theme-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                        <span>Add Member</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Add User Popover - positioned outside the members popover */}
                  {showAddUserPopover && (
                    <div
                      ref={addUserRefs.setFloating}
                      style={addUserFloatingStyles}
                      className="w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-[60]"
                    >
                      {/* Search Input */}
                      <div className="p-2 border-b border-gray-200 dark:border-dark-700">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-500" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>
                      
                      {/* User List */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-gray-500 dark:text-dark-400 text-center">
                            {userSearch ? `No users found` : 'No users available'}
                          </div>
                        ) : (
                          filteredUsers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => handleAddMember(user.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 text-left"
                            >
                              <UserIcon contact={user} size="extra-small" />
                              <span className="text-sm text-gray-900 dark:text-dark-50">{user.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Role Dropdown Popover */}
                  {roleDropdownMemberId && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-[65]"
                        onClick={() => setRoleDropdownMemberId(null)}
                      />
                      <div
                        ref={roleRefs.setFloating}
                        style={roleFloatingStyles}
                        className="w-36 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-[70] py-1"
                      >
                        {(() => {
                          const member = teamMembers.find(m => m.id === roleDropdownMemberId)
                          if (!member) return null
                          return (
                            <>
                              <button
                                onClick={() => handleUpdateRole(member.id, 'member')}
                                disabled={member.role === 'member'}
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-dark-700 ${
                                  member.role === 'member' 
                                    ? 'text-gray-400 dark:text-dark-500 cursor-not-allowed' 
                                    : 'text-gray-700 dark:text-dark-200'
                                }`}
                              >
                                Member
                              </button>
                              <button
                                onClick={() => handleUpdateRole(member.id, 'admin')}
                                disabled={member.role === 'admin'}
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-dark-700 ${
                                  member.role === 'admin' 
                                    ? 'text-gray-400 dark:text-dark-500 cursor-not-allowed' 
                                    : 'text-gray-700 dark:text-dark-200'
                                }`}
                              >
                                Admin
                              </button>
                              {currentUserRole === 'owner' && (
                                <button
                                  onClick={() => handleUpdateRole(member.id, 'owner')}
                                  className="w-full text-left px-3 py-1.5 text-sm text-theme-600 dark:text-theme-400 hover:bg-gray-100 dark:hover:bg-dark-700"
                                >
                                  Transfer Ownership
                                </button>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Create Team Button - only show for DM chats */}
          {chatType === 'dm' && (
            <button
              ref={createTeamButtonRef}
              onClick={() => setShowCreateTeamDropdown(true)}
              disabled={loading}
              className={`p-2 rounded-lg ${showCreateTeamDropdown ? 'text-theme-600 dark:text-theme-400 bg-theme-100 dark:bg-theme-900/30' : 'text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Create team with this user"
            >
              <UserPlusIcon className="w-5 h-5" />
            </button>
          )}
          
          {!isPopout && (
            <button
              onClick={handlePopout}
              disabled={loading}
              className={`p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Pop out chat in new window"
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5" />
            </button>
          )}
          
          {/* Options Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={loading}
              className={`p-2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    className={`w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 ${chatType !== 'team' ? 'rounded-b-lg' : ''} flex items-center`}
                  >
                    <SpeakerXMarkIcon className="w-4 h-4 mr-2" />
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  {chatType === 'team' && (
                    <button
                      onClick={() => handleOptionClick('leaveTeam')}
                      className={`w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700 ${currentUserRole !== 'owner' ? 'rounded-b-lg' : ''} flex items-center`}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Leave Team
                    </button>
                  )}
                  {chatType === 'team' && currentUserRole === 'owner' && (
                    <button
                      onClick={() => handleOptionClick('deleteTeam')}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-b-lg flex items-center border-t border-gray-200 dark:border-dark-700"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete Team
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
            setConfirmationDialog({ isOpen: false, type: null, member: null, newRole: null })
          }, 300)
        }}
        title={
          confirmationDialog.type === 'leaveTeam' ? 'Leave Team' 
          : confirmationDialog.type === 'removeMember' ? 'Remove Member'
          : confirmationDialog.type === 'transferOwnership' ? 'Transfer Ownership'
          : confirmationDialog.type === 'deleteTeam' ? 'Delete Team'
          : 'Remove Chat History'
        }
        description={
          confirmationDialog.type === 'leaveTeam'
            ? `Are you sure you want to leave ${chat?.name}?`
            : confirmationDialog.type === 'removeMember'
            ? `Are you sure you want to remove ${confirmationDialog.member?.name} from ${chat?.name}?`
            : confirmationDialog.type === 'transferOwnership'
            ? `Are you sure you want to transfer ownership of ${chat?.name} to ${confirmationDialog.member?.name}? You will become an admin.`
            : confirmationDialog.type === 'deleteTeam'
            ? `Are you sure you want to delete ${chat?.name}? This action cannot be undone and all team members will lose access.`
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
                toast.success(`You left ${chat?.name}`, {
                  toastId: 'team-left',
                  position: 'top-center',
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: false,
                  draggable: true,
                  progress: undefined,
                  theme: 'light',
                })
                window.location.href = '/chat'
              } else {
                toast.error('Failed to leave team', {
                  toastId: 'team-leave-failed',
                  position: 'top-center',
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: false,
                  draggable: true,
                  progress: undefined,
                  theme: 'light',
                })
              }
            } else if (confirmationDialog.type === 'deleteTeam') {
              const response = await fetch(`/api/chat/teams/${chat.id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: getHeaders()
              })
              if (response.ok) {
                toast.success(`Team "${chat?.name}" deleted`, {
                  toastId: 'team-deleted',
                  position: 'top-center',
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: false,
                  draggable: true,
                  progress: undefined,
                  theme: 'light',
                })
                window.location.href = '/chat'
              } else {
                toast.error('Failed to delete team', {
                  toastId: 'team-delete-failed',
                  position: 'top-center',
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: false,
                  draggable: true,
                  progress: undefined,
                  theme: 'light',
                })
              }
            } else if (confirmationDialog.type === 'removeMember' && confirmationDialog.member) {
              await handleRemoveMember(confirmationDialog.member.id)
            } else if (confirmationDialog.type === 'transferOwnership' && confirmationDialog.member) {
              await executeOwnershipTransfer(confirmationDialog.member.id)
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
            toast.error('An error occurred', {
              toastId: 'action-error',
              position: 'top-center',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: true,
              progress: undefined,
              theme: 'light',
            })
          }
        }}
        type={confirmationDialog.type === 'deleteTeam' ? 'delete' : 'warning'}
        yesText={
          confirmationDialog.type === 'leaveTeam' ? 'Leave' 
          : confirmationDialog.type === 'transferOwnership' ? 'Transfer'
          : confirmationDialog.type === 'deleteTeam' ? 'Delete'
          : 'Remove'
        }
        cancelText="Cancel"
      />
      
      {/* Create Team Dropdown for DM chats */}
      {chatType === 'dm' && (
        <CreateTeamDropdown
          isOpen={showCreateTeamDropdown}
          onClose={() => setShowCreateTeamDropdown(false)}
          triggerRef={createTeamButtonRef}
          placement="bottom-end"
          initialMember={chat}
          onTeamCreated={(newTeam) => {
            onTeamCreated?.(newTeam)
          }}
        />
      )}
    </div>
  )
}
