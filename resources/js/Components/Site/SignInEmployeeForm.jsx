import React, { useState } from 'react';

export default function SignInEmployeeForm({ onComplete }) {
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
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white dark:bg-dark-900">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-8">
        Employee Sign In
      </h2>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <label className="text-lg text-gray-800 dark:text-dark-100">Your Name</label>
        <input
          type="text"
          className="px-4 py-3 rounded border border-gray-300 dark:border-dark-700 text-lg"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          className="mt-4 px-6 py-3 bg-theme-500 text-white rounded-lg text-lg font-semibold shadow hover:bg-theme-600 focus:outline-none"
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}