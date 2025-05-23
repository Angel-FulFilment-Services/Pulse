import React, { useState, useEffect } from 'react';
import useFetchEvents from '../Fetches/Rota/useFetchEvents.jsx';
import { format, differenceInMinutes } from 'date-fns';
import ShiftProgressBar from '../Calendar/ShiftProgressBar.jsx';
import DateInput from '../Forms/DateInput.jsx';
import SimpleList from '../Lists/SimpleList.jsx';

export default function UserFlyoutContentEvents({ hrId, handleDateChange, dateRange }) {
  const [isTransitioning, setIsTransitioning] = useState(true);

  const { events } = useFetchEvents(dateRange.startDate, dateRange.endDate, hrId);

  useEffect(() => {
    setIsTransitioning(false);
  }, [events]);

  return (
    <div className="px-4 py-3 h-full flex flex-col justify-start items-start divide-y divide-gray-200 dark:divide-dark-700">
      <div className="flex gap-x-2 items-center pb-2 justify-between w-full">
        <div className="gap-y-1 flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 dark:text-dark-100">Events</h3>
          <p className="max-w-2xl text-sm text-gray-500 dark:text-dark-400">
            Events for the period of{' '}
            {format(new Date(dateRange.startDate), 'dd MMMM, yyyy')} -{' '}
            {format(new Date(dateRange.endDate), 'dd MMMM, yyyy')}
          </p>
        </div>
        <div className="w-56">
          <DateInput startDateId={"startDate"} endDateId={"endDate"} label={null} showShortcuts={true} placeholder={"Date"} dateRange={true} minDate={new Date().setFullYear(new Date().getFullYear() - 100)} maxDate={new Date().setFullYear(new Date().getFullYear() + 100)} currentState={{startDate: dateRange.startDate, endDate: dateRange.endDate}} onDateChange={handleDateChange}/>
        </div>
      </div>
      <div className={`w-full h-full pt-2 isolate max-h-[50rem] overflow-auto ${events.length > 6 ? "pr-2" : ""}`}>
        {isTransitioning
          ? Array.from({ length: 5 }).map((_, subRowIndex) => (
              <></>
            ))
          : 
            (() => {
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
              }));
  
              // Sort the merged array by on_time
              const sortedData = data.sort(
                (a, b) => new Date(a.on_time) - new Date(b.on_time)
              );

              return sortedData.length > 0 ? (
                <SimpleList
                headers={[
                  { label: 'Date', visible: true },
                  { label: 'Started', visible: true },
                  { label: 'Ended', visible: true },
                  { label: 'Category', visible: true },
                  { label: 'Notes', visible: true },
                  { label: 'Duration', visible: true },
                  { label: 'Logged', visibile: true },
                  { label: 'Logged By', visibile: true },
                ]}
                  data={sortedData}
                />
              ) : (
                <p className="py-2 text-sm text-gray-500 dark:text-dark-400">No events available.</p>
              );
            })()
          }
      </div>
    </div>
  );
}