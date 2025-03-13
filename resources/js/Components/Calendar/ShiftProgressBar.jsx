import React from 'react';
import { format, differenceInMinutes } from 'date-fns';

const ShiftProgressBar = ({ shift, timesheets }) => {
  const calculateTimeBlocks = (shift, timesheets) => {
    const shiftStartDate = new Date(shift.shiftdate);
    shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);

    const shiftEndDate = new Date(shift.shiftdate);
    shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);

    const totalShiftMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);

    const blocks = timesheets
      .filter((timesheet) => timesheet.hr_id === shift.hr_id)
      .map((timesheet) => {
        const onTime = new Date(timesheet.on_time);
        const offTime = timesheet.off_time ? new Date(timesheet.off_time) : new Date();

        const start = Math.max(shiftStartDate, onTime);
        const end = Math.min(shiftEndDate, offTime);

        const blockMinutes = differenceInMinutes(end, start);
        const blockPercentage = (blockMinutes / totalShiftMinutes) * 100;

        if (blockPercentage < 1) {
          return null;
        }

        const offsetMinutes = differenceInMinutes(start, shiftStartDate);
        const offsetPercentage = (offsetMinutes / totalShiftMinutes) * 100;

        return {
          color: blockMinutes <= 60 ? 'text-orange-700 bg-orange-200 ring-orange-600/50' : 'text-green-700 bg-green-300 ring-green-600/70',
          width: `${blockPercentage}%`,
          left: `${offsetPercentage}%`,
        };
      })
      .filter(Boolean); // Remove null values

    // Check if the earliest on_time is after the shiftStartDate
    const earliestOnTime = timesheets
      .filter((timesheet) => timesheet.hr_id === shift.hr_id)
      .map((timesheet) => new Date(timesheet.on_time))
      .sort((a, b) => a - b)[0];

    if (earliestOnTime && earliestOnTime > shiftStartDate) {
      const lateMinutes = differenceInMinutes(earliestOnTime, shiftStartDate);
      const latePercentage = (lateMinutes / totalShiftMinutes) * 100;

      if (latePercentage > 2.5) {
        blocks.unshift({
          color: 'text-red-700 bg-red-300 ring-red-600/50',
          width: `${latePercentage}%`,
          left: '0%',
        });
      }
    }

    return blocks;
  };

  const calculateWorkedPercentage = (shift, timesheets) => {
    const shiftStartDate = new Date(shift.shiftdate);
    shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);
  
    const shiftEndDate = new Date(shift.shiftdate);
    shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);
  
    const totalShiftMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);
  
    // Calculate break time
    let breakMinutes = 0;
    if (totalShiftMinutes > 240 && totalShiftMinutes <= 420) {
      breakMinutes = 30;
    } else if (totalShiftMinutes > 420) {
      breakMinutes = 60;
    }
  
    // Calculate total worked minutes
    const totalWorkedMinutes = timesheets
      .filter((timesheet) => timesheet.hr_id === shift.hr_id)
      .reduce((total, timesheet) => {
        const onTime = new Date(timesheet.on_time);
        const offTime = timesheet.off_time ? new Date(timesheet.off_time) : new Date();
  
        const start = Math.max(shiftStartDate, onTime);
        const end = Math.min(shiftEndDate, offTime);
  
        return total + differenceInMinutes(end, start);
      }, 0);
    
    // Calculate worked percentage
    const workedPercentage = (totalWorkedMinutes / (totalShiftMinutes - breakMinutes)) * 100;
  
    return workedPercentage > 0 ? workedPercentage.toFixed() : 0; // Return percentage with 2 decimal places
  };

  const timeBlocks = calculateTimeBlocks(shift, timesheets);

  // Find the earliest on_time for the current hr_id
  const earliestOnTime = timesheets
    .filter((timesheet) => timesheet.hr_id === shift.hr_id)
    .map((timesheet) => new Date(timesheet.on_time))
    .sort((a, b) => a - b)[0];

  const formattedEarliestOnTime = earliestOnTime
    ? format(earliestOnTime, 'hh:mm a')
    : 'N/A';

  const workedPercentage = calculateWorkedPercentage(shift, timesheets);

  return (
    <div className="flex flex-col gap-y-1 w-full items-end justify-end">
      <div className="flex items-end justify-between pt-0 w-full">
        <div className="flex flex-row md:flex-col xl:flex-row">
          <p tabIndex="0" className="focus:outline-none leading-4 text-gray-500 text-xs">
            Shift Started: {formattedEarliestOnTime}
          </p>
        </div>
        <div className="flex flex-row md:flex-col xl:flex-row">
          <p className="focus:outline-none leading-4 text-gray-500 text-xs">{workedPercentage}%</p>
        </div>
      </div>
      <div className="w-full h-5 bg-gray-200 rounded-full flex flex-row items-center">
        <div className="relative w-full flex flex-row items-center">
          {timeBlocks.map((block, index) => (
            <div
              key={index}
              className={`h-5 ${index === 0 ? 'rounded-l-xl' : 'rounded-l'} ${index === timeBlocks.length - 1 ? 'rounded-r-xl' : 'rounded-r'} ${block.color} ring-1 ring-inset hover:contrast-125 cursor-pointer absolute`}
              style={{ width: block.width, left: block.left }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShiftProgressBar;