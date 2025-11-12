import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import UserIcon from '../User/UserIcon';
import './Styles.css'; // Import your CSS for animations
import {
  sanitizeEscape,
  sanitizeProperCase,
  sanitizeToUpperCase,
  sanitizeTrim
} from '../../Utils/Sanitisers.jsx';

const inputs = [
  { label: 'Full name', key: 'fullName' },
];

export default function SignInInterviewForm({ onComplete, setStep, location, from }) {
  const [input, setInput] = useState(0); // Tracks the current input
  const inputRefs = useRef([]); // Ref to store input elements for focusing
  const [form, setForm] = useState({ fullName: '' }); // Form data
  const [error, setError] = useState(''); // Error message
  const [employees, setEmployees] = useState([]); // State to store the list of employees
  const [debounceTimeout, setDebounceTimeout] = useState(null); // State for managing debounce timeout
  const [animationClass, setAnimationClass] = useState(null); // Tracks the animation class for transitions
  const [isProcessing, setIsProcessing] = useState(false); // Flag to prevent multiple submissions
  const [isInputFocused, setIsInputFocused] = useState(false); // Tracks if the input is focused

  useEffect(() => {
    // Focus the current input after input index changes
    if (inputRefs.current[input]) {
      inputRefs.current[input].focus();
      setTimeout(() => {
        setIsInputFocused(true);
      }, 100);
    }
  }, [input]);

  const handleContinue = () => {
    const current = inputs[input];
    if (!form[current.key].trim()) {
      setError(`Please enter ${current.label.toLowerCase()}.`);
      return;
    }

    // Trigger fade-out animation
    setAnimationClass('fade-out');
    setError('');

    // Wait for the fade-out animation to complete before moving to the next input
    setTimeout(() => {
      if (input < inputs.length - 1) {
        setInput(input + 1); // Move to the next input
        setAnimationClass('fade-in'); // Trigger fade-in animation
      } else {
        handleComplete();
      }
    }, 50); // Match the animation duration (0.2s)
  };

  const sanitizeFormData = (data) => {
    return {
      visitor_name: sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.fullName))),
      visitor_visiting: sanitizeProperCase(sanitizeTrim(sanitizeEscape('Interview'))),
    }
  };

  const handleComplete = () => {
    setAnimationClass('fade-out'); // Trigger fade-out animation
    const sanitizedData = sanitizeFormData(form);
    onComplete(sanitizedData);
    setStep('terms-and-conditions');
  };

  const handleInputChange = (e) => {
    const current = inputs[input];
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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
    <div className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 h-screen w-full">
      <div className="flex items-center justify-end w-full h-10">
        <XMarkIcon
          className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer"
          onClick={() => setStep(from)}
        />
      </div>
      <div className="flex flex-col items-start justify-start bg-white dark:bg-dark-900 h-full w-full pt-10">
        <div className="flex flex-col gap-4 w-full h-full">
          {/* Input Field for Current Input */}
          <div className={`px-36 ${animationClass} flex flex-col gap-y-1`}>
            <label className="text-4xl text-gray-800 dark:text-dark-100">{currentInput.label}</label>
            <input
              ref={el => inputRefs.current[input] = el}
              type="text"
              name={currentInput.key}
              className="py-3 rounded text-6xl w-full focus:outline-none outline-transparent caret-theme-500 dark:caret-theme-400 dark:bg-dark-900 dark:text-dark-100"
              value={form[currentInput.key]}
              onChange={handleInputChange}
              autoComplete="off"
              autoCorrect="false"
              autoFocus
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 100)}
            />
            {error && <div className="text-red-600 font-semibold text-2xl">{error}</div>}
          </div>
          <div className={`flex flex-row items-end justify-end w-full h-full z-10 relative`}>
            {/* Continue Button */}
            <div 
              className="flex-shrink-0 pb-4"
              style={{
                transform: isInputFocused ? 'translateY(-21rem)' : 'translateY(0)', // adjust -8rem as needed
              }}
            >
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