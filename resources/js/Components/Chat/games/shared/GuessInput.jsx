import React, { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'

/**
 * Reusable guess input component for games
 */
export default function GuessInput({
  onSubmit,
  disabled = false,
  placeholder = "Type your guess...",
  validate,
  isSubmitting = false,
  maxLength = 50,
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  
  // Focus input when it becomes enabled (your turn)
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    const trimmedValue = value.trim().toUpperCase()
    if (!trimmedValue) return
    
    // Run validation if provided
    if (validate) {
      const validationError = validate(trimmedValue)
      if (validationError) {
        toast.warning(validationError, { autoClose: 2500 })
        return
      }
    }
    
    onSubmit?.(trimmedValue)
    setValue('')
  }
  
  const handleChange = (e) => {
    const newValue = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase()
    setValue(newValue)
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-colors border-gray-300 dark:border-dark-600 focus:ring-theme-500 focus:border-theme-500 ${
              disabled
                ? 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-500 cursor-not-allowed'
                : 'bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-50'
            } placeholder-gray-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2`}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || isSubmitting || !value.trim()}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            disabled || isSubmitting || !value.trim()
              ? 'bg-gray-200 dark:bg-dark-700 text-gray-400 dark:text-dark-500 cursor-not-allowed'
              : 'bg-theme-500 hover:bg-theme-600 dark:bg-theme-600 dark:hover:bg-theme-700 text-white'
          }`}
        >
          {isSubmitting ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            'Guess'
          )}
        </button>
      </div>
    </form>
  )
}
