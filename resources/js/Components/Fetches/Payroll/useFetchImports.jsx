import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchImports = () => {
  const [imports, setImports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout

  const fetchImports = async (controller) => {
    let loadingTimeout;
    try {
      setIsLoading(true);

      const response = await axios.get('/payroll/imports/log', {
        signal: controller.signal, // Attach the AbortController signal
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setImports(response.data);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      // Ignore abort errors
      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching imports:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController for each fetch

    // Debounce the fetchImports call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchImports(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, []); // Re-run when startDate or endDate changes

  useEffect(() => {
    // Listen for the custom "refreshImports" event
    const handleRefresh = () => {
      const controller = new AbortController();
      fetchImports(controller);
    };
    window.addEventListener('refreshImports', handleRefresh);

    return () => {
      window.removeEventListener('refreshImports', handleRefresh); // Clean up listener
    };
  }, []);

  useEffect(() => {
    // Fetch imports every 60 seconds
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchImports(controller);
    }, 60000); // 60-second interval

    return () => {
      clearInterval(intervalId); // Clear the interval on cleanup
    };
  }, []); // Re-run when startDate or endDate changes

  return { imports, isLoading, isLoaded };
};

export default useFetchImports;