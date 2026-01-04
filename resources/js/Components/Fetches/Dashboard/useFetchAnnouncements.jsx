import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null);

  const fetchAnnouncements = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 500);

      const response = await axios.get('/api/dashboard/announcements', {
        signal: controller.signal,
      });
      setAnnouncements(response.data);
      
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching announcements:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchAnnouncements(controller);
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
      fetchAnnouncements(controller);
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { announcements, isLoading, isLoaded };
};

export default useFetchAnnouncements;
