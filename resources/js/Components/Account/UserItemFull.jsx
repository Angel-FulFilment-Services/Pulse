import { React, memo } from 'react';
import UserItem from './UserItem';
import { getStatus } from '../../Utils/Rota'; // Import the external getStatus function
import { useUserStates } from '../Context/ActiveStateContext';

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
  <div className={`animate-pulse bg-gray-100 ${className}`} />
);

const UserItemFull = ({ agent, shift = null, timesheets = null, events = null, iconSize = "large", isLoading = false }) => {
  const selectedSizeClass = sizeClasses[iconSize] || sizeClasses['medium'];
  const userStates = useUserStates();
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

  // Use the imported getStatus function
  const { status, color } = shift && timesheets ? getStatus(shift, timesheets, events) : { status: null, color: null };

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
        <div className="mt-0 text-xs leading-5 text-gray-500">{jobTitle}</div>
      </div>
    </div>
  );
};

export default memo(UserItemFull);