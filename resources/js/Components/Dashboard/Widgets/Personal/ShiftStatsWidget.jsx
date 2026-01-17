import React, { useMemo, useRef } from 'react';
import { CalendarIcon, ClockIcon, ExclamationTriangleIcon, FaceFrownIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { format, startOfWeek, endOfWeek, subWeeks, differenceInMinutes, isSameDay } from 'date-fns';
import useFetchShifts from '../../../Fetches/Rota/useFetchShifts.jsx';
import useFetchTimesheets from '../../../Fetches/Rota/useFetchTimesheets.jsx';
import useFetchEvents from '../../../Fetches/Rota/useFetchEvents.jsx';

const ShiftStatsWidget = ({ employee, isPreview = false }) => {
    // Preview mode - return static dummy content
    if (isPreview) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                {/* Hours Header */}
                <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700 mb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-theme-50 dark:bg-theme-900/30 border border-theme-200 dark:border-theme-800">
                                <ClockIcon className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-gray-500 dark:text-dark-400 uppercase">Hours</p>
                                <p className="text-[9px] text-gray-400 dark:text-dark-500">5 weeks</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-gray-900 dark:text-dark-100">175h</span>
                            <span className="text-sm text-gray-400 dark:text-dark-500"> / 180h</span>
                        </div>
                    </div>
                </div>
                
                {/* Compact Stats Row */}
                <div className="bg-gray-50 dark:bg-dark-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5" title="Shifts worked">
                            <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">21</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-dark-600"></div>
                        <div className="flex items-center gap-1.5" title="Late arrivals">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-sm font-semibold text-amber-500">1</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-dark-600"></div>
                        <div className="flex items-center gap-1.5" title="Sick days">
                            <FaceFrownIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">0</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-dark-600"></div>
                        <div className="flex items-center gap-1.5" title="Absent/AWOL">
                            <XCircleIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">0</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { employee: currentEmployee } = usePage().props;
    const hrId = employee?.hr_id || currentEmployee?.hr_id;
    
    // Get last 5 weeks date range
    const today = new Date();
    const fiveWeeksAgo = format(startOfWeek(subWeeks(today, 4)), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(today), 'yyyy-MM-dd');
    
    // Fetch shifts, timesheets, and events
    const { shifts, isLoading: isLoadingShifts, isLoaded: isLoadedShifts } = useFetchShifts(fiveWeeksAgo, endDate, 6927);
    const { timesheets, isLoading: isLoadingTimesheets, isLoaded: isLoadedTimesheets } = useFetchTimesheets(fiveWeeksAgo, endDate, 6927);
    const { events, isLoading: isLoadingEvents, isLoaded: isLoadedEvents } = useFetchEvents(fiveWeeksAgo, endDate, 6927);
    
    const isLoading = isLoadingShifts || isLoadingTimesheets || isLoadingEvents;
    const isLoaded = isLoadedShifts && isLoadedTimesheets && isLoadedEvents;
    const initialLoadDone = useRef(false);
    
    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    
    // Only show loading skeleton on initial load, not on data refreshes
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);
    
    // Calculate stats
    const stats = useMemo(() => {
        if (!shifts || !timesheets || !events) {
            return {
                hoursWorked: 0,
                shiftsWorked: 0,
                shiftsLate: 0,
                shiftsSick: 0,
                shiftsAbsent: 0
            };
        }
        
        const now = new Date();
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
        
        const periodEvents = events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate >= fiveWeekStart && eventDate <= fiveWeekEnd;
        });
        
        // Calculate total hours worked
        let totalMinutes = 0;
        periodTimesheets.forEach(ts => {
            const onTime = new Date(ts.on_time);
            const offTime = ts.off_time ? new Date(ts.off_time) : now;
            totalMinutes += differenceInMinutes(offTime, onTime);
        });
        const hoursWorked = Math.round(totalMinutes / 60);
        
        // Calculate scheduled hours from shifts
        let scheduledMinutes = 0;
        periodShifts.forEach(shift => {
            const startHour = Math.floor(shift.shiftstart / 100);
            const startMin = shift.shiftstart % 100;
            const endHour = Math.floor(shift.shiftend / 100);
            const endMin = shift.shiftend % 100;
            
            let shiftMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
            // Handle overnight shifts
            if (shiftMinutes < 0) {
                shiftMinutes += 24 * 60;
            }
            scheduledMinutes += shiftMinutes;
        });
        const scheduledHours = Math.round(scheduledMinutes / 60);
        
        // Calculate shifts worked
        const shiftsWorked = periodShifts.filter(shift => {
            const shiftDate = new Date(shift.shiftdate);
            return periodTimesheets.some(ts => isSameDay(new Date(ts.on_time), shiftDate));
        }).length;
        
        // Calculate shifts late (clocked in more than 5 minutes after shift start)
        let shiftsLate = 0;
        periodShifts.forEach(shift => {
            const shiftDate = new Date(shift.shiftdate);
            const shiftStart = new Date(shiftDate);
            shiftStart.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100, 0, 0);
            
            const matchingTs = periodTimesheets.find(ts => {
                const onTime = new Date(ts.on_time);
                return isSameDay(onTime, shiftDate);
            });
            
            if (matchingTs) {
                const clockInTime = new Date(matchingTs.on_time);
                // Late if clocked in more than 5 minutes after shift start
                if (clockInTime > new Date(shiftStart.getTime() + 5 * 60 * 1000)) {
                    shiftsLate++;
                }
            }
        });
        
        // Count sick events
        const shiftsSick = periodEvents.filter(e => 
            e.category?.toLowerCase() === 'sick'
        ).length;
        
        // Count absent + AWOL events
        const shiftsAbsent = periodEvents.filter(e => 
            e.category?.toLowerCase() === 'absent' || e.category?.toLowerCase() === 'awol'
        ).length;
        
        return {
            hoursWorked,
            scheduledHours,
            shiftsWorked,
            shiftsLate,
            shiftsSick,
            shiftsAbsent
        };
    }, [shifts, timesheets, events]);

    // Loading skeleton
    if (showSkeleton) {
        return (
            <div className="flex flex-col gap-y-3 flex-1 min-h-0 animate-pulse">
                {/* Hours Header skeleton */}
                <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3 py-3.5">
                    <div className="flex items-center justify-between min-h-[3.5rem]"></div>
                </div>
                
                {/* Stats Row skeleton */}
                <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3 h-12">
                    <div className="flex items-center justify-between">
                        
                    </div>
                </div>
            </div>
        );
    }

    // Get icon and value color based on status
    const getStatusColor = (value, type) => {
        if (value === 0) return { icon: 'text-gray-400 dark:text-dark-500', value: 'text-gray-900 dark:text-dark-100' };
        if (type === 'danger') return { icon: 'text-red-500', value: 'text-red-500' };
        if (type === 'warning') return { icon: 'text-amber-500', value: 'text-amber-500' };
        return { icon: 'text-gray-400 dark:text-dark-500', value: 'text-gray-900 dark:text-dark-100' };
    };

    return (
        <div className="flex flex-col flex-1 gap-y-3 min-h-0">
            {/* Hours Header */}
            <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                <div className="flex items-center justify-between min-h-[3.5rem]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-theme-50 dark:bg-theme-900/30 border border-theme-200 dark:border-theme-800">
                            <ClockIcon className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium text-gray-500 dark:text-dark-400 uppercase">Hours</p>
                            <p className="text-[9px] text-gray-400 dark:text-dark-500">5 weeks</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold text-gray-900 dark:text-dark-100">{stats.hoursWorked}h</span>
                        <span className="text-sm text-gray-400 dark:text-dark-500"> / {stats.scheduledHours}h</span>
                    </div>
                </div>
            </div>
            
            {/* Compact Stats Row */}
            <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5" title="Shifts worked">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">{stats.shiftsWorked}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-dark-600"></div>
                    <div className="flex items-center gap-1.5" title="Late arrivals">
                        <ExclamationTriangleIcon className={`h-3.5 w-3.5 ${getStatusColor(stats.shiftsLate, 'warning').icon}`} />
                        <span className={`text-sm font-semibold ${getStatusColor(stats.shiftsLate, 'warning').value}`}>{stats.shiftsLate}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-dark-600"></div>
                    <div className="flex items-center gap-1.5" title="Sick days">
                        <FaceFrownIcon className={`h-3.5 w-3.5 ${getStatusColor(stats.shiftsSick, 'warning').icon}`} />
                        <span className={`text-sm font-semibold ${getStatusColor(stats.shiftsSick, 'warning').value}`}>{stats.shiftsSick}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-dark-600"></div>
                    <div className="flex items-center gap-1.5" title="Absent/AWOL">
                        <XCircleIcon className={`h-3.5 w-3.5 ${getStatusColor(stats.shiftsAbsent, 'danger').icon}`} />
                        <span className={`text-sm font-semibold ${getStatusColor(stats.shiftsAbsent, 'danger').value}`}>{stats.shiftsAbsent}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftStatsWidget;
