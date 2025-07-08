import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import UserIcon from '../User/UserIcon';
import './Styles.css'; // Import your CSS for animations

const inputs = [
  { label: 'Full name', key: 'fullName' },
  { label: 'Company', key: 'company' },
  { label: 'Visiting', key: 'visiting' },
  { label: 'Car registration', key: 'carReg' },
];

export default function SignInVisitorForm({ onComplete, setStep, location }) {
  const [input, setInput] = useState(0); // Tracks the current input
  const [form, setForm] = useState({ fullName: '', company: '', visiting: '', visitingId: '', carReg: '' }); // Form data
  const [error, setError] = useState(''); // Error message
  const [employees, setEmployees] = useState([]); // State to store the list of employees
  const [debounceTimeout, setDebounceTimeout] = useState(null); // State for managing debounce timeout
  const [animationClass, setAnimationClass] = useState(null); // Tracks the animation class for transitions
  const [isProcessing, setIsProcessing] = useState(false); // Flag to prevent multiple submissions
  const [isInputFocused, setIsInputFocused] = useState(false); // Tracks if the input is focused

  const handleContinue = () => {
    const current = inputs[input];
    if (current.key === 'visiting' && !form.visiting.trim()) {
      setError('Please select who you are visiting.');
      return;
    }
    if (!form[current.key].trim() && current.key !== 'visiting') {
      setError(`Please enter ${current.label.toLowerCase()}.`);
      return;
    }
    setError('');

    // Trigger fade-out animation
    setAnimationClass('fade-out');

    // Wait for the fade-out animation to complete before moving to the next input
    setTimeout(() => {
      if (input < inputs.length - 1) {
        setInput(input + 1); // Move to the next input
        setAnimationClass('fade-in'); // Trigger fade-in animation
      } else {
        signIn();
      }
    }, 50); // Match the animation duration (0.2s)
  };

  const signIn = async () => {
    try {
      const response = await axios.get(`/onsite/sign-in`, {
        params: { 
          visitor_name: form.fullName,
          visitor_company: form.company,
          visitor_car_registration: form.carReg,
          visitor_visiting: form.visiting,
          visitor_visiting_user_id: form.visitingId, 
          location: location,
          type: 'access',
          category: 'visitor',
        },
      });

      if (!response.status === 200) {
        throw new Error('Failed to sign in user');
      }

      if (response.status === 200) {
        setIsProcessing(false); // Reset processing state
        setAnimationClass('fade-out'); // Trigger fade-out animation
        onComplete();
      }
    } catch (err) {
      setIsProcessing(false); // Reset processing state on error
      const audio = new Audio('/sounds/access-error.mp3');
      audio.play();
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
      return false;
    }
  };

  const handleInputChange = (e) => {
    const current = inputs[input];
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (current.key === 'visiting') {
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
    }
  };

  const fetchEmployees = async (query) => {
    try {
      const response = await axios.get(`/employees`, {
        params: { name: query, limited: true }, // Pass the input value as a query parameter
      });

      const employeesData = response.data;

      // Check if only one result is returned and the query matches the employee's name
      if (employeesData.length === 1 && employeesData[0].name.toLowerCase() === query.toLowerCase()) {
        setForm({ ...form, visiting: employeesData[0].name, visitingId: employeesData[0].id }); // Set visiting to the employee's name
      } else {
        setEmployees(employeesData); // Update the state with the list of employees
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]); // Clear the list on error
    }
  };

  const handleButtonClick = (employeeName, employeeId) => {
    setForm({ ...form, visiting: employeeName, visitingId: employeeId });

    setAnimationClass('fade-out');

    // Wait for the fade-out animation to complete before moving to the next input
    setTimeout(() => {
      if (input < inputs.length - 1) {
        setInput(input + 1); // Move to the next input
        setAnimationClass('fade-in'); // Trigger fade-in animation
      } else {
        signIn();
      }
    }, 50);
  };

  useEffect(() => {
    // Cleanup timeout on component unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const currentInput = inputs[input];

  return (
    <div className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 pb-16 h-screen w-full">
      <div className="flex items-center justify-between w-full h-10">
        <ArrowLeftIcon
          className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer"
          onClick={() => {
            setAnimationClass('fade-out'); // Trigger fade-out animation

            if (currentInput.key !== inputs[0].key) {
              setError(''); // Clear any previous error
              setTimeout(() => {
                setInput(input - 1); // Go back to the previous input
                setAnimationClass('fade-in'); // Trigger fade-in animation
              }, 50);
            } else {
              setStep('signin-type');
            }
          }}
        />
        <XMarkIcon
          className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer"
          onClick={() => setStep('splash')}
        />
      </div>
      <div className="flex flex-col items-start justify-start bg-white dark:bg-dark-900 h-full w-full pt-10">
        <div className="flex flex-col gap-4 w-full h-full">
          {/* Input Field for Current Input */}
          <div className={`px-36 ${animationClass} flex flex-col gap-y-1`}>
            <label className="text-4xl text-gray-800 dark:text-dark-100">{currentInput.label}</label>
            <input
              type="text"
              name={currentInput.key}
              className="py-3 rounded text-6xl w-full focus:outline-none outline-transparent caret-theme-500 dark:caret-theme-400 dark:bg-dark-900 dark:text-dark-100"
              value={form[currentInput.key]}
              onChange={handleInputChange}
              autoComplete="off"
              autoCorrect="false"
              autoFocus
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            {error && <div className="text-red-600 font-semibold text-2xl">{error}</div>}
          </div>
          <div 
            className={`flex flex-row items-end  ${currentInput.key === 'visiting' ? 'justify-between' : 'justify-end'} w-full h-full z-10 relative`}
            style={{
              transform: isInputFocused ? 'translateY(-21rem)' : 'translateY(0)', // adjust -8rem as needed
            }}
          >
            {currentInput.key === 'visiting' &&
              <div className="relative flex-grow overflow-hidden">
                  {employees.length > 0 && (
                    <div className="flex flex-col relative items-start justify-center w-full h-full gap-y-4 overflow-x-scroll no-scrollbar pb-16 pl-36">
                      <p className="text-base sticky top-0 left-0 text-gray-300 dark:text-dark-600 fade-in">
                        Tap to select
                      </p>
                      <div className="flex flex-row gap-x-4 relative">
                        {employees.map((employee, index) => (
                          <button
                            key={index}
                            onClick={handleButtonClick.bind(null, employee.name, employee.id)}
                            className="px-3.5 pr-6 flex-shrink-0 h-full py-3 bg-white dark:bg-dark-800 text-gray-900 rounded-[3rem] text-6xl shadow-[0_0_15px_0_rgba(0,0,0,0.1)] focus:outline-none flex items-center justify-start fade-in cursor-pointer"
                          >
                            <UserIcon size="extra-large" profilePhoto={employee.profile_photo} />
                            <div className="w-full">
                              <p className="ml-4 text-xl text-left dark:text-dark-100">{employee.name}</p>
                              <p className="ml-4 text-base text-gray-300 dark:text-dark-600 text-left">{employee.job_title}</p>
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
                    <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-white dark:from-dark-900 to-transparent pointer-events-none"></div>
                    <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-white dark:from-dark-900 to-transparent pointer-events-none"></div>
                  </>
                )}
              </div>
            }
            {/* Continue Button */}
            <div className="flex-shrink-0">
              <button
                disabled={isProcessing}
                className="mt-4 px-5 py-4 bg-theme-500 text-white rounded-2xl text-3xl z-20 shadow hover:bg-theme-600 focus:outline-none flex items-center justify-center fade-in disabled:opacity-50 disabled:cursor-not-allowed"
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