import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CameraIcon, DevicePhoneMobileIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY = 'profile_photo_prompt_dismissed';
const SMS_SENT_KEY = 'profile_photo_sms_sent';

// Dismiss duration in hours (default 48 hours), configurable via env
const DISMISS_HOURS = parseInt(import.meta.env.VITE_PROFILE_PHOTO_DISMISS_HOURS || '48', 10);
const DISMISS_DURATION = DISMISS_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

const SMS_LINK_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds (link expiry)

/**
 * Check if the prompt should be shown based on localStorage dismissal and SMS sent time
 */
export function shouldShowProfilePhotoPrompt() {
  const now = Date.now();
  
  // Check if user dismissed the prompt in the last 48 hours
  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (dismissed) {
    const dismissedAt = parseInt(dismissed, 10);
    if ((now - dismissedAt) <= DISMISS_DURATION) {
      return false;
    }
  }
  
  // Check if SMS was sent in the last 24 hours (link still valid)
  const smsSent = localStorage.getItem(SMS_SENT_KEY);
  if (smsSent) {
    const sentAt = parseInt(smsSent, 10);
    if ((now - sentAt) <= SMS_LINK_DURATION) {
      return false;
    }
  }
  
  return true;
}

/**
 * Dismiss the prompt for 48 hours
 */
export function dismissProfilePhotoPrompt() {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
}

/**
 * Record that an SMS was sent (prevents prompt for 24 hours)
 */
export function recordSmsSent() {
  localStorage.setItem(SMS_SENT_KEY, Date.now().toString());
}

/**
 * Clear the dismissal and SMS sent record (useful after user sets photo)
 */
export function clearProfilePhotoDismissal() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SMS_SENT_KEY);
}

