import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import UploadProfilePhoto from '../../Components/Account/UploadProfilePhoto';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function MobileProfilePhoto({ user_id, user_name, signature, expires }) {
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (imageData) => {
    setIsSubmitting(true);
    setError(null);

    if (!imageData) {
      setError('No image to save. Please take or upload a photo first.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Build the signed URL for the POST request
      const url = `/profile/photo/mobile/${user_id}/set?signature=${encodeURIComponent(signature)}&expires=${expires}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ profile_photo: imageData }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsComplete(true);
      } else {
        setError(data.message || 'Failed to save profile photo.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <>
        <Head title="Profile Photo Set" />
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-200/60 mb-6">
              <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-2">
              Profile Photo Set!
            </h1>
            <p className="text-gray-600 dark:text-dark-400 mb-4">
              Your profile photo has been updated successfully.
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-500">
              You can close this page now.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title="Set Profile Photo" />
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col items-center justify-start p-4 pt-8">
        <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl p-6 max-w-lg w-full">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <UploadProfilePhoto
            handleSubmit={handleSubmit}
            handleClose={() => {
                window.close();
            }}
          />

          {isSubmitting && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-dark-800 rounded-lg p-6 text-center">
                <svg
                  className="inline w-12 h-12 animate-spin fill-theme-500 dark:fill-theme-600 text-gray-200 dark:text-dark-700 mx-auto"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <p className="mt-4 text-gray-700 dark:text-dark-300">Saving your photo...</p>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-400 dark:text-dark-600 mt-4 text-center">
          This is a secure, one-time use link. It will expire after you set your photo.
        </p>
      </div>
    </>
  );
}
