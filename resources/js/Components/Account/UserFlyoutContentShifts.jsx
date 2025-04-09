import React, { useState, useEffect } from 'react';
import useFetchShifts from '../Calendar/useFetchShifts';
import useFetchTimesheets from '../Calendar/useFetchTimesheets';
import useFetchEvents from '../Calendar/useFetchEvents';
import { format, startOfDay, endOfDay, subDays, differenceInMinutes } from 'date-fns';
import ShiftProgressBar from '../Calendar/ShiftProgressBar';
import DateInput from '../Forms/DateInput.jsx';

export default function UserFlyoutContentShifts({ hrId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(true);

  const [dateRange, setDateRange ] = useState({startDate: format(startOfDay(subDays(currentDate, 7)), 'yyyy-MM-dd'), endDate: format(endOfDay(currentDate), 'yyyy-MM-dd')});

  const { shifts, isLoading } = useFetchShifts(dateRange.startDate, dateRange.endDate, hrId);
  const { timesheets } = useFetchTimesheets(dateRange.startDate, dateRange.endDate, hrId);
  const { events } = useFetchEvents(dateRange.startDate, dateRange.endDate, hrId);

  useEffect(() => {
    if (shifts.length > 0 && timesheets.length) {
      setIsTransitioning(false);
    }
  }, [shifts, timesheets]);

  const handleDateChange = (item) => {   
    setDateRange({startDate: item[0].value, endDate: item[1].value});
    setIsTransitioning(true);
  }

  const calculateReductionMinutes = (events = []) => {
    return events
      .filter((event) => event.category === 'Reduced')
      .reduce((total, event) => {
        const onTime = new Date(event.on_time);
        const offTime = event.off_time ? new Date(event.off_time) : new Date();
        return total + differenceInMinutes(offTime, onTime);
      }, 0);
  };

  const calculateTotalShiftMinutes = (shifts) => {
    return shifts.reduce((total, shift) => {
      const shiftStartDate = new Date(shift.shiftdate);
      shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);

      const shiftEndDate = new Date(shift.shiftdate);
      shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);

      return total + differenceInMinutes(shiftEndDate, shiftStartDate);
    }, 0);
  };

  const calculateWorkedPercentage = (totalShiftMinutes, totalActualMinutes) => {
    const workedPercentage = (totalActualMinutes / totalShiftMinutes) * 100;
    return workedPercentage > 0 ? Math.floor(workedPercentage) : 0;
  };

  const totalShiftMinutes = calculateTotalShiftMinutes(shifts);
  const reductionMinutes = calculateReductionMinutes(events);
  const totalActualMinutes = timesheets.reduce((total, timesheet) => {
    const onTime = new Date(timesheet.on_time);
    const offTime = timesheet.off_time ? new Date(timesheet.off_time) : new Date();
    return total + differenceInMinutes(offTime, onTime);
  }, 0);
  const workedPercentage = calculateWorkedPercentage(totalShiftMinutes - reductionMinutes, totalActualMinutes);

  return (
    <div className="px-4 py-3 h-full flex flex-col justify-between items-start divide-y divide-gray-200">
      <div className="flex gap-x-2 items-center pb-2 justify-between w-full">
        <div className="gap-y-1 flex flex-col">
          <h3 className="text-base font-semibold text-gray-900">Shifts for this period</h3>
          <p className="max-w-2xl text-sm text-gray-500">
            {format(new Date(dateRange.startDate), 'MMMM dd, yyyy')} -{' '}
            {format(new Date(dateRange.endDate), 'MMMM dd, yyyy')}
          </p>
        </div>
        <div className="w-72">
          <DateInput startDateId={"startDate"} endDateId={"endDate"} label={null} placeholder={"Date"} dateRange={true} minDate={new Date().setFullYear(new Date().getFullYear() - 100)} maxDate={new Date().setFullYear(new Date().getFullYear() + 100)} currentState={{startDate: dateRange.startDate, endDate: dateRange.endDate}} onDateChange={handleDateChange}/>
        </div>
      </div>
      <div className="w-full h-full pt-2">
        {isTransitioning
          ? Array.from({ length: 5 }).map((_, subRowIndex) => (
              <ul className="flex flex-col pb-2" key={subRowIndex}>
                <li className="py-2">
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
          : shifts.map((shift) => {
              const shiftStartDate = new Date(shift.shiftdate);
              shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);

              const shiftEndDate = new Date(shift.shiftdate);
              shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);

              return (
                <ul className="flex flex-col pb-2" key={shift.id}>
                  <li className="py-2">
                    <div className="flex flex-row w-full justify-between">
                      <div className="flex flex-col w-1/4 justify-center">
                        <h4 className="font-medium text-xs text-gray-700">
                          {format(new Date(shift.shiftdate), 'MMMM dd, yyyy')}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {format(shiftStartDate, 'h:mm a').toLowerCase()} -{' '}
                          {format(shiftEndDate, 'h:mm a').toLowerCase()}
                        </p>
                      </div>
                      <div className="w-full">
                        <ShiftProgressBar
                          shift={shift}
                          timesheets={timesheets}
                          events={events}
                          isLoading={isTransitioning}
                        />
                      </div>
                    </div>
                  </li>
                </ul>
              );
            })}
      </div>
      <div className="mx-auto pt-2 flex flex-row w-full justify-between">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0 bg-white w-1/3">
          <div className="text-sm font-medium leading-6 text-gray-600">Hours Scheduled</div>
          <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900">
            { isTransitioning ? 
              <div className="bg-gray-100 h-6 my-1 mt-3 animate-pulse rounded-full w-48"></div>
            :
              <span>
                {Math.floor(totalShiftMinutes / 60) > 0 && `${Math.floor(totalShiftMinutes / 60)} hours`}
                {Math.floor(totalShiftMinutes / 60) > 0 && totalShiftMinutes % 60 > 0 && ', '}
                {totalShiftMinutes % 60 > 0 && `${totalShiftMinutes % 60} minutes`}
              </span>
            }
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-0 bg-white w-1/3">
          <div className="flex flex-col justify-center items-start">
            <div className="text-sm font-medium leading-6 text-gray-600">Hours Worked</div>
            <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900">
              { isTransitioning ? 
                <div className="bg-gray-100 h-6 my-1 mt-3 animate-pulse rounded-full w-48"></div>
              :
                <span>
                  {Math.floor(totalActualMinutes / 60) > 0 && `${Math.floor(totalActualMinutes / 60)} hours`}
                  {Math.floor(totalActualMinutes / 60) > 0 && totalActualMinutes % 60 > 0 && ', '}
                  {totalActualMinutes % 60 > 0 && `${totalActualMinutes % 60} minutes`}
                </span>
              }
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-end gap-x-4 gap-y-0 bg-white w-1/3">
          <div className="flex flex-col justify-center items-center">
            <div className="text-sm font-medium leading-6 text-gray-600">Percentage Worked</div>
            <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900">
              { isTransitioning ? 
                <div className="bg-gray-100 h-6 my-1 mt-3 animate-pulse rounded-full w-12"></div>
                :
                `${workedPercentage}%`
              }
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}