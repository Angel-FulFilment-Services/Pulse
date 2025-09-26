import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  customSize,
  className = '',
  children,
  showCloseButton = true,
  closeOnClickOutside = true,
  fullHeight = false, // New prop for full viewport height with internal scroll
  ...props
}) {
  const sizeClasses = {
    xs: 'max-w-sm',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    '3xl': 'max-w-7xl',
    full: 'max-w-full mx-4'
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={closeOnClickOutside ? handleClose : () => {}}
        {...props}
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
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className={`flex min-h-full text-center ${
            fullHeight 
              ? 'items-stretch justify-center p-4 h-screen' 
              : 'items-center justify-center p-4'
          }`}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`
                  relative w-full transform rounded-xl 
                  bg-white dark:bg-dark-800 text-left align-middle 
                  shadow-xl transition-all
                  ${fullHeight 
                    ? 'h-full flex flex-col overflow-hidden' 
                    : 'overflow-hidden'
                  }
                  ${customSize || sizeClasses[size]}
                  ${className}
                `}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-600 ${
                    fullHeight ? 'flex-shrink-0' : ''
                  }`}>
                    <div>
                      {title && (
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-medium leading-6 text-gray-900 dark:text-dark-100"
                        >
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                          {description}
                        </p>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-dark-300 focus:outline-none"
                        onClick={handleClose}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={`
                  ${(title || showCloseButton) ? '' : 'pt-6'}
                  ${fullHeight ? 'flex-1 overflow-y-auto' : ''}
                `}>
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
