import { useState, useEffect } from 'react';
import axios from 'axios';

const useFetchTimesheets = (startDate, endDate) => {
  const [timesheets, setTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTimesheets = async () => {
      let loadingTimeout;

      try {
        loadingTimeout = setTimeout(() => {
          setIsLoading(true);
        }, 3000);

        const response = await axios.get('/api/rota/timesheets', {
          params: { start_date: startDate, end_date: endDate },
        });
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        setTimesheets(response.data);
      } catch (error) {
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        console.error('Error fetching timesheets:', error);
      }
    };

    fetchTimesheets();

    const intervalId = setInterval(fetchTimesheets, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [startDate, endDate]);

  return { timesheets, isLoading };
};

export default useFetchTimesheets;