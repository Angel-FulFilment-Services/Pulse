import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const PerformanceInsightsWidget = ({ employee }) => {
    // Mock performance data
    const performanceData = {
        hoursThisMonth: { current: 160, trend: 'up', change: '+8h' },
        punctualityScore: { current: 96, trend: 'up', change: '+4%' },
        attendanceRate: { current: 95, trend: 'down', change: '-2%' },
        weeklyHours: [35, 38, 40, 37, 39] // Last 5 weeks
    };

    const StatCard = ({ title, value, trend, change, unit = '' }) => (
        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 dark:text-dark-300">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-dark-100">
                        {value}{unit}
                    </p>
                </div>
                <div className={`flex items-center space-x-1 ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                    {trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{change}</span>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardCard 
            title="Performance Insights"
            headerAction={
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
            }
        >
            <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        title="Hours This Month"
                        value={performanceData.hoursThisMonth.current}
                        unit="h"
                        trend={performanceData.hoursThisMonth.trend}
                        change={performanceData.hoursThisMonth.change}
                    />
                    <StatCard 
                        title="Punctuality Score"
                        value={performanceData.punctualityScore.current}
                        unit="%"
                        trend={performanceData.punctualityScore.trend}
                        change={performanceData.punctualityScore.change}
                    />
                    <StatCard 
                        title="Attendance Rate"
                        value={performanceData.attendanceRate.current}
                        unit="%"
                        trend={performanceData.attendanceRate.trend}
                        change={performanceData.attendanceRate.change}
                    />
                </div>

                {/* Simple Weekly Hours Chart */}
                <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-100 mb-3">
                        Weekly Hours Trend
                    </p>
                    <div className="flex items-end space-x-2 h-20">
                        {performanceData.weeklyHours.map((hours, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div 
                                    className="w-full bg-theme-500 rounded-t-sm"
                                    style={{ height: `${(hours / 40) * 100}%` }}
                                ></div>
                                <span className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                                    W{index + 1}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

export default PerformanceInsightsWidget;
