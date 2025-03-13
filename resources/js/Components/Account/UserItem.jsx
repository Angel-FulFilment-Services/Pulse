import { UserIcon } from '@heroicons/react/24/solid';
import { differenceInMinutes } from 'date-fns';
import { useUserStates } from '../context/ActiveStateContext';

export default function UserItem({ userId, size = 'large' }) {
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

  const selectedSizeClass = sizeClasses["icon"][size] || sizeClasses["icon"]['medium'];
  const selectedActivitySizeClass = sizeClasses["activity"][size] || sizeClasses["activity"]['medium'];
  const userStates = useUserStates();

  const userState = userStates[userId];
  const profilePhoto = userState ? userState.profile_photo : null;
  const lastActiveAt = userState ? userState.last_active_at : null;

  const getActiveIndicatorColor = (lastActiveAt) => {
    const minutesAgo = differenceInMinutes(new Date(), new Date(lastActiveAt));
    if (minutesAgo <= 2.5) {
      return 'bg-green-500';
    } else if (minutesAgo <= 30) {
      return 'bg-yellow-500';
    } else {
      return 'bg-gray-300';
    }
  };

  const activeIndicatorColor = lastActiveAt
    ? getActiveIndicatorColor(lastActiveAt)
    : 'bg-gray-300';

  return (
    <>
      <span className={`relative flex flex-row items-center justify-center bg-gray-50 rounded-full ${selectedSizeClass}`}>
        {profilePhoto ? (
          <img
            src={`/images/profile/${profilePhoto}`}
            className={`w-full h-full select-none rounded-full brightness-95`}
            alt="User profile"
          />
        ) : (
          <UserIcon
            className={`w-[75%] h-[75%] text-gray-300`}
            aria-hidden="true"
          />
        )}
        <span className="absolute bottom-[14%] right-[14%] block translate-x-1/2 translate-y-1/2 transform rounded-full border-2 border-white">
          <span className={`block ${selectedActivitySizeClass} rounded-full ${activeIndicatorColor}`} />
        </span>
      </span>
    </>
  );
}