import React from 'react';

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
        <div className="space-y-4">
            {/* Minimalist header - no card */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                    📅 My Schedule
                </h3>
                <button className="text-sm text-theme-600 hover:text-theme-700">
                    View Full
                </button>
            </div>

            {/* Calendar-style grid */}
            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-4">
                <div className="grid grid-cols-4 gap-3">
                    {upcomingEvents.map((event, index) => (
                        <div key={index} className="text-center">
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
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-dark-400">
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
