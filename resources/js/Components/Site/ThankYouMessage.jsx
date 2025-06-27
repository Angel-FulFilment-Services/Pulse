import React, { useEffect } from 'react';

export default function WelcomeMessage() {
  useEffect(() => {
    const audio = new Audio('/sounds/access-signed-in.mp3'); // Place your bing sound in public/sounds/
    audio.play();
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-between h-screen w-screen dark:bg-dark-900 cursor-pointer select-none py-10"
      tabIndex={0}
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
        <div className="flex flex-col items-start justify-start -mt-8">
          <h1 className="text-9xl font-semibold text-white dark:text-dark-100 mb-6">
            Thank You,
          </h1>
          <h1 className="text-7xl font-semibold text-white dark:text-dark-100 mb-6">
            Someone will be with you shortly
          </h1>
        </div>
      </div>
    </div>
  );
}