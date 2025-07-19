import React, { useState, useEffect } from 'react';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import useFetchShifts from '../Fetches/Rota/useFetchShifts.jsx';
import useFetchTimesheets from '../Fetches/Rota/useFetchTimesheets.jsx';
import useFetchEvents from '../Fetches/Rota/useFetchEvents.jsx';
import useFetchCalls from '../Fetches/Rota/useFetchCalls.jsx';
import ShiftProgressBar from '../Calendar/ShiftProgressBar.jsx';
import DateInput from '../Forms/DateInput.jsx';
import ButtonControl from '../Controls/ButtonControl.jsx';
import { PhotoIcon } from '@heroicons/react/24/outline';

export default function UserFlyoutContentShifts({ hrId, handleDateChange, handleExport, dateRange, isTransitioning, setIsTransitioning }) {
  const { shifts, isLoading: isLoadingShifts, isLoaded: isLoadedShifts } = useFetchShifts(dateRange.startDate, dateRange.endDate, hrId);
  const { timesheets, isLoading: isLoadingTimesheets, isLoaded: isLoadedTimesheets } = useFetchTimesheets(dateRange.startDate, dateRange.endDate, hrId);
  const { events, isLoading: isLoadingEvents, isLoaded: isLoadedEvents } = useFetchEvents(dateRange.startDate, dateRange.endDate, hrId);
  const { calls, isLoading: isLoadingCalls, isLoaded: isLoadedCalls } = useFetchCalls(dateRange.startDate, dateRange.endDate, hrId);

  useEffect(() => {
    if (isLoadedShifts && isLoadedTimesheets) {
      setIsTransitioning(false);
    }
  }, [shifts, timesheets]);

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
  const totalActualMinutes = Math.round(
    timesheets.reduce((total, timesheet) => {
      const onTime = new Date(timesheet.on_time);
      const offTime = timesheet.off_time ? new Date(timesheet.off_time) : new Date();
      return total + differenceInSeconds(offTime, onTime);
    }, 0) / 60
  );
  
  const totalActualMinutesExcludingBreaks = Math.round(
    timesheets.reduce((total, timesheet) => {
      if (timesheet.category === "Break") {
        return total;
      }
      const onTime = new Date(timesheet.on_time);
      const offTime = timesheet.off_time ? new Date(timesheet.off_time) : new Date();
      return total + differenceInSeconds(offTime, onTime);
    }, 0) / 60
  );
  const workedPercentage = calculateWorkedPercentage(totalShiftMinutes - reductionMinutes, totalActualMinutes);
  const workedPercentageExcludingBreaks = calculateWorkedPercentage(totalShiftMinutes - reductionMinutes, totalActualMinutesExcludingBreaks);

  return (
    <div className="px-4 py-3 h-full flex flex-col justify-between items-start divide-y divide-gray-200 dark:divide-dark-700">
      <div className="flex gap-x-2 items-center pb-2 justify-between w-full">
        <div className="gap-y-1 flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 dark:text-dark-100">Shifts</h3>
          <p className="max-w-2xl text-sm text-gray-500 dark:text-dark-400">
            {format(new Date(dateRange.startDate), 'dd MMMM, yyyy')} -{' '}
            {format(new Date(dateRange.endDate), 'dd MMMM, yyyy')}
          </p>
        </div>
        <div className="flex gap-x-4 items-center">
          {shifts.length > 0 && (
            <ButtonControl 
              id="refresh_button" 
              Icon={PhotoIcon} 
              className="w-7 h-7" 
              iconClassName="w-7 h-7 text-theme-500 hover:text-theme-600 dark:text-theme-600 dark:hover:text-theme-500 transition-all ease-in-out" 
              onClick={handleExport}
            />
          )}
          <DateInput startDateId={"startDate"} endDateId={"endDate"} label={null} showShortcuts={true} placeholder={"Date"} dateRange={true} minDate={new Date().setFullYear(new Date().getFullYear() - 100)} maxDate={new Date().setFullYear(new Date().getFullYear() + 100)} currentState={{startDate: dateRange.startDate, endDate: dateRange.endDate}} onDateChange={handleDateChange}/>
        </div>
      </div>
      <div className={`w-full h-full pt-2 isolate overflow-auto bg-white dark:bg-dark-900 ${shifts.length > 6 ? "pr-2" : ""}`} id="scrollable_container">
        <ul className="flex flex-col pb-2" id="scrollable_content">
          {isTransitioning
            ? Array.from({ length: 8 }).map((_, subRowIndex) => (
                <li className="py-1 pb-2" key={subRowIndex}>
                  <div className="flex flex-row w-full justify-between">
                    <div className="flex flex-col w-1/4 gap-y-1 justify-center">
                      <div className="bg-gray-100 dark:bg-dark-800 animate-pulse rounded-full w-20 h-4"></div>
                      <div className="bg-gray-100 dark:bg-dark-800 animate-pulse rounded-full w-24 h-4"></div>
                    </div>
                    <div className="w-full">
                      <ShiftProgressBar isLoading={true} />
                    </div>
                  </div>
                </li>
              ))
            : shifts.map((shift) => {
                const shiftStartDate = new Date(shift.shiftdate);
                shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);

                const shiftEndDate = new Date(shift.shiftdate);
                shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);

                return (
                  <li className="py-1 pb-2" key={shift.id}>
                    <div className="flex flex-row w-full justify-between">
                      <div className="flex flex-col w-1/4 justify-center">
                        <h4 className="font-medium text-xs text-gray-700 dark:text-dark-200">
                          {format(new Date(shift.shiftdate), 'dd MMMM, yyyy')}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-dark-400">
                          {format(shiftStartDate, 'h:mm a').toLowerCase()} -{' '}
                          {format(shiftEndDate, 'h:mm a').toLowerCase()}
                        </p>
                      </div>
                      <div className="w-full">
                        <ShiftProgressBar
                          shift={shift}
                          timesheets={timesheets}
                          events={events}
                          calls={calls}
                          isLoading={isTransitioning}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
        </ul>
      </div>
      <div className="mx-auto pt-2 grid grid-cols-5 w-full justify-between">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0 bg-white dark:bg-dark-900 w-full">
          <div className="text-sm font-medium leading-6 text-gray-600 dark:text-dark-400">Hours Scheduled</div>
          <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900 dark:text-dark-100">
            { isTransitioning ? 
              <div className="bg-gray-100 dark:bg-dark-800 h-6 my-1 mt-3 animate-pulse rounded-full w-24"></div>
            :
              <span>
                {Math.floor(totalShiftMinutes / 60) > 0 && `${Math.floor(totalShiftMinutes / 60)} hours`}
                {Math.floor(totalShiftMinutes / 60) > 0 && totalShiftMinutes % 60 > 0 && ', '}
                {totalShiftMinutes % 60 > 0 && `${totalShiftMinutes % 60} minutes`}
              </span>
            }
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-start gap-x-4 gap-y-0 bg-white dark:bg-dark-900 w-full">
          <div className="flex flex-col justify-center items-start">
            <div className="text-sm font-medium leading-6 text-gray-600 dark:text-dark-400">Hours Worked <span className="text-gray-400 font-normal dark:text-dark-600">(Incl. Breaks)</span></div>
            <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900 dark:text-dark-100">
              { isTransitioning ? 
                <div className="bg-gray-100 dark:bg-dark-800 h-6 my-1 mt-3 animate-pulse rounded-full w-24"></div>
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
        {/* <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-0 bg-white w-full">
          <div className="flex flex-col justify-center items-start">
            <div className="text-sm font-medium leading-6 text-gray-600">Potential Earnings</div>
            <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900">
              { isTransitioning ? 
                <div className="bg-gray-100  h-6 my-1 mt-3 animate-pulse rounded-full w-24"></div>
              :
                <span>
                  {Math.floor(totalShiftMinutes / 60) > 0 &&
                  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
                    Math.floor(totalShiftMinutes / 60) * 12.21
                  )}
                </span>
              }
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-0 bg-white w-full">
          <div className="flex flex-col justify-center items-start">
            <div className="text-sm font-medium leading-6 text-gray-600">Actual Earnings</div>
            <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900">
              { isTransitioning ? 
                <div className="bg-gray-100  h-6 my-1 mt-3 animate-pulse rounded-full w-24"></div>
              :
                <span>
                  {Math.floor(totalActualMinutes / 60) > 0 &&
                  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
                    Math.floor(totalActualMinutes / 60) * 12.21
                  )}
                </span>
              }
            </div>
          </div>
        </div> */}
        <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-0 bg-white dark:bg-dark-900 w-full">
          <div className="flex flex-col justify-center items-center">
            <div className="text-sm font-medium leading-6 text-gray-600 dark:text-dark-400">Percentage Worked <span className="text-gray-400 font-normal dark:text-dark-600">(Incl. Breaks)</span></div>
            <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900 dark:text-dark-100">
              { isTransitioning ? 
                <div className="bg-gray-100 dark:bg-dark-800 h-6 my-1 mt-3 animate-pulse rounded-full w-24"></div>
                :
                `${workedPercentage}%`
              }
              
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-0 bg-white dark:bg-dark-900 w-full">
          <div className="flex flex-col justify-center items-start">
            <div className="text-sm font-medium leading-6 text-gray-600 dark:text-dark-400">Hours Worked <span className="text-gray-400 font-normal dark:text-dark-600">(Excl. Breaks)</span></div>
            <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900 dark:text-dark-100">
              { isTransitioning ? 
                <div className="bg-gray-100 dark:bg-dark-800 h-6 my-1 mt-3 animate-pulse rounded-full w-24"></div>
              :
                <span>
                  {Math.floor(totalActualMinutesExcludingBreaks / 60) > 0 && `${Math.floor(totalActualMinutesExcludingBreaks / 60)} hours`}
                  {Math.floor(totalActualMinutesExcludingBreaks / 60) > 0 && totalActualMinutesExcludingBreaks % 60 > 0 && ', '}
                  {totalActualMinutesExcludingBreaks % 60 > 0 && `${totalActualMinutesExcludingBreaks % 60} minutes`}
                </span>
              }
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-end gap-x-4 gap-y-0 bg-white dark:bg-dark-900 w-full">
          <div className="flex flex-col justify-center items-center">
            <div className="text-sm font-medium leading-6 text-gray-600 dark:text-dark-400">Percentage Worked <span className="text-gray-400 font-normal dark:text-dark-600">(Excl. Breaks)</span></div>
            <div className="w-full flex-none leading-10 tracking-tight text-base font-semibold text-gray-900 dark:text-dark-100">
              { isTransitioning ? 
                <div className="bg-gray-100 dark:bg-dark-800 h-6 my-1 mt-3 animate-pulse rounded-full w-24"></div>
                :
                `${workedPercentageExcludingBreaks}%`
              }
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}