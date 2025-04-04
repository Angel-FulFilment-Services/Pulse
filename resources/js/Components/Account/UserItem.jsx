import { UserIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import { differenceInMinutes } from 'date-fns';
import { useUserStates } from '../Context/ActiveStateContext';
import React, { memo, useMemo } from 'react';

const UserItem = ({ userId, size = 'large' }) => {
  const sizeClasses = {
    "icon": {
      'extra-small': 'h-6 w-6',
      'small': 'h-8 w-8',
      'medium': 'h-10 w-10',
      'large': 'h-12 w-12',
      'extra-large': 'h-14 w-14',
    },
    "activity": {
      'extra-small': 'h-1.5 w-1.5',
      'small': 'h-2 w-2',
      'medium': 'h-2.5 w-2.5',
      'large': 'h-3 w-3',
      'extra-large': 'h-3.5 w-3.5',
    }
  };

  const selectedSizeClass = sizeClasses.icon[size] || sizeClasses.icon.medium;
  const selectedActivitySizeClass = sizeClasses.activity[size] || sizeClasses.activity.medium;

  const userStates = useUserStates();

  // Memoize userState to avoid recalculating it unnecessarily
  const userState = useMemo(() => userStates[userId], [userStates, userId]);

  // Memoize profilePhoto and lastActiveAt
  const profilePhoto = useMemo(() => userState?.profile_photo || null, [userState]);
  const lastActiveAt = useMemo(() => userState?.last_active_at || null, [userState]);

  // Memoize activeIndicatorColor
  const activeIndicatorColor = useMemo(() => {
    if (!lastActiveAt) return 'bg-gray-300';

    const minutesAgo = differenceInMinutes(new Date(), new Date(lastActiveAt));
    if (minutesAgo <= 2.5) {
      return 'bg-green-500';
    } else if (minutesAgo <= 30) {
      return 'bg-yellow-500';
    } else {
      return 'bg-gray-300';
    }
  }, [lastActiveAt]);

  return (
    <>
      <span className={`relative flex flex-row items-center justify-center bg-gray-50 rounded-full ${selectedSizeClass} group`}>
        <div
          className={`group-hover:flex hidden z-10 absolute top-0 left-0 inset-0 items-center justify-center bg-gray-200 bg-opacity-35 rounded-full group-hover:cursor-pointer transition-all ease-in-out`}
        >
          <ArrowsPointingOutIcon className="w-5 h-5 text-gray-800" />
        </div>
        {profilePhoto ? (
          <img
            src={`/images/profile/${profilePhoto}`}
            className={`w-full h-full select-none rounded-full brightness-95`}
            alt="User profile"
          />
        ) : (
          <UserIcon className={`w-[80%] h-[80%] text-gray-300`} aria-hidden="true" />
        )}
        <span className="absolute bottom-[14%] right-[14%] block translate-x-1/2 translate-y-1/2 transform rounded-full border-2 border-white z-20">
          <span className={`block ${selectedActivitySizeClass} rounded-full ${activeIndicatorColor}`} />
        </span>
      </span>
    </>
  );
};

// Wrap the component in React.memo
export default memo(UserItem);