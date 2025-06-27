import React from 'react';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SignInTypeSelector({ onSelect, setStep }) {
  return (
    <div className="fixed inset-0 bg-white z-40 p-12 pt-10 h-screen w-screen">
      <div className="flex items-center justify-between w-full h-10">
        <ArrowLeftIcon className="h-10 w-10 text-black stroke-[2.5] cursor-pointer" onClick={() => setStep('mode')} />
        <XMarkIcon className="h-10 w-10 text-black stroke-[2.5] cursor-pointer" onClick={() => setStep('splash')} />
      </div>
      <div className="flex flex-col items-center justify-center bg-white dark:bg-dark-900 h-full w-full pt-14 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full h-full">
          <button
            className="px-8 w-full h-full py-4 bg-white text-gray-900 rounded-[3rem] text-6xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] hover:bg-gray-50 focus:outline-none col-span-2"
            onClick={() => onSelect('employee')}
          >
            Employee
          </button>
          <button
            className="px-8 w-full h-full py-4 bg-white text-gray-900 rounded-[3rem] text-6xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] hover:bg-gray-50 focus:outline-none"
            onClick={() => onSelect('visitor')}
          >
            Visitor
          </button>
          <button
            className="px-8 w-full h-full py-4 bg-white text-gray-900 rounded-[3rem] text-6xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] hover:bg-gray-50 focus:outline-none"
            onClick={() => onSelect('contractor')}
          >
            Contractor
          </button>
        </div>
      </div>
    </div>
  );
}