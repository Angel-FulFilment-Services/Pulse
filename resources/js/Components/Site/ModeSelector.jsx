import { ChevronRightIcon, ChevronLeftIcon, CubeIcon } from '@heroicons/react/24/outline';
import { RiDoorOpenLine, RiDoorClosedLine } from '@remixicon/react';
import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function ModeSelector({ setStep, location }) {
  return (
    <div className="flex flex-col items-center justify-center h-full dark:bg-dark-900 gap-y-10 w-full">
      <button
        className="px-8 w-full h-full py-4 bg-white dark:bg-dark-800 dark:text-dark-100 text-gray-900 rounded-[3rem] text-6xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] hover:bg-gray-50 focus:outline-none flex items-center justify-start"
        onClick={() => setStep('signin-type')}
      >
        <div className="flex flex-row items-center justify-center w-2/6">
          <RiDoorOpenLine className="h-20 w-20 text-green-700 inline-block stroke-[2]" />
        </div>
        <p className="mb-2">
          Sign In
        </p>
      </button>
      <button
        className="px-8 w-full h-full py-4 bg-white dark:bg-dark-800 dark:text-dark-100 text-gray-900 rounded-[3rem] text-6xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] hover:bg-gray-50 focus:outline-none flex items-center justify-start"
        onClick={() => setStep('signout-type')}
      >
        <div className="flex flex-row items-center justify-center w-2/6">
          <RiDoorClosedLine className="h-20 w-20 text-red-700 inline-block stroke-[2]" />
        </div>
        <p className="mb-2">
          Sign Out
        </p>
      </button>
      <button
        className="px-8 w-full h-full py-4 bg-white dark:bg-dark-800 dark:text-dark-100 text-gray-900 rounded-[3rem] text-6xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] hover:bg-gray-50 focus:outline-none flex items-center justify-start"
        onClick={() => setStep('delivery-type')}
      >
        <div className="flex flex-row items-center justify-center w-2/6">
          <CubeIcon className="h-20 w-20 text-gray-900 dark:text-dark-200 inline-block stroke-[2] flex-shrink-0" />
        </div>
        <p className="mb-2">
          Delivery
        </p>
      </button>
    </div>
  );
}