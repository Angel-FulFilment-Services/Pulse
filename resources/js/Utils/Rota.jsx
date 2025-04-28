import { differenceInMinutes, differenceInSeconds, isSameDay, format } from 'date-fns';

export function getStatus(shift, timesheets, events) {
  const statuses = {
    attended: 'text-green-700 bg-green-50 ring-green-600/20',
    upcoming: 'text-gray-600 bg-gray-50 ring-gray-500/10',
    late: 'text-orange-700 bg-orange-50 ring-orange-600/10',
    absent: 'text-red-700 bg-red-50 ring-red-600/10',
    awol: 'text-red-700 bg-red-50 ring-red-600/10',
    sick: 'text-yellow-600 bg-yellow-50 ring-yellow-600/10',
    flagged: 'text-blue-700 bg-blue-50 ring-blue-600/20',
  };

  const shiftStartDate = new Date(shift.shiftdate);
  shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);

  const shiftEndDate = new Date(shift.shiftdate);
  shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);

  if(shift.unallocated) {
    return { status: 'Surplus', color: statuses.flagged, due: shiftStartDate, end: shiftEndDate };
  }

  const now = new Date();

  // Check for events and use the latest event's type for the status
  if (events && events.length > 0) {
    const latestEvent = events
      .filter((event) => event.shift_id === shift.unq_id) // Ensure events pertain to the current shift
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]; // Get the latest event by `created_at`

    if (latestEvent) {
      return {
        status: latestEvent.category, // Use the event type as the status
        color: statuses[latestEvent.category.toLowerCase()] || statuses.flagged, // Map to a color or default to flagged
        due: shiftStartDate,
        end: shiftEndDate
      };
    }
  }

  if (shiftStartDate > now) {
    const minutesUntilShift = differenceInMinutes(shiftStartDate, now);
    const hoursUntilShift = Math.floor(minutesUntilShift / 60);
    const remainingMinutes = minutesUntilShift % 60;

    const dueInMessage = hoursUntilShift > 0
      ? `Due in ${hoursUntilShift} hours and ${remainingMinutes} minutes`
      : remainingMinutes > 0
      ? `Due in ${remainingMinutes} minutes`
      : 'Due now';

    return {
      status: isSameDay(shiftStartDate, now) ? dueInMessage : 'Upcoming',
      color: statuses.upcoming,
      due: shiftStartDate,
      end: shiftEndDate
    };
  }

  const earliestTimesheet = timesheets
    .filter((timesheet) => timesheet.hr_id === shift.hr_id)
    .filter((timesheet) => {
      const onTime = new Date(timesheet.on_time);
      const offTime = timesheet.off_time ? new Date(timesheet.off_time) : new Date();

      // Filter timesheets to include only those entries that fall within an hour before the shift start and an hour after the shift end
      return (
        (onTime >= new Date(shiftStartDate.getTime() - 30 * 60 * 1000) && onTime <= shiftEndDate) ||
        (offTime >= shiftStartDate && offTime <= new Date(shiftEndDate.getTime() + 30 * 60 * 1000))
      );
    })
    .sort((a, b) => new Date(a.on_time) - new Date(b.on_time))[0];

  if (!earliestTimesheet && differenceInMinutes(new Date(), shiftStartDate) > 60) {
    return { status: 'Absent', color: statuses.absent, due: shiftStartDate, end: shiftEndDate };
  }

  if (!earliestTimesheet && differenceInMinutes(new Date(), shiftStartDate) <= 60) {
    return { status: 'Late', color: statuses.late, due: shiftStartDate, end: shiftEndDate };
  }

  const onTime = new Date(earliestTimesheet.on_time);

  if (onTime <= shiftStartDate) {
    return { status: 'Attended', color: statuses.attended, due: shiftStartDate, end: shiftEndDate };
  }

  if (earliestTimesheet) {
    return { status: 'Late', color: statuses.late, due: shiftStartDate, end: shiftEndDate };
  }

  return { status: 'Absent', color: statuses.absent, due: shiftStartDate, end: shiftEndDate };
}

