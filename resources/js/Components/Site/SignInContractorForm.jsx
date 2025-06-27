import React, { useState } from 'react';
import { ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import './Styles.css'; // Import your CSS for animations

const inputs = [
  { label: 'Full Name', key: 'fullName' },
  { label: 'Company', key: 'company' },
  { label: 'Car Registration', key: 'carReg' },
];

export default function SignInContractorForm({ onComplete, setStep }) {
  const [input, setInput] = useState(0); // Tracks the current input
  const [form, setForm] = useState({ fullName: '', company: '', carReg: '' }); // Form data
  const [error, setError] = useState(''); // Error message
  const [animationClass, setAnimationClass] = useState(null); // Tracks the animation class for transitions

  const handleContinue = () => {
    const current = inputs[input];
    if (!form[current.key].trim()) {
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
        onComplete(form); // Call onComplete with form data on the last input
      }
    }, 50); // Match the animation duration (0.2s)
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const currentInput = inputs[input];

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
          {/* Input Field for Current Input */}
          <div className={`pt-16 px-36 ${animationClass}`}>
            <label className="text-4xl text-gray-800 dark:text-dark-100">{currentInput.label}</label>
            <input
              type="text"
              name={currentInput.key}
              className="py-3 rounded text-6xl w-full focus:outline-none outline-transparent caret-theme-500 dark:caret-theme-400"
              placeholder={currentInput.placeholder}
              value={form[currentInput.key]}
              onChange={handleInputChange}
              autoComplete="off"
              autoCorrect="false"
              autoFocus
            />
            {error && <div className="text-red-600 font-semibold text-2xl">{error}</div>}
          </div>

          {/* Continue Button */}
          <div className="flex flex-row items-end justify-end w-full h-full z-10 relative">
            <div className="flex-shrink-0">
              <button
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