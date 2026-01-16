import React, { Fragment, useRef, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Hourglass } from 'ldrs/react'
import 'ldrs/react/Hourglass.css'

export default function ProgressDialog({
  isOpen,
  onClose,
  title = "Exporting Payroll",
  description = "Please wait while we build your CSV export.",
  progress = 0,
  flavourTexts = ["Crunching numbers...", "Stacking bricks...", "Almost there!", "Just a moment..."],
  onCancel,
  showCancel = false,
}) {
  const cancelButtonRef = useRef(null);
  const [flavourIndex, setFlavourIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && flavourTexts.length > 0) {
      setFlavourIndex(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setFlavourIndex(prev => (prev + 1) % flavourTexts.length);
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
  }, [isOpen]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        initialFocus={cancelButtonRef} 
        onClose={onCancel ? () => { onCancel(); onClose(); } : () => {}}
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
          <div className="fixed inset-0 bg-gray-500/50 dark:bg-dark-800/50 transition-opacity" />
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
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-theme-600 dark:text-theme-600 bg-theme-100 dark:bg-theme-200/20">
                    <Hourglass size="35" color="rgb(var(--theme-600) / 1)"></Hourglass>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-dark-100">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-dark-400">{description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="mb-2 text-center text-sm text-theme-600 dark:text-theme-700 font-medium min-h-[1.5em] transition-all duration-500 ease-in-out">
                    {flavourTexts[flavourIndex]}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-theme-600 dark:bg-theme-700 h-3 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-dark-500 text-center">
                    {progress.toFixed(0)}%
                  </div>
                </div>
                {showCancel && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md bg-white dark:bg-dark-900 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:ring-dark-600 dark:hover:bg-dark-800 border-none border-transparent"
                      onClick={() => {
                        if (onCancel) onCancel();
                        onClose();
                      }}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
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