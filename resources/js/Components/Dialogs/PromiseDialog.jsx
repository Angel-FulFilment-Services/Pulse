import React, { Fragment, useRef, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Hourglass } from 'ldrs/react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import 'ldrs/react/Hourglass.css'

export default function PromiseDialog({
  isOpen,
  onClose,
  promise,
  pendingTitle = "Processing...",
  pendingDescription = "Please wait while we process your request.",
  successTitle = "Success!",
  successDescription = "Operation completed successfully.",
  errorTitle = "Error",
  errorDescription = "An error occurred while processing your request.",
  pendingTexts = ["Processing...", "Please wait...", "Almost there!", "Just a moment..."],
  onSuccess,
  onError,
  autoCloseDelay = 1000, // Auto close after success/error (reduced to 1 second)
}) {
  const [state, setState] = useState('pending'); // 'pending', 'success', 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [flavourIndex, setFlavourIndex] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Handle promise execution
  useEffect(() => {
    if (isOpen && promise) {
      setState('pending');
      setResult(null);
      setError(null);
      
      promise
        .then((data) => {
          setState('success');
          setResult(data);
          if (onSuccess) onSuccess(data);
          
          // Auto close after success
          timeoutRef.current = setTimeout(() => {
            onClose();
          }, autoCloseDelay);
        })
        .catch((err) => {
          setState('error');
          setError(err);
          if (onError) onError(err);
          
          // Auto close after error
          timeoutRef.current = setTimeout(() => {
            onClose();
          }, autoCloseDelay);
        });
    }
  }, [isOpen, promise]);

  // Handle flavour text rotation during pending state
  useEffect(() => {
    if (state === 'pending' && pendingTexts.length > 0) {
      setFlavourIndex(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setFlavourIndex(prev => (prev + 1) % pendingTexts.length);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state, pendingTexts]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Get current state properties
  const getStateProps = () => {
    switch (state) {
      case 'success':
        return {
          title: successTitle,
          description: successDescription,
          icon: <CheckCircleIcon className="h-8 w-8" />,
          iconBg: 'bg-green-100 dark:bg-green-200/20',
          iconColor: 'text-green-600 dark:text-green-500',
        };
      case 'error':
        return {
          title: errorTitle,
          description: error?.message || errorDescription,
          icon: <XCircleIcon className="h-8 w-8" />,
          iconBg: 'bg-red-100 dark:bg-red-200/20',
          iconColor: 'text-red-600 dark:text-red-500',
        };
      default: // pending
        return {
          title: pendingTitle,
          description: pendingDescription,
          icon: <Hourglass size="35" color="rgb(var(--theme-600) / 1)" />,
          iconBg: 'bg-theme-100 dark:bg-theme-200/20',
          iconColor: 'text-theme-600 dark:text-theme-600',
        };
    }
  };

  const stateProps = getStateProps();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={() => {}} // Prevent manual closing
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-800/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${stateProps.iconBg}`}>
                    <div className={stateProps.iconColor}>
                      {stateProps.icon}
                    </div>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-dark-100">
                      {stateProps.title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-dark-400">{stateProps.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Show flavour text only during pending state */}
                {state === 'pending' && (
                  <div className="mt-6">
                    <div className="text-center text-sm text-theme-600 dark:text-theme-700 font-medium min-h-[1.5em] transition-all duration-500 ease-in-out">
                      {pendingTexts[flavourIndex]}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}