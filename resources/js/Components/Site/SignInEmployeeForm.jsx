import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import './Styles.css';
import axios from 'axios';
import UserIcon from '../User/UserIcon';
import { toast } from 'react-toastify';

export default function SignInEmployeeForm({ onComplete, setStep, location }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]); // State to store the list of employees
  const [debounceTimeout, setDebounceTimeout] = useState(null); // State for managing debounce timeout
  const [isProcessing, setIsProcessing] = useState(false); // Flag to prevent multiple submissions
  const [animationClass, setAnimationClass] = useState(null); // State for animation class
  const [isInputFocused, setIsInputFocused] = useState(false); // Tracks if the input is focused

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

  const signIn = async (userId) => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setIsProcessing(true); // Set processing state to true to prevent multiple submissions

    try {
      const response = await axios.get(`/onsite/status`, {
        params: { 
          user_id: userId, 
        },
      });

      if (response.status === 400) {
        throw new Error('This user is already signed in.');
      }

      if (!response.status === 200) {
        throw new Error('Failed to sign in user');
      }

      if (response.status === 200) {
        setIsProcessing(false); // Reset processing state
        setAnimationClass('fade-out'); // Trigger fade-out animation
        setTimeout(() => {
          onComplete({ user_id: userId });
          setStep('terms-and-conditions'); // Navigate to terms and conditions
        }, 200);
      }
    } catch (err) {
      setIsProcessing(false); // Reset processing state on error
      const audio = new Audio('/sounds/access-error.mp3');
      audio.play();
      if(err.response && err.response.status === 400) {
        toast.error("You're already signed in.", {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      } else {
        toast.error('Could not sign in, please try again.', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      }
      return false;
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
    <div className="inset-0 fixed bg-white dark:bg-dark-900 z-40 p-12 pt-10 h-dvh w-full">
      <div className="flex items-center justify-between w-full h-10">
        <ArrowLeftIcon
          className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer"
          onClick={() => setStep('signin-type')}
        />
        <XMarkIcon
          className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer"
          onClick={() => setStep('splash')}
        />
      </div>
      <div className="flex flex-col items-start justify-start bg-white h-full dark:bg-dark-900 w-full pt-10">
        <div className="flex flex-col gap-4 w-full h-full">
          <div className={`px-36 ${animationClass} flex flex-col gap-y-1`}>
            <label className="text-4xl text-gray-800 dark:text-dark-100">Full name</label>
            <input
              type="text"
              className="py-3 rounded text-6xl w-full focus:outline-none outline-transparent dark:text-dark-100 caret-theme-500 dark:caret-theme-400 dark:bg-dark-900"
              value={name}
              autoCorrect={"false"}
              autoComplete="off"
              tabIndex={0}
              onChange={handleInputChange}
              autoFocus
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 100)}
            />
            {error && <div className="text-red-600 font-semibold text-2xl">{error}</div>}
          </div>
          <div className="flex flex-row items-end justify-between w-full h-full z-10 relative">
            <div 
              className="relative flex-grow overflow-hidden" 
              style={{
                transform: isInputFocused ? 'translateY(-21rem)' : 'translateY(0)', // adjust -8rem as needed
              }}
            >
                {employees.length > 0 && (
                  <div className="flex flex-col relative items-start justify-center w-full h-full gap-y-4 overflow-x-scroll no-scrollbar pl-36 pb-4">
                    <p className="text-base sticky top-0 left-0 text-gray-300 dark:text-dark-600 fade-in">
                      Tap to select
                    </p>
                    <div className="flex flex-row gap-x-4 relative">
                      {employees.map((employee, index) => (
                        <button
                          key={index}
                          onClick={() => {handleButtonClick.bind(null, employee.name, employee.id); signIn(employee.id)}}
                          className="px-3.5 pr-6 flex-shrink-0 h-full py-3 bg-white text-gray-900 dark:bg-dark-800 rounded-[3rem] text-6xl shadow-[0_0_15px_0_rgba(0,0,0,0.1)] focus:outline-none flex items-center justify-start fade-in cursor-pointer"
                        >
                          <UserIcon size="extra-large" profilePhoto={employee.profile_photo} />
                          <div className="w-full">
                            <p className="ml-4 text-xl text-left dark:text-dark-100">{employee.name}</p>
                            <p className="ml-4 text-base text-gray-300 text-left dark:text-dark-600">{employee.job_title}</p>
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
                  <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-white to-transparent dark:from-dark-900 pointer-events-none"></div>
                  <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-white to-transparent dark:from-dark-900 pointer-events-none"></div>
                </>
              )}
            </div>
            <div 
              className="flex-shrink-0 pb-4"  
              style={{
                transform: isInputFocused ? 'translateY(-21rem)' : 'translateY(0)', // adjust -8rem as needed
              }}
            >
              <button
                disabled={!id || !name.length || isProcessing}
                className="mt-4 px-5 py-4 bg-theme-500 text-white rounded-2xl text-3xl z-20 shadow hover:bg-theme-600 focus:outline-none flex items-center justify-center fade-in disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => signIn(id)}
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