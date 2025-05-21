import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { ThreeDots } from 'react-loader-spinner';
import Logo from '../Branding/Logo.jsx';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';

export default function TwoFactorAuthForm() {
  const { data, setData, post, processing, errors, reset, clearErrors, wasSuccessful, hasErrors } = useForm({
    passcode: '', // Initialize passcode field
  });

  const [resending, setResending] = useState(false); // Track resend processing state

  useEffect(() => {
    // Add a global paste event listener
    const handleGlobalPaste = (e) => {
      const pastedData = e.clipboardData.getData('text');
      if (pastedData.length == 6) {
        setData('passcode', pastedData.toUpperCase()); // Automatically set the input value
      } else {
        e.preventDefault(); // Prevent the paste if it's not six characters
      }
    };

    window.addEventListener('paste', handleGlobalPaste);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [setData]);

  function submit(e) {
    e.preventDefault();

    clearErrors();

    post('/verify', {
      preserveScroll: true,
      onSuccess: () => {
        router.visit('/'); // Redirect on success
      },
      onError: (e) => {
        toast.error(e.error, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });

        reset('passcode'); // Reset passcode field on error
      },
    });
  }

  function resendCode() {
    setResending(true); // Set resending state to true
    router.get('/verify/resend', {}, {
      onSuccess: () => {
        toast.success('Verification code resent successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      },
      onError: () => {
        toast.error('Failed to resend verification code. Please try again.', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      },
      onFinish: () => {
        setResending(false); // Reset resending state to false
      },
    });
  }

  function button_colour() {
    switch (true) {
      case hasErrors:
        return 'bg-red-500 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500';
      case wasSuccessful:
        return 'bg-green-500 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500';
      default:
        return 'bg-theme-400 hover:bg-theme-500 dark:bg-theme-600 dark:hover:bg-theme-500';
    }
  }

  return (
    <div className="w-full max-w-lg lg:w-1/2 xl:w-1/3 h-screen flex flex-col items-center justify-center z-40">
      <form
        className="flex flex-col items-center justify-center rounded-xl w-4/5 shadow-2xl bg-gray-100 dark:bg-dark-800 overflow-y-auto p-6"
        onSubmit={submit}
      >
        <Logo />
        <div className="text-center mt-4">
          <h2 className="text-base font-semibold leading-7 text-theme-500">Two-Factor Authentication</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-300">
            Enter the passcode sent to your device.
          </p>
        </div>
        <div className="mt-4 w-full">
          <label
            htmlFor="passcode"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 text-center"
          >
            Passcode
          </label>
          <div className="mt-4 flex justify-center">
            <div
              className={`flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 focus-within:ring-2 focus-within:ring-inset focus-within:ring-theme-600 dark:focus-within:ring-theme-700 sm:max-w-md ${
                errors.passcode && 'ring-red-600 dark:ring-red-700'
              }`}
            >
              <input
                type="text"
                name="passcode"
                value={data.passcode}
                onChange={(e) => {
                  setData('passcode', e.target.value);
                  clearErrors();
                }}
                id="passcode"
                autoComplete="one-time-code"
                className="block flex-1 border-0 bg-transparent px-1 text-gray-900 placeholder:text-gray-400 dark:text-dark-100 caret-transparent dark:placeholder:text-dark-600 focus:ring-0 sm:leading-6 focus:outline-none text-center font-semibold max-w-48 min-h-16 placeholder:text-md text-2xl uppercase"
                placeholder="&lowast;&lowast;&lowast;&lowast;&lowast;&lowast;"
                spellCheck="false"
                maxLength="6"
              />
            </div>
            {errors.passcode && (
              <div className="text-red-600 dark:text-red-700 text-sm pt-1 text-center">{errors.passcode}</div>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-1">
          <p className="text-xs leading-tight text-gray-600 dark:text-dark-300">Didn't receive a code?</p>
        </div>
        <div className="mt-1 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={resendCode}
            className="text-sm font-medium text-theme-500 hover:text-theme-600 dark:text-theme-400 dark:hover:text-theme-500"
          >
            Resend Code
          </button>
          {resending && (
            <span className="text-md font-medium text-theme-500 dark:text-theme-400 -mr-4 -mt-1">
              <span className="inline-block animate-dot-sequence">.</span>
              <span className="inline-block animation-delay-200 animate-dot-sequence">.</span>
              <span className="inline-block animation-delay-500 animate-dot-sequence">.</span>
            </span>
          )}
        </div>
        <div className="mt-6">
          <button
            disabled={processing || wasSuccessful || hasErrors}
            className={`${button_colour()} transition-all duration-500 w-full max-w-xs min-w-48 rounded-md px-2 py-1.5 text-gray-100 dark:text-dark-100 text-base font-semibold flex flex-row justify-center items-center gap-1.5`}
          >
            {processing ? (
              <ThreeDots
                visible={true}
                height="24"
                width="40"
                color="#FFFFFF"
                radius="12.5"
                ariaLabel="three-dots-loading"
                wrapperStyle={{}}
                wrapperClass=""
              />
            ) : (
              !wasSuccessful &&
              !hasErrors && <p>Verify</p>
            )}
            {hasErrors &&
                <div className='w-5 h-5 checkmark__check'>
                    <svg viewBox="-2 -2 56 56" class="crossmark__icon" width="" height="">
                        <circle class="crossmark__circle" strokeWidth={4} strokeMiterlimit={10} stroke="currentColor" cx="26" cy="26" r="25" fill="none"/>
                        <path class="crossmark__cross" strokeWidth={4} strokeMiterlimit={10} strokeLinecap={"round"} stroke="currentColor" fill="none" d="M16 16 36 36M36 16 16 36"/>
                    </svg>
                </div>
            }
            {wasSuccessful &&
                <div className='w-5 h-5 checkmark__check'>
                    <svg viewBox="-2 -2 56 56" class="checkmark__icon">
                        <circle class="checkmark__circle" strokeWidth={4} strokeMiterlimit={10} stroke="currentColor" cx="26" cy="26" r="25" fill="none"/>
                        <path class="checkmark__cross" strokeWidth={4} strokeMiterlimit={10} strokeLinecap={"round"} stroke="currentColor" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
            }
          </button>
        </div>
      </form>
    </div>
  );
}