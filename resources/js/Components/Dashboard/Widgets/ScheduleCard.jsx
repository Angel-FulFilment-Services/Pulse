import React from 'react';
import { CalendarDaysIcon, ClockIcon, PlayIcon } from '@heroicons/react/24/outline';

const ScheduleCard = ({ employee }) => {
    const currentShift = {
        title: "Morning Shift",
        startTime: "9:00 AM",
        endTime: "5:00 PM",
        progress: 65,
        status: "active",
        location: "Main Office",
        remaining: "2h 48m"
    };

    return (
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-theme-200 dark:border-dark-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Header with gradient accent */}
            <div className="bg-gradient-to-r from-theme-600 to-theme-700 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <CalendarDaysIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Today's Schedule</h3>
                            <p className="text-theme-100 text-sm">Active shift in progress</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-white">Live</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Current Shift Info */}
                <div className="bg-theme-50 dark:bg-dark-800 rounded-xl p-4 mb-4 border border-theme-100 dark:border-dark-700">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-dark-100">{currentShift.title}</h4>
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-dark-300">
                                <ClockIcon className="h-4 w-4" />
                                <span className="text-sm">{currentShift.startTime} - {currentShift.endTime}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-theme-700 dark:text-theme-300">{currentShift.remaining}</div>
                            <div className="text-gray-500 dark:text-dark-400 text-sm">remaining</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-dark-300">
                            <span>Progress</span>
                            <span>{currentShift.progress}%</span>
                        </div>
                        <div className="w-full bg-theme-200 dark:bg-dark-700 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-theme-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                style={{ width: `${currentShift.progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-theme-100 hover:bg-theme-200 dark:bg-dark-800 dark:hover:bg-dark-700 rounded-lg py-3 px-4 transition-all duration-200 border border-theme-200 dark:border-dark-700 hover:border-theme-300 dark:hover:border-dark-600">
                    <div className="flex items-center justify-center space-x-2">
                        <PlayIcon className="h-5 w-5 text-theme-700 dark:text-theme-300" />
                        <span className="font-medium text-theme-700 dark:text-theme-300">View Full Schedule</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default ScheduleCard;