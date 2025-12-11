import { useRef, useEffect } from 'react'
import axios from 'axios'

const restrictedWordsCache = {
  words: [],
  lastFetchTime: null,
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// Leet speak / number substitution map
const LEET_MAP = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  '$': 's',
  '!': 'i',
}

/**
 * Luhn algorithm to validate credit card numbers
 */
const luhnCheck = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, '')
  
  if (digits.length < 13 || digits.length > 19) {
    return false
  }
  
  let sum = 0
  let isEven = false
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Check if text contains credit card numbers
 */
const containsCreditCard = (text) => {
  // Remove common separators to check continuous digits
  const cleanText = text.replace(/[\s\-_.]/g, '')
  
  // Pattern for potential credit card numbers (13-19 digits)
  // Matches sequences of 13-19 digits that might be separated by spaces, dashes, or dots
  const cardPatterns = [
    /\b\d{13,19}\b/g, // Continuous digits
    /\b\d{4}[\s\-_.]\d{4}[\s\-_.]\d{4}[\s\-_.]\d{4}\b/g, // 4-4-4-4 format
    /\b\d{4}[\s\-_.]\d{6}[\s\-_.]\d{5}\b/g, // 4-6-5 format (Amex)
  ]
  
  for (const pattern of cardPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      for (const match of matches) {
        const digits = match.replace(/\D/g, '')
        if (luhnCheck(digits)) {
          return true
        }
      }
    }
  }
  
  // Also check in cleaned text
  const cleanMatches = cleanText.match(/\d{13,19}/g)
  if (cleanMatches) {
    for (const match of cleanMatches) {
      if (luhnCheck(match)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Normalize text to detect leet speak variations
 * Converts numbers and symbols back to letters
 */
const normalizeLeetSpeak = (text) => {
  let normalized = text.toLowerCase()
  
  // Replace leet speak characters with their letter equivalents
  Object.keys(LEET_MAP).forEach(leetChar => {
    const regex = new RegExp(leetChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    normalized = normalized.replace(regex, LEET_MAP[leetChar])
  })
  
  return normalized
}

/**
 * Hook for managing restricted words filtering
 */
export function useRestrictedWords() {
  const intervalRef = useRef(null)

  /**
   * Fetch restricted words from API
   */
  const fetchRestrictedWords = async () => {
    try {
      const response = await axios.get('/api/chat/restricted-words')
      restrictedWordsCache.words = response.data.words || []
      restrictedWordsCache.lastFetchTime = Date.now()
      console.log(`Loaded ${restrictedWordsCache.words.length} restricted words`)
    } catch (error) {
      console.error('Failed to fetch restricted words:', error)
    }
  }

  /**
   * Ensure restricted words are loaded and fresh
   */
  const ensureWordsLoaded = async () => {
    const now = Date.now()
    const shouldRefetch = !restrictedWordsCache.lastFetchTime || 
                          (now - restrictedWordsCache.lastFetchTime) > CACHE_DURATION
    
    if (shouldRefetch) {
      await fetchRestrictedWords()
    }
  }

  /**
   * Filter restricted words from text based on their levels
   * @param {string} text - The text to filter
   * @returns {object} - { filteredText: string, blocked: boolean, blockedWords: array }
   */
  const filterRestrictedWords = (text) => {
    if (!text) {
      return { filteredText: text, blocked: false, blockedWords: [] }
    }

    // Check for credit card numbers first (always block)
    if (containsCreditCard(text)) {
      return { 
        filteredText: text, 
        blocked: true, 
        blockedWords: ['credit card number'] 
      }
    }

    if (restrictedWordsCache.words.length === 0) {
      return { filteredText: text, blocked: false, blockedWords: [] }
    }

    let filteredText = text
    const blockedWords = []
    const normalizedText = normalizeLeetSpeak(text)
    
    // Group words by level
    const level1Words = [] // Star out
    const level2Words = [] // Remove
    const level3Words = [] // Block

    // Sort by length (longest first) to handle compound words and phrases properly
    const sortedWords = [...restrictedWordsCache.words].sort((a, b) => b.word.length - a.word.length)

    // First pass: detect blocked words and categorize
    sortedWords.forEach(wordObj => {
      const word = wordObj.word
      const level = wordObj.level || 1
      const substitution = wordObj.substitution
      
      const normalizedWord = word.toLowerCase()
      
      // Check if it's a multi-word phrase (contains spaces) or single word
      const isPhrase = word.includes(' ')
      
      // Build a regex pattern that matches both normal and leet speak
      let pattern = ''
      for (let char of normalizedWord) {
        // Find all leet variations of this character
        const leetVariations = Object.keys(LEET_MAP).filter(k => LEET_MAP[k] === char)
        if (leetVariations.length > 0) {
          pattern += `[${char}${leetVariations.join('')}]`
        } else {
          // Escape special regex characters
          pattern += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }
      }
      
      // For phrases, match anywhere; for single words, use word boundaries
      const regexPattern = isPhrase ? pattern : `\\b${pattern}\\b`
      const regex = new RegExp(regexPattern, 'gi')
      
      // Check if the word/phrase exists in the text
      if (regex.test(text)) {
        if (level === 3) {
          level3Words.push({ word, substitution })
          blockedWords.push(word)
        } else if (level === 2) {
          level2Words.push({ word, substitution })
        } else {
          level1Words.push({ word, substitution })
        }
      }
    })

    // If any level 3 words found, block the entire message
    if (level3Words.length > 0) {
      return { 
        filteredText: text, 
        blocked: true, 
        blockedWords: blockedWords 
      }
    }

    // Process level 2 words (remove or substitute)
    level2Words.forEach(wordObj => {
      const word = wordObj.word
      const substitution = wordObj.substitution
      
      // Create a regex that also matches leet speak variations
      const normalizedWord = word.toLowerCase()
      
      // Check if it's a multi-word phrase
      const isPhrase = word.includes(' ')
      
      // Build a regex pattern that matches both normal and leet speak
      let pattern = ''
      for (let char of normalizedWord) {
        // Find all leet variations of this character
        const leetVariations = Object.keys(LEET_MAP).filter(k => LEET_MAP[k] === char)
        if (leetVariations.length > 0) {
          pattern += `[${char}${leetVariations.join('')}]`
        } else {
          // Escape special regex characters
          pattern += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }
      }
      
      // For phrases, match anywhere; for single words, use word boundaries
      const regexPattern = isPhrase ? pattern : `\\b${pattern}\\b`
      const regex = new RegExp(regexPattern, 'gi')
      
      // If substitution provided, replace with it; otherwise remove
      if (substitution) {
        filteredText = filteredText.replace(regex, substitution)
      } else {
        // Remove the word and clean up extra spaces
        filteredText = filteredText.replace(regex, '').replace(/\s+/g, ' ').trim()
      }
    })

    // Process level 1 words (replace with asterisks or substitute)
    level1Words.forEach(wordObj => {
      const word = wordObj.word
      const substitution = wordObj.substitution
      
      const normalizedWord = word.toLowerCase()
      
      // Check if it's a multi-word phrase
      const isPhrase = word.includes(' ')
      
      // Build a regex pattern that matches both normal and leet speak
      let pattern = ''
      for (let char of normalizedWord) {
        const leetVariations = Object.keys(LEET_MAP).filter(k => LEET_MAP[k] === char)
        if (leetVariations.length > 0) {
          pattern += `[${char}${leetVariations.join('')}]`
        } else {
          // Escape special regex characters
          pattern += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }
      }
      
      // For phrases, match anywhere; for single words, use word boundaries
      const regexPattern = isPhrase ? pattern : `\\b${pattern}\\b`
      const regex = new RegExp(regexPattern, 'gi')
      
      // If substitution provided, use it; otherwise replace with asterisks
      if (substitution) {
        filteredText = filteredText.replace(regex, substitution)
      } else {
        // Replace with asterisks of same length
        filteredText = filteredText.replace(regex, (match) => {
          return '*'.repeat(match.length)
        })
      }
    })

    // Check if message is empty after filtering (only whitespace or empty)
    if (!filteredText.trim()) {
      return { 
        filteredText: text, 
        blocked: true, 
        blockedWords: ['message contains only restricted content'] 
      }
    }

    return { 
      filteredText, 
      blocked: false, 
      blockedWords: [] 
    }
  }

  /**
   * Check if text contains any restricted words
   * @param {string} text - The text to check
   * @returns {boolean} - True if text contains restricted words
   */
  const containsRestrictedWords = (text) => {
    if (!text || restrictedWordsCache.words.length === 0) return false

    const normalizedText = normalizeLeetSpeak(text)
    
    return restrictedWordsCache.words.some(wordObj => {
      const regex = new RegExp(`\\b${wordObj.word}\\b`, 'i')
      return regex.test(text) || regex.test(normalizedText)
    })
  }

  // Start periodic refresh when hook is mounted
  useEffect(() => {
    // Initial fetch
    ensureWordsLoaded()
    
    // Set up interval to refresh every 5 minutes
    intervalRef.current = setInterval(() => {
      fetchRestrictedWords()
    }, CACHE_DURATION)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    filterRestrictedWords,
    containsRestrictedWords,
    ensureWordsLoaded,
  }
}
