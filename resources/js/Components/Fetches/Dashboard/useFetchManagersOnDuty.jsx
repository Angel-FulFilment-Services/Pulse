import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchManagersOnDuty = () => {
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null);

  const fetchManagers = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 500);

      const response = await axios.get('/dashboard/managers-on-duty', {
        signal: controller.signal,
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      // Dedupe managers by hr_id to prevent duplicates
      const uniqueManagers = response.data.filter((manager, index, self) => 
        index === self.findIndex(m => m.hr_id === manager.hr_id)
      );
      // Order managers by online status, then clocked in status, then name
      uniqueManagers.sort((a, b) => {
        if (a.is_online !== b.is_online) {
          return b.is_online - a.is_online;
        }
        if (a.is_clocked_in !== b.is_clocked_in) {
          return b.is_clocked_in - a.is_clocked_in;
        }
        return a.name.localeCompare(b.name);
      });

      setManagers(uniqueManagers);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching managers on duty:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchManagers(controller);
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(debounceTimeout.current);
    };
  }, []);

  // Refresh every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchManagers(controller);
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { managers, isLoading, isLoaded };
};

export default useFetchManagersOnDuty;
