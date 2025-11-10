import React from 'react';
import { CakeIcon, GiftIcon } from '@heroicons/react/24/outline';

const BirthdayTrackerWidget = ({ employee }) => {
    const celebrations = [
        {
            id: 1,
            name: 'Sarah Johnson',
            type: 'birthday',
            date: '2025-09-26',
            department: 'Marketing',
            message: 'Happy Birthday!'
        },
        {
            id: 2,
            name: 'Mike Chen',
            type: 'anniversary',
            date: '2025-09-28',
            department: 'Engineering',
            years: 3,
            message: '3 years with the company!'
        },
        {
            id: 3,
            name: 'Emma Wilson',
            type: 'birthday',
            date: '2025-09-30',
            department: 'HR',
            message: 'Happy Birthday!'
        }
    ];

    const getTypeIcon = (type) => {
        return type === 'birthday' ? (
            <CakeIcon className="h-5 w-5 text-pink-500" />
        ) : (
            <GiftIcon className="h-5 w-5 text-purple-500" />
        );
    };

    const getTypeColor = (type) => {
        return type === 'birthday' 
            ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700'
            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="space-y-3">
            {celebrations.map((celebration) => (
                <div key={celebration.id} className={`border border-gray-200 dark:border-dark-700 rounded-lg p-4 ${getTypeColor(celebration.type)}`}>
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(celebration.type)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100">
                                    {celebration.name}
                                </h4>
                                <span className="text-xs font-medium text-gray-600 dark:text-dark-300">
                                    {formatDate(celebration.date)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-dark-300 mb-2">
                                {celebration.message}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-dark-400">
                                    {celebration.department}
                                </span>
                                <button className="text-xs text-theme-600 hover:text-theme-700 font-medium">
                                    Send Wishes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {celebrations.length === 0 && (
                <div className="text-center py-6 text-gray-500 dark:text-dark-400">
                    <CakeIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No celebrations this week</p>
                </div>
            )}
        </div>
    );
};

export default BirthdayTrackerWidget;
