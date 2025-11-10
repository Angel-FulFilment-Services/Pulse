import React from 'react';
import { ChartBarIcon, CalendarIcon, ClockIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const QuickStatsCard = ({ employee }) => {
    const weekStats = {
        hours: { value: 32.5, target: 40, unit: 'h', trend: '+2.5h' },
        shifts: { value: 4, target: 5, unit: '', trend: 'On track' },
        events: { value: 2, target: 3, unit: '', trend: '1 upcoming' }
    };

    const getProgressPercentage = (value, target) => {
        return Math.min((value / target) * 100, 100);
    };

    return (
        <div className="space-y-4">
                {/* Hours with progress */}
                <div className="bg-theme-50 dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                            <span className="text-sm text-gray-600 dark:text-dark-300">Hours Worked</span>
                        </div>
                        <span className="text-xs text-theme-600 dark:text-theme-400 font-medium">{weekStats.hours.trend}</span>
                    </div>
                    <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-dark-100">{weekStats.hours.value}</span>
                        <span className="text-gray-500 dark:text-dark-400 text-sm">/ {weekStats.hours.target}{weekStats.hours.unit}</span>
                    </div>
                    <div className="w-full bg-theme-200 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-theme-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${getProgressPercentage(weekStats.hours.value, weekStats.hours.target)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Shifts & Events */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-theme-50 dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
                        <div className="flex items-center space-x-2 mb-2">
                            <CalendarIcon className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                            <span className="text-xs text-gray-600 dark:text-dark-300">Shifts</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-dark-100">{weekStats.shifts.value}</div>
                        <div className="text-xs text-theme-600 dark:text-theme-400">{weekStats.shifts.trend}</div>
                    </div>
                    
                    <div className="bg-theme-50 dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700">
                        <div className="flex items-center space-x-2 mb-2">
                            <ChartBarIcon className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                            <span className="text-xs text-gray-600 dark:text-dark-300">Events</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-dark-100">{weekStats.events.value}</div>
                        <div className="text-xs text-theme-600 dark:text-theme-400">{weekStats.events.trend}</div>
                    </div>
                </div>
        </div>
    );
};

export default QuickStatsCard;
