import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { hasPermission } from '../../../Utils/Permissions';

const useFetchLatestShiftDate = () => {
  const [latestDate, setLatestDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasFetched = useRef(false);
  const url = hasPermission('pulse_view_rota') ? '/rota/latest-date' : '/user/rota/latest-date';

  useEffect(() => {
    // Only fetch once
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    const fetchLatestDate = async () => {
      try {
        setIsLoading(true);

        const response = await axios.get(url, {
          signal: controller.signal,
        });

        setLatestDate(response.data.latest_date);
        setIsLoading(false);
        setIsLoaded(true);
      } catch (error) {
        setIsLoading(false);
        setIsLoaded(false);

        if (axios.isCancel(error)) {
          console.log('Fetch aborted');
        } else {
          console.error('Error fetching latest shift date:', error);
        }
      }
    };

    fetchLatestDate();

    return () => {
      controller.abort();
    };
  }, []);

  return { latestDate, isLoading, isLoaded };
};

export default useFetchLatestShiftDate;
