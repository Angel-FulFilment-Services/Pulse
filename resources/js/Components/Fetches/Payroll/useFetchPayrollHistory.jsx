import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchPayrollHistory = () => {
  const [payrollHistory, setPayrollHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch once
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    const fetchPayrollHistory = async () => {
      try {
        setIsLoading(true);

        const response = await axios.get('/user/payroll/history', {
          signal: controller.signal,
        });

        setPayrollHistory(response.data.history || []);
        setIsLoading(false);
        setIsLoaded(true);
      } catch (error) {
        setIsLoading(false);
        setIsLoaded(false);

        if (axios.isCancel(error)) {
          console.log('Fetch aborted');
        } else {
          console.error('Error fetching payroll history:', error);
        }
      }
    };

    fetchPayrollHistory();

    return () => {
      controller.abort();
    };
  }, []);

  return { payrollHistory, isLoading, isLoaded };
};

export default useFetchPayrollHistory;
