import { React, memo } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import PopoverFlyout from '../Flyouts/PopoverFlyout';
import { ClockIcon } from '@heroicons/react/24/outline';

const SkeletonLoader = ({ className }) => (
    <div className={`animate-pulse bg-gray-100 ${className}`} />
);
  
const ShiftProgressBar = ({ shift, timesheets, events, isLoading = false }) => {
    if (isLoading) {
        // Render skeleton loader when loading
        return (
            <div className="flex flex-col gap-y-1 w-full items-end justify-end">
            <div className="flex items-end justify-between pt-0 w-full">
                <div className="flex flex-row md:flex-col xl:flex-row w-full">
                <SkeletonLoader className="h-4 w-1/3 rounded-lg" />
                </div>
                <div className="flex flex-row gap-x-1 w-full justify-end">
                <SkeletonLoader className="h-4 w-8/12 rounded-lg" />
                </div>
            </div>
            <div className="w-full h-5 rounded-full flex flex-row items-center">
                <SkeletonLoader className="h-5 w-full rounded-full" />
            </div>
            </div>
        );
    }
    
    const categories = {
        "time block": {
            "PBX Import": 'text-orange-700 bg-orange-200 ring-orange-600/50 ring-1 ring-inset hover:bg-orange-100',
            "Break": 'text-green-700 bg-green-200/75 ring-green-600/50 ring-1 ring-inset hover:bg-green-100',
            "Warehouse": 'text-blue-700 bg-blue-300 ring-blue-600/70 ring-1 ring-inset hover:bg-blue-200',
            "Reinstated": 'text-orange-700 bg-orange-200 ring-orange-600/500 ring-1 ring-inset hover:bg-orange-100',
            "TSA Dedicated Agent": 'text-orange-700 bg-orange-200 ring-orange-600/500 ring-1 ring-inset hover:bg-orange-100',
            "Lateness": "text-red-700 bg-red-300 ring-red-600/50 ring-1 ring-inset hover:bg-red-200",
            "Training": 'text-blue-700 bg-blue-300 ring-blue-600/70 ring-1 ring-inset hover:bg-blue-200',
            "HR Meetings": 'text-blue-700 bg-blue-300 ring-blue-600/70 ring-1 ring-inset hover:bg-blue-200',
            "Other": 'text-blue-700 bg-blue-300 ring-blue-600/70 ring-1 ring-inset hover:bg-blue-200',
            "Reduced": 'text-blue-700 bg-blue-100 border-dashed border-2 border-blue-600/50 hover:bg-blue-50',
            "AWOL": "text-red-700 bg-red-100 border-dashed border-2 border-red-600/50 hover:bg-red-50",
            "Sick": "text-yellow-700 bg-yellow-100 border-dashed border-2 border-yellow-600/50 hover:bg-yellow-50",
        },
        "detail": {
            "PBX Import": 'text-orange-700 bg-orange-50 ring-orange-600/30',
            "Break": 'text-green-700 bg-green-50 ring-green-600/30',
            "Warehouse": 'text-blue-700 bg-blue-50 ring-blue-600/30',
            "Reinstated": 'text-orange-700 bg-orange-50 ring-orange-600/30',
            "TSA Dedicated Agent": 'text-orange-700 bg-orange-50 ring-orange-600/30',
            "Lateness": "text-red-700 bg-red-50 ring-red-600/30",
            "Training": 'text-blue-700 bg-blue-50 ring-blue-600/30',
            "Reduced": 'text-blue-700 bg-blue-50 ring-blue-600/30',
            "HR Meetings": 'text-blue-700 bg-blue-50 ring-blue-600/30',
            "Other": 'text-blue-700 bg-blue-50 ring-blue-600/30',
            "AWOL": "text-red-700 bg-red-50 ring-red-600/30",
            "Sick": "text-yellow-600 bg-yellow-50 ring-yellow-600/30",
        }
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

    const calculateTimeBlocks = (shift, timesheets, events) => {
      const shiftStartDate = new Date(shift.shiftdate);
      shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);
  
      const shiftEndDate = new Date(shift.shiftdate);
      shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);
  
      const totalShiftMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);
  
      let totalActualMinutes = 0;
  
      // Calculate total reduction minutes
      const reductionMinutes = calculateReductionMinutes(events);

      // Merge timesheets and events
      const combinedData = [
        ...(timesheets || []).map((record) => ({ ...record, origin: 'timesheets' })),
        ...(events || []).map((record) => ({ ...record, origin: 'events' })),
      ];
      
      const blocks = combinedData
        .filter((record) => {
          const onTime = new Date(record.on_time);
          const offTime = record.off_time ? new Date(record.off_time) : new Date();
  
          // Filter records to include only those entries that fall within an hour before the shift start and an hour after the shift end
          return (
            (onTime >= new Date(shiftStartDate.getTime() - 30 * 60 * 1000) && onTime <= shiftEndDate) ||
            (offTime >= shiftStartDate && offTime <= new Date(shiftEndDate.getTime() + 30 * 60 * 1000))
          );
        })
        .map((record) => {
          const onTime = new Date(record.on_time);
          const offTime = record.off_time ? new Date(record.off_time) : new Date();
  
          const start = Math.max(shiftStartDate, onTime);
          const end = Math.min(shiftEndDate, offTime);
  
          const blockMinutes = differenceInMinutes(end, start);
          
          if (record.origin === 'timesheets') {
            totalActualMinutes += differenceInMinutes(offTime, onTime);
          }
  
          const blockPercentage = (blockMinutes / totalShiftMinutes) * 100;
  
          if (blockPercentage < 1) {
            return null;
          }
  
          const offsetMinutes = differenceInMinutes(start, shiftStartDate);
          const offsetPercentage = (offsetMinutes / totalShiftMinutes) * 100;
  
          return {
            category: record.category,
            color: categories["time block"][record.category],
            width: `${blockPercentage}%`,
            left: `${offsetPercentage}%`,
            start: record.on_time,
            end: record.off_time,
            started: new Date(record.on_time).toLocaleTimeString('en-GB', { hour12: false }),
            ended: new Date(record.off_time).toLocaleTimeString('en-GB', { hour12: false }),
          };
        })
        .filter(Boolean) // Remove null values
        .sort((a, b) => parseFloat(a.left) - parseFloat(b.left)); // Order by the lowest left value to the highest
  
      // Check if the earliest on_time is after the shiftStartDate
      const earliestOnTime = combinedData
        .filter((record) => record.hr_id === shift.hr_id)
        .filter((record) => {
            const onTime = new Date(record.on_time);
            const offTime = record.off_time ? new Date(record.off_time) : new Date();
    
            // Filter records to include only those entries that fall within an hour before the shift start and an hour after the shift end
            return (
              (onTime >= new Date(shiftStartDate.getTime() - 30 * 60 * 1000) && onTime <= shiftEndDate) ||
              (offTime >= shiftStartDate && offTime <= new Date(shiftEndDate.getTime() + 30 * 60 * 1000))
            );
        })
        .map((record) => new Date(record.on_time))
        .sort((a, b) => a - b)[0];
  
      if (earliestOnTime && earliestOnTime > shiftStartDate) {
        const lateMinutes = differenceInMinutes(earliestOnTime, shiftStartDate);
        const latePercentage = (lateMinutes / totalShiftMinutes) * 100;
  
        if (latePercentage > 2.5) {
          blocks.unshift({
            category: "Lateness",
            color: categories["time block"]['Lateness'],
            width: `${latePercentage}%`,
            left: '0%',
            start: shiftStartDate,
            end: earliestOnTime,
            started: shiftStartDate.toLocaleTimeString('en-GB', { hour12: false }),
            ended: earliestOnTime.toLocaleTimeString('en-GB', { hour12: false }),
          });
        }
      }
  
      return { blocks, totalActualMinutes, earliestOnTime, reductionMinutes };
    };
  
  const { blocks: timeBlocks, totalActualMinutes, earliestOnTime, reductionMinutes } = calculateTimeBlocks(shift, timesheets, events);

  const shiftStartDate = new Date(shift.shiftdate);
  shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);

  const shiftEndDate = new Date(shift.shiftdate);
  shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);

  const scheduledMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);

  const formattedActualHours = `${String(Math.floor(totalActualMinutes / 60)).padStart(2, '0')}:${String(totalActualMinutes % 60).padStart(2, '0')}`;

  const formattedScheduledHours = `${String(Math.floor((scheduledMinutes - reductionMinutes) / 60)).padStart(2, '0')}:${String((scheduledMinutes - reductionMinutes) % 60).padStart(2, '0')}`;

  const formatTimeDifference = (start, end) => {
    const totalMinutes = differenceInMinutes(end, start);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let formattedTime = '';
    if (hours > 1) {
      formattedTime += `${hours}h, `;
    } else if (hours === 1) {
      formattedTime += `${hours}h, `;
    }
  
    if (minutes > 1) {
      formattedTime += `${minutes}m`;
    } else if (minutes === 1) {
      formattedTime += `${minutes}m`;
    }
  
    return formattedTime.trim()
  };

  const calculateWorkedPercentage = (shift, timesheets, reductionMinutes) => {
    const totalShiftMinutes = differenceInMinutes(shiftEndDate, shiftStartDate) - reductionMinutes;

    // Calculate worked percentage
    const workedPercentage = (totalActualMinutes / (totalShiftMinutes)) * 100;

    return workedPercentage > 0 ? Math.floor(workedPercentage) : 0; // Return percentage with 2 decimal places
  };

  const workedPercentage = calculateWorkedPercentage(shift, timesheets, reductionMinutes );

  const shiftStartDisplayTime = earliestOnTime ? earliestOnTime : shiftStartDate;
  const shiftStarted = earliestOnTime ? true : false;

  return (
    <div className="flex flex-col gap-y-1 w-full items-end justify-end overflow-visible">
      <div className="flex items-end justify-between pt-0 w-full">
        <div className="flex flex-row md:flex-col xl:flex-row">
          <p tabIndex="0" className="focus:outline-none leading-4 text-gray-500 text-xs">
            Shift {shiftStarted ? 'Started' : 'Starts'}: {format(shiftStartDisplayTime, 'hh:mm a')}
          </p>
        </div>
        <div className="flex flex-row gap-x-1">
        { !shift.unallocated && (
          <p className="focus:outline-none leading-4 text-gray-500 text-xs">Scheduled Hours: {formattedScheduledHours}</p>
        )}
          <p className="focus:outline-none leading-4 text-gray-500 text-xs">Actual: {formattedActualHours}</p>
        { !shift.unallocated && (
          <>
            <p className="focus:outline-none leading-4 text-gray-500 text-xs">-</p>
            <p className="focus:outline-none leading-4 text-gray-900 text-xs">{workedPercentage}%</p>
          </>
        )}
        </div>
      </div>
      <div className="w-full h-5 bg-gray-200 rounded-full flex flex-row items-center">
        <div className="relative w-full flex flex-row items-center">
          {timeBlocks.map((block, index) => (
            <PopoverFlyout
              key={index}
              width="w-52"
              placement='top'
              style={{ width: block.width, left: block.left }}
              className={`h-5 ${index === 0 ? 'rounded-l-xl' : 'rounded-l'} ${
                index === timeBlocks.length - 1 ? 'rounded-r-xl' : 'rounded-r'
              } ${block.color} cursor-pointer absolute overflow-visible z-0 hover:z-50`}
              content={
                <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300">
                    <div className="relative flex gap-x-2 justify-start items-center rounded-lg w-full h-full pb-1">
                        <div className={`flex flex-none items-center justify-center rounded-lg p-2 w-8 h-8 ${categories["detail"][block.category]} ring-1`}>
                            <ClockIcon aria-hidden="true" className="size-6 flex-shrink-0"/>
                        </div>
                        <div className="flex flex-col">
                            <p className="font-semibold text-gray-900">
                                Time Block - <span className="font-normal text-sm">{formatTimeDifference(block.start, block.end)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="relative flex gap-x-2 justify-start items-center mx-1 pt-2">
                        <div className="flex flex-col gap-y-1">
                            <p className="text-gray-500 font-medium text-xs"> Started: <span className="text-gray-700"> {block.started} </span> </p>
                            <p className="text-gray-500 font-medium text-xs"> Ended: <span className="text-gray-700"> {block.ended} </span> </p>
                            <p className="text-gray-500 font-medium text-xs"> Category: <span className="text-gray-700"> {block.category} </span> </p>
                        </div>
                    </div>
                </div>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(ShiftProgressBar);