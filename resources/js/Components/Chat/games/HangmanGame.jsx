import React, { useState } from 'react'
import { SparklesIcon, XCircleIcon } from '@heroicons/react/24/solid'
import TurnIndicator from './shared/TurnIndicator.jsx'
import GuessInput from './shared/GuessInput.jsx'
import GameControls from './shared/GameControls.jsx'

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
    <circle cx="42" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" className="text-theme-500 dark:text-theme-600" />
    {/* Body */}
    <path d="M42 30V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-600" />
    {/* Arms */}
    <path d="M42 34L34 40M42 34L50 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-600" />
    {/* Legs */}
    <path d="M42 42L34 52M42 42L50 52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-theme-500 dark:text-theme-600" />
  </svg>
)

/**
 * Hangman SVG that progressively reveals body parts based on wrong guesses
 * 0 = empty, 1 = head, 2 = body, 3 = left arm, 4 = right arm, 5 = left leg, 6 = right leg (game over)
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
 * For game master: shows actual word but grayed out until revealed
 */
const WordDisplay = ({ revealed = '', gameOver = false, actualWord = '', isGameMaster = false }) => {
  // Game master sees actual letters grayed out, others see underscores
  const letters = (actualWord || revealed).split('')
  
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {letters.map((letter, index) => {
        const isRevealed = revealed[index] !== '_'
        const showLetter = isRevealed || gameOver || isGameMaster
        
        return (
          <div
            key={index}
            className={`w-8 h-10 flex items-center justify-center border-b-2 ${
              isRevealed 
                ? 'border-theme-500 dark:border-theme-400'
                : gameOver && !isRevealed
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-400 dark:border-gray-500'
            }`}
          >
            <span className={`text-xl font-bold ${
              isRevealed
                ? 'text-gray-900 dark:text-dark-50'
                : gameOver && !isRevealed
                  ? 'text-red-500 dark:text-red-400'
                  : isGameMaster
                    ? 'text-gray-300 dark:text-dark-600'
                    : 'text-transparent'
            }`}>
              {showLetter ? letter : '_'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Display of already guessed letters
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
 * Display of wrong word guesses - positioned on the right side
 */
const WrongWordGuesses = ({ guesses = [] }) => {
  // Filter for wrong word guesses only (length > 1 and not correct)
  const wrongWords = guesses
    .filter(g => g.guess?.length > 1 && !g.is_correct)
    .sort((a, b) => a.guess.localeCompare(b.guess))
  
  if (wrongWords.length === 0) return null
  
  return (
    <div className="flex flex-col gap-1 items-start">
      {wrongWords.map((guess, index) => (
        <span
          key={index}
          className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through decoration-red-500 dark:decoration-red-400"
          title={`Guessed by ${guess.user_name}`}
        >
          {guess.guess}
        </span>
      ))}
    </div>
  )
}

/**
 * Main Hangman Game Component
 */
export default function HangmanGame({
  game,
  currentUser,
  teamMembers = [],
  onGuess,
  onSelectNextPlayer,
  onCancelGame,
  isSubmitting = false,
  isMember = true,
}) {
  const gameData = game?.game_data || {}
  const isActive = game?.status === 'active'
  const isMyTurn = isMember && game?.current_player_id === currentUser?.id
  const isGameMaster = isMember && game?.started_by === currentUser?.id
  const awaitingFirstPlayer = gameData.awaiting_first_player === true
  const wrongGuesses = gameData.wrong_guesses || 0
  const maxWrongGuesses = gameData.max_wrong_guesses || 6
  const revealed = gameData.revealed || ''
  const guessedLetters = gameData.guessed_letters || []
  const guesses = gameData.guesses || []
  const word = gameData.word || '' // Only visible to game master or when game is over
  const gameOver = !isActive
  const won = game?.winner_id !== null
  
  const handleGuess = (guess) => {
    if (!isActive || !isMyTurn || isSubmitting) return
    onGuess?.(guess.toUpperCase())
  }
  
  // Validate if a letter has already been guessed
  const validateGuess = (guess) => {
    if (guess.length === 1 && guessedLetters.includes(guess.toUpperCase())) {
      return 'Already guessed'
    }
    return null
  }
  
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-dark-600/50 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HangmanIcon className="w-5 h-5" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50">Hangman</h3>
          {isActive && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              In Progress
            </span>
          )}
          {gameOver && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
              won 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {won ? (
                <>
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Won!
                </>
              ) : (
                <>
                  <XCircleIcon className="w-3.5 h-3.5" />
                  Game Over
                </>
              )}
            </span>
          )}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-dark-400">
          {wrongGuesses}/{maxWrongGuesses} wrong
        </div>
      </div>
      
      {/* Game Content */}
      <div className="p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Hangman Figure row - with wrong words on right */}
          <div className="flex items-center justify-center gap-6 w-full">
            {/* Spacer for balance */}
            <div className="w-20 flex-shrink-0" />
            
            {/* Hangman Figure - centered */}
            <div className="w-32 h-28 flex-shrink-0">
              <HangmanFigure wrongGuesses={wrongGuesses} />
            </div>
            
            {/* Wrong Word Guesses - to the right of hangman, only during active game */}
            <div className="w-20 flex-shrink-0">
              {isActive && <WrongWordGuesses guesses={guesses} />}
            </div>
          </div>
          
          {/* Word Display - centered below figure */}
          <WordDisplay 
            revealed={revealed} 
            gameOver={gameOver} 
            actualWord={word}
            isGameMaster={isGameMaster}
          />
          
          {/* Guessed Letters */}
          <GuessedLetters letters={guessedLetters} word={word || revealed.replace(/_/g, '')} />
        </div>
        
        {/* Turn Indicator - below the game area */}
        {isActive && (
          <div className="mt-6 flex justify-center">
            <TurnIndicator
              currentPlayer={game?.current_player}
              isMyTurn={isMyTurn}
              awaitingFirstPlayer={awaitingFirstPlayer}
              isGameMaster={isGameMaster}
            />
          </div>
        )}
            
        {/* Winner display */}
        {gameOver && won && game?.winner && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-dark-400">
              <span className="font-semibold text-theme-500 dark:text-theme-600">
                {game.winner.name}
              </span>
              {' '}guessed the word! (+{game.points_awarded || 10} points)
            </p>
          </div>
        )}
        
        {/* Input and Controls */}
        {isActive && isMember && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              {/* Guess Input */}
              <div className="flex-1">
                <GuessInput
                  onSubmit={handleGuess}
                  disabled={!isMyTurn || isSubmitting || awaitingFirstPlayer}
                  placeholder={awaitingFirstPlayer ? "Waiting for game master to select first player..." : (isMyTurn ? "Type a letter or guess the word..." : "Waiting for your turn...")}
                  validate={validateGuess}
                  isSubmitting={isSubmitting}
                />
              </div>
              
              {/* Game Controls for game master */}
              {isGameMaster && (
                <GameControls
                  teamMembers={teamMembers}
                  currentPlayerId={game?.current_player_id}
                  onSelectNextPlayer={onSelectNextPlayer}
                  onCancelGame={onCancelGame}
                  disabled={isSubmitting}
                />
              )}
            </div>
          </div>
        )}
        
        {/* Spy mode indicator */}
        {isActive && !isMember && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
            <p className="text-center text-sm text-gray-500 dark:text-dark-400 italic">
              Viewing as spectator
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
