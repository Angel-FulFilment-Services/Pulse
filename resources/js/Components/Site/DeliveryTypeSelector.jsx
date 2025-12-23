import React from 'react';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function DeliveryTypeSelector({ onSelect, setStep, location, from }) {

    const signIn = async (category) => {
      try {
        const response = await axios.get(`/onsite/sign-in`, {
          params: { 
            type: 'delivery',
            category: category,
            location: location,
          },
        });

        if (!response.status === 200) {
          throw new Error('Failed to sign in user');
        }

        if (response.status === 200) {
          if (category === 'signature') {
            setStep('thank-you-signature');
          } else {
            setStep('thank-you-left-at-door');
          }
        }
      } catch (err) {
        const audio = new Audio('/sounds/access-error.mp3');
        audio.play();
        toast.error('Could not notify office, please try again.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
        });
        return false;
      }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 h-dvh w-screen">
      <div className="flex items-center justify-between w-full h-10">
        <ArrowLeftIcon className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer" onClick={() => setStep(from)} />
        <XMarkIcon className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer" onClick={() => setStep('splash')} />
      </div>
      <div className="flex flex-col items-center justify-center bg-white dark:bg-dark-900 h-full w-full pt-14 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full h-full">
          <button
            className="px-8 w-full h-full py-4 bg-white text-gray-900 dark:bg-dark-800 dark:text-dark-100 rounded-[3rem] text-6xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] hover:bg-gray-50 focus:outline-none col-span-2"
            onClick={() => signIn('signature')}
          >
            Requires Signature
          </button>
          <button
            className="px-8 w-full h-full py-4 bg-white text-gray-900 dark:bg-dark-800 dark:text-dark-100 rounded-[3rem] text-6xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] hover:bg-gray-50 focus:outline-none col-span-2"
            onClick={() => signIn('left-at-door')}
          >
            Left at Door
          </button>
        </div>
      </div>
    </div>
  );
}