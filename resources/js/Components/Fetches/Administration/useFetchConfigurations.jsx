import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchConfigurations = (category, refreshTrigger = 0) => {
  const [configurations, setConfigurations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout

  const fetchConfigurations = async (controller) => {
    let loadingTimeout;
    try {
      setIsLoading(true);

      const response = await axios.get('/administration/angel-gift/configurations', {
        signal: controller.signal, // Attach the AbortController signal
        params: {
          category, // Include the tab parameter in the request
        },
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setConfigurations(response.data.configurations);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      // Ignore abort errors
      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching configurations:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController for each fetch

    // Debounce the fetchConfigurations call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchConfigurations(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, [category, refreshTrigger]); // Re-run when category or refreshTrigger changes

  useEffect(() => {
    // Listen for the custom "refreshConfigurations" event
    const handleRefresh = () => {
      const controller = new AbortController();
      fetchConfigurations(controller);
    };
    window.addEventListener('refreshConfigurations', handleRefresh);

    return () => {
      window.removeEventListener('refreshConfigurations', handleRefresh); // Clean up listener
    };
  }, []);

  useEffect(() => {
    // Fetch configurations every 60 seconds
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchConfigurations(controller);
    }, 60000); // 60-second interval

    return () => {
      clearInterval(intervalId); // Clear the interval on cleanup
    };
  }, []); // Re-run when startDate or endDate changes

  return { configurations, isLoading, isLoaded, refetch: () => {
    const controller = new AbortController();
    fetchConfigurations(controller);
  } };
};

export default useFetchConfigurations;