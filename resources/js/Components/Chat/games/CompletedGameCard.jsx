import React from 'react'
import { SparklesIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid'

/**
 * Small Hangman icon for header
 */
const HangmanIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Gallows */}
    <path 
      d="M12 56H24M18 56V12M18 12H42M42 12V18" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-gray-600 dark:text-gray-400"
    />
    {/* Head */}
    <circle cx="42" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" className="text-theme-500 dark:text-theme-400" />
    {/* Body */}
    <path d="M42 30V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-400" />
    {/* Arms */}
    <path d="M42 34L34 40M42 34L50 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-400" />
    {/* Legs */}
    <path d="M42 42L34 52M42 42L50 52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-400" />
  </svg>
)

/**
 * Hangman SVG figure for completed games
 */
const HangmanFigure = ({ wrongGuesses = 0 }) => (
  <svg viewBox="0 0 100 120" className="w-full h-full max-w-[140px] mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Gallows base */}
    <path 
      d="M10 110 H50" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round"
      className="text-gray-600 dark:text-gray-500"
    />
    {/* Gallows vertical */}
    <path 
      d="M30 110 V15" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round"
      className="text-gray-600 dark:text-gray-500"
    />
    {/* Gallows top beam */}
    <path 
      d="M30 15 H70" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round"
      className="text-gray-600 dark:text-gray-500"
    />
    {/* Rope */}
    <path 
      d="M70 15 V35" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      className="text-amber-700 dark:text-amber-600"
    />
    
    {/* Head - shows at 1 wrong guess */}
    {wrongGuesses >= 1 && (
      <circle 
        cx="70" 
        cy="45" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="3"
        fill="none"
        className="text-theme-500 dark:text-theme-600"
      />
    )}
    
    {/* Body - shows at 2 wrong guesses */}
    {wrongGuesses >= 2 && (
      <path 
        d="M70 55 V80" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
        className="text-theme-500 dark:text-theme-600"
      />
    )}
    
    {/* Left arm - shows at 3 wrong guesses */}
    {wrongGuesses >= 3 && (
      <path 
        d="M70 62 L55 72" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
        className="text-theme-500 dark:text-theme-600"
      />
    )}
    
    {/* Right arm - shows at 4 wrong guesses */}
    {wrongGuesses >= 4 && (
      <path 
        d="M70 62 L85 72" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
        className="text-theme-500 dark:text-theme-600"
      />
    )}
    
    {/* Left leg - shows at 5 wrong guesses */}
    {wrongGuesses >= 5 && (
      <path 
        d="M70 80 L55 98" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
        className="text-theme-500 dark:text-theme-600"
      />
    )}
    
    {/* Right leg - shows at 6 wrong guesses (game over!) */}
    {wrongGuesses >= 6 && (
      <path 
        d="M70 80 L85 98" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
        className="text-red-500 dark:text-red-400"
      />
    )}
  </svg>
)

/**
 * Word display with revealed and hidden letters
 */
const WordDisplay = ({ word = '', revealed = '' }) => {
  const letters = word.split('')
  
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {letters.map((letter, index) => {
        const wasRevealed = revealed[index] !== '_'
        return (
          <div
            key={index}
            className={`w-8 h-10 flex items-center justify-center border-b-2 ${
              wasRevealed 
                ? 'border-theme-500 dark:border-theme-600'
                : 'border-red-400 dark:border-red-500'
            }`}
          >
            <span className={`text-xl font-bold ${
              wasRevealed
                ? 'text-gray-900 dark:text-dark-50'
                : 'text-red-500 dark:text-red-400'
            }`}>
              {letter}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Display of guessed letters
 */
const GuessedLetters = ({ letters = [], word = '' }) => {
  if (letters.length === 0) return null
  
  return (
    <div className="flex flex-wrap justify-center gap-1.5 mt-4">
      {letters.sort().map((letter) => {
        const isCorrect = word.includes(letter)
        return (
          <span
            key={letter}
            className={`px-2 py-0.5 text-sm font-medium rounded ${
              isCorrect
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {letter}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Completed Game Card - displays a finished game in the chat timeline
 */
export default function CompletedGameCard({ game, currentUser }) {
  if (!game) return null
  
  const gameData = game.game_data || {}
  const won = game.winner_id !== null
  const isCurrentUserWinner = currentUser && game.winner_id === currentUser.id
  const wrongGuesses = gameData.wrong_guesses || 0
  const maxWrongGuesses = gameData.max_wrong_guesses || 6
  const word = gameData.word || ''
  const revealed = gameData.revealed || ''
  const guessedLetters = gameData.guessed_letters || []
  const winnerName = game.winner?.name || 'Unknown'
  const pointsAwarded = game.points_awarded || 10
  
  return (
    <div className="my-4 flex justify-center">
      <div className="w-full max-w-lg bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-dark-600/50 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HangmanIcon className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50">Hangman</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
              won 
                ? isCurrentUserWinner
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-theme-100 dark:bg-theme-900/30 text-theme-700 dark:text-theme-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {won ? (
                isCurrentUserWinner ? (
                  <>
                    <SparklesIcon className="w-3.5 h-3.5" />
                    Won!
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Complete
                  </>
                )
              ) : (
                <>
                  <XCircleIcon className="w-3.5 h-3.5" />
                  Game Over
                </>
              )}
            </span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-dark-400">
            {wrongGuesses}/{maxWrongGuesses} wrong
          </div>
        </div>
        
        {/* Game Content */}
        <div className="p-6">
          <div className="flex flex-col items-center gap-4">
            {/* Hangman Figure - centered */}
            <div className="w-32 h-28">
              <HangmanFigure wrongGuesses={wrongGuesses} />
            </div>
            
            {/* Word Display - centered below figure */}
            <WordDisplay word={word} revealed={revealed} />
            
            {/* Guessed Letters */}
            <GuessedLetters letters={guessedLetters} word={word} />
          </div>
          
          {/* Winner display */}
          <div className="mt-4 text-center">
            {won ? (
              <p className="text-sm text-gray-600 dark:text-dark-400">
                <span className="font-semibold text-theme-500 dark:text-theme-600">
                  {winnerName}
                </span>
                {' '}guessed the word! (+{pointsAwarded} points)
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-dark-400">
                Better luck next time!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
