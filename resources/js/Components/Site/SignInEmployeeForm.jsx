import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import './Styles.css';
import axios from 'axios';
import UserIcon from '../User/UserIcon';

export default function SignInEmployeeForm({ onComplete, setStep }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]); // State to store the list of employees
  const [debounceTimeout, setDebounceTimeout] = useState(null); // State for managing debounce timeout

  const handleContinue = () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    onComplete();
  };

  const fetchEmployees = async (query) => {
    try {
      const response = await axios.get(`/employees`, {
        params: { name: query }, // Pass the input value as a query parameter
      });
  
      const employeesData = response.data;
  
      // Check if only one result is returned and the query matches the employee's name
      if (employeesData.length === 1 && employeesData[0].name.toLowerCase() === query.toLowerCase()) {
        setName(employeesData[0].name); // Set the name to the employee's name
        setId(employeesData[0].id); // Set the guid to the employee's qr_token
        setEmployees(employeesData);
      } else {
        setEmployees(employeesData); // Update the state with the list of employees
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]); // Clear the list on error
    }
  };

  const handleInputChange = (e) => {
    setError('');
    const value = e.target.value;
    setName(value);

    if (value.trim().length === 1) {
      return;
    }

    // Clear the previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set a new timeout to debounce the API call
    const newTimeout = setTimeout(() => {
      if (value.trim()) {
        fetchEmployees(value); // Fetch employees after debounce delay
      } else {
        setEmployees([]); // Clear the list if input is empty
      }
    }, 300); // 300ms debounce delay

    setDebounceTimeout(newTimeout);
  };

  const handleButtonClick = (employeeName, id) => {
    setName(employeeName);
    setId(id);
  }

  useEffect(() => {
    // Cleanup timeout on component unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return (
    <div className="fixed inset-0 bg-white z-40 p-12 pt-10 h-screen w-full">
      <div className="flex items-center justify-between w-full h-16">
        <ArrowLeftIcon
          className="h-16 w-16 text-black stroke-[2.5] cursor-pointer"
          onClick={() => setStep('signin-type')}
        />
        <XMarkIcon
          className="h-16 w-16 text-black stroke-[2.5] cursor-pointer"
          onClick={() => setStep('splash')}
        />
      </div>
      <div className="flex flex-col items-start justify-start bg-white dark:bg-dark-900 h-full w-full pt-14">
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="px-36 pt-16">
            <label className="text-4xl text-gray-800 dark:text-dark-100">Full name</label>
            <input
              type="text"
              className="py-3 rounded text-6xl w-full focus:outline-none outline-transparent caret-theme-500 dark:caret-theme-400"
              value={name}
              autoCorrect={"false"}
              autoComplete="off"
              tabIndex={0}
              onChange={handleInputChange}
              autoFocus
            />
            {error && <div className="text-red-600 font-semibold text-2xl">{error}</div>}
          </div>
          <div className="flex flex-row items-end justify-between w-full h-full z-10 relative">
            <div className="relative flex-grow overflow-hidden">
                {employees.length > 0 && (
                  <div className="flex flex-col relative items-start justify-center w-full h-full gap-y-4 pb-16 overflow-x-scroll no-scrollbar pl-36">
                    <p className="text-base sticky top-0 left-0 text-gray-300 dark:text-dark-300 fade-in">
                      Tap to select
                    </p>
                    <div className="flex flex-row gap-x-4 relative">
                      {employees.map((employee, index) => (
                        <button
                          key={index}
                          onClick={() => {handleButtonClick.bind(null, employee.name, employee.id); handleContinue()}}
                          className="px-3.5 pr-6 flex-shrink-0 h-full py-3 bg-white text-gray-900 rounded-[3rem] text-6xl shadow-[0_0_15px_0_rgba(0,0,0,0.1)] focus:outline-none flex items-center justify-start fade-in cursor-pointer"
                        >
                          <UserIcon size="extra-large" profilePhoto={employee.profile_photo} />
                          <div className="w-full">
                            <p className="ml-4 text-xl text-left">{employee.name}</p>
                            <p className="ml-4 text-base text-gray-300 text-left">{employee.job_title}</p>
                          </div>
                        </button>
                      ))}
                      {employees.length >= 3 && (
                        <div className="flex-shrink-0 min-w-[29.5rem]"></div>  
                      )}
                    </div>
                  </div>
                )}
              {/* Gradient overlay */}
              {employees.length > 0 && (
                <>
                  <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                  <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                </>
              )}
            </div>
            <div className="flex-shrink-0">
              <button
                disabled={!id && name.length}
                className="mt-4 px-5 py-4 bg-theme-500 text-white rounded-2xl text-3xl z-20 shadow hover:bg-theme-600 mb-16 focus:outline-none flex items-center justify-center fade-in"
                onClick={handleContinue}
              >
                <ChevronRightIcon className="h-8 w-8 inline-block stroke-[7] flex-shrink-0 mr-2" />
                <p className="mb-1">Continue</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}