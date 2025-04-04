import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ActiveStateContext = createContext();

export const ActiveStateProvider = ({ children }) => {
  const [userStates, setUserStates] = useState({});

  useEffect(() => {
    const fetchUserStates = async () => {
      try {
        const response = await axios.get('/users/active-states');

        setUserStates(response.data);
      } catch (error) {
        console.error('Error fetching user states:', error);
      }
    };

    fetchUserStates();

    const intervalId = setInterval(fetchUserStates, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  return (
    <ActiveStateContext.Provider value={userStates}>
      {children}
    </ActiveStateContext.Provider>
  );
};

export const useUserStates = () => {
  return useContext(ActiveStateContext);
};