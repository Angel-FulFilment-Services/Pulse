import { React, memo } from 'react';
import UserItem from './UserItem';
import { getStatus } from '../../Utils/Rota'; // Import the external getStatus function
import { useUserStates } from '../Context/ActiveStateContext';
import { format } from 'date-fns';
import { random } from 'lodash';

const sizeClasses = { 
  'extra-small': 'h-6 w-6',
  'small': 'h-8 w-8',
  'medium': 'h-10 w-10',
  'large': 'h-12 w-12',
  'extra-large': 'h-14 w-14',
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const SkeletonLoader = ({ className }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-dark-800 ${className}`} />
);

const UserItemFull = ({ agent, shift = null, timesheets = null, events = null, iconSize = "large", isLoading = false, allowClickInto = true, clickablePhoto = false, headingClass = null, subHeadingClass = null}) => {
  const selectedSizeClass = sizeClasses[iconSize] || sizeClasses['medium'];
  const { userStates } = useUserStates();
  const userState = agent?.hr_id ? userStates[agent.hr_id] : null;
  const jobTitle = userState ? userState.job_title : null;

  if (isLoading) {
    // Render skeleton loader when loading
    return (
      <div className="flex gap-x-6">
        <SkeletonLoader className={`rounded-full ${selectedSizeClass}`} />
        <div className="flex-auto">
          <SkeletonLoader className="h-4 w-40 mb-2 rounded-lg" />
          <SkeletonLoader className="h-4 w-28 rounded-lg" />
        </div>
      </div>
    );
  }

  const { status, color, due, end } = shift && timesheets ? getStatus(shift, timesheets, events) : { status: null, color: null };

  return (
    <div className="flex gap-x-6">
      <UserItem userId={agent.hr_id} size={iconSize} agent={agent} allowClickInto={allowClickInto} clickablePhoto={clickablePhoto} jobTitle={jobTitle} />
      <div className="flex-auto">
        <div className="pb-0.5 flex items-start gap-x-3">
          <div className={`${headingClass ? headingClass : "text-sm font-medium text-gray-900 dark:text-dark-50"} text-nowrap leading-6 w-max`}>{agent?.agent || userState?.name}</div>
          {shift?.shiftcat && (
            <div
              className={classNames(
                'text-gray-600 bg-gray-50 ring-gray-500/10 dark:text-gray-900 dark:bg-gray-100/85 dark:ring-gray-800/10',
                'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset text-nowrap',
              )}
            >
              {shift.shiftcat}
            </div>
          )}
          {shift?.shiftloc && (
            <div
              className={classNames(
                'text-theme-600 bg-theme-50 ring-theme-500/10 dark:text-theme-900 dark:bg-theme-100/85 dark:ring-theme-800/10',
                'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset text-nowrap',
              )}
            >
              {shift.shiftloc}
            </div>
          )}

          {/* Border between shift category and location */}
          <div className="w-px bg-gray-200 dark:bg-dark-700 h-6" />

          {shift && timesheets && (
            <div
              className={classNames(
                color,
                'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset text-nowrap',
              )}
            >
              {status}
            </div>
          )}
        </div>
        <div className={`${subHeadingClass ? subHeadingClass : "text-xs text-gray-500 dark:text-dark-400"} ${shift ? "pt-0.5" : null} flex items-center gap-x-2 leading-5`}> {jobTitle} {shift ? <div className="w-1 h-1 shrink-0 mt-0.5 bg-gray-400 dark:bg-dark-500 rounded-full"></div> : null} {shift ? <span>{format(due, 'h:mm a').toLowerCase()} - {format(end, 'h:mm a').toLowerCase()} </span> : null}</div>
        {/* <div className="mt-0 text-xs leading-5 text-gray-500"> {jobTitle} <span>- Due: 09:00am </span></div> */}
      </div>
    </div>
  );
};

export default memo(UserItemFull);