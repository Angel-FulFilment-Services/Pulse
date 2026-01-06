import React, { useMemo, useRef } from 'react';
import { CalendarIcon, ClockIcon, ExclamationTriangleIcon, FaceFrownIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { format, startOfWeek, endOfWeek, subWeeks, differenceInMinutes, isSameDay } from 'date-fns';
import useFetchShifts from '../../Fetches/Rota/useFetchShifts.jsx';
import useFetchTimesheets from '../../Fetches/Rota/useFetchTimesheets.jsx';
import useFetchEvents from '../../Fetches/Rota/useFetchEvents.jsx';

const QuickStatsCard = ({ employee }) => {
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
            shiftsWorked,
            shiftsLate,
            shiftsSick,
            shiftsAbsent
        };
    }, [shifts, timesheets, events]);
    
    // Stat card component
    const StatCard = ({ title, value, subtitle, icon: Icon, status = 'neutral' }) => {
        const getStatusStyles = () => {
            switch (status) {
                case 'warning':
                    return {
                        iconBg: 'bg-yellow-100 border border-yellow-200 dark:border-yellow-800 dark:bg-yellow-900/30',
                        iconColor: 'text-yellow-600 dark:text-yellow-400'
                    };
                case 'danger':
                    return {
                        iconBg: 'bg-red-100 border border-red-200 dark:border-red-800 dark:bg-red-900/30',
                        iconColor: 'text-red-600 dark:text-red-400'
                    };
                default:
                    return {
                        iconBg: 'bg-gray-100 border border-gray-200 dark:border-dark-600 dark:bg-dark-700',
                        iconColor: 'text-gray-500 dark:text-dark-400'
                    };
            }
        };
        
        const styles = getStatusStyles();
        
        return (
            <div className="bg-gray-50 dark:bg-dark-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-lg ${styles.iconBg}`}>
                        <Icon className={`h-5 w-5 ${styles.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase tracking-wide mb-0.5">
                            {title}
                        </p>
                        <div className="flex items-baseline gap-1.5">
                            <p className="text-lg font-bold text-gray-900 dark:text-dark-100">
                                {value}
                            </p>
                            {subtitle && (
                                <p className="text-xs text-gray-400 dark:text-dark-500">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Loading skeleton
    if (showSkeleton) {
        return (
            <div className="flex flex-col flex-1 min-h-0 animate-pulse">
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div 
                            key={i} 
                            className={`bg-gray-50 dark:bg-dark-800 rounded-lg p-2 px-3 border border-gray-100 dark:border-dark-700 ${i === 1 ? 'col-span-2' : ''}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="h-11 w-11 bg-gray-200/75 dark:bg-dark-700/25 rounded-lg flex-shrink-0"></div>
                                <div className="flex-1">
                                    <div className="h-2.5 w-16 bg-gray-200/75 dark:bg-dark-700/25 rounded mb-1.5"></div>
                                    <div className="h-5 w-10 bg-gray-200/75 dark:bg-dark-700/25 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-2">
                {/* Hours Worked - spans full width */}
                <div className="col-span-2 bg-gray-50 dark:bg-dark-800 rounded-lg p-2 px-3 border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-lg bg-theme-100 border border-theme-200 dark:border-theme-800 dark:bg-theme-900/30">
                            <ClockIcon className="h-5 w-5 text-theme-600 dark:text-theme-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase tracking-wide mb-0.5">
                                Hours Worked
                            </p>
                            <div className="flex items-baseline gap-1.5">
                                <p className="text-lg font-bold text-gray-900 dark:text-dark-100">
                                    {stats.hoursWorked}h
                                </p>
                                <p className="text-xs text-gray-400 dark:text-dark-500">
                                    last 5 weeks
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Shifts Worked */}
                <StatCard 
                    title="Shifts"
                    value={stats.shiftsWorked}
                    icon={CalendarIcon}
                />
                
                {/* Shifts Late */}
                <StatCard 
                    title="Late"
                    value={stats.shiftsLate}
                    icon={ExclamationTriangleIcon}
                    status={stats.shiftsLate > 0 ? 'warning' : 'neutral'}
                />
                
                {/* Shifts Sick */}
                <StatCard 
                    title="Sick"
                    value={stats.shiftsSick}
                    icon={FaceFrownIcon}
                    status={stats.shiftsSick > 0 ? 'warning' : 'neutral'}
                />
                
                {/* Absent/AWOL */}
                <StatCard 
                    title="Absent"
                    value={stats.shiftsAbsent}
                    icon={XCircleIcon}
                    status={stats.shiftsAbsent > 0 ? 'danger' : 'neutral'}
                />
            </div>
        </div>
    );
};

export default QuickStatsCard;
