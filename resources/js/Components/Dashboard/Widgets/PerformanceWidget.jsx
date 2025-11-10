import React from 'react';

const PerformanceWidget = ({ employee }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hours Trend */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-1">
                        37.5h
                    </div>
                    <p className="text-sm text-gray-600 dark:text-dark-300 mb-2">Avg Weekly Hours</p>
                    <div className="text-xs text-green-600 dark:text-green-400">
                        ↗ +2.5h from last month
                    </div>
                </div>

                {/* Punctuality */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-1">
                        96%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-dark-300 mb-2">Punctuality Score</p>
                    <div className="text-xs text-green-600 dark:text-green-400">
                        ↗ +4% from last month
                    </div>
                </div>

                {/* Attendance */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-1">
                        22/23
                    </div>
                    <p className="text-sm text-gray-600 dark:text-dark-300 mb-2">Days This Month</p>
                    <div className="text-xs text-gray-500 dark:text-dark-400">
                        1 day remaining
                    </div>
                </div>
            </div>
    );
};

export default PerformanceWidget;
