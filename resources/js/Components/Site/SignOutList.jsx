import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import UserIcon from '../User/UserIcon';
import { toast } from 'react-toastify';
import './Styles.css'; // Import your styles
import axios from 'axios';
import { RiDoorClosedLine } from '@remixicon/react';
import { set } from 'lodash';

export default function SignOutList({ onComplete, setStep, signOutType }) {
  const [users, setUsers] = useState([]);
  const [signingOutId, setSigningOutId] = useState(null);
  const [availableHeight, setAvailableHeight] = useState(window.innerHeight); // State to track available height

  const updateHeight = () => {
    const headerHeight = 100; // Adjust based on your header height
    const footerHeight = 90; // Adjust based on your footer height
    const newHeight = window.innerHeight - headerHeight - footerHeight;

    console.log('Updating available height:', newHeight);
    setAvailableHeight(newHeight);
  };

  useEffect(() => {
    // Update height on load and resize
    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    // Fetch the list of signed-in users from the server
    const fetchSignedInUsers = async () => {
      try {
        const response = await axios.get('/onsite/signed-in', {
          params: { category: signOutType },
        });
        setUsers(response.data);
        updateHeight(); // Update height after users are loaded
      } catch (error) {
        if (error.response && error.response.status === 404) {
          toast.error('No one is currently signed-in.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
          });
          const audio = new Audio('/sounds/access-error.mp3');
          audio.play();
          setUsers([]); // Clear users if none found
          setStep('mode');
        } else {
          toast.error('Failed to load signed-in users. Please try again later.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
          });
          const audio = new Audio('/sounds/access-error.mp3');
          audio.play();
          setUsers([]); // Clear users on error
          setStep('mode');
        }
      }
    };

    fetchSignedInUsers();
  }, [signOutType]);

  const signOut = async (id, userId) => {
    setSigningOutId(id); // Set signing out ID to show loading state
    try {
      const response = await axios.get(`/onsite/sign-out`, {
        params: { 
          id: id, 
          user_id: userId,
        },
      });

      if (response.status === 400) {
        throw new Error('This user is already signed out.');
      }

      if (!response.status === 200) {
        throw new Error('Failed to sign out user');
      }

      if (response.status === 200) {
        setSigningOutId(null); // Reset signing out ID
        onComplete();
      }
    } catch (err) {
      setSigningOutId(null); // Reset signing out ID on error
      const audio = new Audio('/sounds/access-error.mp3');
      audio.play();
      if(err.response && err.response.status === 400) {
        toast.error("You're already signed out.", {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });

        setTimeout(() => {
          setStep('splash'); // Navigate to splash screen after error
        }, 3000);
      } else {
        toast.error('Could not sign out, please try again.', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      }
      return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 h-dvh w-screen">
      <div className="flex items-center justify-between w-full h-10">
        <ArrowLeftIcon className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer" onClick={() => setStep('signout-type')} />
        <XMarkIcon className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer" onClick={() => setStep('splash')} />
      </div>
      <div className="flex flex-col items-start justify-start bg-white dark:bg-dark-900 h-full w-full pt-14">
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="px-36">
            <label className="text-4xl text-gray-800 dark:text-dark-100">Sign out</label>
          </div>
          <div className="flex flex-row items-start justify-between w-full h-full z-10 relative">
            <div className="relative flex-grow overflow-y-hidden">
              {users.length > 0 && (
                <div className="flex flex-col relative items-start justify-center w-full pl-16">
                  <p className="text-base sticky h-full w-full top-0 left-0 text-gray-300 dark:text-dark-600 fade-in z-10 pl-20">
                    Tap to select
                  </p>
                  <div className="flex flex-col gap-y-4 relative overflow-y-scroll overflow-x-visible no-scrollbar pl-20 pr-20 pt-6" style={{ height: `${availableHeight}px` }}>
                    {users.map(user => (
                      <button
                        key={user.id}
                        onClick={() => signOut(user.id, user.user_id)}
                        disabled={signingOutId === user.id}
                        className="px-3.5 pr-6 flex-shrink-0 py-3 bg-white text-gray-900 dark:bg-dark-800 rounded-[3rem] text-6xl shadow-[0_0_15px_0_rgba(0,0,0,0.1)] focus:outline-none flex items-center justify-start fade-in cursor-pointer"
                      >
                        <UserIcon size="extra-large" profilePhoto={user.profile_photo} />
                        <div className="w-full">
                          <p className="ml-4 text-xl text-left dark:text-dark-100">{user.display_name}</p>
                          <p className="ml-4 text-base text-gray-300 dark:text-dark-600 text-left">{user.job_title}</p>
                        </div>
                        <div className="flex flex-row items-end justify-center ml-24">
                          <RiDoorClosedLine className="h-9 w-9 text-red-700 inline-block stroke-1" />
                        </div>
                      </button>
                    ))}
                    {users.length >= 3 && (
                      <div className="flex-shrink-0 min-h-[29.5rem]"></div>  
                    )}
                  </div>
                </div>
              )}
              {users.length > 0 && (
                <>
                  <div className="absolute top-5 w-full h-20 bg-gradient-to-b from-white dark:from-dark-900 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-6 w-full h-20 bg-gradient-to-t from-white dark:from-dark-900 to-transparent pointer-events-none"></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}