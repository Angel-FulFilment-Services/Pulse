import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import HangmanGame from './HangmanGame.jsx'

/**
 * Small Hangman icon for collapsed header
 */
const HangmanIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 56H24M18 56V12M18 12H42M42 12V18" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-gray-600 dark:text-gray-400"
    />
    <circle cx="42" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" className="text-theme-500 dark:text-theme-600" />
    <path d="M42 30V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-600" />
    <path d="M42 34L34 40M42 34L50 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-600" />
    <path d="M42 42L34 52M42 42L50 52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-600" />
  </svg>
)

/**
 * Active Game Display - shows the current game at the bottom of the chat
 * This component handles API calls and passes data to the specific game component
 */
export default function ActiveGameDisplay({
  teamId,
  currentUser,
  teamMembers = [],
  game,
  onGameUpdate,
  isMember = true,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const prevCurrentPlayerId = useRef(game?.current_player_id)
  
  // Auto-expand when it becomes user's turn
  useEffect(() => {
    if (!game || !currentUser || !isMember) return
    
    const isMyTurn = game.current_player_id === currentUser.id
    const wasMyTurn = prevCurrentPlayerId.current === currentUser.id
    
    // If it just became my turn (wasn't before, is now), expand
    if (isMyTurn && !wasMyTurn && isMinimized) {
      setIsMinimized(false)
    }
    
    prevCurrentPlayerId.current = game.current_player_id
  }, [game?.current_player_id, currentUser?.id, isMinimized, isMember])
  
  const getHeaders = () => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
    }
  }
  
  // Handle making a guess
  const handleGuess = useCallback(async (guess) => {
    if (!game?.id || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/chat/teams/${teamId}/games/${game.id}/guess`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({ guess })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        onGameUpdate?.(data.game)
        
        // Show toast for wrong word guesses
        if (data.guess_result && data.guess_result.guess?.length > 1 && !data.guess_result.is_correct) {
          toast.error(`Wrong word! "${data.guess_result.guess}" is not the answer.`, { autoClose: 3000 })
        }
      } else {
        toast.error(data.error || 'Failed to submit guess', { autoClose: 3000 })
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.', { autoClose: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }, [game?.id, teamId, isSubmitting, onGameUpdate])
  
  // Handle selecting next player
  const handleSelectNextPlayer = useCallback(async (playerId) => {
    if (!game?.id || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/chat/teams/${teamId}/games/${game.id}/next-player`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
        body: JSON.stringify({ player_id: playerId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        onGameUpdate?.(data.game)
      } else {
        toast.error(data.error || 'Failed to select player', { autoClose: 3000 })
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.', { autoClose: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }, [game?.id, teamId, isSubmitting, onGameUpdate])
  
  // Handle cancelling game
  const handleCancelGame = useCallback(async () => {
    if (!game?.id || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/chat/teams/${teamId}/games/${game.id}/cancel`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: getHeaders(),
      })
      
      if (response.ok) {
        onGameUpdate?.(null) // Clear the game
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to cancel game', { autoClose: 3000 })
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.', { autoClose: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }, [game?.id, teamId, isSubmitting, onGameUpdate])
  
  // Only show if game exists and is active
  if (!game || game.status !== 'active') return null
  
  const isMyTurn = isMember && game.current_player_id === currentUser?.id
  const gameData = game.game_data || {}
  const wrongGuesses = gameData.wrong_guesses || 0
  const maxWrongGuesses = gameData.max_wrong_guesses || 6
  
  // Collapsed/minimized view
  if (isMinimized) {
    return (
      <div className="border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-dark-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HangmanIcon className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-900 dark:text-dark-50">Hangman</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              In Progress
            </span>
            {isMyTurn && (
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full animate-pulse">
                Your turn!
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-dark-400">
              {wrongGuesses}/{maxWrongGuesses} wrong
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-300">
            Show
            <ChevronUpIcon className="w-4 h-4" />
          </span>
        </button>
      </div>
    )
  }
  
  // Render the appropriate game component based on game type
  switch (game.game_type) {
    case 'hangman':
      return (
        <div className="border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50">
          {/* Minimize button bar */}
          <button
            onClick={() => setIsMinimized(true)}
            className="w-full px-4 py-1.5 flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-dark-700/50 transition-colors border-b border-gray-200 dark:border-dark-700"
            title="Hide game"
          >
            <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-300">
              Hide
              <ChevronDownIcon className="w-4 h-4" />
            </span>
          </button>
          
          <div className="px-4 py-3">
            <HangmanGame
              game={game}
              currentUser={currentUser}
              teamMembers={teamMembers}
              onGuess={handleGuess}
              onSelectNextPlayer={handleSelectNextPlayer}
              onCancelGame={handleCancelGame}
              isSubmitting={isSubmitting}
              isMember={isMember}
            />
          </div>
        </div>
      )
    
    default:
      return (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-850">
          <div className="text-center text-sm text-gray-500 dark:text-dark-400">
            Unknown game type: {game.game_type}
          </div>
        </div>
      )
  }
}
