import React, { useState } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import SimpleList from '../Lists/SimpleList';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';
import { getStatus } from '../../Utils/Rota';
import { toast } from 'react-toastify'; // Import toast for notifications
import { TrashIcon, ExclamationCircleIcon  } from '@heroicons/react/20/solid';
import { PencilIcon } from '@heroicons/react/24/solid';
import { usePage } from '@inertiajs/react';

export default function ShiftInformation({ selectedShift, selectedEvent, setShowFlagShift, setSelectedEvent, allowEventManagement }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { auth } = usePage().props;

  const shiftStartDate = new Date(selectedShift.shift.shiftdate);
  shiftStartDate.setHours(Math.floor(selectedShift.shift.shiftstart / 100), selectedShift.shift.shiftstart % 100);
  
  const shiftEndDate = new Date(selectedShift.shift.shiftdate);
  shiftEndDate.setHours(Math.floor(selectedShift.shift.shiftend / 100), selectedShift.shift.shiftend % 100);
  
  const bufferStart = new Date(shiftStartDate.getTime() - 30 * 60 * 1000); // 30 min before shift start
  const bufferEnd = new Date(shiftEndDate.getTime() + 30 * 60 * 1000);     // 30 min after shift end

  const handleRemoveEvent = async () => {
    try {
      if(!selectedEvent || !allowEventManagement || selectedEvent.category === 'SMS Sent' || selectedEvent.user_id === auth.user.id) {
        // Display error toast notification
        toast.error('You cannot remove this event.', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
        return;
      }

      const route = selectedEvent.origin === 'events' ? '/rota/remove-event' : '/rota/remove-break';
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content'); // Get CSRF token

      const response = await fetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken, // Include CSRF token in the headers
        },
        body: JSON.stringify({ eventId: selectedEvent.origin === 'events' ? selectedEvent.id : selectedEvent.unq_id }), // Pass the event ID in the request body
      });

      if (!response.ok) {
        throw new Error('Failed to remove the event');
      }

      // Dispatch the custom event to refresh timesheets, and events
      window.dispatchEvent(new Event('refreshTimesheets'));
      window.dispatchEvent(new Event('refreshEvents'));

      // Display success toast notification
      toast.success('Event removed successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });

      // Close the dialog
      setIsDialogOpen(false);

      // Optionally, refresh the data or update the UI to reflect the removal
      // For example, you could trigger a re-fetch of the shift data here
    } catch (error) {
      // Display error toast notification
      toast.error('Failed to remove the event. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    }
  };

  if (!selectedShift) {
    return <p className="p-4">No shift selected.</p>;
  }

  return (
    <>
      <h3 className="font-medium text-sm text-gray-900 pt-4">Shift</h3>
      <dl className="divide-y divide-gray-200 border-b border-t border-gray-200 pt-2">
        {/* Status */}
        <div className="flex justify-between items-center py-1.5 text-sm font-medium">
          <dt className="text-gray-500">Status</dt>
          <dd className={(() => {
            const { color } = getStatus(selectedShift.shift, selectedShift.timesheets, selectedShift.events);
            return `p-1 px-2 rounded-lg ring-1 text-xs ${color}`;
          })()}>
            {(() => {
              const { status } = getStatus(selectedShift.shift, selectedShift.timesheets, selectedShift.events);
              return status;
            })()}
          </dd>
        </div>

        {/* Shift Start */}
        <div className="flex justify-between items-center py-2 text-sm font-medium">
          <dt className="text-gray-500">{!selectedShift.shift.unallocated ? "Scheduled Shift Start" : "Shift Started"}</dt>
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
          <dt className="text-gray-500">{!selectedShift.shift.unallocated ? "Scheduled Shift End" : "Shift Ended"}</dt>
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
        {!selectedShift.shift.unallocated ? (
          <div className="flex justify-between items-center py-2 text-sm font-medium">
            <dt className="text-gray-500">Actual Time Started</dt>
            <dd className="text-gray-900">
              {(() => {
                const earliestOnTime = selectedShift.timesheets
                  .filter((timesheet) => timesheet.hr_id === selectedShift.shift.hr_id)
                  .map((timesheet) => new Date(timesheet.on_time))
                  .sort((a, b) => a - b)[0];

                return earliestOnTime
                  ? format(earliestOnTime, 'h:mm a')
                  : 'N/A';
              })()}
            </dd>
          </div>
        ) : <></>}

        {/* Scheduled Hours */}
        {!selectedShift.shift.unallocated ? (
          <div className="flex justify-between py-2 text-sm font-medium">
            <dt className="text-gray-500">Scheduled Hours</dt>
            <dd className="text-gray-900">
              {(() => {
                const reductionMinutes = (selectedShift?.events || [])
                .filter((event) => event.category === 'Reduced') // Filter only reduction events
                .reduce((total, event) => {
                  const onTime = new Date(event.on_time);
                  const offTime = event.off_time ? new Date(event.off_time) : new Date();
                  return total + differenceInMinutes(offTime, onTime); // Add the difference for each reduction event
                }, 0);

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

                const adjustedMinutes = scheduledMinutes - reductionMinutes;

                const formattedScheduledHours = `${String(
                  Math.floor((adjustedMinutes) / 60)
                ).padStart(2, '0')}:${String((adjustedMinutes) % 60).padStart(2, '0')}`;

                return formattedScheduledHours;
              })()}
            </dd>
          </div>
        ) : <></>}

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
          {(() => {
            // Merge timesheets and events
            const mergedData = [
              ...(selectedShift?.timesheets || []).filter(record => {
                if (!record.on_time || !record.off_time) return false;
                const onTime = new Date(record.on_time);
                const offTime = new Date(record.off_time);
                return onTime >= bufferStart && offTime <= bufferEnd;
              }).map((record) => ({
                ...record,
                origin: 'timesheets',
              })),
              ...(selectedShift?.events || []).filter(record => {
                if (!record.on_time || !record.off_time) return false;
                const onTime = new Date(record.on_time);
                const offTime = new Date(record.off_time);
                return onTime >= bufferStart && offTime <= bufferEnd;
              }).map((record) => ({
                ...record,
                origin: 'events',
              })),
            ].map((record) => ({
              started: record.on_time && record.category !== 'Note' && record.category !== 'SMS Sent'
                ? format(new Date(record.on_time), 'h:mm a')
                : '',
              ended: record.off_time && record.category !== 'Note' && record.category !== 'SMS Sent'
                ? format(new Date(record.off_time), 'h:mm a')
                : '',
              category: record.category || record.type || 'N/A', // Use 'category' or 'type' for the record
              on_time: record.on_time, // Include on_time for sorting
              duration: record.off_time && record.category !== 'Note' && record.category !== 'SMS Sent'
                ? `${Math.floor(
                    differenceInMinutes(
                      new Date(record.off_time),
                      new Date(record.on_time)
                    ) / 60
                  )}h ${differenceInMinutes(
                    new Date(record.off_time),
                    new Date(record.on_time)
                  ) % 60}m`
                : '',
              action: (record.origin === 'events' && record.category !== 'SMS Sent') || (record.origin === 'timesheets' && record.category === 'Break') ? (
                <div className="flex gap-x-1">
                  {(auth !== record.user_id && allowEventManagement && record.origin === 'events') && (
                      <button
                        type="button"
                        className="bg-gray-50  w-7 h-7 ring-1 ring-gray-300 rounded-md hover:bg-gray-100  flex justify-center items-center"
                        onClick={() => {
                          if (allowEventManagement) {
                            setSelectedEvent(record);
                            setShowFlagShift(true);
                          }
                        }}
                      >
                        <PencilIcon className="w-5 h-5 inline-block text-gray-500" />
                      </button>
                  )} 
                  {(auth !== record.user_id && allowEventManagement) && (
                      <button
                        type="button"
                        className="bg-red-50 w-7 h-7 ring-1 ring-red-200 rounded-md hover:bg-red-100 flex justify-center items-center"
                        onClick={() => {
                          if (allowEventManagement) {
                            setSelectedEvent(record);
                            setIsDialogOpen(true);
                          }
                        }}
                      >
                        <TrashIcon className="w-5 h-5 inline-block text-red-600" />
                      </button>
                  )}
                </div>
              ) : null,
            }));

            // Sort the merged array by on_time
            const sortedData = mergedData.sort(
              (a, b) => new Date(a.on_time) - new Date(b.on_time)
            );

            return sortedData.length > 0 ? (
              <SimpleList
              headers={[
                { label: 'Started', visible: true },
                { label: 'Ended', visible: true },
                { label: 'Category', visible: true },
                { label: 'Duration', visible: true },
                { label: 'Action', visible: false, className: "flex flex-row justify-end w-full" },
              ]}
                data={sortedData}
              />
            ) : (
              <p className="py-2 text-sm text-gray-500">No events available.</p>
            );
          })()}
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          title="Confirm Removal"
          description="Are you sure you want to remove this event? This action cannot be undone."
          isYes={handleRemoveEvent}
          type="question"
          yesText="Remove"
          cancelText="Cancel"
        />
      </div>
    </>
  );
}