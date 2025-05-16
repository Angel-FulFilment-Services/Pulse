import { UserIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import { differenceInMinutes } from 'date-fns';
import { useUserStates } from '../Context/ActiveStateContext';
import ClickedModal from '../Modals/ClickedModal';
import React, { memo, useMemo } from 'react';
import UserFlyoutLayout from './UserFlyoutLayout';
import PopoverFlyout from '../Flyouts/PopoverFlyout';

const UserItem = ({ userId, size = 'large', agent, allowClickInto, jobTitle, showState = true, customClass, searchState = 'hrId' }) => {
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
  const userState = useMemo(() => {
    // If hrId is provided, try direct lookup by hrId (top-level key)
    if (userId && userStates && typeof userStates === 'object' && searchState === 'hrId') {
      return userStates[userId];
    }
    // If userId is provided, try to find in array by user_id
    if (userId && userStates && typeof userStates === 'object' && searchState === 'userId') {
      return Object.values(userStates).find(u => u.user_id === userId);
    }
    return undefined;
  }, [userStates, userId]);

  // Memoize profilePhoto and lastActiveAt
  const profilePhoto = useMemo(() => userState?.profile_photo || null, [userState]);
  const lastActiveAt = useMemo(() => userState?.last_active_at || null, [userState]);
  const isNewUser = useMemo(() => userState?.new || false, [userState]);

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
      <span className={`relative flex flex-shrink-0 flex-row items-center justify-center bg-gray-50 rounded-full ${selectedSizeClass} ${customClass}`}>
        {allowClickInto && (<ClickedModal
            overlay={true}
            size={"xl"}
            className={`w-full h-full justify-center items-center flex absolute rounded-full`}
            onClose={() => null} // Clear the message when the flyout closes
            content={(handleSubmit, handleClose) => <UserFlyoutLayout hrId={userId} handleClose={handleClose} jobTitle={jobTitle} /> 
          }
        >
          <div
            className={`flex z-20 absolute top-0 left-0 inset-0 items-center justify-center bg-none hover:bg-gray-800 hover:bg-opacity-50 rounded-full cursor-pointer transition-all ease-in-out group`}
          >
            <ArrowsPointingOutIcon className="w-5 h-5 text-gray-100 group-hover:block hidden" />
          </div>
        </ClickedModal>)}

        {profilePhoto ? (
          <img
            src={`/images/profile/${profilePhoto}`}
            className={`w-full h-full select-none rounded-full brightness-95`}
            alt="User profile"
          />
        ) : (
          <UserIcon className={`w-[80%] h-[80%] text-gray-300 ml-0.5`} aria-hidden="true" />
        )}
        {showState && (
          <PopoverFlyout
            placement='top'
            className=""
            placementOffset={-4}
            content={
              <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300 mr-1 cursor-default">
                  {
                    activeIndicatorColor === 'bg-green-500' ? (
                      <p className="text-sm">Active</p>
                    ) : activeIndicatorColor === 'bg-yellow-500' ? (
                      <p className="text-sm">Active {Math.floor(differenceInMinutes(new Date(), new Date(lastActiveAt)))} minutes ago</p>
                    ) : (
                      <p className="text-sm">Inactive</p>
                    )
                  }
              </div>
            }>
            <span className="absolute bottom-[14%] right-[14%] block translate-x-1/2 translate-y-1/2 transform rounded-full border-2 border-white z-50">
              <span className={`block ${selectedActivitySizeClass} rounded-full ${activeIndicatorColor}`} />
            </span>
          </PopoverFlyout>
        )}
        {isNewUser && (
            <span className="absolute -top-[18%] -right-[18%] transform z-50">
              <span className={`text-xs text-orange-500 font-bold`}>New</span>
            </span>
        )}
      </span>
    </>
  );
};

// Wrap the component in React.memo
export default memo(UserItem);