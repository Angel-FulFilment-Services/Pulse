import React, { useMemo } from 'react';
import { CalendarDaysIcon, ClockIcon, MapPinIcon, BriefcaseIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { format, startOfDay, endOfDay, differenceInMinutes, isSameDay } from 'date-fns';
import useFetchShifts from '../../Fetches/Rota/useFetchShifts.jsx';
import useFetchTimesheets from '../../Fetches/Rota/useFetchTimesheets.jsx';

// Category colors for timesheet entries
const categoryColors = {
    'PBX Import': 'bg-theme-500',
    'Break': 'bg-green-500',
    'Warehouse': 'bg-blue-500',
    'Training': 'bg-blue-500',
    'HR Meetings': 'bg-blue-500',
    'Lateness': 'bg-red-500',
    'Other': 'bg-gray-500',
};

const ScheduleCard = ({ employee, isExpanded }) => {
    const { employee: currentEmployee } = usePage().props;
    const hrId = employee?.hr_id || currentEmployee?.hr_id;
    
    // Get today's date range
    const today = new Date();
    const startDate = format(startOfDay(today), 'yyyy-MM-dd');
    const endDate = format(endOfDay(today), 'yyyy-MM-dd');
    
    // Fetch shifts and timesheets for today
    const { shifts, isLoading: isLoadingShifts, isLoaded: isLoadedShifts } = useFetchShifts(startDate, endDate, 965);
    const { timesheets, isLoading: isLoadingTimesheets, isLoaded: isLoadedTimesheets } = useFetchTimesheets(startDate, endDate, 965);
    
    const isLoading = isLoadingShifts || isLoadingTimesheets;
    const isLoaded = isLoadedShifts && isLoadedTimesheets;
    
    // Format duration helper
    const formatDuration = (minutes) => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${minutes}m`;
    };
    
    // Process today's shift data
    const shiftData = useMemo(() => {
        if (!shifts || shifts.length === 0) return null;
        
        // Find today's shift
        const todayShift = shifts.find(shift => isSameDay(new Date(shift.shiftdate), today));
        if (!todayShift) return null;
        
        const now = new Date();
        
        // Parse shift times
        const shiftStartDate = new Date(todayShift.shiftdate);
        shiftStartDate.setHours(Math.floor(todayShift.shiftstart / 100), todayShift.shiftstart % 100, 0, 0);
        
        const shiftEndDate = new Date(todayShift.shiftdate);
        shiftEndDate.setHours(Math.floor(todayShift.shiftend / 100), todayShift.shiftend % 100, 0, 0);
        
        // Format times for display
        const startTimeFormatted = format(shiftStartDate, 'h:mm a');
        const endTimeFormatted = format(shiftEndDate, 'h:mm a');
        
        // Calculate total shift duration in minutes
        const totalDurationMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);
        
        // Find relevant timesheet entries for this shift
        const relevantTimesheets = timesheets?.filter((ts) => {
            const onTime = new Date(ts.on_time);
            const offTime = ts.off_time ? new Date(ts.off_time) : null;
            return (
                (onTime >= new Date(shiftStartDate.getTime() - 60 * 60 * 1000) && onTime <= shiftEndDate) ||
                (offTime && offTime >= shiftStartDate && offTime <= new Date(shiftEndDate.getTime() + 60 * 60 * 1000))
            );
        }) || [];
        
        // Check if currently clocked in
        const activeTimesheet = relevantTimesheets.find(ts => ts.on_time && !ts.off_time);
        const isClockedIn = !!activeTimesheet;
        const clockedInAt = activeTimesheet ? new Date(activeTimesheet.on_time) : null;
        
        // Calculate worked time
        let workedMinutes = 0;
        relevantTimesheets.forEach(ts => {
            const onTime = new Date(ts.on_time);
            const offTime = ts.off_time ? new Date(ts.off_time) : now;
            workedMinutes += differenceInMinutes(offTime, onTime);
        });
        
        // Calculate elapsed minutes (time since shift started)
        const elapsedMinutes = now < shiftStartDate 
            ? 0 
            : now >= shiftEndDate 
                ? totalDurationMinutes 
                : differenceInMinutes(now, shiftStartDate);
        
        // Calculate worked percentage against elapsed time (for active shifts) or total (for completed)
        const isCompleted = now >= shiftEndDate;
        const comparisonMinutes = isCompleted ? totalDurationMinutes : elapsedMinutes;
        const workedPercentage = comparisonMinutes > 0 
            ? Math.min(100, Math.round((workedMinutes / comparisonMinutes) * 100))
            : 0;
        
        // For display, show worked vs total shift
        const displayPercentage = totalDurationMinutes > 0
            ? Math.min(100, Math.round((workedMinutes / totalDurationMinutes) * 100))
            : 0;
        
        // Calculate remaining time
        let remainingText = '';
        let status = 'upcoming';
        
        if (now < shiftStartDate) {
            const minutesUntilStart = differenceInMinutes(shiftStartDate, now);
            if (minutesUntilStart >= 60) {
                const hours = Math.floor(minutesUntilStart / 60);
                const mins = minutesUntilStart % 60;
                remainingText = mins > 0 ? `${hours}h ${mins}m until start` : `${hours}h until start`;
            } else {
                remainingText = `${minutesUntilStart}m until start`;
            }
            status = 'upcoming';
        } else if (now >= shiftEndDate) {
            remainingText = 'Shift completed';
            status = 'completed';
        } else {
            const minutesRemaining = differenceInMinutes(shiftEndDate, now);
            if (minutesRemaining >= 60) {
                const hours = Math.floor(minutesRemaining / 60);
                const mins = minutesRemaining % 60;
                remainingText = mins > 0 ? `${hours}h ${mins}m remaining` : `${hours}h remaining`;
            } else {
                remainingText = `${minutesRemaining}m remaining`;
            }
            status = isClockedIn ? 'active' : 'not_clocked_in';
        }
        
        // Format worked time
        let workedText = '';
        if (workedMinutes >= 60) {
            const hours = Math.floor(workedMinutes / 60);
            const mins = workedMinutes % 60;
            workedText = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } else {
            workedText = `${workedMinutes}m`;
        }
        
        // Group timesheet entries by category for breakdown
        const timesheetBreakdown = relevantTimesheets.reduce((acc, ts) => {
            const category = ts.category || 'Other';
            const onTime = new Date(ts.on_time);
            const offTime = ts.off_time ? new Date(ts.off_time) : now;
            const duration = differenceInMinutes(offTime, onTime);
            
            if (!acc[category]) {
                acc[category] = { category, totalMinutes: 0, entries: [] };
            }
            acc[category].totalMinutes += duration;
            acc[category].entries.push({
                startTime: format(onTime, 'h:mm a'),
                endTime: ts.off_time ? format(offTime, 'h:mm a') : 'Active',
                duration,
                isActive: !ts.off_time,
            });
            return acc;
        }, {});
        
        return {
            shift: todayShift,
            startTime: startTimeFormatted,
            endTime: endTimeFormatted,
            location: todayShift.shiftloc || 'Main Office',
            category: todayShift.shiftcat || 'Standard',
            progress: displayPercentage,
            workedPercentage,
            remainingText,
            status,
            isClockedIn,
            clockedInAt,
            workedText,
            workedMinutes,
            totalDurationMinutes,
            timesheetBreakdown: Object.values(timesheetBreakdown),
        };
    }, [shifts, timesheets, today]);
    
    // Loading skeleton
    if (isLoading || !isLoaded) {
        return (
            <div className="flex flex-col flex-1 min-h-0 animate-pulse">
                <div className="bg-theme-50 dark:bg-theme-900/20 border border-theme-200 dark:border-theme-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1.5">
                            <div className="h-4 w-24 bg-theme-200 dark:bg-theme-700 rounded"></div>
                            <div className="h-3 w-32 bg-theme-100 dark:bg-theme-800 rounded"></div>
                        </div>
                        <div className="text-right space-y-1.5">
                            <div className="h-4 w-20 bg-theme-200 dark:bg-theme-700 rounded"></div>
                            <div className="h-3 w-14 bg-theme-100 dark:bg-theme-800 rounded"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <div className="h-2 w-12 bg-theme-100 dark:bg-theme-800 rounded"></div>
                            <div className="h-2 w-16 bg-theme-100 dark:bg-theme-800 rounded"></div>
                            <div className="h-2 w-12 bg-theme-100 dark:bg-theme-800 rounded"></div>
                        </div>
                        <div className="h-2.5 w-full bg-white/50 dark:bg-dark-700 rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }
    
    // No shift today
    if (!shiftData) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                <div className="relative mb-4">
                    {/* Background circle */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-dark-700 dark:to-dark-800 flex items-center justify-center shadow-inner">
                        <CalendarDaysIcon className="h-10 w-10 text-gray-400 dark:text-dark-500" />
                    </div>
                    {/* Checkmark badge */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center border-2 border-white dark:border-dark-900">
                        <svg className="w-4 h-4 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-dark-200 mb-1">No Shift Today</h4>
                <p className="text-sm text-gray-500 dark:text-dark-400 max-w-[200px]">
                    You have no shifts scheduled. Enjoy your day off!
                </p>
            </div>
        );
    }
    
    // Status colors
    const statusColors = {
        upcoming: 'text-blue-600 dark:text-blue-400',
        active: 'text-green-600 dark:text-green-400',
        not_clocked_in: 'text-orange-600 dark:text-orange-400',
        completed: 'text-gray-600 dark:text-dark-400',
    };
    
    // Get progress bar color based on worked percentage
    const getProgressColor = () => {
        if (shiftData.status === 'upcoming') return 'bg-blue-500';
        
        const percentage = shiftData.workedPercentage;
        if (percentage >= 90) return 'bg-green-500';
        if (percentage >= 70) return 'bg-amber-500';
        return 'bg-red-500';
    };
    
    const progressColor = getProgressColor();

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Shift Info Card */}
            <div className="bg-theme-50 dark:bg-theme-900/20 border border-theme-200 dark:border-theme-800 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-base font-semibold text-theme-900 dark:text-theme-100">
                                {shiftData.category}
                            </h4>
                            {shiftData.isClockedIn && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                                    Clocked In
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-theme-600 dark:text-theme-400">
                            <div className="flex items-center gap-1">
                                <ClockIcon className="h-3.5 w-3.5" />
                                <span>{shiftData.startTime} - {shiftData.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="h-3.5 w-3.5" />
                                <span>{shiftData.location}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-sm font-bold ${statusColors[shiftData.status]}`}>
                            {shiftData.remainingText}
                        </div>
                        {shiftData.workedMinutes > 0 && (
                            <div className="text-xs text-theme-600 dark:text-theme-400">
                                {shiftData.workedText} worked
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between text-[10px] text-theme-600 dark:text-theme-400 mb-1">
                        <span>{shiftData.startTime}</span>
                        <span>{shiftData.progress}% worked</span>
                        <span>{shiftData.endTime}</span>
                    </div>
                    <div className="w-full bg-white/50 dark:bg-dark-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`${progressColor} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${shiftData.progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Timesheet Breakdown */}
            {isExpanded && shiftData.timesheetBreakdown.length > 0 && (
                <div className="flex-1 min-h-0 overflow-auto">
                    <h5 className="text-[10px] font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide mb-2">Today's Activity</h5>
                    <div className="space-y-2">
                        {shiftData.timesheetBreakdown.map((item, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${categoryColors[item.category] || 'bg-gray-500'}`}></div>
                                        <span className="text-xs font-medium text-gray-900 dark:text-dark-100">{item.category}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-dark-300">
                                        {formatDuration(item.totalMinutes)}
                                    </span>
                                </div>
                                <div className="space-y-0.5 ml-3">
                                    {item.entries.map((entry, entryIndex) => (
                                        <div key={entryIndex} className="flex items-center justify-between text-[10px] text-gray-500 dark:text-dark-400">
                                            <span>
                                                {entry.startTime} - {entry.isActive ? (
                                                    <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                                ) : entry.endTime}
                                            </span>
                                            <span>{formatDuration(entry.duration)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleCard;