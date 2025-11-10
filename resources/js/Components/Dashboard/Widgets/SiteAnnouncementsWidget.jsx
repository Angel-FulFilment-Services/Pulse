import React from 'react';
import { SpeakerWaveIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const SiteAnnouncementsWidget = ({ employee }) => {
    const announcements = [
        {
            id: 1,
            type: 'policy',
            title: 'Updated Remote Work Policy',
            content: 'New hybrid working arrangements are now in effect. Please review the updated guidelines in the employee handbook.',
            priority: 'high',
            date: '2025-09-24',
            author: 'HR Department'
        },
        {
            id: 2,
            type: 'maintenance',
            title: 'Scheduled System Maintenance',
            content: 'The employee portal will be offline for maintenance this Sunday from 2:00 AM to 6:00 AM.',
            priority: 'medium',
            date: '2025-09-23',
            author: 'IT Department'
        }
    ];

    const getPriorityIcon = (priority) => {
        if (priority === 'high') {
            return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
        }
        return <SpeakerWaveIcon className="h-5 w-5 text-blue-500" />;
    };

    const getPriorityBorder = (priority) => {
        return priority === 'high' ? 'border-l-red-500' : 'border-l-blue-500';
    };

    return (
        <div className="space-y-4">
                {announcements.map((announcement) => (
                    <div key={announcement.id} className={`border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 border-l-4 ${getPriorityBorder(announcement.priority)} rounded-r-lg p-4`}>
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                                {getPriorityIcon(announcement.priority)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100">
                                        {announcement.title}
                                    </h4>
                                    <span className="text-xs text-gray-500 dark:text-dark-400">
                                        {new Date(announcement.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-dark-300 mb-2">
                                    {announcement.content}
                                </p>
                                <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-dark-400">
                                    From: {announcement.author}
                                </span>
                                <button className="text-xs text-theme-600 hover:text-theme-700 font-medium">
                                    Read More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))})
            </div>
    );
};

export default SiteAnnouncementsWidget;
