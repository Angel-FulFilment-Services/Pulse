import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const ActiveStateContext = createContext();

export const ActiveStateProvider = ({ children }) => {
  const [userStates, setUserStates] = useState({});

  const fetchUserStates = useCallback(async () => {
    try {
      const response = await axios.get('/users/active-states');
      setUserStates(response.data);
    } catch (error) {
      console.error('Error fetching user states:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserStates();
    const intervalId = setInterval(fetchUserStates, 60000); // Update every minute
    return () => clearInterval(intervalId);
  }, [fetchUserStates]);

  return (
    <ActiveStateContext.Provider value={{ userStates, refreshUserStates: fetchUserStates }}>
      {children}
    </ActiveStateContext.Provider>
  );
};

export const useUserStates = () => useContext(ActiveStateContext);