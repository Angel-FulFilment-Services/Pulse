import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const useFetchEmployee = (hrId = null) => {
  const [employee, setEmployee] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef(null); // Ref to store the debounce timeout

  const fetchEmployee = async (controller) => {
    let loadingTimeout;

    try {
      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 500);

      const response = await axios.get('/employee/information', {
        params: { hr_id: hrId },
        signal: controller.signal, // Attach the AbortController signal
      });

      clearTimeout(loadingTimeout);
      setIsLoading(false);
      setEmployee(response.data);
    } catch (error) {
      clearTimeout(loadingTimeout);
      setIsLoading(false);

      // Ignore abort errors
      if (axios.isCancel(error)) {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching employee:', error);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController(); // Create a new AbortController for each fetch

    // Debounce the fetchEmployee call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
        fetchEmployee(controller);
    }, 300); // Debounce delay of 300ms

    // Cleanup function
    return () => {
      controller.abort(); // Cancel the ongoing request
      clearTimeout(debounceTimeout.current); // Clear the debounce timeout
    };
  }, [hrId]); // Re-run when startDate or endDate changes

  return { employee, isLoading };
};

export default useFetchEmployee;