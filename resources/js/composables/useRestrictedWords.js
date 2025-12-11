import { ref } from 'vue'
import axios from 'axios'

const restrictedWords = ref([])
const lastFetchTime = ref(null)
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Composable for managing restricted words filtering
 */
export function useRestrictedWords() {
  /**
   * Fetch restricted words from API
   */
  const fetchRestrictedWords = async () => {
    try {
      const response = await axios.get('/api/chat/restricted-words')
      restrictedWords.value = response.data.words || []
      lastFetchTime.value = Date.now()
      console.log(`Loaded ${restrictedWords.value.length} restricted words`)
    } catch (error) {
      console.error('Failed to fetch restricted words:', error)
    }
  }

  /**
   * Ensure restricted words are loaded and fresh
   */
  const ensureWordsLoaded = async () => {
    const now = Date.now()
    const shouldRefetch = !lastFetchTime.value || (now - lastFetchTime.value) > CACHE_DURATION
    
    if (shouldRefetch) {
      await fetchRestrictedWords()
    }
  }

  /**
   * Filter restricted words from text
   * @param {string} text - The text to filter
   * @returns {string} - The filtered text with restricted words replaced by asterisks
   */
  const filterRestrictedWords = (text) => {
    if (!text || restrictedWords.value.length === 0) return text

    let filteredText = text

    // Sort by length (longest first) to handle compound words properly
    const sortedWords = [...restrictedWords.value].sort((a, b) => b.length - a.length)

    sortedWords.forEach(word => {
      // Create regex that matches the word as whole word or part of word
      // Case insensitive, with word boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      
      // Replace with asterisks of same length
      filteredText = filteredText.replace(regex, (match) => {
        return '*'.repeat(match.length)
      })
    })

    return filteredText
  }

  /**
   * Check if text contains any restricted words
   * @param {string} text - The text to check
   * @returns {boolean} - True if text contains restricted words
   */
  const containsRestrictedWords = (text) => {
    if (!text || restrictedWords.value.length === 0) return false

    const lowerText = text.toLowerCase()
    
    return restrictedWords.value.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i')
      return regex.test(lowerText)
    })
  }

  /**
   * Start periodic refresh of restricted words
   */
  const startPeriodicRefresh = () => {
    // Initial fetch
    ensureWordsLoaded()
    
    // Set up interval to refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchRestrictedWords()
    }, CACHE_DURATION)

    // Return cleanup function
    return () => clearInterval(intervalId)
  }

  return {
    restrictedWords,
    fetchRestrictedWords,
    ensureWordsLoaded,
    filterRestrictedWords,
    containsRestrictedWords,
    startPeriodicRefresh,
  }
}
