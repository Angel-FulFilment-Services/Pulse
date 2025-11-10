import React from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const ScheduleWidget = ({ employee }) => {
    // Mock schedule data
    const upcomingEvents = [
        { date: '25', day: 'Wed', type: 'shift', time: '9:00-17:00' },
        { date: '26', day: 'Thu', type: 'meeting', time: '14:00' },
        { date: '27', day: 'Fri', type: 'shift', time: '9:00-17:00' },
        { date: '28', day: 'Sat', type: 'off', time: null },
    ];

    const getEventColor = (type) => {
        switch (type) {
            case 'shift': return 'bg-theme-500';
            case 'meeting': return 'bg-blue-500';
            case 'off': return 'bg-gray-300';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div>
            {/* Calendar-style grid */}
            <div className="grid grid-cols-4 gap-3">
                {upcomingEvents.map((event, index) => (
                    <div key={index} className="border border-gray-200 dark:border-dark-700 text-center bg-gray-50 dark:bg-dark-800 rounded-lg p-3">
                            <div className="mb-2">
                                <div className="text-xs text-gray-500 dark:text-dark-400 uppercase tracking-wide">
                                    {event.day}
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-dark-100">
                                    {event.date}
                                </div>
                            </div>
                            <div className={`w-full h-3 rounded-full ${getEventColor(event.type)} mb-1`}></div>
                            {event.time && (
                                <div className="text-xs text-gray-600 dark:text-dark-300">
                                    {event.time}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-dark-400 mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-theme-500 rounded-full"></div>
                        <span>Shift</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Meeting</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span>Off</span>
                    </div>
                </div>
            </div>
    );
};

export default ScheduleWidget;
