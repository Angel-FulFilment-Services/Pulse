import { useRef, useEffect } from 'react'
import axios from 'axios'

const restrictedWordsCache = {
  words: [],
  lastFetchTime: null,
}

// Dictionary cache for legitimate words
const dictionaryCache = {
  words: null, // Will be a Set for O(1) lookup
  loaded: false,
  loading: false,
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
 * Check if a word exists in the English dictionary
 * @param {string} word - The word to check
 * @returns {boolean} - True if word is in dictionary
 */
const isLegitimateWord = (word) => {
  if (!dictionaryCache.loaded || !dictionaryCache.words) {
    return true // If dictionary not loaded, assume legitimate to avoid false positives
  }
  return dictionaryCache.words.has(word.toLowerCase())
}

/**
 * Load the English dictionary for word validation
 */
const loadDictionary = async () => {
  if (dictionaryCache.loaded || dictionaryCache.loading) return
  
  dictionaryCache.loading = true
  try {
    const response = await axios.get('/js/data/english-dictionary.json')
    dictionaryCache.words = new Set(response.data)
    dictionaryCache.loaded = true
  } catch (error) {
    console.error('Failed to load dictionary:', error)
    // Continue without dictionary - will only use word boundary matching
  } finally {
    dictionaryCache.loading = false
  }
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
    
    // Also load dictionary if not already loaded
    await loadDictionary()
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
      // Word boundaries ensure we only match whole words, not substrings
      // e.g., "ass" won't match "assigned", "class", "assessment", etc.
      const regexPattern = isPhrase ? pattern : `\\b${pattern}\\b`
      const regex = new RegExp(regexPattern, 'gi')
      
      // Check if the word/phrase exists in the text (exact match)
      const hasMatch = regex.test(text)
      
      // Also check for compound words containing the restricted word
      // but only flag if the compound word is NOT in the dictionary
      let hasEmbeddedBypass = false
      if (!isPhrase && dictionaryCache.loaded) {
        // Find words that contain the restricted pattern
        const embeddedPattern = `\\b(\\w*${pattern}\\w*|\\w+${pattern}|${pattern}\\w+)\\b`
        const embeddedRegex = new RegExp(embeddedPattern, 'gi')
        const matches = text.match(embeddedRegex) || []
        
        for (const match of matches) {
          // Skip if it's an exact match (already handled above)
          if (match.toLowerCase() === normalizedWord) continue
          
          // Check if this compound word is in the dictionary
          if (!isLegitimateWord(match)) {
            hasEmbeddedBypass = true
            break
          }
        }
      }
      
      // Build the pattern for replacement - include embedded pattern if bypass detected
      const effectivePattern = hasEmbeddedBypass 
        ? `\\b(\\w*${pattern}\\w*|\\w+${pattern}|${pattern}\\w+)\\b`
        : regexPattern
      
      if (hasMatch || hasEmbeddedBypass) {
        if (level === 3) {
          level3Words.push({ word, substitution, pattern: effectivePattern })
          blockedWords.push(word)
        } else if (level === 2) {
          level2Words.push({ word, substitution, pattern: effectivePattern })
        } else {
          level1Words.push({ word, substitution, pattern: effectivePattern })
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
      const pattern = wordObj.pattern
      
      // Use the pattern determined during detection
      const regex = new RegExp(pattern, 'gi')
      
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
      const pattern = wordObj.pattern
      
      // Use the pattern determined during detection
      const regex = new RegExp(pattern, 'gi')
      
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
