import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchTimesheets = (startDate, endDate, hrId = null) => {
  const [timesheets, setTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout
  const latestDates = useRef({ startDate, endDate }); // Ref to store the latest startDate and endDate

  const fetchTimesheets = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 3000);

      const response = await axios.get('/rota/timesheets', {
        params: { start_date: latestDates.current.startDate, end_date: latestDates.current.endDate, hr_id: hrId },
        signal: controller.signal, // Attach the AbortController signal
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setTimesheets(response.data);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      // Ignore abort errors
      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching timesheets:', error);
      }
    }
  };

  useEffect(() => {
    // Update the latestDates ref whenever startDate or endDate changes
    latestDates.current = { startDate, endDate };
  }, [startDate, endDate]);

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController for each fetch

    // Debounce the fetchTimesheets call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchTimesheets(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, [startDate, endDate]); // Re-run when startDate or endDate changes

  useEffect(() => {
    // Listen for the custom "refreshTimesheets" event
    const handleRefresh = () => {
      const controller = new AbortController();
      fetchTimesheets(controller);
    };
    window.addEventListener('refreshTimesheets', handleRefresh);

    return () => {
      window.removeEventListener('refreshTimesheets', handleRefresh); // Clean up listener
    };
  }, []);

  useEffect(() => {
    // Fetch timesheets every 60 seconds
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchTimesheets(controller);
    }, 60000); // 60-second interval

    return () => {
      clearInterval(intervalId); // Clear the interval on cleanup
    };
  }, [startDate, endDate]); // Re-run when startDate or endDate changes

  return { timesheets, isLoading, isLoaded };
};

export default useFetchTimesheets;