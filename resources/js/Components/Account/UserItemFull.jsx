import React from 'react';
import UserItem from './UserItem';
import { differenceInMinutes, isSameDay } from 'date-fns';

const statuses = {
  attended: 'text-green-700 bg-green-50 ring-green-600/20',
  upcoming: 'text-gray-600 bg-gray-50 ring-gray-500/10',
  late: 'text-orange-700 bg-orange-50 ring-orange-600/10',
  absent: 'text-red-700 bg-red-50 ring-red-600/10',
};

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

const getStatus = (shift, timesheets) => {
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
};

const UserItemFull = ({ agent, shift = null, timesheets = null, iconSize="large" }) => {
  const { status, color } = shift && timesheets ? getStatus(shift, timesheets) : { status: null, color: null };

  return (
    <div className="flex gap-x-6">
      <UserItem userId={agent.hr_id} size={iconSize} />
      <div className="flex-auto">
        <div className="flex items-start gap-x-3">
          <div className="text-sm font-medium leading-6 text-gray-900">{agent.agent}</div>
          {shift && timesheets && (
            <div
              className={classNames(
                color,
                'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
              )}
            >
              {status}
            </div>
          )}
        </div>
        <div className="mt-0 text-xs leading-5 text-gray-500">{agent.job_title}</div>
      </div>
    </div>
  );
};

export default UserItemFull;