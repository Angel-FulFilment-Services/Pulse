import React, { useState, useEffect } from 'react';
import useFetchEvents from '../Calendar/useFetchEvents';
import { format, startOfDay, endOfDay, subDays, differenceInMinutes } from 'date-fns';
import ShiftProgressBar from '../Calendar/ShiftProgressBar';
import DateInput from '../Forms/DateInput.jsx';
import SimpleList from '../Lists/SimpleList';

export default function UserFlyoutContentEvents({ hrId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(true);

  const [dateRange, setDateRange ] = useState({startDate: format(startOfDay(subDays(currentDate, 7)), 'yyyy-MM-dd'), endDate: format(endOfDay(currentDate), 'yyyy-MM-dd')});

  const { events } = useFetchEvents(dateRange.startDate, dateRange.endDate, hrId);

  useEffect(() => {
    setIsTransitioning(false);
  }, [events]);

  const handleDateChange = (item) => {   
    setDateRange({startDate: item[0].value, endDate: item[1].value});
    setIsTransitioning(true);
  }

  return (
    <div className="px-4 py-3 h-full min-h-96 flex flex-col justify-start items-start divide-y divide-gray-200">
      <div className="flex gap-x-2 items-center pb-2 justify-between w-full">
        <div className="gap-y-1 flex flex-col">
          <h3 className="text-base font-semibold text-gray-900">Events</h3>
          <p className="max-w-2xl text-sm text-gray-500">
            Events for the period of{' '}
            {format(new Date(dateRange.startDate), 'MMMM dd, yyyy')} -{' '}
            {format(new Date(dateRange.endDate), 'MMMM dd, yyyy')}
          </p>
        </div>
        <div className="w-56">
          <DateInput startDateId={"startDate"} endDateId={"endDate"} label={null} placeholder={"Date"} dateRange={true} minDate={new Date().setFullYear(new Date().getFullYear() - 100)} maxDate={new Date().setFullYear(new Date().getFullYear() + 100)} currentState={{startDate: dateRange.startDate, endDate: dateRange.endDate}} onDateChange={handleDateChange}/>
        </div>
      </div>
      <div className={`w-full h-full pt-2 isolate max-h-[25rem] overflow-auto ${events.length > 6 ? "pr-2" : ""}`}>
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
          : 
            (() => {
              // Merge timesheets and events
              const data = events.map((record) => ({
                date: record.on_time
                ? format(new Date(record.created_at), 'MMMM dd, yyyy h:mm a')
                : '-',
                started: record.on_time
                  ? format(new Date(record.on_time), 'h:mm a')
                  : '-',
                ended: record.off_time
                  ? format(new Date(record.off_time), 'h:mm a')
                  : '-',
                category: record.category || record.type || 'N/A', // Use 'category' or 'type' for the record
                on_time: record.on_time, // Include on_time for sorting
                duration: record.off_time
                  ? `${Math.floor(
                      differenceInMinutes(
                        new Date(record.off_time),
                        new Date(record.on_time)
                      ) / 60
                    )}h ${differenceInMinutes(
                      new Date(record.off_time),
                      new Date(record.on_time)
                    ) % 60}m`
                  : '-'
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
                  { label: 'Duration', visible: true },
                ]}
                  data={sortedData}
                />
              ) : (
                <p className="py-2 text-sm text-gray-500">No events available.</p>
              );
            })()
          }
      </div>
    </div>
  );
}