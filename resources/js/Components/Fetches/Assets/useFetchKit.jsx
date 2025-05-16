import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchKit = (hrId = null) => {
  const [kit, setKit] = useState([]);
  const [responses, setResponses] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout

  const fetchKit = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 3000);

      const response = await axios.get('/asset-management/support/kit', {
        params: { hr_id: hrId },
        signal: controller.signal, // Attach the AbortController signal
      });

      console.log(response.data);

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setKit(response.data.items);
      setResponses(response.data.response);
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

    // Debounce the fetchKit call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchKit(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, [hrId]); // Re-run when hrId changes

  useEffect(() => {
    // Fetch kit every 60 seconds
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchKit(controller);
    }, 60000); // 60-second interval

    return () => {
      clearInterval(intervalId); // Clear the interval on cleanup
    };
  }, [hrId]); // Re-run when hrId changes

  return { kit, responses, isLoading, isLoaded };
};

export default useFetchKit;