import React, { useState } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { BellIcon, ChatBubbleOvalLeftIcon, CheckIcon, FlagIcon } from '@heroicons/react/20/solid';
import SimpleList from '../Lists/SimpleList';
import { getStatus } from '../../Utils/Rota';
import { sendSMS } from '../../Utils/SMS';
import ClickedFlyout from '../Flyouts/ClickedFlyout';
import { validateRequired, validateIsLength, validateAscii } from '../../Utils/Validation';
import ShiftInformation from './ShiftInformation';
import FlagShift from './FlagShift';
import { toast } from 'react-toastify';

export default function ShiftView({ selectedShift }) {
  const [sendingButtons, setSendingButtons] = useState({}); // Track sending status for each button
  const [message, setMessage] = useState(''); // State to track the textarea value
  const [showFlagShift, setShowFlagShift] = useState(false); // State to toggle between components

  if (!selectedShift) {
    return <p className="p-4">No shift selected.</p>;
  }

  const sendShiftReminder = async (shift, buttonKey) => {
    setSendingButtons((prev) => ({ ...prev, [buttonKey]: true })); // Set the specific button to "sending"

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

    const message = `Reminder: You have a shift scheduled on ${format(
      new Date(shift.shiftdate),
      'MMMM d, yyyy'
    )} from ${startTime} to ${endTime}.`;

    try {
      await sendSMS('Angel', '07515881715', message); // Call the generic sendSMS function
    } catch (error) {
      console.error('Error sending shift reminder:', error);
    } finally {
      setSendingButtons((prev) => ({ ...prev, [buttonKey]: false })); // Reset the specific button to "not sending"
    }
  };

  const sendCustomSMS = async (message, buttonKey) => {
    setSendingButtons((prev) => ({ ...prev, [buttonKey]: true })); // Set the specific button to "sending"

    try {
      await sendSMS('Angel', '07515881715', message); // Call the generic sendSMS function
    } catch (error) {
      console.error('Error sending shift reminder:', error);
    } finally {
      setSendingButtons((prev) => ({ ...prev, [buttonKey]: false })); // Reset the specific button to "not sending"
    }
  };

  return (
    <div className="pr-4">
      <div className="flex flex-col gap-y-4 divide-y divide-gray-200">
        <div className="rounded-xl bg-gray-50 h-8 flex flex-row">
          <button
            className={`w-1/3 justify-center items-center flex h-full ring-1 ring-inset ring-gray-300 ${
              sendingButtons['shift-reminder']
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-500 cursor-pointer'
            } rounded-l-xl`}
            onClick={() => sendShiftReminder(selectedShift.shift, 'shift-reminder')} // Pass the buttonKey into the function
            disabled={sendingButtons['shift-reminder']} // Disable the button if it's sending
          >
            {sendingButtons['shift-reminder'] ? (
              <svg
                className="inline w-4 h-4 animate-spin fill-gray-200"
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
          </button>
          <ClickedFlyout
            icon={sendingButtons['custom-sms'] ? (
                <svg
                  className="inline w-4 h-4 animate-spin fill-gray-200"
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
            className={`w-1/3 justify-center items-center flex h-full ring-1 ring-inset ring-gray-300 z-50 ${
                sendingButtons['custom-sms']
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-500 cursor-pointer'
            }`}
            onClose={() => setMessage('')} // Clear the message when the flyout closes
            content={(handleSubmit) => (
              <div className="w-full mx-auto p-2 flex flex-col space-y-2 divide-y divide-gray-300 hover:text-gray-400 cursor-auto">
                <div className="w-full flex justify-between items-center">
                  <h1 className="text-gray-800 hover:text-gray-800">Compose your message</h1>
                  <h2 className={` ${255 - message.length < 10 ? 'text-red-500' : 'text-gray-400'}  `}>
                    {255 - message.length}
                  </h2>
                </div>
                <textarea
                  rows={8}
                  name="comment"
                  id="comment"
                  className="block w-full p-2 resize-none rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset !outline-none focus:ring-orange-600 sm:text-sm sm:leading-6"
                  value={message} // Bind the textarea value to state
                  onChange={(e) => setMessage(e.target.value)} // Update state on input
                  maxLength={255}
                />
                <button
                  className="cursor-pointer inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
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
            className={`w-1/3 justify-center items-center flex h-full ring-1 ring-inset ring-red-200 ${showFlagShift ? "bg-red-100 text-red-700" : "hover:bg-red-100 bg-red-50 text-red-600 hover:text-red-700"} cursor-pointer rounded-r-xl`}
            onClick={() => setShowFlagShift(true)} // Show the FlagShift component
          >
            <FlagIcon className="w-5 h-5"></FlagIcon>
          </button>
        </div>

        {/* Toggle between ShiftInformation and FlagShift */}
        {showFlagShift ? (
          <FlagShift
            selectedShift={selectedShift}
            onCancel={() => setShowFlagShift(false)} // Hide the FlagShift component
          />
        ) : (
          <ShiftInformation selectedShift={selectedShift} />
        )}
      </div>
    </div>
  );
}