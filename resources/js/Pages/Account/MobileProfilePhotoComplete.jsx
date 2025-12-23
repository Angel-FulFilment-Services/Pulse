import React from 'react';
import { Head } from '@inertiajs/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function MobileProfilePhotoComplete({ message }) {
  return (
    <>
      <Head title="Profile Photo Set" />
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-200/60 mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-2">
            Already Complete
          </h1>
          <p className="text-gray-600 dark:text-dark-400 mb-4">
            {message || 'Your profile photo has already been set.'}
          </p>
          <p className="text-sm text-gray-500 dark:text-dark-500">
            You can close this page now.
          </p>
        </div>
      </div>
    </>
  );
}
