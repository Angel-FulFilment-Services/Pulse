import React from 'react';
import { Head } from '@inertiajs/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function MobileProfilePhotoExpired() {
  return (
    <>
      <Head title="Link Expired" />
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-200/60 mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-2">
            Link Expired
          </h1>
          <p className="text-gray-600 dark:text-dark-400 mb-4">
            This link has expired or has already been used.
          </p>
          <p className="text-sm text-gray-500 dark:text-dark-500">
            Please request a new link from the Angel Pulse app if you still need to set your profile photo.
          </p>
        </div>
      </div>
    </>
  );
}
