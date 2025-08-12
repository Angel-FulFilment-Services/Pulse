import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchArticles = () => {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout

  const fetchArticles = async (controller) => {
    let loadingTimeout;
    try {
      setIsLoading(true);
    
      const response = await axios.get('/knowledge-base/articles', {
        signal: controller.signal, // Attach the AbortController signal
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setArticles(response.data.articles);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      // Ignore abort errors
      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching articles:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController for each fetch

    // Debounce the fetchArticles call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchArticles(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, []); // Re-run when startDate or endDate changes

  useEffect(() => {
    // Listen for the custom "refreshArticles" event
    const handleRefresh = () => {
      const controller = new AbortController();
      fetchArticles(controller);
    };
    window.addEventListener('refreshArticles', handleRefresh);

    return () => {
      window.removeEventListener('refreshArticles', handleRefresh); // Clean up listener
    };
  }, []);

  useEffect(() => {
    // Fetch imports every 60 seconds
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchArticles(controller);
    }, 60000); // 60-second interval

    return () => {
      clearInterval(intervalId); // Clear the interval on cleanup
    };
  }, []); // Re-run when startDate or endDate changes

  return { articles, isLoading, isLoaded };
};

export default useFetchArticles;