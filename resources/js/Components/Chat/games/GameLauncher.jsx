import React, { useState, useRef, useEffect } from 'react'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { PuzzlePieceIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ConfirmationDialog from '@/Components/Dialogs/ConfirmationDialog.jsx'

// Custom SVG icons for games
const HangmanIcon = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 64 72" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Gallows */}
    <path 
      d="M12 56H28M20 56V12M20 12H40M40 12V18" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-gray-700 dark:text-gray-400"
    />
    {/* Head */}
    <circle 
      cx="40" 
      cy="24" 
      r="6" 
      stroke="currentColor" 
      strokeWidth="2.5"
      className="text-theme-600 dark:text-theme-600"
    />
    {/* Body */}
    <path 
      d="M40 30V42" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      className="text-theme-600 dark:text-theme-600"
    />
    {/* Arms */}
    <path 
      d="M40 34L32 38M40 34L48 38" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      className="text-theme-600 dark:text-theme-600"
    />
    {/* Legs */}
    <path 
      d="M40 42L34 52M40 42L46 52" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      className="text-theme-600 dark:text-theme-600"
    />
    {/* Letter slots - 4 slots, centered */}
    <path 
      d="M11 71H17M23 71H29M35 71H41M47 71H53" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      className="text-theme-500 dark:text-theme-600"
    />
  </svg>
)

// Game definitions with icons, titles, and descriptions
const AVAILABLE_GAMES = [
  {
    id: 'hangman',
    title: 'Hangman',
    description: 'Guess the word letter by letter before the man is hung!',
    Icon: HangmanIcon,
    minPlayers: 2,
  },
  // Future games can be added here with their own custom SVG icons
]

export default function GameLauncher({ 
  teamId, 
  teamMembers = [], 
  currentUser,
  onGameStarted,
  activeGame = null,
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState(null)
  const [word, setWord] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [pendingGameStart, setPendingGameStart] = useState(null)
  
  const buttonRef = useRef(null)
  
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-end',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  
  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setSelectedGame(null)
      setWord('')
      setError('')
    }
  }, [isOpen])
  
  const getHeaders = () => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
    }
  }
  
  // Cancel the current active game
  const cancelActiveGame = async () => {
    if (!activeGame?.id) return false
    
    try {
      const response = await fetch(`/api/chat/teams/${teamId}/games/${activeGame.id}/cancel`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
      })
      return response.ok
    } catch (err) {
      console.error('Error cancelling game:', err)
      return false
    }
  }
  
  // Actually start the game (after confirmation if needed)
  const doStartGame = async () => {
    if (!selectedGame || !word.trim()) {
      setError('Please enter a word')
      return
    }
    
    // Validate word is only letters
    if (!/^[a-zA-Z]+$/.test(word.trim())) {
      setError('Word must contain only letters (A-Z)')
      return
    }
    
    setIsStarting(true)
    setError('')
    
    try {
      const response = await fetch(`/api/chat/teams/${teamId}/games/${selectedGame.id}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({
          word: word.trim(),
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setIsOpen(false)
        onGameStarted?.(data.game)
      } else {
        setError(data.error || 'Failed to start game')
      }
    } catch (err) {
      console.error('Error starting game:', err)
      setError('Failed to start game')
    } finally {
      setIsStarting(false)
    }
  }
  
  const handleStartGame = async () => {
    // If there's an active game, show confirmation dialog
    if (activeGame) {
      setShowCancelConfirm(true)
      return
    }
    
    // No active game, start directly
    await doStartGame()
  }
  
  // Handle confirmation to cancel current game and start new one
  const handleConfirmCancelAndStart = async () => {
    setShowCancelConfirm(false)
    setIsStarting(true)
    
    const cancelled = await cancelActiveGame()
    if (cancelled) {
      await doStartGame()
    } else {
      setError('Failed to cancel current game')
      setIsStarting(false)
    }
  }
  
  return (
    <div className="relative">
      <button
        ref={(el) => {
          buttonRef.current = el
          refs.setReference(el)
        }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors ${
          isOpen 
            ? 'text-theme-500 dark:text-theme-600 bg-theme-100 dark:bg-theme-900/30' 
            : 'text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Start a game"
      >
        <PuzzlePieceIcon className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                {selectedGame ? selectedGame.title : 'Start a Game'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-300 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            
            {!selectedGame ? (
              /* Game Selection */
              <div className="py-2">
                {AVAILABLE_GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className="w-full px-4 py-3 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-700">
                      <game.Icon className="w-10 h-10" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                        {game.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 leading-relaxed">
                        {game.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Game Setup */
              <div className="p-4 space-y-4">
                {/* Game info */}
                <div className="flex items-center gap-4 pb-3 border-b border-gray-200 dark:border-dark-700">
                  <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-700">
                    <selectedGame.Icon className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                      {selectedGame.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {selectedGame.description}
                    </p>
                  </div>
                </div>
                
                {/* Word input (for hangman) */}
                {selectedGame.id === 'hangman' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-dark-300 mb-1">
                      Secret Word
                    </label>
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => setWord(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                      placeholder="Enter a word..."
                      maxLength={10}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50 placeholder-gray-400 dark:placeholder-dark-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-dark-400">
                      Up to 10 letters, no spaces. You'll select who goes first after starting.
                    </p>
                  </div>
                )}
                
                {/* Error message */}
                {error && (
                  <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
                )}
                
                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartGame}
                    disabled={isStarting || !word.trim()}
                    className="flex-1 px-3 py-2 text-sm text-white bg-theme-500 hover:bg-theme-600 dark:bg-theme-600 dark:hover:bg-theme-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? 'Starting...' : 'Start Game'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Confirmation dialog for cancelling active game */}
      <ConfirmationDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancel Current Game?"
        description="There's already an active game in this chat. Starting a new game will cancel the current one. Are you sure you want to continue?"
        type="delete"
        yesText="Cancel & Start New"
        cancelText="Keep Current Game"
        isYes={handleConfirmCancelAndStart}
      />
    </div>
  )
}
