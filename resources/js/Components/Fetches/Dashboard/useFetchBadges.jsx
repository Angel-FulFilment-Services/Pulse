import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchBadges = () => {
  const [badges, setBadges] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null);

  const fetchBadges = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 1000);

      const response = await axios.get('/badges', {
        signal: controller.signal,
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setBadges(response.data);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching badges:', error);
      }
    }
  };

  const fetchStatistics = async (controller) => {
    try {
      const response = await axios.get('/badges/statistics', {
        signal: controller.signal,
      });
      setStatistics(response.data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching badge statistics:', error);
      }
    }
  };

  const markBadgeAsViewed = async (badgeId) => {
    try {
      await axios.post(`/badges/${badgeId}/mark-viewed`);
      
      // Update local state to remove "NEW" indicator
      setBadges(prevBadges =>
        prevBadges.map(badge =>
          badge.id === badgeId
            ? { ...badge, isNew: false, viewed_at: new Date().toISOString() }
            : badge
        )
      );
    } catch (error) {
      console.error('Error marking badge as viewed:', error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    // Debounce the fetch call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchBadges(controller);
      fetchStatistics(controller);
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(debounceTimeout.current);
    };
  }, []);

  useEffect(() => {
    // Fetch badges every 5 minutes
    const intervalId = setInterval(() => {
      const controller = new AbortController();
      fetchBadges(controller);
      fetchStatistics(controller);
    }, 300000); // 5 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { badges, statistics, isLoading, isLoaded, markBadgeAsViewed };
};

export default useFetchBadges;