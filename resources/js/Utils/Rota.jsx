import { differenceInMinutes, isSameDay, format } from 'date-fns';

export function getStatus(shift, timesheets) {
  const statuses = {
    attended: 'text-green-700 bg-green-50 ring-green-600/20',
    upcoming: 'text-gray-600 bg-gray-50 ring-gray-500/10',
    late: 'text-orange-700 bg-orange-50 ring-orange-600/10',
    absent: 'text-red-700 bg-red-50 ring-red-600/10',
  };

  const shiftStartDate = new Date(shift.shiftdate);
  shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);

  const shiftEndDate = new Date(shift.shiftdate);
  shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);

  const now = new Date();

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
    return { status: 'Absent', color: statuses.absent };
  }

  if (!earliestTimesheet && differenceInMinutes(new Date(), shiftStartDate) <= 60) {
    return { status: 'Late', color: statuses.late };
  }

  const onTime = new Date(earliestTimesheet.on_time);

  if (onTime <= shiftStartDate) {
    return { status: 'Attended', color: statuses.attended };
  }

  if (earliestTimesheet) {
    return { status: 'Late', color: statuses.late };
  }

  return { status: 'Absent', color: statuses.absent };
}

export function groupShifts(shifts, merge = false) {
  const grouped = {};

  // Sort shifts by shiftstart
  shifts.sort((a, b) => a.shiftstart - b.shiftstart);

  shifts.forEach((shift) => {
    const date = format(new Date(shift.shiftdate), 'yyyy-MM-dd');
    const key = `${shift.shiftstart}-${shift.shiftend}`;
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

  return grouped;
}