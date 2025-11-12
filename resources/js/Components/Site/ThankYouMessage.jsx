import React, { useEffect, useRef } from 'react';

export default function ThankYouMessage({ setStep, category }) {
  const timeoutRef = useRef(null); // Ref to store the timeout ID

  useEffect(() => {
    const audio = new Audio('/sounds/access-signed-in.mp3'); // Place your bing sound in public/sounds/
    audio.play();

    // Set the timeout and store its ID in the ref
    timeoutRef.current = setTimeout(() => {
      setStep('splash');
    }, 5000); // Automatically go back to splash after 5 seconds

    // Cleanup timeout on component unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    // Clear the timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStep('splash'); // Navigate to splash
  };

  return (
    <div
      className="flex flex-col items-center justify-between h-screen w-screen dark:bg-dark-900 cursor-pointer select-none py-10"
      tabIndex={0}
      style={{ outline: 'none' }}
      onClick={handleClick} // Clear timeout and navigate to splash
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
    >
      <div className="h-full w-full flex flex-col items-center justify-start px-10 z-50"> 
        <div className="flex h-2/5 items-start justify-start">
          <img
            src="/images/angel-logo-tag-line.png"
            alt="Logo"
            className="h-52"
          />
        </div>
        <div className="flex flex-col items-start justify-center -mt-8">
          <h1 className="text-9xl font-semibold text-white dark:text-dark-100 mb-6">
            Thank You,
          </h1>
          <h1 className="text-7xl font-semibold text-white dark:text-dark-100 mb-6">
            {category === 'signature' ? 'Someone will be with you shortly.' : 'Please leave your package in the foyer.'}
          </h1>
        </div>
      </div>
    </div>
  );
}