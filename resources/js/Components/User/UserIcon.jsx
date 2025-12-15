import { UserIcon } from '@heroicons/react/24/solid';
import { memo } from 'react';

const Icon = ({ size = 'large', profilePhoto }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    'extra-small': 'h-6 w-6',
    'small': 'h-8 w-8',
    'medium': 'h-10 w-10',
    'large': 'h-12 w-12',
    'extra-large': 'h-14 w-14',
  };

  return (
    <span className={`relative flex flex-shrink-0 flex-row items-center justify-center bg-gray-50 dark:bg-dark-800 rounded-full ${sizeClasses[size]}`}>
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
    </span>
  );
};

// Wrap the component in React.memo
export default memo(Icon);