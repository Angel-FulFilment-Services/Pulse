import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Styles.css'; // Assuming you have a CSS file for styles
import { set } from 'lodash';

const inputs = [
  { label: 'Full name', key: 'fullName' },
  { label: 'Company', key: 'company' },
  { label: 'Car registration', key: 'carReg' },
];

export default function SignInContractorForm({ onComplete, setStep, location }) {
  const [input, setInput] = useState(0); // Tracks the current input
  const inputRefs = useRef([]); // Ref to store input elements for focusing
  const [form, setForm] = useState({ fullName: '', company: '', carReg: '' }); // Form data
  const [error, setError] = useState(''); // Error message
  const [animationClass, setAnimationClass] = useState(null); // Tracks the animation class for transitions
  const [isProcessing, setIsProcessing] = useState(false); // Flag to prevent multiple submissions
  const [isInputFocused, setIsInputFocused] = useState(false);

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
    if (!form[current.key].trim() && (current.key !== 'carReg')) {
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
        handleComplete(); // Call onComplete with form data on the last input
      }
    }, 50); // Match the animation duration (0.2s)
  };

  const handleComplete = () => {
    setAnimationClass('fade-out'); // Trigger fade-out animation
    onComplete({
      visitor_name: form.fullName,
      visitor_company: form.company,
      visitor_car_registration: form.carReg,
    });
    setStep('terms-and-conditions');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const currentInput = inputs[input];

  return (
    <div
      className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 pb-16 h-screen min-h-dvh w-full"
    >
      <div className="flex items-center justify-between w-full h-10">
        <ArrowLeftIcon
          className="h-10 w-10 text-black dark:text-dark-100  stroke-[2.5] cursor-pointer"
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
              ref={el => inputRefs.current[input] = el}
              type="text"
              name={currentInput.key}
              className="py-3 rounded text-6xl w-full focus:outline-none outline-transparent caret-theme-500 dark:caret-theme-400 dark:bg-dark-900 dark:text-dark-100"
              placeholder={currentInput.placeholder}
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

          {/* Continue Button */}
          <div className={`flex flex-row items-end justify-end w-full h-full z-10 relative`}>
            <div 
              className="flex-shrink-0"
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