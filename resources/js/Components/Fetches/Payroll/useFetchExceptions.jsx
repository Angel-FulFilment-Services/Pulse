import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchExceptions = (startDate, endDate, hrId = null) => {
  const [exceptions, setExceptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout
  const latestDates = useRef({ startDate, endDate }); // Ref to store the latest startDate and endDate

  const fetchExceptions = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      setIsLoading(true);

      const response = await axios.get('/payroll/exports/exceptions', {
        params: { start_date: latestDates.current.startDate, end_date: latestDates.current.endDate, hr_id: hrId },
        signal: controller.signal, // Attach the AbortController signal
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setExceptions(response.data);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      // Ignore abort errors
      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching exceptions:', error);
      }
    }
  };

  useEffect(() => {
    // Update the latestDates ref whenever startDate or endDate changes
    latestDates.current = { startDate, endDate };
  }, [startDate, endDate]);

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController for each fetch

    // Debounce the fetchExceptions call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchExceptions(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, [startDate, endDate]); // Re-run when startDate or endDate changes

  useEffect(() => {
    // Listen for the custom "refreshExceptions" event
    const handleRefresh = () => {
      const controller = new AbortController();
      fetchExceptions(controller);
    };
    window.addEventListener('refreshExceptions', handleRefresh);

    return () => {
      window.removeEventListener('refreshExceptions', handleRefresh); // Clean up listener
    };
  }, []);

  useEffect(() => {
    // Fetch exceptions every 60 seconds
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchExceptions(controller);
    }, 60000); // 60-second interval

    return () => {
      clearInterval(intervalId); // Clear the interval on cleanup
    };
  }, [startDate, endDate]); // Re-run when startDate or endDate changes

  return { exceptions, isLoading, isLoaded };
};

export default useFetchExceptions;