export function groupShifts(shifts, merge = false, groupBy = (shift) => `${shift.shiftstart}-${shift.shiftend}`, timesheets = {}, events = {}, userStates = {}, filters = {}, search = null) {
  const grouped = {};

  // Sort shifts by shiftstart
  shifts.sort((a, b) => a.shiftstart - b.shiftstart);

  shifts.forEach((shift) => {
    const date = format(new Date(shift.shiftdate), 'yyyy-MM-dd');
    const key = groupBy(shift); // Use the custom grouping property or default

    if (!grouped[date]) {
      grouped[date] = {};
    }
    if (!grouped[date][key]) {
      grouped[date][key] = [];
    }
    grouped[date][key].push(shift);
  });

  if (merge) {
    // Merge shifts that fall within the widest time range
    Object.keys(grouped).forEach((date) => {
      const shiftsByTime = grouped[date];
      const mergedShifts = {};

      const timeKeys = Object.keys(shiftsByTime).sort((a, b) => {
        const [startA, endA] = a.split('-').map(Number);
        const [startB, endB] = b.split('-').map(Number);
        return startA - startB || endB - endA;
      });

      let currentKey = null;
      let currentShifts = [];

      timeKeys.forEach((key) => {
        const [start, end] = key.split('-').map(Number);

        if (!currentKey) {
          currentKey = key;
          currentShifts = shiftsByTime[key];
        } else {
          const [currentStart, currentEnd] = currentKey.split('-').map(Number);

          if (start >= currentStart && end <= currentEnd) {
            currentShifts = currentShifts.concat(shiftsByTime[key]);
          } else {
            mergedShifts[currentKey] = currentShifts;
            currentKey = key;
            currentShifts = shiftsByTime[key];
          }
        }
      });

      if (currentKey) {
        mergedShifts[currentKey] = currentShifts;
      }

      grouped[date] = mergedShifts;
    });
  }

  // Add unallocated shifts logic here if timesheets is passed
  if (timesheets.length > 0) {
    const unallocatedRecords = timesheets.filter((record) => {
      return !shifts.some((shift) => shift.hr_id === record.hr_id);
    });

    const unallocatedByHrId = unallocatedRecords.reduce((acc, record) => {
      if (!acc[record.hr_id]) {
        acc[record.hr_id] = [];
      }
      acc[record.hr_id].push(record);
      return acc;
    }, {});

    Object.keys(grouped).forEach((date) => {
      const unallocated = Object.entries(unallocatedByHrId).map(([hr_id, records]) => {
        const earliestOnTime = records
          .filter((record) => record.on_time)
          .map((record) => new Date(record.on_time))
          .reduce((min, current) => (current < min ? current : min), new Date());

        const latestOffTime = records
          .filter((record) => record.off_time)
          .map((record) => new Date(record.off_time))
          .reduce((max, current) => (current > max ? current : max), new Date(0));

        return {
          id: records[0]?.urn || records[0]?.unq_id || records?.id,
          hr_id,
          shiftdate: date,
          shiftstart: format(earliestOnTime, 'HHmm'),
          shiftend: format(latestOffTime, 'HHmm'),
          agent: userStates[hr_id]?.name || 'Unallocated Agent',
          job_title: userStates[hr_id]?.job_title || 'Unallocated Job',
          unallocated: true,
        };
      });

      if (unallocated.length) {
        if (!grouped[date]['unallocated']) {
          grouped[date]['unallocated'] = [];
        }
        grouped[date]['unallocated'] = unallocated;
      }
    });
  }

  if (filters && filters.length > 0) {
    Object.keys(grouped).forEach((date) => {
      const shiftsByTime = grouped[date];
      Object.keys(shiftsByTime).forEach((key) => {
        shiftsByTime[key] = shiftsByTime[key].filter((shift) => {
          return filters.every((filter) => {
            // Get the checked filter options
            const activeOptions = filter.options.filter((option) => option.checked);
  
            // If no options are checked, skip this filter
            if (activeOptions.length === 0) return true;
  
            // Evaluate the filter's expression for each active option
            return activeOptions.some((option) =>
              filter.expression(shift, userStates, timesheets, events)(option.value)
            );
          });
        });
      });

      // Remove time groups with zero-length shifts
      Object.keys(shiftsByTime).forEach((key) => {
        if (shiftsByTime[key].length === 0) {
          delete shiftsByTime[key];
        }
      });

      // Remove the date group if it has no time groups left
      if (Object.keys(shiftsByTime).length === 0) {
        delete grouped[date];
      }
    });
  }

  if (search) {
    Object.keys(grouped).forEach((date) => {
      const shiftsByTime = grouped[date];
      Object.keys(shiftsByTime).forEach((key) => {
        shiftsByTime[key] = shiftsByTime[key].filter((shift) => {
          return (
            shift.agent.toLowerCase().includes(search.toLowerCase())
          );
        });
      });

      // Remove time groups with zero-length shifts
      Object.keys(shiftsByTime).forEach((key) => {
        if (shiftsByTime[key].length === 0) {
          delete shiftsByTime[key];
        }
      });

      // Remove the date group if it has no time groups left
      if (Object.keys(shiftsByTime).length === 0) {
        delete grouped[date];
      }
    });
  }

  return grouped;
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

export function calculateTimeBlocks (shift, timesheets, events) {
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
          "Absent": "text-red-700 bg-red-100 border-dashed border-2 border-red-600/50 hover:bg-red-50",
          "Sick": "text-yellow-700 bg-yellow-100 border-dashed border-2 border-yellow-600/50 hover:bg-yellow-50",
          "Gap": "text-gray-700 bg-gray-100/50 border-dashed border-2 border-gray-400/25 hover:bg-gray-50",
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
          "Absent": "text-red-700 bg-red-50 ring-red-600/30",
          "Sick": "text-yellow-600 bg-yellow-50 ring-yellow-600/30",
          "Gap": "text-gray-500 bg-gray-50 ring-gray-600/30"
      }
  }

  const shiftStartDate = new Date(shift.shiftdate);
  shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);

  const shiftEndDate = new Date(shift.shiftdate);
  shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);

  const totalShiftMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);

  let totalActualMinutes = 0;
  let totalLoggedOnSeconds = 0;
  let totalAdditionalSeconds = 0;

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

        if(record.category === 'PBX Import') {
          totalLoggedOnSeconds += differenceInSeconds(offTime, onTime);
        }

        if(["HR Meetings", "Warehouse", "Training", "Other"].includes(record.category)) {
          totalAdditionalSeconds += differenceInSeconds(offTime, onTime);
        }
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
    .filter((record) => record.hr_id === shift.hr_id && record.category == "PBX Import")
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

    if (latePercentage > 1) {
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
  // Add gaps between blocks
  const gapBlocks = [];

  // Filter out overlapping blocks
  const nonOverlappingBlocks = blocks.filter((block, index) => {
    const currentBlockStart = new Date(block.start);
    const currentBlockEnd = new Date(block.end);
  
    // Check if the current block overlaps with any other block
    return !blocks.some((otherBlock, otherIndex) => {
      if (index === otherIndex) return false; // Skip the same block
      const otherBlockStart = new Date(otherBlock.start);
      const otherBlockEnd = new Date(otherBlock.end);
  
      // Check if the current block is within the other block's time range
      return (
        currentBlockStart >= otherBlockStart &&
        currentBlockEnd <= otherBlockEnd
      );
    });
  });
  
  // Calculate gaps between non-overlapping blocks
  for (let i = 0; i < nonOverlappingBlocks.length - 1; i++) {
    const currentBlockEnd = new Date(nonOverlappingBlocks[i].end);
    const nextBlockStart = new Date(nonOverlappingBlocks[i + 1].start);
  
    if (
      currentBlockEnd < nextBlockStart &&
      !(nonOverlappingBlocks[i].category === 'Break' && nonOverlappingBlocks[i + 1].category === 'Break') && // Ignore gaps between breaks
      !nonOverlappingBlocks.slice(i + 1).every(block => block.category === 'Break')
    ) {
      const gapMinutes = differenceInMinutes(nextBlockStart, currentBlockEnd);
      const gapPercentage = (gapMinutes / totalShiftMinutes) * 100;
  
      if (gapPercentage > 1) {
        gapBlocks.push({
          category: 'Gap',
          color: categories['time block']['Gap'], // Use a neutral color for gaps
          width: `${gapPercentage}%`,
          left: `${(differenceInMinutes(currentBlockEnd, shiftStartDate) / totalShiftMinutes) * 100}%`,
          start: currentBlockEnd,
          end: nextBlockStart,
          started: currentBlockEnd.toLocaleTimeString('en-GB', { hour12: false }),
          ended: nextBlockStart.toLocaleTimeString('en-GB', { hour12: false }),
        });
      }
    }
  }

  // Merge gap blocks with existing blocks
  const allBlocks = [...blocks, ...gapBlocks].sort((a, b) => parseFloat(a.left) - parseFloat(b.left));

  return { blocks: allBlocks, totalActualMinutes, totalLoggedOnSeconds, totalAdditionalSeconds, earliestOnTime, reductionMinutes, categories };
};