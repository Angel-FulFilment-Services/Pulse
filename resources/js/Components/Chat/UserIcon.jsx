import { UserIcon } from '@heroicons/react/24/solid';
import { differenceInMinutes } from 'date-fns';
import React, { memo, useMemo, useState } from 'react';
import PopoverFlyout from '../Flyouts/PopoverFlyout';
import { useUserStates } from '../Context/ActiveStateContext';
import ContactCard from './ContactCard';

const UserItem = ({ size = 'large', contact, showContactCard = false, onSendMessage, contactCardPlacement = 'right-start' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    "icon": {
      'extra-small': 'h-6 w-6',
      'small': 'h-9 w-9',
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

  const { userStates } = useUserStates();

    // Memoize userState to avoid recalculating it unnecessarily
  const userState = useMemo(() => {
    if (contact?.id && userStates && typeof userStates === 'object') {
      return Object.values(userStates).find(u => u.user_id === contact.id);
    }
    return undefined;
  }, [userStates, contact?.id]);
  
  const selectedSizeClass = sizeClasses.icon[size] || sizeClasses.icon.medium;
  const selectedActivitySizeClass = sizeClasses.activity[size] || sizeClasses.activity.medium;

  // Memoize profilePhoto and lastActiveAt
  const profilePhoto = useMemo(() => userState?.profile_photo || null, [userState]);
  const lastActiveAt = useMemo(() => userState?.pulse_last_active_at || null, [userState]);

  // Memoize activeIndicatorColor
  const activeIndicatorColor = useMemo(() => {
    if (!lastActiveAt) return 'bg-gray-300';

    const minutesAgo = differenceInMinutes(new Date(), new Date(lastActiveAt));
    if (minutesAgo <= 2.5) {
      return 'bg-green-500 dark:bg-green-600';
    } else if (minutesAgo <= 30) {
      return 'bg-yellow-500 dark:bg-yellow-600';
    } else {
      return 'bg-gray-300 dark:bg-gray-400';
    }
  }, [lastActiveAt]);

  const iconContent = (
    <span className={`relative flex flex-shrink-0 flex-row items-center justify-center bg-gray-50 dark:bg-dark-800 rounded-full ${selectedSizeClass}`}>
      {profilePhoto && !imageError ? (
        <img
          src={`https://pulse-cdn.angelfs.co.uk/profile/images/${profilePhoto}`}
          className={`w-full h-full select-none rounded-full brightness-95`}
          alt="User profile"
          onError={() => setImageError(true)}
        />
      ) : (
        <UserIcon className={`w-[80%] h-[80%] text-gray-300 dark:text-dark-600`} aria-hidden="true" />
      )}
      <span className="absolute bottom-[14%] right-[14%] block translate-x-1/2 translate-y-1/2 transform rounded-full border-2 border-white dark:border-dark-900 z-20">
          <span className={`block ${selectedActivitySizeClass} rounded-full ${activeIndicatorColor}`} />
      </span>
    </span>
  );

  // Wrap with ContactCard if enabled
  if (showContactCard && contact) {
    return (
      <ContactCard 
        contact={contact} 
        onSendMessage={onSendMessage}
        placement={contactCardPlacement}
      >
        {iconContent}
      </ContactCard>
    );
  }

  return iconContent;
};

// Wrap the component in React.memo
export default memo(UserItem);