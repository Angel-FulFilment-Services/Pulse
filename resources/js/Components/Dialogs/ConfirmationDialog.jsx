import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationCircleIcon, CheckCircleIcon, InformationCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const iconTypes = {
  warning: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  question: {
    icon: QuestionMarkCircleIcon,
    bgColor: 'bg-theme-100',
    iconColor: 'text-theme-600',
  },
};

export default function ConfirmationDialog({
  isOpen,
  setIsOpen,
  title,
  description,
  isYes,
  type = 'info',
  yesText = 'Yes', // Default text for the "Yes" button
  cancelText = 'Cancel', // Default text for the "Cancel" button
}) {
  const cancelButtonRef = useRef(null);

  const { icon: Icon, bgColor, iconColor } = iconTypes[type] || iconTypes.info;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" initialFocus={cancelButtonRef} onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${bgColor}`}>
                    <Icon className={`h-7 w-7 ${iconColor}`} aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-theme-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-theme-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 sm:col-start-2"
                    onClick={() => {
                      isYes(); // Trigger the callback for "Yes"
                      setIsOpen(false); // Close the dialog
                    }}
                  >
                    {yesText}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50  border-none border-transparent sm:col-start-1 sm:mt-0"
                    onClick={() => setIsOpen(false)} // Close the dialog
                    ref={cancelButtonRef}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}