import React, { useMemo, useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ClockIcon, CheckCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { format, startOfMonth, startOfWeek, endOfWeek, subWeeks, differenceInMinutes, isSameDay } from 'date-fns';
import useFetchShifts from '../../Fetches/Rota/useFetchShifts.jsx';
import useFetchTimesheets from '../../Fetches/Rota/useFetchTimesheets.jsx';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const PerformanceInsightsWidget = ({ employee, isExpanded }) => {
    const { employee: currentEmployee } = usePage().props;
    const hrId = employee?.hr_id || currentEmployee?.hr_id;
    
    // Get theme color for chart - stores raw RGB values like "249 115 22" (space-separated)
    const [themeRgb, setThemeRgb] = useState('249 115 22');
    
    // Convert space-separated RGB to comma-separated for rgb() function
    const toRgbString = (rgbString) => rgbString.split(/\s+/).join(', ');
    
    // Convert RGB string to hex with alpha for Chart.js compatibility
    // Handles both space-separated "249 115 22" and comma-separated "249, 115, 22" formats
    const rgbToHexAlpha = (rgbString, alpha) => {
        try {
            // Split by comma or space
            const parts = rgbString.split(/[,\s]+/).map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
            if (parts.length < 3) {
                return `rgba(249, 115, 22, ${alpha})`; // Fallback
            }
            const [r, g, b] = parts;
            const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
            return hex + alphaHex;
        } catch {
            return `rgba(249, 115, 22, ${alpha})`; // Fallback
        }
    };
    
    useEffect(() => {
        const updateThemeColor = () => {
            const rgb = getComputedStyle(document.body).getPropertyValue('--theme-500').trim();
            if (rgb) {
                setThemeRgb(rgb);
            }
        };
        
        // Initial update (with small delay to ensure CSS is loaded)
        setTimeout(updateThemeColor, 0);
        
        // Watch for theme changes via class changes on body
        const observer = new MutationObserver(updateThemeColor);
        observer.observe(document.body, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        return () => observer.disconnect();
    }, []);
    
    // Get date range - this month and last 5 weeks for chart
    const today = new Date();
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
    const fiveWeeksAgo = format(startOfWeek(subWeeks(today, 4)), 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');
    
    // Fetch shifts and timesheets
    const { shifts, isLoading: isLoadingShifts, isLoaded: isLoadedShifts } = useFetchShifts(fiveWeeksAgo, endDate, 6927);
    const { timesheets, isLoading: isLoadingTimesheets, isLoaded: isLoadedTimesheets } = useFetchTimesheets(fiveWeeksAgo, endDate, 6927);
    
    const isLoading = isLoadingShifts || isLoadingTimesheets;
    const isLoaded = isLoadedShifts && isLoadedTimesheets;
    
    // Calculate performance metrics
    const performanceData = useMemo(() => {
        if (!shifts || !timesheets) {
            return {
                totalHours: { current: 0, trend: 'up', change: '0h' },
                punctualityScore: { current: 0, trend: 'up', change: '0%' },
                attendanceRate: { current: 0, trend: 'up', change: '0%' },
                weeklyHours: [0, 0, 0, 0, 0],
                weeklyScheduled: [0, 0, 0, 0, 0],
                weekLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                chartDateRange: ''
            };
        }
        
        const now = new Date();
        
        // Calculate the 5-week period range
        const fiveWeekStart = startOfWeek(subWeeks(now, 4));
        const fiveWeekEnd = endOfWeek(now);
        
        // Filter data for the 5-week period
        const periodShifts = shifts.filter(s => {
            const shiftDate = new Date(s.shiftdate);
            return shiftDate >= fiveWeekStart && shiftDate <= fiveWeekEnd;
        });
        const periodTimesheets = timesheets.filter(ts => {
            const onTime = new Date(ts.on_time);
            return onTime >= fiveWeekStart && onTime <= fiveWeekEnd;
        });
        
        // Calculate total hours worked in the 5-week period
        let totalHours = 0;
        periodTimesheets.forEach(ts => {
            const onTime = new Date(ts.on_time);
            const offTime = ts.off_time ? new Date(ts.off_time) : now;
            totalHours += differenceInMinutes(offTime, onTime) / 60;
        });
        totalHours = Math.round(totalHours);
        
        // Calculate punctuality score for the 5-week period
        // Missed shifts count as not punctual (worse than being late)
        let onTimeCount = 0;
        const totalScheduledShifts = periodShifts.length;
        
        periodShifts.forEach(shift => {
            const shiftDate = new Date(shift.shiftdate);
            const shiftStart = new Date(shiftDate);
            shiftStart.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100, 0, 0);
            
            // Find matching timesheet
            const matchingTs = periodTimesheets.find(ts => {
                const onTime = new Date(ts.on_time);
                return isSameDay(onTime, shiftDate);
            });
            
            if (matchingTs) {
                const clockInTime = new Date(matchingTs.on_time);
                // On time if clocked in within 5 minutes of shift start
                if (clockInTime <= new Date(shiftStart.getTime() + 5 * 60 * 1000)) {
                    onTimeCount++;
                }
            }
            // No timesheet = missed shift = not punctual (counts as 0)
        });
        
        const punctualityScore = totalScheduledShifts > 0 
            ? Math.round((onTimeCount / totalScheduledShifts) * 100)
            : 100;
        
        // Calculate attendance rate (shifts worked / shifts scheduled) for the 5-week period
        const shiftsScheduled = periodShifts.length;
        const shiftsWorked = periodShifts.filter(shift => {
            const shiftDate = new Date(shift.shiftdate);
            return periodTimesheets.some(ts => isSameDay(new Date(ts.on_time), shiftDate));
        }).length;
        
        const attendanceRate = shiftsScheduled > 0 
            ? Math.round((shiftsWorked / shiftsScheduled) * 100)
            : 100;
        
        // Calculate weekly hours for chart (last 5 weeks)
        const weeklyHours = [];
        const weeklyScheduled = [];
        const weekLabels = [];
        
        // Track the date range for display
        let chartStartDate = null;
        let chartEndDate = null;
        
        for (let i = 4; i >= 0; i--) {
            const weekStart = startOfWeek(subWeeks(now, i));
            const weekEnd = endOfWeek(subWeeks(now, i));
            
            // Track overall range
            if (i === 4) chartStartDate = weekStart;
            if (i === 0) chartEndDate = weekEnd;
            
            // Create label like "Week 1", "Week 2", etc.
            weekLabels.push(`Week ${5 - i}`);
            
            // Calculate worked hours for this week
            let weekHours = 0;
            timesheets.forEach(ts => {
                const onTime = new Date(ts.on_time);
                if (onTime >= weekStart && onTime <= weekEnd) {
                    const offTime = ts.off_time ? new Date(ts.off_time) : now;
                    weekHours += differenceInMinutes(offTime, onTime) / 60;
                }
            });
            weeklyHours.push(Math.round(weekHours));
            
            // Calculate scheduled hours for this week
            let scheduledHours = 0;
            shifts.forEach(shift => {
                const shiftDate = new Date(shift.shiftdate);
                if (shiftDate >= weekStart && shiftDate <= weekEnd) {
                    // Calculate shift duration from shiftstart and shiftend
                    const startHour = Math.floor(shift.shiftstart / 100);
                    const startMin = shift.shiftstart % 100;
                    const endHour = Math.floor(shift.shiftend / 100);
                    const endMin = shift.shiftend % 100;
                    
                    let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                    // Handle overnight shifts
                    if (duration < 0) {
                        duration += 24 * 60;
                    }
                    scheduledHours += duration / 60;
                }
            });
            weeklyScheduled.push(Math.round(scheduledHours));
        }
        
        // Calculate trends (compare last week to previous week)
        const lastWeekHours = weeklyHours[4] || 0;
        const prevWeekHours = weeklyHours[3] || 0;
        const hoursTrend = lastWeekHours >= prevWeekHours ? 'up' : 'down';
        const hoursChange = lastWeekHours - prevWeekHours;
        
        return {
            totalHours: { 
                current: totalHours, 
                trend: hoursTrend, 
                change: `${hoursChange >= 0 ? '+' : ''}${hoursChange}h` 
            },
            punctualityScore: { 
                current: punctualityScore, 
                trend: punctualityScore >= 90 ? 'up' : 'down', 
                change: punctualityScore >= 90 ? 'Good' : 'Needs work' 
            },
            attendanceRate: { 
                current: attendanceRate, 
                trend: attendanceRate >= 90 ? 'up' : 'down', 
                change: `${shiftsWorked}/${shiftsScheduled}` 
            },
            weeklyHours,
            weeklyScheduled,
            weekLabels,
            chartDateRange: chartStartDate && chartEndDate 
                ? `${format(chartStartDate, 'MMM d')} - ${format(chartEndDate, 'MMM d, yyyy')}`
                : ''
        };
    }, [shifts, timesheets]);

    const StatCard = ({ title, value, trend, change, unit = '', icon: Icon }) => (
        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 py-4 border border-gray-100 dark:border-dark-700">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />}
                        <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase tracking-wide">{title}</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-dark-100">
                        {value}{unit}
                    </p>
                </div>
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    trend === 'up' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                    {trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-3 w-3" />
                    ) : (
                        <ArrowTrendingDownIcon className="h-3 w-3" />
                    )}
                    <span>{change}</span>
                </div>
            </div>
        </div>
    );

    // Loading skeleton
    if (isLoading || !isLoaded) {
        return (
            <div className="flex flex-col flex-1 min-h-0 animate-pulse">
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 py-4 border border-gray-100 dark:border-dark-700">
                            <div className="h-3 w-20 bg-gray-200/75 dark:bg-dark-700/25 rounded mb-2"></div>
                            <div className="h-6 w-12 bg-gray-200/75 dark:bg-dark-700/25 rounded mb-0.5"></div>
                        </div>
                    ))}
                </div>
                {/* Chart skeleton when expanded */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-3 w-28 bg-gray-200/75 dark:bg-dark-700/25 rounded"></div>
                            <div className="h-3 w-32 bg-gray-200/75 dark:bg-dark-700/25 rounded"></div>
                        </div>
                        <div className="h-44 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-24 w-full max-w-xs flex items-end justify-center gap-2">
                                    {[50, 80, 100].map((height, i) => (
                                        <div 
                                            key={i} 
                                            className="w-8 bg-gray-200/75 dark:bg-dark-700/25 rounded-md"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    ))}
                                </div>
                                <div className="h-5 w-28 bg-gray-200/75 dark:bg-dark-700/25 rounded-md"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard 
                    title="Hours (5 Weeks)"
                    value={performanceData.totalHours.current}
                    unit="h"
                    trend={performanceData.totalHours.trend}
                    change={performanceData.totalHours.change}
                    icon={ClockIcon}
                />
                <StatCard 
                    title="Punctuality"
                    value={performanceData.punctualityScore.current}
                    unit="%"
                    trend={performanceData.punctualityScore.trend}
                    change={performanceData.punctualityScore.change}
                    icon={CheckCircleIcon}
                />
                <StatCard 
                    title="Attendance"
                    value={performanceData.attendanceRate.current}
                    unit="%"
                    trend={performanceData.attendanceRate.trend}
                    change={performanceData.attendanceRate.change}
                    icon={CalendarIcon}
                />
            </div>

            {/* Expanded Content - Chart.js Line Chart */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide">
                            Weekly Hours Trend
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-dark-500">
                            {performanceData.chartDateRange}
                        </p>
                    </div>
                    <div className="h-44">
                        <Line
                            data={{
                                labels: performanceData.weekLabels,
                                datasets: [
                                    {
                                        label: 'Hours Worked',
                                        data: performanceData.weeklyHours,
                                        borderColor: `rgb(${toRgbString(themeRgb)})`,
                                        backgroundColor: rgbToHexAlpha(themeRgb, 0.05),
                                        fill: true,
                                        tension: 0.3,
                                        pointRadius: 4,
                                        pointBackgroundColor: `rgb(${toRgbString(themeRgb)})`,
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2,
                                    },
                                    {
                                        label: 'Scheduled',
                                        data: performanceData.weeklyScheduled,
                                        borderColor: 'rgba(156, 163, 175, 0.7)',
                                        backgroundColor: 'rgba(156, 163, 175, 0.05)',
                                        fill: true,
                                        tension: 0.3,
                                        pointRadius: 3,
                                        pointBackgroundColor: 'rgba(156, 163, 175, 0.7)',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 1,
                                        borderWidth: 2,
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'top',
                                        align: 'end',
                                        labels: {
                                            boxWidth: 8,
                                            boxHeight: 8,
                                            usePointStyle: true,
                                            pointStyle: 'circle',
                                            font: { size: 10 },
                                            color: '#9ca3af',
                                            padding: 12
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        titleFont: { size: 11 },
                                        bodyFont: { size: 11 },
                                        padding: 8,
                                        callbacks: {
                                            label: (context) => `${context.dataset.label}: ${context.parsed.y}h`
                                        }
                                    }
                                },
                                scales: {
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            font: { size: 10 },
                                            color: '#9ca3af'
                                        }
                                    },
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(156, 163, 175, 0.1)'
                                        },
                                        ticks: {
                                            font: { size: 10 },
                                            color: '#9ca3af',
                                            callback: (value) => `${value}h`
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceInsightsWidget;
