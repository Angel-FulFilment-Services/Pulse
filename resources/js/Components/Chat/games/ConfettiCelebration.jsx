import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrophyIcon } from '@heroicons/react/24/solid'

const CONFETTI_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFEAA7', // Yellow
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#FF69B4', // Hot Pink
]

export default function ConfettiCelebration({ 
  winner, 
  gameName = 'Hangman', 
  onComplete,
  show = false 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setShowText(true)
      // Start fading out the text after 2.5 seconds
      const textTimer = setTimeout(() => {
        setShowText(false)
      }, 2500)
      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 4000)
      return () => {
        clearTimeout(timer)
        clearTimeout(textTimer)
      }
    }
  }, [show, onComplete])

  const confettiPieces = useMemo(() => {
    if (!isVisible) return []
    
    return Array.from({ length: 40 }).map((_, i) => {
      // Spread angle: mostly downward (60° to 120° from horizontal, where 90° is straight down)
      // But also some wider spread (30° to 150°)
      const baseAngle = 60 + Math.random() * 60 // 60-120 degrees (mostly downward)
      const wideAngle = 30 + Math.random() * 120 // 30-150 degrees (wider spread)
      const angle = Math.random() > 0.3 ? baseAngle : wideAngle
      
      // Convert to radians and calculate trajectory
      const angleRad = (angle * Math.PI) / 180
      const distance = 250 + Math.random() * 300 // Slightly shorter distance
      const endX = Math.cos(angleRad) * distance * (Math.random() > 0.5 ? 1 : -1) // Spread left and right
      const endY = Math.sin(angleRad) * distance // Always positive (downward)
      
      // Random confetti properties
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
      const size = 8 + Math.random() * 6 // Slightly larger, less variation
      const rotation = Math.random() * 360
      const rotationEnd = rotation + (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360) // Less rotation
      const delay = Math.random() * 0.1 // Even shorter stagger
      const duration = 1.2 + Math.random() * 0.6 // Shorter duration
      
      return {
        id: i,
        endX,
        endY,
        color,
        size,
        rotation,
        rotationEnd,
        delay,
        duration,
      }
    })
  }, [isVisible])

  // Wrapper component that creates the positioning context
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="relative w-full h-0 overflow-visible pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Container for confetti with fixed height */}
          <div className="absolute inset-x-0 top-0 h-[800px] overflow-hidden">
            {/* Burst origin point - top center */}
            <div 
              className="absolute"
              style={{
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '1px',
                height: '1px',
              }}
            >
              {confettiPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  className="absolute will-change-transform"
                  style={{
                    width: `${piece.size}px`,
                    height: `${piece.size * 0.6}px`,
                    backgroundColor: piece.color,
                    borderRadius: '2px',
                    left: '0',
                    top: '0',
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1, 
                    rotate: piece.rotation,
                  }}
                  animate={{
                    x: piece.endX,
                    y: piece.endY,
                    opacity: 0,
                    rotate: piece.rotationEnd,
                  }}
                  transition={{
                    duration: piece.duration,
                    delay: piece.delay,
                    ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for smooth deceleration
                    opacity: {
                      duration: piece.duration * 0.4,
                      delay: piece.delay + piece.duration * 0.6,
                    },
                  }}
                />
              ))}
            </div>

            {/* Winner announcement - slides down from top center */}
            <AnimatePresence>
              {showText && (
                <motion.div
                  className="absolute top-0 left-1/2 pt-4"
                  initial={{ opacity: 0, y: -50, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: -30, x: '-50%' }}
                  transition={{ 
                    duration: 0.5,
                    ease: 'easeOut',
                  }}
                >
                  <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 px-6 py-4 flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-theme-100 dark:bg-theme-900/30 flex items-center justify-center">
                      <TrophyIcon className="w-6 h-6 text-theme-500 dark:text-theme-600" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-dark-50 whitespace-nowrap">
                        {winner} wins!
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-dark-400">
                        Won the game of {gameName}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
