import React, { useEffect } from 'react';

export default function WelcomeMessage() {
  useEffect(() => {
    const audio = new Audio('/sounds/bing.mp3'); // Place your bing sound in public/sounds/
    audio.play();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white dark:bg-dark-900">
      <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-6">
        Welcome!
      </h2>
      <p className="text-xl text-gray-800 dark:text-dark-100">
        You have successfully signed in.
      </p>
    </div>
  );
}