import { React, memo, useMemo } from 'react';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import PopoverFlyout from '../Flyouts/PopoverFlyout';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useUtilisationTargets } from '../Context/UtilisationTargetsContext';
import { calculateTimeBlocks } from '../../Utils/Rota';

ChartJS.register(ArcElement, Tooltip, Legend);

const SkeletonLoader = ({ className }) => (
    <div className={`animate-pulse bg-gray-100 dark:bg-dark-800  ${className}`} />
);
  
const ShiftProgressBar = ({ shift, timesheets, events, calls, rank, isLoading = false }) => {
    if (isLoading) {
        // Render skeleton loader when loading
        return (
            <div className="flex flex-row items-center justify-center gap-x-4">
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
              <div className="rounded-full">
                    <SkeletonLoader className="h-12 w-12 rounded-full" />
                </div>
            </div>
        );
    }
  
  const { blocks: timeBlocks, totalActualMinutes, totalLoggedOnSeconds, totalAdditionalSeconds, earliestOnTime, reductionMinutes, categories } = calculateTimeBlocks(shift, timesheets, events);

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

  const totalCallTime = calls.filter((record) => {
    const time = new Date(record.date_time);

    // Filter records to include only those entries that fall within an hour before the shift start and an hour after the shift end
    return (
      (time >= new Date(shiftStartDate.getTime() - 60 * 60 * 1000) && time <= shiftEndDate) && ( record.ddi != '6111' || rank )
    );
  }).reduce((total, call) => total + Number(call.time || 0), 0);

  const utilisationPercentage = totalLoggedOnSeconds ? Math.round(((totalCallTime + (rank ? totalAdditionalSeconds : 0)) / totalLoggedOnSeconds) * 100) : 0;

  const targets = useUtilisationTargets();
  const colour = utilisationPercentage > targets?.utilisation
  ? {backgroundColor: 'rgba(187, 247, 208, 1)', borderColor: 'rgba(22, 163, 74, 0.5)'}
  : utilisationPercentage > targets?.utilisation - (targets?.utilisation * 0.1)
  ? {backgroundColor: 'rgba(254, 215, 170, 1)', borderColor: 'rgba(234, 88, 12, 0.5)'} 
  : {backgroundColor: 'rgba(252, 165, 165, 1)', borderColor: 'rgba(220, 38, 38, 0.5)'};

  const utilisationData = {
    labels: [], // No labels
    datasets: [
      {
        data: [utilisationPercentage, (100 - utilisationPercentage)], // Example data
        backgroundColor: [
          colour.backgroundColor, // Main color
          'rgba(229, 231, 235, 1)', // Grey background
        ],
        borderColor: [
          colour.borderColor,
          'rgba(229, 231, 235, 0)', // Grey border
        ],
        borderWidth: 1, // Remove borders
        cutout: '75%', // Slimmer donut
      },
    ],
  };

  const chartOptions = {
    plugins: {
      tooltip: {
        enabled: false, // Enable tooltips
      },
      legend: {
        display: false, // Disable legend
      },
    },
    animation: utilisationPercentage ? true : false,
    events: [],
    maintainAspectRatio: false, // Allow resizing
    responsive: true,
  };

  return (
    <div className="flex flex-row gap-x-4 items-center justify-start w-full">
      <div className="flex flex-col gap-y-1 w-full items-end justify-end overflow-visible">
        <div className="flex items-end justify-between pt-0 w-full">
          <div className="flex flex-row md:flex-col xl:flex-row">
            <p tabIndex="0" className="focus:outline-none leading-4 text-gray-500 dark:text-dark-400 text-xs">
              Shift {shiftStarted ? 'Started' : 'Starts'}: {format(shiftStartDisplayTime, 'hh:mm a')}
            </p>
          </div>
          <div className="flex flex-row gap-x-1">
          { !shift.unallocated && (
            <p className="focus:outline-none leading-4 text-gray-500 dark:text-dark-400 text-xs">Scheduled Hours: {formattedScheduledHours}</p>
          )}
            <p className="focus:outline-none leading-4 text-gray-500 dark:text-dark-400 text-xs">Actual: {formattedActualHours}</p>
          { !shift.unallocated && (
            <>
              <p className="focus:outline-none leading-4 text-gray-500 dark:text-dark-400 text-xs">-</p>
              <p className="focus:outline-none leading-4 text-gray-900 dark:text-dark-100 text-xs">{workedPercentage}%</p>
            </>
          )}
          </div>
        </div>
        <div className="w-full h-5 bg-gray-200 dark:bg-dark-700 rounded-full flex flex-row items-center">
          <div className="relative w-full flex flex-row items-center">
            {timeBlocks.map((block, index) => (
              <PopoverFlyout
                key={index}
                width="w-52"
                placement='top'
                style={{ width: block.width, left: block.left }}
                className={`h-5 ${index === 0 ? 'rounded-l-xl' : 'rounded-l'} ${
                  index === timeBlocks.length - 1 ? 'rounded-r-xl' : 'rounded-r'
                } ${block.color} cursor-pointer absolute overflow-visible`}
                content={
                  <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300 dark:divide-dark-600">
                      <div className="relative flex gap-x-2 justify-start items-center rounded-lg w-full h-full pb-1">
                          <div className={`flex flex-none items-center justify-center rounded-lg p-2 w-8 h-8 ${categories["detail"][block.category]} ring-1`}>
                              <ClockIcon aria-hidden="true" className="size-6 flex-shrink-0"/>
                          </div>
                          <div className="flex flex-col">
                              <p className="font-semibold text-gray-900 dark:text-dark-100">
                                  Time Block - <span className="font-normal text-sm">{formatTimeDifference(block.start, block.end)}</span>
                              </p>
                          </div>
                      </div>
                      <div className="relative flex gap-x-2 justify-start items-center mx-1 pt-2">
                          <div className="flex flex-col gap-y-1">
                              <p className="text-gray-500 dark:text-dark-400 font-medium text-xs"> Started: <span className="text-gray-700 dark:text-dark-200"> {block.started} </span> </p>
                              <p className="text-gray-500 dark:text-dark-400 font-medium text-xs"> Ended: <span className="text-gray-700 dark:text-dark-200"> {block.ended} </span> </p>
                              <p className="text-gray-500 dark:text-dark-400 font-medium text-xs"> Category: <span className="text-gray-700 dark:text-dark-200"> {block.category} </span> </p>
                          </div>
                      </div>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </div>

      <PopoverFlyout
        placement='top'
        className=""
        content={
          <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300">
              <p class="text-gray-900 dark:text-dark-100"> Utilisation </p>
          </div>
        }>
          <div className="w-12 h-12 flex items-center justify-center relative">
            <Doughnut data={utilisationData} options={chartOptions} />
            <div className="absolute">
                <p className="text-xs font-medium text-gray-600 dark:text-dark-300">{utilisationPercentage}%</p>
            </div>
          </div>
        </PopoverFlyout>
    </div>
  );
};

export default memo(ShiftProgressBar);