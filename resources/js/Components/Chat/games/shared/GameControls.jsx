import React, { useState, useRef, useEffect } from 'react'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { ChevronDownIcon, XMarkIcon, UserIcon as UserIconOutline, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ConfirmationDialog from '@/Components/Dialogs/ConfirmationDialog.jsx'
import UserIcon from '@/Components/Chat/UserIcon.jsx'

/**
 * Reusable game controls component for game masters
 * - Select next player
 * - Cancel game
 */
export default function GameControls({
  teamMembers = [],
  currentPlayerId,
  onSelectNextPlayer,
  onCancelGame,
  disabled = false,
}) {
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [playerSearch, setPlayerSearch] = useState('')
  const searchInputRef = useRef(null)
  
  const { refs: playerRefs, floatingStyles: playerFloatingStyles } = useFloating({
    placement: 'top-end',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  
  // Filter players by search and exclude current player
  const filteredPlayers = teamMembers
    .filter(m => m.id !== currentPlayerId)
    .filter(m => m.name?.toLowerCase().includes(playerSearch.toLowerCase()))
  
  const handleSelectPlayer = (playerId) => {
    onSelectNextPlayer?.(playerId)
    setShowPlayerDropdown(false)
    setPlayerSearch('')
  }
  
  const handleCancelGame = () => {
    onCancelGame?.()
    setShowCancelDialog(false)
  }
  
  const handleCloseDropdown = () => {
    setShowPlayerDropdown(false)
    setPlayerSearch('')
  }
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (showPlayerDropdown && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showPlayerDropdown])
  
  return (
    <div className="flex items-center gap-2">
      {/* Select Next Player */}
      <div className="relative">
        <button
          ref={playerRefs.setReference}
          onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 px-3 h-[42px] text-sm font-medium rounded-lg transition-colors ${
            disabled
              ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-dark-500 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
          }`}
          title="Select next player"
        >
          <UserIconOutline className="w-4 h-4" />
          <span className="hidden sm:inline">Next Player</span>
          <ChevronDownIcon className="w-3.5 h-3.5" />
        </button>
        
        {showPlayerDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={handleCloseDropdown}
            />
            
            {/* Dropdown with search */}
            <div
              ref={playerRefs.setFloating}
              style={playerFloatingStyles}
              className="w-64 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-50"
            >
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200 dark:border-dark-700">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search players..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Player List */}
              <div className="max-h-48 overflow-y-auto py-1">
                {filteredPlayers.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 dark:text-dark-400 text-center">
                    {playerSearch ? 'No players found' : 'No other players'}
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSelectPlayer(player.id)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2"
                    >
                      <UserIcon contact={player} size="extra-small" />
                      <span className="text-sm text-gray-900 dark:text-dark-50 truncate">{player.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Cancel Game */}
      <button
        onClick={() => setShowCancelDialog(true)}
        disabled={disabled}
        className={`px-2.5 h-[42px] w-[42px] rounded-lg transition-colors ${
          disabled
            ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-dark-500 cursor-not-allowed'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
        }`}
        title="Cancel game"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
      
      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="Cancel Game?"
        description="Are you sure you want to cancel this game? This action cannot be undone."
        type="delete"
        yesText="Cancel Game"
        cancelText="Keep Playing"
        isYes={handleCancelGame}
      />
    </div>
  )
}
