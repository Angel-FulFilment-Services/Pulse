import { useState, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function ClickedModal({
  size = 'md', // Default size
  className = '',
  style = {},
  children, // Trigger element
  content, // Modal content
  icon,
  onClose, // Callback for handling closure events
  onSubmit = () => {}, // Default to a no-op function
}) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    xs: 'w-[100%] sm:w-[40%] h-[100%] sm:h-[50%]',
    sm: 'w-[100%] sm:w-[50%] h-[100%] sm:h-[60%]',
    md: 'w-[100%] sm:w-[60%] h-[100%] sm:h-[70%]',
    lg: 'w-[100%] sm:w-[70%] h-[100%] sm:h-[80%]',
    xl: 'w-[100%] sm:w-[80%] h-[100%] sm:h-[90%]',
    '2xl': 'w-[100%] h-[100%]',
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleSubmit = (...args) => {
    onSubmit(...args); // Safely call onSubmit (default is a no-op)
    setIsOpen(false); // Close the modal after submission
  };

  return (
    <>
      {/* Trigger Element */}
      <div
        onClick={() => setIsOpen(true)}
        className={`${className}`}
        style={style}
      >
        {icon}
        {children}
      </div>

      {/* Modal */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={handleClose}>
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
            <div className="flex h-full items-center justify-center p-4 text-center sm:p-0 py-12 md:py-0">
              <div className="hidden lg:flex lg:flex-col min-w-72 w-72"></div>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel
                  className={`relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-900 text-left shadow-xl transition-all mt-14 lg:mt-0 mx-0 md:mx-6 ${sizeClasses[size]}`}
                >
                  {/* Modal Content */}
                  {content(handleSubmit, handleClose)}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}