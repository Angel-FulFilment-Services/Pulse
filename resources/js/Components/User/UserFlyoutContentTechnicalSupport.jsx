import React, { useState, useRef, useEffect } from 'react';
import useFetchTechnicalSupport from '../Fetches/Assets/useFetchTechnicalSupport.jsx';
import { format, differenceInMinutes } from 'date-fns';
import ShiftProgressBar from '../Calendar/ShiftProgressBar.jsx';
import DateInput from '../Forms/DateInput.jsx';
import { PlusIcon } from '@heroicons/react/24/outline';
import ButtonControl from '../Controls/ButtonControl.jsx';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';
import StackedList from '../Lists/StackedList.jsx'; // Import your new component

export default function UserFlyoutContentTechnicalSupport({ hrId, handleDateChange, dateRange }) {
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { events } = useFetchTechnicalSupport(dateRange.startDate, dateRange.endDate, hrId);

  const allowSupportManagement = true; // Replace with actual logic to determine if event management is allowed

  useEffect(() => {
    setIsTransitioning(false);
  }, [events]);

  const handleRemoveEvent = async () => {
    try {
      if (!selectedEvent || !allowSupportManagement) {
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

      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content'); // Get CSRF token

      const response = await fetch('/asset-management/support/events/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken, // Include CSRF token in the headers
        },
        body: JSON.stringify({ eventId: selectedEvent.id }), // Pass the event ID in the request body
      });

      if (!response.ok) {
        throw new Error('Failed to remove the event');
      }

      // Dispatch the custom event to refresh timesheets, and events
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

      setIsDialogOpen(false);
    }
  };

  return (
    <div className="px-4 py-3 h-full flex flex-col justify-start items-start divide-y divide-gray-200">
      <div className="flex gap-x-2 items-center pb-2 justify-between w-full">
        <div className="gap-y-1 flex flex-col">
          <h3 className="text-base font-semibold text-gray-900">Technical Support</h3>
          <p className="max-w-2xl text-sm text-gray-500">
            Technical support for the period of{' '}
            {format(new Date(dateRange.startDate), 'dd MMMM, yyyy')} -{' '}
            {format(new Date(dateRange.endDate), 'dd MMMM, yyyy')}
          </p>
        </div>
        <div className="flex gap-x-4 items-center">
          <ButtonControl 
            id="refresh_button" 
            Icon={PlusIcon} 
            customClass="w-7 h-7" 
            iconClass="w-7 h-7 text-orange-500 hover:text-orange-600 transition-all ease-in-out" 
          />
          <DateInput startDateId={"startDate"} endDateId={"endDate"} label={null} showShortcuts={true} placeholder={"Date"} dateRange={true} minDate={new Date().setFullYear(new Date().getFullYear() - 100)} maxDate={new Date().setFullYear(new Date().getFullYear() + 100)} currentState={{startDate: dateRange.startDate, endDate: dateRange.endDate}} onDateChange={handleDateChange}/>
        </div>
      </div>
      <div className={`w-full h-full isolate max-h-[25rem] overflow-auto ${events.length > 6 ? "pr-2" : ""}`}>
        {isTransitioning
          ? Array.from({ length: 5 }).map((_, subRowIndex) => (
              <ul className="flex flex-col pb-2" key={subRowIndex}>
                <li className="py-1">
                  <div className="flex flex-row w-full justify-between">
                    <div className="flex flex-col w-1/4 gap-y-1 justify-center">
                      <div className="bg-gray-100 animate-pulse rounded-full w-20 h-4"></div>
                      <div className="bg-gray-100 animate-pulse rounded-full w-24 h-4"></div>
                    </div>
                    <div className="w-full">
                      <ShiftProgressBar isLoading={true} />
                    </div>
                  </div>
                </li>
              </ul>
            ))
          : (() => {
              // Merge timesheets and events
              const data = events.map((record) => ({
                date: record.on_time
                ? format(new Date(record.date), 'dd MMMM, yyyy')
                : '-',
                started: record.on_time && record.category !== 'Note' && record.category !== 'SMS Sent'
                  ? format(new Date(record.on_time), 'h:mm a')
                  : '',
                ended: record.off_time && record.category !== 'Note' && record.category !== 'SMS Sent'
                  ? format(new Date(record.off_time), 'h:mm a')
                  : '',
                category: record.category || record.type || 'N/A', // Use 'category' or 'type' for the record
                on_time: record.on_time, // Include on_time for sorting
                notes: record.notes,
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
                logged: record.created_at
                ? format(new Date(record.created_at), 'dd MMMM, yyyy h:mm a')
                : '-',
                loggedby: record.logged_by,
                createdBy: record.created_by_user_id,
                resolved: record.resolved,
                id: record.id,
              }));
  
              // Sort the merged array by on_time
              const sortedData = data.sort(
                (a, b) => new Date(a.on_time) - new Date(b.on_time)
              );

              return sortedData.length > 0 ? (
                <StackedList
                  data={sortedData}
                  allowSupportManagement={allowSupportManagement}
                  onRemove={row => {
                    setSelectedEvent(row);
                    setIsDialogOpen(true);
                  }}
                  renderDescription={(row) =>
                  <>
                    <p>Time Spent: {row.duration}</p>
                    <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                      <circle cx={1} cy={1} r={1} />
                    </svg>
                    <p>Technician: {row.loggedby}</p>
                    <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                      <circle cx={1} cy={1} r={1} />
                    </svg>
                    <p>
                      <time dateTime={row.logged}>{row.logged}</time>
                    </p>
                  </>}
                  renderExpanableContent={(row) => (
                    <>
                      <p className="text-sm font-semibold leading-6 text-gray-900">
                        {row.date}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.started} - {row.ended}
                      </p>
                      {row.notes && (
                        <div className="mt-2 text-xs text-gray-700">
                          <span className="font-semibold">Notes: </span>
                          {row.notes}
                        </div>
                      )}
                    </>
                  )}
                  onEdit={row => {
                    // handle edit logic here if needed
                  }}
                />
              ) : (
                <p className="py-2 text-sm text-gray-500">No events available.</p>
              );
            })()
          }
      </div>
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        title="Confirm Removal"
        description="Are you sure you want to remove this support event? This action cannot be undone."
        isYes={handleRemoveEvent}
        type="question"
        yesText="Remove"
        cancelText="Cancel"
      />
    </div>
  );
}