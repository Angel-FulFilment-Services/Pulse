import React, { useState, useEffect } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { BellIcon, ChatBubbleOvalLeftIcon, CheckIcon, FlagIcon } from '@heroicons/react/20/solid';
import { sendSMS } from '../../Utils/SMS';
import ClickedFlyout from '../Flyouts/ClickedFlyout';
import { validateRequired, validateIsLength, validateAscii } from '../../Utils/Validation';
import ShiftInformation from './ShiftInformation';
import FlagShift from './FlagShift';
import { toast } from 'react-toastify';
import useFetchEmployee from '../Fetches/User/useFetchEmployee';
import { hasPermission } from '../../Utils/Permissions';

export default function ShiftView({ selectedShift }) {
  const [sendingButtons, setSendingButtons] = useState({}); // Track sending status for each button
  const [message, setMessage] = useState(''); // State to track the textarea value
  const [showFlagShift, setShowFlagShift] = useState(false); // State to toggle between components
  const [selectedEvent, setSelectedEvent] = useState(null); // State to track selected event

  const allowEventManagement = hasPermission('pulse_manage_events');

  if (!selectedShift) {
    return <p className="p-4">No shift selected.</p>;
  }

  const { employee, isLoading } = useFetchEmployee(selectedShift.shift.hr_id);

  const getDefaultShiftReminderMessage = () => {
    const { shift } = selectedShift;
    const startTime = format(
      new Date(shift.shiftdate).setHours(
        Math.floor(shift.shiftstart / 100),
        shift.shiftstart % 100
      ),
      'h:mm a'
    );
    const endTime = format(
      new Date(shift.shiftdate).setHours(
        Math.floor(shift.shiftend / 100),
        shift.shiftend % 100
      ),
      'h:mm a'
    );
    return `Reminder: You have a shift scheduled on ${format(
      new Date(shift.shiftdate),
      'd MMMM, yyyy'
    )} from ${startTime} to ${endTime}.`;
  };

  const sendCustomSMS = async (message, buttonKey) => {
    setSendingButtons((prev) => ({ ...prev, [buttonKey]: true })); // Set the specific button to "sending"

    try {
      await sendSMS('Angel', employee.contact_mobile_phone, message); // Call the generic sendSMS function

      let startHour, startMinute, endHour, endMinute;

      startHour = selectedShift.shift.shiftstart.slice(0, 2);
      startMinute = selectedShift.shift.shiftstart.slice(2, 4);

      // Create a new SMS event.
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const payload = {
        hrID: selectedShift.shift.hr_id,
        flagType: 'SMS Sent',
        startTime: { hour: startHour, minute: startMinute },
        endTime: { hour: startHour, minute: startMinute },
        notes: message,
        date: selectedShift.shift.shiftdate,
        shiftID: selectedShift.shift.unq_id,
      }

      const response = await fetch('/rota/save-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken, // Include the CSRF token
        },
        body: JSON.stringify(payload),
      });

    } catch (error) {
      console.error('Error sending shift reminder:', error);
    } finally {
      setSendingButtons((prev) => ({ ...prev, [buttonKey]: false })); // Reset the specific button to "not sending"
    }
  };

  return (
    <div className="pr-4">
      <div className="flex flex-col gap-y-4 divide-y divide-gray-200 dark:divide-dark-700">
        <div className="rounded-xl bg-gray-50 dark:bg-dark-800 h-8 flex flex-row">
          <ClickedFlyout
            icon={sendingButtons['shift-reminder'] ? (
                <svg
                  className="inline w-4 h-4 animate-spin fill-gray-200 dark:fill-dark-700"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              ) : (
                <BellIcon className="w-5 h-5" />
              )}
            width="w-72"
            placement="bottom"
            className={`w-1/3 justify-center items-center flex h-full ring-1 ring-inset ring-gray-300 dark:ring-dark-600 z-50 rounded-l-lg ${
                sendingButtons['shift-reminder']
                  ? 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-500 dark:hover:text-dark-400 hover:text-gray-500 cursor-pointer'
            }`}
            onOpen={() => setMessage(getDefaultShiftReminderMessage())}
            onClose={() => setMessage('')} // Clear the message when the flyout closes
            content={(handleSubmit) => (
              <div className="w-full mx-auto p-2 flex flex-col space-y-2 divide-y divide-gray-300 hover:text-gray-400 dark:divide-dark-600 dark:hover:text-dark-500 cursor-auto">
                <div className="w-full flex justify-between items-center">
                  <h1 className="text-gray-800 hover:text-gray-800 dark:text-dark-100 hover:dark:text-dark-100">Compose your SMS message</h1>
                  <h2 className={` ${255 - message.length < 10 ? 'text-red-500 dark:text-red-600' : 'text-gray-400 dark:text-dark-500'}  `}>
                    {255 - message.length}
                  </h2>
                </div>
                <textarea
                  rows={8}
                  name="comment"
                  id="comment"
                  className="block w-full p-2 resize-none rounded-md border-0 py-1.5 text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 placeholder:text-gray-400 dark:placeholder:text-dark-500 focus:ring-2 focus:ring-inset !outline-none focus:ring-theme-600 dark:focus:ring-theme-700 sm:text-sm sm:leading-6"
                  value={message} // Bind the textarea value to state
                  onChange={(e) => setMessage(e.target.value)} // Update state on input
                  maxLength={255}
                />
                <button
                  className="cursor-pointer inline-flex w-full justify-center rounded-md bg-theme-500 dark:bg-theme-600 px-3 py-2 text-sm font-semibold text-white dark:text-dark-100 shadow-sm hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-700"
                  onClick={() => handleSubmit(message, 'shift-reminder')} // Pass message and buttonKey to handleSubmit
                >
                  Send
                </button>
              </div>
            )}
            onSubmit={(message, buttonKey) => {
              // Validate the message
              const requiredError = validateRequired(message, 'Message');
              const lengthError = validateIsLength(message, { min: 1, max: 255 });
              const asciiError = validateAscii(message);

              if (requiredError || lengthError || asciiError) {
                // Display the first validation error as a toast notification
                toast.error(requiredError?.message || lengthError?.message || asciiError?.message,{
                    position: 'top-center',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: 'light',
                });
                return;
              }

              // If validation passes, send the SMS
              sendCustomSMS(message, buttonKey);
              setMessage(''); // Clear the message after sending
            }}
          />
          <ClickedFlyout
            icon={sendingButtons['custom-sms'] ? (
                <svg
                  className="inline w-4 h-4 animate-spin fill-gray-200 dark:fill-dark-700"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              ) : (
                <ChatBubbleOvalLeftIcon className="w-5 h-5" />
              )}
            width="w-72"
            placement="bottom"
            className={`w-1/3 justify-center items-center flex h-full ring-1 ring-inset ring-gray-300 dark:ring-dark-600 z-50 ${
                sendingButtons['custom-sms']
                  ? 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-500 dark:hover:text-dark-400 hover:text-gray-500 cursor-pointer'
            }`}
            onClose={() => setMessage('')} // Clear the message when the flyout closes
            content={(handleSubmit) => (
              <div className="w-full mx-auto p-2 flex flex-col space-y-2 divide-y divide-gray-300 hover:text-gray-400 dark:divide-dark-600 dark:hover:text-dark-500 cursor-auto">
                <div className="w-full flex justify-between items-center">
                  <h1 className="text-gray-800 hover:text-gray-800 dark:text-dark-100 dark:hover:text-dark-100">Compose your SMS message</h1>
                  <h2 className={` ${255 - message.length < 10 ? 'text-red-500 dark:text-red-600' : 'text-gray-400 dark:text-dark-500'}  `}>
                    {255 - message.length}
                  </h2>
                </div>
                <textarea
                  rows={8}
                  name="comment"
                  id="comment"
                  className="block w-full p-2 resize-none rounded-md border-0 py-1.5 text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 placeholder:text-gray-400 dark:placeholder:text-dark-500 focus:ring-2 focus:ring-inset !outline-none focus:ring-theme-600 dark:focus:ring-theme-700 sm:text-sm sm:leading-6"
                  value={message} // Bind the textarea value to state
                  onChange={(e) => setMessage(e.target.value)} // Update state on input
                  maxLength={255}
                />
                <button
                  className="cursor-pointer inline-flex w-full justify-center rounded-md bg-theme-500 dark:bg-theme-600 px-3 py-2 text-sm font-semibold text-white dark:text-dark-100 shadow-sm hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-700"
                  onClick={() => handleSubmit(message, 'custom-sms')} // Pass message and buttonKey to handleSubmit
                >
                  Send
                </button>
              </div>
            )}
            onSubmit={(message, buttonKey) => {
              // Validate the message
              const requiredError = validateRequired(message, 'Message');
              const lengthError = validateIsLength(message, { min: 1, max: 255 });
              const asciiError = validateAscii(message);

              if (requiredError || lengthError || asciiError) {
                // Display the first validation error as a toast notification
                toast.error(requiredError?.message || lengthError?.message || asciiError?.message,{
                    position: 'top-center',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: 'light',
                });
                return;
              }

              // If validation passes, send the SMS
              sendCustomSMS(message, buttonKey);
              setMessage(''); // Clear the message after sending
            }}
          />

          <button
            className={`w-1/3 justify-center items-center flex h-full ring-1 ring-inset ring-red-200 dark:ring-red-400/75 ${showFlagShift ? "bg-red-100 dark:bg-red-300/75 text-red-700 dark:text-red-800" : "hover:bg-red-100 bg-red-50 dark:hover:bg-red-200/75 dark:bg-red-300/75 text-red-600 hover:text-red-700 dark:text-red-700 dark:hover:text-red-600"} cursor-pointer rounded-r-xl disabled:bg-red-100 disabled:text-red-300 dark:disabled:text-red-400 dark:disabled:bg-red-300/75 disabled:cursor-not-allowed`}
            onClick={() => {if(allowEventManagement) setShowFlagShift(true)}} // Show the FlagShift component
            {... allowEventManagement ? {} : { disabled: true } } // Disable button if no permission
          >
            <FlagIcon className="w-5 h-5"></FlagIcon>
          </button>
        </div>

        {/* Toggle between ShiftInformation and FlagShift */}
        {showFlagShift ? (
          <FlagShift
            selectedShift={selectedShift}
            selectedEvent={selectedEvent}
            allowEventManagement={allowEventManagement}
            onCancel={() => {setShowFlagShift(false); setSelectedEvent(null);}} // Hide the FlagShift component
          />
        ) : (
          <ShiftInformation 
            selectedShift={selectedShift} 
            selectedEvent={selectedEvent}
            allowEventManagement={allowEventManagement} 
            setShowFlagShift={setShowFlagShift} 
            setSelectedEvent={setSelectedEvent} 
          />
        )}
      </div>
    </div>
  );
}