import { useState, useEffect } from 'react';
import axios from 'axios';

const useFetchShifts = (startDate, endDate) => {
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await axios.get('/api/rota/shifts', {
          params: { start_date: startDate, end_date: endDate },
        });
        setShifts(response.data);
      } catch (error) {
        console.error('Error fetching shifts:', error);
      }
    };

    fetchShifts();
  }, [startDate, endDate]);

  return shifts;
};

export default useFetchShifts;