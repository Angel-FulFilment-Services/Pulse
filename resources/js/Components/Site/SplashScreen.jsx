import React from 'react';

export default function SplashScreen({ onContinue }) {
  return (
    <div
      className="flex flex-col items-center justify-between h-screen w-screen dark:bg-dark-900 cursor-pointer select-none py-10"
      onClick={onContinue} 
      tabIndex={0}
      role="button"
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onContinue()}
      style={{ outline: 'none' }}
    >
      <div className="h-full w-full flex flex-col items-center justify-start px-10 z-50"> 
        <div className="flex h-2/5 items-start justify-start">
          <img
            src="/images/angel-logo.png"
            alt="Logo"
            className="w-72"
          />
        </div>
        <div className="flex flex-col items-start justify-start">
          <h1 className="text-9xl font-semibold text-white dark:text-dark-100 mb-6">
            Hello,
          </h1>
          <h1 className="text-7xl font-semibold text-white dark:text-dark-100 mb-6">
            Please sign in here.
          </h1>
        </div>
      </div>
      {/* <div
        className="px-6 py-6 text-center bg-[rgba(0,141,169,1)] text-white rounded-3xl text-3xl font-medium shadow-lg hover:bg-gray-50 focus:outline-none z-50 ring-1 ring-black ring-opacity-5"
      >
        <p className="opacity-100">
          Tap the screen to continue
        </p>
      </div> */}
      <div
        className="px-6 py-6 text-center bg-white text-black rounded-3xl text-3xl font-medium shadow-lg hover:bg-gray-50 focus:outline-none z-50 ring-1 ring-black ring-opacity-5"
      >
        <p className="opacity-100 -mt-1">
          Tap the screen to continue
        </p>
      </div>
    </div>
  );
}