import { useState, useEffect } from 'react';
import axios from 'axios';

const useFetchShifts = (startDate, endDate) => {
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchShifts = async () => {
      let loadingTimeout;

      try {
        loadingTimeout = setTimeout(() => {
          setIsLoading(true);
        }, 3000);

        const response = await axios.get('/api/rota/shifts', {
          params: { start_date: startDate, end_date: endDate },
        });
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        setShifts(response.data);
      } catch (error) {
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        console.error('Error fetching shifts:', error);
      }
    };

    fetchShifts();
  }, [startDate, endDate]);

  return { shifts, isLoading };
};

export default useFetchShifts;