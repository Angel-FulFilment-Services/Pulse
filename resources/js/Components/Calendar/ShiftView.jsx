import React, { useState } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { BellIcon, ChatBubbleOvalLeftIcon, CheckIcon, FlagIcon } from '@heroicons/react/20/solid';
import SimpleList from '../Lists/SimpleList';
import { getStatus } from '../../Utils/Rota';
import { sendSMS } from '../../Utils/SMS';
import ClickedFlyout from '../Flyouts/ClickedFlyout';
import { validateRequired, validateIsLength, validateAscii } from '../../Utils/Validation';
import { toast } from 'react-toastify';

export default function ShiftView({ selectedShift }) {
  const [sendingButtons, setSendingButtons] = useState({}); // Track sending status for each button
  const [message, setMessage] = useState(''); // State to track the textarea value

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
      await sendSMS('Angel', '07788236380', message); // Call the generic sendSMS function
    } catch (error) {
      console.error('Error sending shift reminder:', error);
    } finally {
      setSendingButtons((prev) => ({ ...prev, [buttonKey]: false })); // Reset the specific button to "not sending"
    }
  };

  const sendCustomSMS = async (message, buttonKey) => {
    setSendingButtons((prev) => ({ ...prev, [buttonKey]: true })); // Set the specific button to "sending"

    try {
      await sendSMS('Angel', '07788236380', message); // Call the generic sendSMS function
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
            className={`w-1/4 justify-center items-center flex h-full ring-1 ring-inset ring-gray-300 ${
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
            className={`w-1/4 justify-center items-center flex h-full ring-1 ring-inset ring-gray-300 ${
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

          <button className="w-1/4 justify-center items-center flex h-full ring-1 ring-inset ring-green-300 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 cursor-pointer">
            <CheckIcon className="w-5 h-5"></CheckIcon>
          </button>
            <ClickedFlyout
            icon={<FlagIcon className="w-5 h-5"></FlagIcon>}
            width="w-28"
            placement="bottom"
            className={`w-1/4 justify-center items-center flex h-full ring-1 ring-inset ring-red-200 hover:bg-red-100 bg-red-50 text-red-600 hover:text-red-700 cursor-pointer rounded-r-xl`}
            content={(handleSubmit) => (
              <div className="w-full mx-auto py-2 flex flex-col space-y-2 divide-y divide-gray-300 hover:text-gray-400 cursor-auto">
                <div className="w-full flex justify-center items-center">
                    <ul className="divide-y divide-gray-200 w-full flex flex-col items-center">
                        <li className ={`hover:bg-gray-50 bg-white text-gray-900 hover:font-semibold font-normal block truncate relative cursor-pointer select-none py-1 pl-3 pr-9`}>
                            Sick
                        </li>
                        <li className ={`hover:bg-gray-50 bg-white text-gray-900 hover:font-semibold font-normal block truncate relative cursor-pointer select-none py-1 pl-3 pr-9`}>
                            Sick
                        </li>
                        <li className ={`hover:bg-gray-50 bg-white text-gray-900 hover:font-semibold font-normal block truncate relative cursor-pointer select-none py-1 pl-3 pr-9`}>
                            Sick
                        </li>
                        <li className ={`hover:bg-gray-50 bg-white text-gray-900 hover:font-semibold font-normal block truncate relative cursor-pointer select-none py-1 pl-3 pr-9`}>
                            Sick
                        </li>
                    </ul>
                </div>
              </div>
            )}
            onSubmit={(message, buttonKey) => {
              // Validate the message

              // If validation passes, send the SMS
              sendCustomSMS(message, buttonKey);
              setMessage(''); // Clear the message after sending
            }}
          />
        </div>

        <h3 className="font-medium text-sm text-gray-900 pt-4">Shift</h3>
        <dl className="divide-y divide-gray-200 border-b border-t border-gray-200 pt-2">
          {/* Status */}
          <div className="flex justify-between items-center py-1.5 text-sm font-medium">
            <dt className="text-gray-500">Status</dt>
            <dd className={(() => {
              const { color } = getStatus(selectedShift.shift, selectedShift.timesheets);
              return `p-1 px-2 rounded-lg ring-1 text-xs ${color}`;
            })()}>
              {(() => {
                const { status } = getStatus(selectedShift.shift, selectedShift.timesheets);
                return status;
              })()}
            </dd>
          </div>

          {/* Shift Start */}
          <div className="flex justify-between items-center py-2 text-sm font-medium">
            <dt className="text-gray-500">Scheduled Shift Start</dt>
            <dd className="text-gray-900">
              {(() => {
                const startHour = Math.floor(selectedShift.shift.shiftstart / 100);
                const startMinute = selectedShift.shift.shiftstart % 100;
                const startDate = new Date();
                startDate.setHours(startHour, startMinute);
                return format(startDate, 'h:mm a');
              })()}
            </dd>
          </div>

          {/* Shift End */}
          <div className="flex justify-between items-center py-2 text-sm font-medium">
            <dt className="text-gray-500">Scheduled Shift End</dt>
            <dd className="text-gray-900">
              {(() => {
                const endHour = Math.floor(selectedShift.shift.shiftend / 100);
                const endMinute = selectedShift.shift.shiftend % 100;
                const endDate = new Date();
                endDate.setHours(endHour, endMinute);
                return format(endDate, 'h:mm a');
              })()}
            </dd>
          </div>

          {/* Actual Time Started */}
          <div className="flex justify-between items-center py-2 text-sm font-medium">
            <dt className="text-gray-500">Actual Time Started</dt>
            <dd className="text-gray-900">
              {(() => {
                const shiftStartDate = new Date(selectedShift.shift.shiftdate);
                shiftStartDate.setHours(
                  Math.floor(selectedShift.shift.shiftstart / 100),
                  selectedShift.shift.shiftstart % 100
                );

                const earliestOnTime = selectedShift.timesheets
                  .filter((timesheet) => timesheet.hr_id === selectedShift.shift.hr_id)
                  .map((timesheet) => new Date(timesheet.on_time))
                  .sort((a, b) => a - b)[0];

                return earliestOnTime
                  ? format(earliestOnTime, 'h:mm a')
                  : format(shiftStartDate, 'h:mm a');
              })()}
            </dd>
          </div>

          {/* Scheduled Hours */}
          <div className="flex justify-between py-2 text-sm font-medium">
            <dt className="text-gray-500">Scheduled Hours</dt>
            <dd className="text-gray-900">
              {(() => {
                const shiftStartDate = new Date(selectedShift.shift.shiftdate);
                shiftStartDate.setHours(
                  Math.floor(selectedShift.shift.shiftstart / 100),
                  selectedShift.shift.shiftstart % 100
                );

                const shiftEndDate = new Date(selectedShift.shift.shiftdate);
                shiftEndDate.setHours(
                  Math.floor(selectedShift.shift.shiftend / 100),
                  selectedShift.shift.shiftend % 100
                );

                const scheduledMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);
                let breakMinutes = 0;
                if (scheduledMinutes > 240 && scheduledMinutes <= 420) {
                  breakMinutes = 30;
                } else if (scheduledMinutes > 420) {
                  breakMinutes = 60;
                }

                const formattedScheduledHours = `${String(
                  Math.floor((scheduledMinutes - breakMinutes) / 60)
                ).padStart(2, '0')}:${String((scheduledMinutes - breakMinutes) % 60).padStart(2, '0')}`;

                return formattedScheduledHours;
              })()}
            </dd>
          </div>

          {/* Worked Hours */}
          <div className="flex justify-between py-2 text-sm font-medium">
            <dt className="text-gray-500">Worked Hours</dt>
            <dd className="text-gray-900">
              {(() => {
                const totalActualMinutes = selectedShift.timesheets
                  .filter((timesheet) => timesheet.hr_id === selectedShift.shift.hr_id)
                  .reduce((total, timesheet) => {
                    const onTime = new Date(timesheet.on_time);
                    const offTime = timesheet.off_time ? new Date(timesheet.off_time) : new Date();
                    return total + differenceInMinutes(offTime, onTime);
                  }, 0);

                const formattedActualHours = `${String(
                  Math.floor(totalActualMinutes / 60)
                ).padStart(2, '0')}:${String(totalActualMinutes % 60).padStart(2, '0')}`;

                return formattedActualHours;
              })()}
            </dd>
          </div>
        </dl>

        <h3 className="pt-4 font-medium text-sm text-gray-900">Events</h3>
        <div className="w-full">
          <div className="pt-2">
            {selectedShift?.timesheets?.length > 0 ? (
              <SimpleList
                headers={['Started', 'Ended', 'Category', 'Duration']}
                data={selectedShift.timesheets.map((timesheet) => {
                  const eventStarted = timesheet.on_time
                    ? format(new Date(timesheet.on_time), 'h:mm a')
                    : '-';
                  const eventEnded = timesheet.off_time
                    ? format(new Date(timesheet.off_time), 'h:mm a')
                    : '-';
                  const duration = timesheet.off_time
                    ? `${Math.floor(
                        differenceInMinutes(new Date(timesheet.off_time), new Date(timesheet.on_time)) / 60
                      )}h ${differenceInMinutes(
                        new Date(timesheet.off_time),
                        new Date(timesheet.on_time)
                      ) % 60}m`
                    : '-';

                  return {
                    started: eventStarted,
                    ended: eventEnded,
                    category: timesheet.category || 'N/A',
                    duration: duration,
                  };
                })}
              />
            ) : (
              <p className="py-2 text-sm text-gray-500">No timesheet events available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}