import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchRestrictedWords = (refreshTrigger = 0) => {
  const [restrictedWords, setRestrictedWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null);

  const fetchRestrictedWords = async (controller) => {
    let loadingTimeout;
    try {
      setIsLoading(true);

      const response = await axios.get('/api/administration/restricted-words', {
        signal: controller.signal,
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setRestrictedWords(response.data.restrictedWords);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching restricted words:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchRestrictedWords(controller);
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(debounceTimeout.current);
    };
  }, [refreshTrigger]);

  useEffect(() => {
    const handleRefresh = () => {
      const controller = new AbortController();
      fetchRestrictedWords(controller);
    };
    window.addEventListener('refreshRestrictedWords', handleRefresh);

    return () => {
      window.removeEventListener('refreshRestrictedWords', handleRefresh);
    };
  }, []);

  return { 
    restrictedWords, 
    isLoading, 
    isLoaded, 
    refetch: () => {
      const controller = new AbortController();
      fetchRestrictedWords(controller);
    } 
  };
};

export default useFetchRestrictedWords;
