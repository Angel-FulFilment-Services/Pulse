import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchLatestArticles = (category = null, limit = 5, search = '') => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef(null);

  const fetchArticles = async (controller) => {
    let loadingTimeout;
    setIsLoaded(false);

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 500);

      const response = await axios.get('/dashboard/latest-articles', {
        signal: controller.signal,
        params: {
          category,
          limit,
          search: search.trim() || undefined,
        },
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setArticles(response.data.articles);
      setCategories(response.data.categories);
      setIsLoaded(true);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setIsLoaded(false);

      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching latest articles:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchArticles(controller);
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(debounceTimeout.current);
    };
  }, [category, limit, search]);

  return { articles, categories, isLoading, isLoaded };
};

export default useFetchLatestArticles;
