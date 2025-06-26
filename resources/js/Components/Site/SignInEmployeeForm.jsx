import React, { useState } from 'react';
import { ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import './styles.css'

export default function SignInEmployeeForm({ onComplete, setStep }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    // You can pass the name up if needed: onComplete(name)
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-white z-40 p-12 pt-10 h-screen w-full">
      <div className="flex items-center justify-between w-full h-16">
        <ArrowLeftIcon className="h-16 w-16 text-black stroke-[2.5] cursor-pointer" onClick={() => setStep('scan')} />
        <XMarkIcon className="h-16 w-16 text-black stroke-[2.5] cursor-pointer" onClick={() => setStep('splash')} />
      </div>
      <div className="flex flex-col items-start justify-start bg-white dark:bg-dark-900 h-full w-full pt-14 pb-16">
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="px-36 pt-16">
            <label className="text-5xl text-gray-800 dark:text-dark-100">Full name</label>
            <input
              type="text"
              className="py-3 rounded text-7xl w-full focus:outline-none outline-transparent caret-theme-500 dark:caret-theme-400"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            {error && <div className="text-red-600 text-4xl">{error}</div>}
          </div>
          <div className="flex flex-col items-end justify-end w-full h-full">
            <button
              className="mt-4 px-8 py-6 bg-theme-500 text-white rounded-2xl text-3xl shadow hover:bg-theme-600 focus:outline-none flex items-center justify-center fade-in"
              onClick={handleContinue}
            >
              <ChevronRightIcon className="h-8 w-8 inline-block stroke-[7] flex-shrink-0 mr-2" />
              <p className="mb-1">
                Continue
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}