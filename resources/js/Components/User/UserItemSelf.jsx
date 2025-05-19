import { React, memo } from 'react';
import UserItem from './UserItem';
import { getStatus } from '../../Utils/Rota'; // Import the external getStatus function
import { useUserStates } from '../Context/ActiveStateContext';
import { format } from 'date-fns';
import { usePage } from '@inertiajs/react'

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

const UserItemFull = ({ iconSize = "large", isLoading = false, headingClass = null, subHeadingClass = null}) => {
  const { auth, employee } = usePage().props
  const selectedSizeClass = sizeClasses[iconSize] || sizeClasses['medium'];
  const name = auth?.user.name;
  const jobTitle = employee?.job_title ?  employee.job_title : null;

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

  return (
    <div className="flex gap-x-6">
      <UserItem userId={employee.hr_id} size={iconSize} allowClickInto={false} />
      <div className="flex-auto">
        <div className="pb-0.5 flex items-start gap-x-3">
          <div className={`${headingClass ? headingClass : "text-sm font-medium text-gray-900 dark:text-dark-50"} text-nowrap leading-6 w-max`}>{name}</div>
        </div>
        <div className={`${subHeadingClass ? subHeadingClass : "text-xs text-gray-500 dark:text-dark-400"} flex items-center gap-x-2 leading-5`}>{jobTitle}</div>
      </div>
    </div>
  );
};

export default memo(UserItemFull);