import React from 'react';
import { BoltIcon } from '@heroicons/react/24/outline';

const ActivityFeedWidget = ({ employee }) => {
    const activities = [
        {
            id: 1,
            type: 'clock_in',
            title: 'Clocked in',
            time: '9:02 AM',
            ago: '2 hours ago',
            icon: '🕐',
            color: 'text-green-600'
        },
        {
            id: 2,
            type: 'meeting',
            title: 'Team meeting attended',
            time: '2:30 PM',
            ago: 'Yesterday',
            icon: '👥',
            color: 'text-blue-600'
        },
        {
            id: 3,
            type: 'document',
            title: 'Payslip available',
            time: '5:00 PM',
            ago: '2 days ago',
            icon: '📄',
            color: 'text-yellow-600'
        },
        {
            id: 4,
            type: 'update',
            title: 'Profile updated',
            time: '11:15 AM',
            ago: '3 days ago',
            icon: '✏️',
            color: 'text-purple-600'
        }
    ];

    return (
        <div className="space-y-4">
                {activities.map((activity, index) => (
                    <div key={activity.id} className="border border-gray-200 dark:border-dark-700 rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start space-x-4">
                            {/* Timeline dot */}
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-50 dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-600 rounded-full text-sm">
                                {activity.icon}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-dark-100">
                                        {activity.title}
                                    </p>
                                    <span className="text-xs text-gray-500 dark:text-dark-400">
                                        {activity.ago}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-dark-300">
                                    {activity.time}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
    );
};

export default ActivityFeedWidget;
