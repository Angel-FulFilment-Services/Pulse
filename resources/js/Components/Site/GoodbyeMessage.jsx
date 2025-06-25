import React, { useEffect } from 'react';

export default function GoodbyeMessage() {
  useEffect(() => {
    const audio = new Audio('/sounds/bong.mp3'); // Place your bong sound in public/sounds/
    audio.play();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white dark:bg-dark-900">
      <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">
        Goodbye!
      </h2>
      <p className="text-xl text-gray-800 dark:text-dark-100">
        You have successfully signed out.
      </p>
    </div>
  );
}