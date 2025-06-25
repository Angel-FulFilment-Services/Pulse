import React, { useState } from 'react';

const steps = [
  { label: 'Full Name', key: 'fullName', placeholder: 'Enter your full name' },
  { label: 'Company', key: 'company', placeholder: 'Enter your company' },
  { label: 'Car Registration', key: 'carReg', placeholder: 'Enter your car registration (if applicable)' },
];

export default function SignInContractorForm({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ fullName: '', company: '', carReg: '' });
  const [error, setError] = useState('');

  const handleContinue = () => {
    const current = steps[step];
    if (!form[current.key].trim()) {
      setError(`Please enter ${current.label.toLowerCase()}.`);
      return;
    }
    setError('');
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // You can pass form data up if needed: onComplete(form)
      onComplete();
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [steps[step].key]: e.target.value });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white dark:bg-dark-900">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-8">
        Contractor Sign In
      </h2>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <label className="text-lg text-gray-800 dark:text-dark-100">{steps[step].label}</label>
        <input
          type="text"
          className="px-4 py-3 rounded border border-gray-300 dark:border-dark-700 text-lg"
          placeholder={steps[step].placeholder}
          value={form[steps[step].key]}
          onChange={handleChange}
          autoFocus
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          className="mt-4 px-6 py-3 bg-theme-500 text-white rounded-lg text-lg font-semibold shadow hover:bg-theme-600 focus:outline-none"
          onClick={handleContinue}
        >
          {step < steps.length - 1 ? 'Continue' : 'Finish'}
        </button>
      </div>
    </div>
  );
}