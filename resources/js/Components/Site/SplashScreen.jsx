import { TruckIcon } from '@heroicons/react/24/solid';
import React from 'react';

export default function SplashScreen({ onContinue, setStep }) {
  return (
    <>
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
              src="/images/angel-logo-tag-line.png"
              alt="Logo"
              className="h-52"
            />
          </div>
          <div className="flex flex-col items-start justify-start -mt-14">
            <h1 className="text-9xl font-semibold text-white dark:text-dark-100 -ml-2">
              Welcome to
              <img
                src="/images/angel-logo-light.png"
                alt="Logo"
                className="h-52 inline-block ml-6 mb-3"
              />
            </h1>
            <h1 className="text-5xl font-semibold text-white dark:text-dark-100 mb-6 -mt-6 max-w-[54rem]">
              Please Sign In Here
            </h1>
            <h1 className="text-4xl font-semibold text-white dark:text-dark-100 mb-6 ml-1">
              For Angel employees and visitors only.
            </h1>
          </div>
        </div>
        <div className="flex flex-row items-center justify-center gap-x-6 z-50">
          <div
            className="px-6 py-6 text-center bg-[rgba(0,141,169,1)] text-white rounded-3xl text-3xl font-medium shadow-lg focus:outline-none z-50 ring-1 ring-black ring-opacity-5"
            onClick={(event) => { setStep('signin-interview-home'); event.stopPropagation(); }}
          >
            I'm here for an interview
          </div>
          <div>
            <p className="text-3xl font-semibold text-white dark:text-dark-100">or</p>
          </div>
          <div
            className="px-6 py-6 text-center bg-[rgba(0,141,169,1)] text-white rounded-3xl text-3xl font-medium shadow-lg focus:outline-none z-50 ring-1 ring-black ring-opacity-5"
          >
            <p className="opacity-100">
              Tap the screen to continue
            </p>
          </div>
        </div>
        {/* <div
          className="px-6 py-6 text-center bg-white text-black rounded-3xl text-3xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] font-medium hover:bg-gray-50 focus:outline-none z-50 ring-1 ring-black ring-opacity-5"
        >
          <p className="opacity-100 -mt-1">
            Tap the screen to continue
          </p>
        </div> */}
      </div>
      <div
        className="z-50 p-6 absolute right-10 top-1/2 -mt-16 text-center bg-[rgba(0,141,169,1)] text-white rounded-3xl cursor-pointer text-xl shadow-[0_0_35px_0_rgba(0,0,0,0.1)] font-bold focus:outline-none ring-1 ring-black ring-opacity-5 flex flex-col items-center"
        onClick={(event) => { setStep('delivery-type-home'); event.stopPropagation(); }}
      >
        <TruckIcon className="h-14 w-14 inline-block text-white" />
      </div>
    </>
  );
}