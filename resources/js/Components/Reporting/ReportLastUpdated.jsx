import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function LastUpdated({ lastUpdated }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date()); // Update the current time every second
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <p className="whitespace-nowrap text-xs pt-1.5 text-gray-500">
      Last Updated: {lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : 'Never'}
    </p>
  );
}