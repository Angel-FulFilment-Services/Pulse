import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const UtilisationTargetsContext = createContext();

export const UtilisationTargetsProvider = ({ children }) => {
  const [utilisationTargets, setUtilisationTargets] = useState({});

  useEffect(() => {
    const fetchUtilisationTargets = async () => {
      try {
        const response = await axios.get('/reporting/targets/utilisation');

        setUtilisationTargets(response.data);
      } catch (error) {
        console.error('Error fetching utilisation targets:', error);
      }
    };

    fetchUtilisationTargets();

    const intervalId = setInterval(fetchUtilisationTargets, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  return (
    <UtilisationTargetsContext.Provider value={utilisationTargets}>
      {children}
    </UtilisationTargetsContext.Provider>
  );
};

export const useUtilisationTargets = () => {
  return useContext(UtilisationTargetsContext);
};