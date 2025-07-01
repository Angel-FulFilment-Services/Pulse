import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchAssets = (available = null) => {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout

  const fetchAssets = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 3000);

      const response = await axios.get('/asset-management/assets', {
        signal: controller.signal, // Attach the AbortController signal
        params: {
          available,
        },
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setAssets(response.data);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      // Ignore abort errors
      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching kiit:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController for each fetch

    // Debounce the fetchAssets call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchAssets(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, [available]); // Re-run when available changes

  useEffect(() => {
    // Fetch assets every 60 seconds
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchAssets(controller);
    }, 60000); // 60-second interval

    return () => {
      clearInterval(intervalId); // Clear the interval on cleanup
    };
  }, [available]); // Re-run when available changes

  return { assets, isLoading, isLoaded };
};

export default useFetchAssets;