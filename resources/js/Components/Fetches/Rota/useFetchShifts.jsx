import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchShifts = (startDate, endDate, hrId = null) => {
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout

  const fetchShifts = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 500);

      const response = await axios.get('/rota/shifts', {
        params: { start_date: startDate, end_date: endDate, hr_id: hrId },
        signal: controller.signal, // Attach the AbortController signal
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setShifts(response.data);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      // Ignore abort errors
      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching shifts:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController for each fetch

    // Debounce the fetchShifts call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchShifts(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, [startDate, endDate]); // Re-run when startDate or endDate changes

  return { shifts, isLoading, isLoaded };
};

export default useFetchShifts;