export default function ProfilePhotoPromptDialog({
  isOpen,
  onClose,
  maskedPhone,
  userName,
  onSendSms,
}) {
  const [step, setStep] = useState('prompt'); // 'prompt' | 'sending' | 'sent' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Reset step when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('prompt');
      setErrorMessage('');
      setIsResending(false);
      setResendCountdown(0);
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const startResendCountdown = () => {
    setResendCountdown(60); // 60 second countdown
  };

  const handleYes = async () => {
    setStep('sending');
    try {
      const result = await onSendSms();
      if (result.success) {
        recordSmsSent(); // Track that SMS was sent
        startResendCountdown(); // Start countdown for resend button
        setStep('sent');
      } else {
        setErrorMessage(result.message || 'Failed to send SMS.');
        setStep('error');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred.');
      setStep('error');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await onSendSms();
      if (result.success) {
        recordSmsSent(); // Track that SMS was sent
        startResendCountdown(); // Reset countdown after resend
      } else {
        setErrorMessage(result.message || 'Failed to resend SMS.');
        setStep('error');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred.');
      setStep('error');
    } finally {
      setIsResending(false);
    }
  };

  const handleLater = () => {
    dismissProfilePhotoPrompt();
    onClose();
  };

  const handleClose = () => {
    // Don't reset step here - let the useEffect reset it when dialog opens again
    // This prevents the content from flashing back to 'prompt' during the fade-out animation
    onClose();
  };

  // Get icon based on step
  const getIcon = () => {
    switch (step) {
      case 'sending':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-100 dark:bg-theme-200/60">
            <DevicePhoneMobileIcon className="h-7 w-7 text-theme-600 dark:text-theme-700 animate-pulse" aria-hidden="true" />
          </div>
        );
      case 'sent':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-200/60">
            <CheckCircleIcon className="h-7 w-7 text-green-600 dark:text-green-700" aria-hidden="true" />
          </div>
        );
      case 'error':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-200/60">
            <DevicePhoneMobileIcon className="h-7 w-7 text-red-600 dark:text-red-700" aria-hidden="true" />
          </div>
        );
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-100 dark:bg-theme-200/60">
            <CameraIcon className="h-7 w-7 text-theme-600 dark:text-theme-700" aria-hidden="true" />
          </div>
        );
    }
  };

  // Get title based on step
  const getTitle = () => {
    switch (step) {
      case 'sending': return 'Sending SMS...';
      case 'sent': return 'SMS Sent!';
      case 'error': return 'Failed to Send SMS';
      default: return 'Set Your Profile Photo';
    }
  };

  // Get description based on step
  const getDescription = () => {
    switch (step) {
      case 'sending':
        return (
          <p className="text-sm text-gray-500 dark:text-dark-400">
            Please wait while we send the link to your phone.
          </p>
        );
      case 'sent':
        return (
          <>
            <p className="text-sm text-gray-500 dark:text-dark-400">
              We've sent an SMS message to the number ending in <span className="font-semibold">{maskedPhone}</span>.
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-400 mt-2">
              Click the link in the message to set your profile photo from your phone.
            </p>
            <p className="text-sm text-gray-800 dark:text-dark-500 mt-2 leading-relaxed">
                Remember to store your mobile device away from your workstation after updating your photo in accordance with your contract.
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-500 mt-3">
              The link expires in 24 hours and can only be used once.
            </p>
          </>
        );
      case 'error':
        return (
          <p className="text-sm text-gray-500 dark:text-dark-400">
            {errorMessage}
          </p>
        );
      default:
        return (
          <>
            <p className="text-sm text-gray-800 dark:text-dark-200">
              Hi {userName}, you haven't set a profile photo yet.
            </p>
            <p className='text-sm text-gray-500 dark:text-dark-400 mt-4 leading-relaxed'>
                In line with industry standards, adding a profile photo helps personalise your experience and makes it easier for team members to connect. Your image will be kept in the strictest of confidence in a secure environment.
            </p>
            <p className="text-sm text-gray-800 dark:text-dark-200 mt-4">
              We'll send a secure link to your phone ending in <span className="font-semibold">{maskedPhone}</span>.
            </p>
          </>
        );
    }
  };

  // Get buttons based on step
  const getButtons = () => {
    switch (step) {
      case 'sending':
        return (
          <button
            type="button"
            disabled
            className="inline-flex w-full justify-center rounded-md bg-gray-300 dark:bg-dark-600 px-3 py-2 text-sm font-semibold text-gray-500 dark:text-dark-400 shadow-sm cursor-not-allowed"
          >
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </button>
        );
      case 'sent':
        return (
          <div className="space-y-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-theme-500 dark:bg-theme-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600"
              onClick={handleClose}
            >
              Done
            </button>
            <button
              type="button"
              disabled={isResending || resendCountdown > 0}
              className="inline-flex w-full justify-center rounded-md bg-white dark:bg-dark-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleResend}
            >
              {isResending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resending...
                </>
              ) : resendCountdown > 0 ? (
                `Resend available in ${resendCountdown}s`
              ) : (
                "Didn't get the message? Resend"
              )}
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-white dark:bg-dark-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-theme-500 dark:bg-theme-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600"
              onClick={() => setStep('prompt')}
            >
              Try Again
            </button>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-white dark:bg-dark-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700"
              onClick={handleLater}
            >
              I'll Do This Later
            </button>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-theme-500 dark:bg-theme-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600"
              onClick={handleYes}
            >
              Yes, Send Link
            </button>
          </div>
        );
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={step === 'sending' ? () => {} : handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/50 dark:bg-dark-800/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {/* Fixed structure - icon, title, description, buttons */}
                <div className="min-h-[310px] flex flex-col">
                  {/* Icon */}
                  {getIcon()}
                  
                  {/* Title */}
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-dark-100">
                      {getTitle()}
                    </Dialog.Title>
                  </div>
                  
                  {/* Description - flexible height area */}
                  <div className="mt-2 text-center flex-1">
                    {getDescription()}
                  </div>
                  
                  {/* Buttons - always at bottom */}
                  <div className="mt-5 sm:mt-6">
                    {getButtons()}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
