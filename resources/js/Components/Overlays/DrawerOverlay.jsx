import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function DrawerOverlay({ isOpen, onClose, title, subTitle, children, hasBackdrop, slideFrom = 'right', width = 'md' }) {
  const slideInClasses = slideFrom === 'left' ? '-translate-x-full' : 'translate-x-full';
  const slideOutClasses = slideFrom === 'left' ? '-translate-x-full' : 'translate-x-full';

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    "2xl": 'sm:max-w-2xl',
    "3xl": 'sm:max-w-3xl',
    "4xl": 'sm:max-w-4xl',
    "5xl": 'sm:max-w-5xl',
    "6xl": 'sm:max-w-6xl',
    "7xl": 'sm:max-w-full'
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        {hasBackdrop && (
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/50 dark:bg-dark-900/50 transition-opacity" />
          </Transition.Child>
        )}

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={`pointer-events-none fixed inset-y-0 ${slideFrom}-0 flex max-w-full mt-16 lg:mt-0 ${slideFrom === 'left' ? 'pr-10 ml-0 lg:ml-72' : 'pl-0 sm:pl-10'}`}>
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom={slideInClasses}
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo={slideOutClasses}
              >
                <Dialog.Panel className={`pointer-events-auto w-screen ${widthClasses[width]}`}>
                  <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-dark-900 py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Dialog.Title className="text-base font-semibold leading-6 text-gray-900 dark:text-dark-50">
                            {title}
                          </Dialog.Title>
                          <Dialog.Title className="text-sm text-gray-500 dark:text-dark-400">
                            {subTitle}
                          </Dialog.Title>
                        </div>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-white dark:bg-dark-900 text-gray-400 dark:text-dark-500 dark:hover:text-dark-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}