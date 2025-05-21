import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { router } from '@inertiajs/react';
import UploadProfilePhoto from '../../Components/Account/UploadProfilePhoto';
import { FaceSmileIcon, UserCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import Logo from '../../Components/Branding/Logo';
import { usePage } from '@inertiajs/react';

export default function Photo({ account }) {
  const [isLoading, setIsLoading] = useState(false);

  console.log('Account:', account);

  const setProfilePhoto = async (image) => {
    try {
      setIsLoading(true);
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const formData = new FormData();
      formData.append('profile_photo', image);

      const response = await fetch('/profile/account/photo/set', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 422) {
          const errorData = await response.json();
          throw new Error(errorData.errors.profile_photo || 'Validation failed');
        }
        throw new Error('Failed to set profile photo');
      }

      router.visit('/profile/account/photo');
      toast.success('Profile photo updated successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Profile photo could not be updated. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProfilePhoto = async () => {
    try {
      setIsLoading(true);
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

      const response = await fetch('/profile/account/photo/delete', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile photo');
      }

      router.visit('/profile/account/photo');
      toast.success('Profile photo deleted successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } catch (error) {
      console.error(error);
      toast.error('Profile photo could not be deleted. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-800 gap-y-8">
    
        <div className="flex flex-col items-center justify-center scale-150 mb-10">
            <Logo/>
        </div>

      {account.profile_photo ? (
        <div className="w-full max-w-2xl p-6 bg-white dark:bg-dark-900 rounded-lg shadow-lg flex flex-col items-center">
            <div className="mb-8 text-center w-full">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Thank You!</h1>
                <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
                    Your profile photo has been successfully updated.
                </p>
            </div>

          <div className="size-64 lg:size-96 ring-4 ring-green-600 rounded-full bg-green-600 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
                <UserIcon className="size-32 lg:size-32 text-green-600 opacity-85 absolute z-20" />
            </div>
            <img
                src={`https://pulse.cdn.angelfs.co.uk/profile/images/${account.profile_photo}`}
                alt="Profile Preview"
                draggable={false}
                className="contrast-75 brightness-85 rounded-full w-full h-full object-cover"
                style={{
                    maxWidth: 'none',
                    maxHeight: 'none',
                    objectFit: 'cover',
                    transition: 'opacity 0.2s',
                }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-64 lg:size-96 rounded-full bg-green-600/10 z-20"></div>
            </div>
          </div>
          <button
            onClick={deleteProfilePhoto}
            className="mt-6 text-sm font-semibold text-theme-600 hover:text-theme-500 dark:text-theme-700 dark:hover:text-theme-600"
            disabled={isLoading}
          >
            Delete Current Photo
          </button>
        </div>
      ) : (
        <div className="w-full max-w-2xl p-6 bg-white dark:bg-dark-900 rounded-lg shadow-lg">
          <UploadProfilePhoto
            handleSubmit={(image) => setProfilePhoto(image)}
            handleClose={() => router.visit('/profile/account')}
          />
        </div>
      )}
    </div>
  );
}