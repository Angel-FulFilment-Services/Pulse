import React from 'react'

/**
 * Reusable turn indicator component for games
 */
export default function TurnIndicator({ currentPlayer, isMyTurn, awaitingFirstPlayer = false, isGameMaster = false }) {
  // Awaiting first player selection
  if (awaitingFirstPlayer) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="font-medium">
          {isGameMaster ? 'Select who goes first' : 'Waiting for game master to select first player...'}
        </span>
      </div>
    )
  }
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      isMyTurn
        ? 'bg-theme-100 dark:bg-theme-900/30 text-theme-700 dark:text-theme-300'
        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400'
    }`}>
      {isMyTurn ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-theme-500"></span>
          </span>
          <span className="font-medium">Your turn!</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-dark-500"></span>
          <span>
            Waiting for <span className="font-medium">{currentPlayer?.name || 'player'}</span>
          </span>
        </>
      )}
    </div>
  )
}
