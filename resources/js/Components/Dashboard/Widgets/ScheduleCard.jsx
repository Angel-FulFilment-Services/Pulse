import React, { useMemo, useRef } from 'react';
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
    const { shifts, isLoading: isLoadingShifts, isLoaded: isLoadedShifts } = useFetchShifts(startDate, endDate, 6927);
    const { timesheets, isLoading: isLoadingTimesheets, isLoaded: isLoadedTimesheets } = useFetchTimesheets(startDate, endDate, 6927);
    
    const isLoading = isLoadingShifts || isLoadingTimesheets;
    const isLoaded = isLoadedShifts && isLoadedTimesheets;
    const initialLoadDone = useRef(false);
    
    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    
    // Only show loading skeleton on initial load, not on data refreshes
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);
    
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
    if (showSkeleton) {
        return (
            <div className="flex flex-col flex-1 min-h-0 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-11 w-11 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-20 bg-gray-200 dark:bg-dark-700 rounded"></div>
                            <div className="h-4 w-16 bg-gray-100 dark:bg-dark-800 rounded"></div>
                        </div>
                        <div className="h-3 w-32 bg-gray-100 dark:bg-dark-800 rounded"></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="h-[5.3rem] bg-gray-100 dark:bg-dark-700 rounded-lg"></div>
                    <div className="h-[5.3rem] bg-gray-100 dark:bg-dark-700 rounded-lg"></div>
                </div>
            </div>
        );
    }
    
    // No shift today
    if (!shiftData) {
        return (
            <div className="flex flex-col flex-1 min-h-0 relative">
                {/* Skeleton-like background */}
                <div className="flex items-center gap-3 mb-3 opacity-30">
                    <div className="h-11 w-11 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-20 bg-gray-200 dark:bg-dark-700 rounded"></div>
                            <div className="h-4 w-16 bg-gray-100 dark:bg-dark-800 rounded"></div>
                        </div>
                        <div className="h-3 w-32 bg-gray-100 dark:bg-dark-800 rounded"></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 opacity-30">
                    <div className="h-[5.3rem] bg-gray-100 dark:bg-dark-700 rounded-lg"></div>
                    <div className="h-[5.3rem] bg-gray-100 dark:bg-dark-700 rounded-lg"></div>
                </div>
                
                {/* Centered overlay text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="backdrop-blur-sm px-4 py-2 bg-white/70 dark:bg-dark-900/70 rounded-lg border border-gray-200 dark:border-dark-700 text-center">
                        <CalendarDaysIcon className="h-8 w-8 text-gray-400 dark:text-dark-500 mx-auto mb-2" />
                        <p className="text-xl font-medium text-gray-600 dark:text-dark-200">No Shift Today</p>
                        <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">You have no scheduled shifts for today.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Status badge styles
    const getStatusBadge = () => {
        switch (shiftData.status) {
            case 'active':
                return {
                    bg: 'bg-green-100 dark:bg-green-900/30',
                    text: 'text-green-700 dark:text-green-400',
                    dot: 'bg-green-500',
                    label: 'Active'
                };
            case 'upcoming':
                return {
                    bg: 'bg-blue-100 dark:bg-blue-900/30',
                    text: 'text-blue-700 dark:text-blue-400',
                    dot: 'bg-blue-500',
                    label: 'Upcoming'
                };
            case 'completed':
                return {
                    bg: 'bg-gray-100 dark:bg-dark-700',
                    text: 'text-gray-600 dark:text-dark-400',
                    dot: 'bg-gray-400',
                    label: 'Completed'
                };
            case 'not_clocked_in':
                return {
                    bg: 'bg-orange-100 dark:bg-orange-900/30',
                    text: 'text-orange-700 dark:text-orange-400',
                    dot: 'bg-orange-500',
                    label: 'Not Clocked In'
                };
            default:
                return {
                    bg: 'bg-gray-100 dark:bg-dark-700',
                    text: 'text-gray-600 dark:text-dark-400',
                    dot: 'bg-gray-400',
                    label: ''
                };
        }
    };
    
    // Get progress bar color based on status and worked percentage
    const getProgressColor = () => {
        if (shiftData.status === 'upcoming') return 'bg-blue-500';
        if (shiftData.status === 'completed') return 'bg-green-500';
        
        const percentage = shiftData.workedPercentage;
        if (percentage >= 90) return 'bg-green-500';
        if (percentage >= 70) return 'bg-theme-500';
        return 'bg-orange-500';
    };
    
    const statusBadge = getStatusBadge();

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Header with icon and shift info */}
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-theme-100 border border-theme-200 dark:border-theme-800 dark:bg-theme-900/30">
                    <CalendarDaysIcon className="h-5 w-5 text-theme-600 dark:text-theme-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                            {shiftData.category}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} ${shiftData.status === 'active' ? 'animate-pulse' : ''}`}></span>
                            {statusBadge.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-dark-400">
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
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 py-6 border border-gray-100 dark:border-dark-700">
                    <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase tracking-wide mb-0.5">Status</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{shiftData.remainingText}</p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 py-6 border border-gray-100 dark:border-dark-700">
                    <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase tracking-wide mb-0.5">Worked</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{shiftData.workedText || '0m'}</p>
                </div>
            </div>
        </div>
    );
};

export default ScheduleCard;