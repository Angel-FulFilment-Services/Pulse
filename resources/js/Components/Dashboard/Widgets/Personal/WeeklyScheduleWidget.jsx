import React, { useMemo, useRef, useState } from 'react';
import { CalendarDaysIcon, ClockIcon, MapPinIcon, BriefcaseIcon, ChevronLeftIcon, ChevronRightIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { format, addDays, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, isSameDay, differenceInMinutes, isThisWeek, parseISO, isAfter } from 'date-fns';
import useFetchShifts from '../../../Fetches/Rota/useFetchShifts.jsx';
import useFetchTimesheets from '../../../Fetches/Rota/useFetchTimesheets.jsx';
import useFetchEvents from '../../../Fetches/Rota/useFetchEvents.jsx';
import useFetchLatestShiftDate from '../../../Fetches/Rota/useFetchLatestShiftDate.jsx';
import PopoverFlyout from '../../../Flyouts/PopoverFlyout.jsx';
import { calculateTimeBlocks } from '../../../../Utils/Rota.jsx';

const WeeklyScheduleWidget = ({ employee, isPreview = false, isExpanded = false }) => {
    // Week navigation state for expanded mode
    const [weekOffset, setWeekOffset] = useState(0);
    
    // Preview mode - return static dummy content
    if (isPreview) {
        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        const dates = [5, 6, 7, 8, 9, 10, 11];
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => (
                        <div key={day} className={`flex flex-col items-center p-2 rounded-lg border ${i === 0 ? 'bg-theme-500 border-theme-600 text-white' : 'bg-gray-50 dark:bg-dark-800 border-gray-200 dark:border-dark-700'}`}>
                            <span className={`text-[10px] font-medium ${i === 0 ? 'text-white/80' : 'text-gray-500 dark:text-dark-400'}`}>{day}</span>
                            <span className={`text-lg font-bold ${i === 0 ? 'text-white' : 'text-gray-900 dark:text-dark-100'}`}>{dates[i]}</span>
                            <div className={`h-0.5 w-8 rounded-full mt-1 ${i < 5 ? 'bg-theme-400' : 'bg-gray-300 dark:bg-dark-600'}`} />
                            <span className={`text-[10px] mt-0.5 ${i === 0 ? 'text-white/80' : 'text-gray-500 dark:text-dark-400'}`}>{i < 5 ? '8am' : 'Off'}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-dark-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-theme-500" />
                        <span>Shift</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-dark-600" />
                        <span>Off</span>
                    </div>
                </div>
            </div>
        );
    }

    const { employee: currentEmployee } = usePage().props;
    const hrId = employee?.hr_id || currentEmployee?.hr_id;
    
    // Get date range for selected week (Monday to Sunday)
    const today = new Date();
    const baseWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekStart = addDays(baseWeekStart, weekOffset * 7);
    const weekEnd = addDays(weekStart, 6); // Sunday
    const startDate = format(startOfDay(weekStart), 'yyyy-MM-dd');
    const endDate = format(endOfDay(weekEnd), 'yyyy-MM-dd');
    const isCurrentWeek = weekOffset === 0;
    
    // Track which weekOffset has successfully loaded data
    const [loadedWeekOffset, setLoadedWeekOffset] = useState(null);
    const prevIsLoaded = useRef(false);
    
    // Fetch latest shift date to determine if rota is released
    const { latestDate: latestShiftDate, isLoaded: isLatestDateLoaded } = useFetchLatestShiftDate();
    
    // Fetch shifts, timesheets, and events for the week
    const { shifts, isLoading: isLoadingShifts, isLoaded: isLoadedShifts } = useFetchShifts(startDate, endDate, 5758);
    const { timesheets, isLoading: isLoadingTimesheets, isLoaded: isLoadedTimesheets } = useFetchTimesheets(startDate, endDate, 5758);
    const { events, isLoading: isLoadingEvents, isLoaded: isLoadedEvents } = useFetchEvents(startDate, endDate, 5758);
    
    const isLoading = isLoadingShifts || isLoadingTimesheets || isLoadingEvents;
    const isLoaded = isLoadedShifts && isLoadedTimesheets && isLoadedEvents;
    const initialLoadDone = useRef(false);
    
    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    
    // Check if the current week's rota has been released
    // The rota is not released if the start of the week is after the latest shift date
    const isRotaReleased = useMemo(() => {
        if (!isLatestDateLoaded || !latestShiftDate) return true; // Assume released if we don't know yet
        const latestDate = parseISO(latestShiftDate);
        // Check if the week start is after the latest shift date
        return !isAfter(weekStart, latestDate);
    }, [latestShiftDate, isLatestDateLoaded, weekStart]);
    
    // Update loadedWeekOffset only when isLoaded transitions from false to true
    // This ensures we only update when a NEW fetch completes, not when weekOffset changes
    // while isLoaded is still true from the previous fetch
    React.useEffect(() => {
        if (isLoaded && !prevIsLoaded.current) {
            // isLoaded just became true - a fetch completed
            setLoadedWeekOffset(weekOffset);
        }
        prevIsLoaded.current = isLoaded;
    }, [isLoaded, weekOffset]);
    
    // Only show loading skeleton on initial load, not on data refreshes
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);
    
    // Show skeleton when navigating between weeks (data hasn't loaded for current week yet)
    const showWeekChangeSkeleton = loadedWeekOffset !== weekOffset;
    
    // Week navigation handlers
    const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
    const goToNextWeek = () => setWeekOffset(prev => prev + 1);
    const goToCurrentWeek = () => setWeekOffset(0);
    
    // Process schedule for each day of current week
    const weekSchedule = useMemo(() => {
        const days = [];
        const now = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i);
            const isToday = isSameDay(date, now);
            
            // Get all shifts for this day
            const dayShifts = shifts?.filter(shift => {
                const shiftDate = new Date(shift.shiftdate);
                return isSameDay(shiftDate, date);
            }) || [];
            
            // Sort by start time
            dayShifts.sort((a, b) => a.shiftstart - b.shiftstart);
            
            // For today, find the next upcoming or current shift
            // For other days, just use the first shift
            let dayShift = null;
            if (isToday && dayShifts.length > 0) {
                const currentTime = now.getHours() * 100 + now.getMinutes();
                // Find shift that hasn't ended yet
                dayShift = dayShifts.find(s => s.shiftend > currentTime) || dayShifts[dayShifts.length - 1];
            } else {
                dayShift = dayShifts[0] || null;
            }
            
            const shiftCount = dayShifts.length;
            
            // Format time helper
            const formatTime = (h, m) => {
                const period = h >= 12 ? 'pm' : 'am';
                const hour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                return m > 0 ? `${hour}:${String(m).padStart(2, '0')}${period}` : `${hour}${period}`;
            };
            
            // Process all shifts for the popover
            const allShiftsInfo = dayShifts.map(shift => {
                const startHour = Math.floor(shift.shiftstart / 100);
                const startMin = shift.shiftstart % 100;
                const endHour = Math.floor(shift.shiftend / 100);
                const endMin = shift.shiftend % 100;
                
                return {
                    time: `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`,
                    category: shift.shiftcat || null,
                    location: shift.shiftloc || null,
                };
            });
            
            let shiftTime = null;
            let workedPercentage = null;
            let category = null;
            
            if (dayShift) {
                const startHour = Math.floor(dayShift.shiftstart / 100);
                const startMin = dayShift.shiftstart % 100;
                const endHour = Math.floor(dayShift.shiftend / 100);
                const endMin = dayShift.shiftend % 100;
                
                shiftTime = `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;
                category = dayShift.shiftcat || null;
                
                // Calculate worked percentage for past or current day shifts
                const shiftStartDate = new Date(dayShift.shiftdate);
                shiftStartDate.setHours(startHour, startMin, 0, 0);
                
                const shiftEndDate = new Date(dayShift.shiftdate);
                shiftEndDate.setHours(endHour, endMin, 0, 0);
                
                const totalShiftMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);
                
                // Only calculate percentage for past shifts or current day
                if (date <= now) {
                    // Find timesheets for this day's shift
                    const dayTimesheets = timesheets?.filter(ts => {
                        const onTime = new Date(ts.on_time);
                        const offTime = ts.off_time ? new Date(ts.off_time) : null;
                        return (
                            (onTime >= new Date(shiftStartDate.getTime() - 60 * 60 * 1000) && onTime <= shiftEndDate) ||
                            (offTime && offTime >= shiftStartDate && offTime <= new Date(shiftEndDate.getTime() + 60 * 60 * 1000))
                        );
                    }) || [];
                    
                    // Calculate total worked minutes
                    let workedMinutes = 0;
                    dayTimesheets.forEach(ts => {
                        const onTime = new Date(ts.on_time);
                        const offTime = ts.off_time ? new Date(ts.off_time) : now;
                        workedMinutes += differenceInMinutes(offTime, onTime);
                    });
                    
                    if (totalShiftMinutes > 0) {
                        workedPercentage = Math.min(100, Math.round((workedMinutes / totalShiftMinutes) * 100));
                    }
                }
            }
            
            days.push({
                date: format(date, 'd'),
                day: format(date, 'EEE'),
                fullDate: date,
                isToday,
                isPast: date < startOfDay(now),
                type: dayShift ? 'shift' : 'off',
                time: shiftTime,
                location: dayShift?.shiftloc || null,
                category,
                workedPercentage,
                shiftCount,
                allShifts: allShiftsInfo,
                rawShifts: dayShifts, // Include raw shift data for expanded view
            });
        }
        
        return days;
    }, [shifts, timesheets, weekStart, events]);

    // Compact skeleton loader
    const renderCompactSkeleton = () => (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Date range header */}
            <div className="flex items-center justify-center -mt-2 mb-2">
                <span className="text-[10px] font-medium text-gray-400 dark:text-dark-500">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </span>
                {!isCurrentWeek && (
                    <button
                        onClick={goToCurrentWeek}
                        className="ml-2 p-0.5 rounded-lg text-theme-500 dark:text-theme-400 hover:text-theme-600 dark:hover:text-theme-300 hover:bg-theme-50 dark:hover:bg-theme-900/20 transition-colors"
                        title="Go to current week"
                    >
                        <ArrowUturnLeftIcon className="h-3 w-3" />
                    </button>
                )}
            </div>
            
            {/* Calendar-style grid with navigation */}
            <div className="flex items-center gap-1 flex-1 mb-0.5">
                {/* Previous week button */}
                <button
                    onClick={goToPreviousWeek}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-7 gap-2 flex-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="bg-gray-100 dark:bg-dark-800 rounded-lg p-2 py-4 h-24 animate-pulse">
                            
                        </div>
                    ))}
                </div>
                
                {/* Next week button */}
                <button
                    onClick={goToNextWeek}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </button>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-xs mt-2 pt-2 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-200 dark:bg-dark-700 rounded-full"></div>
                    <div className="h-3 w-6 bg-gray-200 dark:bg-dark-700 rounded"></div>
                </div>
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-200 dark:bg-dark-700 rounded-full"></div>
                    <div className="h-3 w-4 bg-gray-200 dark:bg-dark-700 rounded"></div>
                </div>
            </div>
        </div>
    );

    // Expanded skeleton loader
    const renderExpandedSkeleton = () => (
        <div className="flex flex-col h-full min-h-0">
            {/* Week Navigation Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-dark-700">
                <button
                    onClick={goToPreviousWeek}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400 transition-colors"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                        {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                    </h3>
                    {!isCurrentWeek && (
                        <button
                            onClick={goToCurrentWeek}
                            className="p-1 rounded-lg text-theme-500 dark:text-theme-400 hover:text-theme-600 dark:hover:text-theme-300 hover:bg-theme-50 dark:hover:bg-theme-900/20 transition-colors"
                            title="Go to current week"
                        >
                            <ArrowUturnLeftIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <button
                    onClick={goToNextWeek}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400 transition-colors"
                >
                    <ChevronRightIcon className="h-5 w-5" />
                </button>
            </div>
            
            {/* Skeleton Progress Bars */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-100 dark:bg-dark-800 rounded-xl p-4 animate-pulse h-28">
                        {/* Shift Header Skeleton */}
                        
                    </div>
                ))}
            </div>
            
            {/* Category Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-dark-400 mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-200 dark:bg-dark-700"></div>
                    <div className="h-3 w-12 bg-gray-200 dark:bg-dark-700 rounded"></div>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-200 dark:bg-dark-700"></div>
                    <div className="h-3 w-8 bg-gray-200 dark:bg-dark-700 rounded"></div>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-200 dark:bg-dark-700"></div>
                    <div className="h-3 w-10 bg-gray-200 dark:bg-dark-700 rounded"></div>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-200 dark:bg-dark-700"></div>
                    <div className="h-3 w-6 bg-gray-200 dark:bg-dark-700 rounded"></div>
                </div>
            </div>
        </div>
    );

    // Show appropriate skeleton based on view mode (initial load or week navigation)
    if (showSkeleton || showWeekChangeSkeleton) {
        return isExpanded ? renderExpandedSkeleton() : renderCompactSkeleton();
    }

    // Rota not released view for compact mode
    const renderRotaNotReleased = () => (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Date range header */}
            <div className="flex items-center justify-center -mt-2 mb-2">
                <span className="text-[10px] font-medium text-gray-400 dark:text-dark-500">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </span>
                {!isCurrentWeek && (
                    <button
                        onClick={goToCurrentWeek}
                        className="ml-2 p-0.5 rounded-lg text-theme-500 dark:text-theme-400 hover:text-theme-600 dark:hover:text-theme-300 hover:bg-theme-50 dark:hover:bg-theme-900/20 transition-colors"
                        title="Go to current week"
                    >
                        <ArrowUturnLeftIcon className="h-3 w-3" />
                    </button>
                )}
            </div>
            
            {/* Calendar-style grid with navigation */}
            <div className="flex items-center gap-1 flex-1">
                {/* Previous week button */}
                <button
                    onClick={goToPreviousWeek}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                {/* Rota not released message */}
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <ExclamationTriangleIcon className="h-8 w-8 text-theme-400 dark:text-theme-500 mb-2" />
                    <p className="text-sm font-medium text-gray-600 dark:text-dark-300">Rota Not Released</p>
                    <p className="text-xs text-gray-400 dark:text-dark-500 mt-0.5">Schedule not yet available</p>
                </div>
                
                {/* Next week button */}
                <button
                    onClick={goToNextWeek}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );

    // Compact view (default)
    const renderCompactView = () => {
        // Check if rota is not released for this week
        if (!isRotaReleased) {
            return renderRotaNotReleased();
        }
        
        return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Date range header */}
            <div className="flex items-center justify-center -mt-2 mb-2">
                <span className="text-[10px] font-medium text-gray-400 dark:text-dark-500">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </span>
                {!isCurrentWeek && (
                    <button
                        onClick={goToCurrentWeek}
                        className="ml-2 p-0.5 rounded-lg text-theme-500 dark:text-theme-400 hover:text-theme-600 dark:hover:text-theme-300 hover:bg-theme-50 dark:hover:bg-theme-900/20 transition-colors"
                        title="Go to current week"
                    >
                        <ArrowUturnLeftIcon className="h-3 w-3" />
                    </button>
                )}
            </div>
            
            {/* Calendar-style grid with navigation */}
            <div className="flex items-center gap-1 flex-1">
                {/* Previous week button */}
                <button
                    onClick={goToPreviousWeek}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-7 gap-2 flex-1">
                {weekSchedule.map((day, index) => (
                    <PopoverFlyout
                        key={index}
                        placement="top"
                        enabled={day.type === 'shift'}
                        content={
                            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-100 dark:border-dark-700 p-3 min-w-[200px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                                        {format(day.fullDate, 'EEEE, MMM d')}
                                    </span>
                                    {day.shiftCount > 1 && (
                                        <span className="text-[10px] font-medium text-theme-600 dark:text-theme-400 bg-theme-50 border border-theme-200 dark:border-theme-800 dark:bg-theme-900/30 px-1.5 py-0.5 rounded">
                                            {day.shiftCount} shifts
                                        </span>
                                    )}
                                </div>
                                
                                {/* Show all shifts */}
                                <div className={`space-y-2 ${day.shiftCount > 1 ? 'divide-y divide-gray-100 dark:divide-dark-700' : ''}`}>
                                    {day.allShifts.map((shift, idx) => (
                                        <div key={idx} className={idx > 0 ? 'pt-2' : ''}>
                                            {shift.category && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-300 mb-1">
                                                    <BriefcaseIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                                                    <span>{shift.category}</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-300 mb-1">
                                                <ClockIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                                                <span>{shift.time}</span>
                                            </div>
                                            
                                            {shift.location && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-300">
                                                    <MapPinIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                                                    <span>{shift.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {day.workedPercentage !== null && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-700">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-500 dark:text-dark-400">Worked</span>
                                            <span className={`font-medium ${
                                                day.workedPercentage >= 90 
                                                    ? 'text-green-600 dark:text-green-400' 
                                                    : day.workedPercentage >= 70 
                                                        ? 'text-amber-600 dark:text-amber-400' 
                                                        : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {day.workedPercentage}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    day.workedPercentage >= 90 
                                                        ? 'bg-green-500' 
                                                        : day.workedPercentage >= 70 
                                                            ? 'bg-amber-500' 
                                                            : 'bg-red-500'
                                                }`}
                                                style={{ width: `${day.workedPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        }
                    >
                        <div 
                            className={`relative border text-center rounded-lg p-2 transition-all cursor-default ${
                                day.isToday 
                                    ? 'border-theme-300 dark:border-theme-700 bg-theme-50 dark:bg-theme-900/20 ' 
                                    : 'border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700'
                            }`}
                        >
                            {/* Multiple shifts indicator */}
                            {day.shiftCount > 1 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-theme-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {day.shiftCount}
                                </div>
                            )}
                            <div className="mb-2">
                                <div className={`text-xs uppercase tracking-wide ${
                                    day.isToday 
                                        ? 'text-theme-600 dark:text-theme-400 font-medium' 
                                        : 'text-gray-500 dark:text-dark-400'
                                }`}>
                                    {day.day}
                                </div>
                                <div className={`text-lg font-bold ${
                                    day.isToday 
                                        ? 'text-theme-700 dark:text-theme-300' 
                                        : 'text-gray-900 dark:text-dark-100'
                                }`}>
                                    {day.date}
                                </div>
                            </div>
                            <div className={`w-full h-2 rounded-full mb-1 ${
                                day.type === 'shift' 
                                    ? 'bg-theme-500' 
                                    : 'bg-gray-300 dark:bg-dark-600'
                            }`}></div>
                            {day.time ? (
                                <div className="text-[10px] text-gray-600 dark:text-dark-300 leading-tight truncate">
                                    {day.time.split(' - ')[0]}
                                </div>
                            ) : (
                                <div className="text-[10px] text-gray-400 dark:text-dark-500">
                                    Off
                                </div>
                            )}
                        </div>
                    </PopoverFlyout>
                ))}
                </div>
                
                {/* Next week button */}
                <button
                    onClick={goToNextWeek}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </button>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-dark-400 mt-2 pt-2 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-theme-500 rounded-full"></div>
                    <span>Shift</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-dark-600 rounded-full"></div>
                    <span>Off</span>
                </div>
            </div>
        </div>
        );
    };
    
    // Rota not released view for expanded mode
    const renderExpandedRotaNotReleased = () => (
        <div className="flex flex-col h-full min-h-0">
            {/* Week Navigation Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-dark-700">
                <button
                    onClick={goToPreviousWeek}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400 transition-colors"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                        {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                    </h3>
                    {!isCurrentWeek && (
                        <button
                            onClick={goToCurrentWeek}
                            className="p-1 rounded-lg text-theme-500 dark:text-theme-400 hover:text-theme-600 dark:hover:text-theme-300 hover:bg-theme-50 dark:hover:bg-theme-900/20 transition-colors"
                            title="Go to current week"
                        >
                            <ArrowUturnLeftIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <button
                    onClick={goToNextWeek}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400 transition-colors"
                >
                    <ChevronRightIcon className="h-5 w-5" />
                </button>
            </div>
            
            {/* Rota not released message */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-theme-400 dark:text-theme-500 mb-3" />
                <p className="text-lg font-medium text-gray-600 dark:text-dark-300">Rota Not Released</p>
                <p className="text-sm text-gray-400 dark:text-dark-500 mt-1">The schedule for this week has not been released yet.</p>
            </div>
        </div>
    );
    
    // Expanded view with progress bars and week navigation
    const renderExpandedView = () => {
        // Check if rota is not released for this week
        if (!isRotaReleased) {
            return renderExpandedRotaNotReleased();
        }
        
        // Get shifts with progress data
        const shiftsWithProgress = weekSchedule
            .filter(day => day.rawShifts.length > 0)
            .flatMap(day => day.rawShifts.map(shift => ({
                ...shift,
                dayInfo: day,
            })));
        
        return (
            <div className="flex flex-col h-full min-h-0">
                {/* Week Navigation Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-dark-700">
                    <button
                        onClick={goToPreviousWeek}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                        </h3>
                        {!isCurrentWeek && (
                            <button
                                onClick={goToCurrentWeek}
                                className="p-1 rounded-lg text-theme-500 dark:text-theme-400 hover:text-theme-600 dark:hover:text-theme-300 hover:bg-theme-50 dark:hover:bg-theme-900/20 transition-colors"
                                title="Go to current week"
                            >
                                <ArrowUturnLeftIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    
                    <button
                        onClick={goToNextWeek}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400 transition-colors"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                </div>
                
                {/* Shift Progress Bars */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {shiftsWithProgress.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CalendarDaysIcon className="h-12 w-12 text-gray-300 dark:text-dark-600 mb-3" />
                            <p className="text-sm text-gray-500 dark:text-dark-400">No shifts scheduled this week</p>
                        </div>
                    ) : (
                        shiftsWithProgress.map((shift, index) => {
                            // Get timesheets and events for this shift
                            const shiftDateStr = shift.shiftdate;
                            const shiftTimesheets = timesheets?.filter(ts => ts.date === shiftDateStr) || [];
                            const shiftEvents = events?.filter(ev => {
                                if (!ev.on_time) return false;
                                const evDate = format(new Date(ev.on_time), 'yyyy-MM-dd');
                                return evDate === shiftDateStr;
                            }) || [];
                            
                            // Calculate time blocks
                            const { blocks: timeBlocks, totalActualMinutes, categories } = calculateTimeBlocks(shift, shiftTimesheets, shiftEvents);
                            
                            // Calculate shift times
                            const shiftStartDate = new Date(shift.shiftdate);
                            shiftStartDate.setHours(Math.floor(shift.shiftstart / 100), shift.shiftstart % 100);
                            const shiftEndDate = new Date(shift.shiftdate);
                            shiftEndDate.setHours(Math.floor(shift.shiftend / 100), shift.shiftend % 100);
                            const scheduledMinutes = differenceInMinutes(shiftEndDate, shiftStartDate);
                            const workedPercentage = scheduledMinutes > 0 ? Math.min(100, Math.round((totalActualMinutes / scheduledMinutes) * 100)) : 0;
                            
                            const formatTimeDisplay = (h, m) => {
                                const period = h >= 12 ? 'PM' : 'AM';
                                const hour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                                return `${hour}:${String(m).padStart(2, '0')} ${period}`;
                            };
                            
                            const startHour = Math.floor(shift.shiftstart / 100);
                            const startMin = shift.shiftstart % 100;
                            const endHour = Math.floor(shift.shiftend / 100);
                            const endMin = shift.shiftend % 100;
                            
                            const formattedActual = `${Math.floor(totalActualMinutes / 60)}h ${totalActualMinutes % 60}m`;
                            const formattedScheduled = `${Math.floor(scheduledMinutes / 60)}h ${scheduledMinutes % 60}m`;
                            
                            return (
                                <div key={`${shift.shiftdate}-${shift.shiftstart}-${index}`} className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
                                    {/* Shift Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
                                                shift.dayInfo.isToday 
                                                    ? 'bg-theme-500 text-white' 
                                                    : 'bg-white dark:bg-dark-700 text-gray-700 dark:text-dark-200 border border-gray-200 dark:border-dark-600'
                                            }`}>
                                                <span className="text-[10px] font-medium uppercase leading-none">{format(new Date(shift.shiftdate), 'EEE')}</span>
                                                <span className="text-sm font-bold leading-none">{format(new Date(shift.shiftdate), 'd')}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-dark-100">
                                                    {shift.shiftcat || 'Shift'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-dark-400">
                                                    {formatTimeDisplay(startHour, startMin)} - {formatTimeDisplay(endHour, endMin)}
                                                    {shift.shiftloc && <span className="ml-2">• {shift.shiftloc}</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${
                                                workedPercentage >= 90 ? 'text-green-600 dark:text-green-400' :
                                                workedPercentage >= 70 ? 'text-amber-600 dark:text-amber-400' :
                                                workedPercentage > 0 ? 'text-red-600 dark:text-red-400' :
                                                'text-gray-400 dark:text-dark-500'
                                            }`}>
                                                {workedPercentage > 0 ? `${workedPercentage}%` : '—'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-dark-400">
                                                {totalActualMinutes > 0 ? formattedActual : 'Not started'} / {formattedScheduled}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full h-6 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden relative">
                                        {timeBlocks.length > 0 ? (
                                            timeBlocks.map((block, blockIndex) => {
                                                const isFirst = blockIndex === 0;
                                                const isLast = blockIndex === timeBlocks.length - 1;
                                                const roundedClass = isFirst && isLast 
                                                    ? 'rounded-full' 
                                                    : isFirst 
                                                        ? 'rounded-l-full' 
                                                        : isLast 
                                                            ? 'rounded-r-full' 
                                                            : '';
                                                
                                                return (
                                                    <PopoverFlyout
                                                        key={blockIndex}
                                                        placement="top"
                                                        style={{ width: block.width, left: block.left }}
                                                        className={`absolute h-6 ${block.color} ${roundedClass} cursor-pointer transition-opacity hover:opacity-80`}
                                                        content={
                                                            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 p-3 min-w-[180px]">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categories?.detail?.[block.category] || 'bg-gray-100 dark:bg-dark-700 text-gray-500'}`}>
                                                                        <ClockIcon className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{block.category}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-dark-400">Time Block</p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1 text-xs">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-500 dark:text-dark-400">Started</span>
                                                                        <span className="text-gray-700 dark:text-dark-200 font-medium">{block.started}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-500 dark:text-dark-400">Ended</span>
                                                                        <span className="text-gray-700 dark:text-dark-200 font-medium">{block.ended}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                    />
                                                );
                                            })
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs text-gray-400 dark:text-dark-500">
                                                    {shift.dayInfo.isPast ? 'No data recorded' : 'Upcoming shift'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                
                {/* Category Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-dark-400 mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-theme-200 dark:bg-theme-300/75 ring-1 ring-theme-600/50"></div>
                        <span>Logged On</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-200/75 dark:bg-green-300/75 ring-1 ring-green-600/50"></div>
                        <span>Break</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-300 dark:bg-blue-400/75 ring-1 ring-blue-600/70"></div>
                        <span>Other</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-gray-100 dark:bg-dark-600/75 border-2 border-dashed border-gray-400/25"></div>
                        <span>Gap</span>
                    </div>
                </div>
            </div>
        );
    };
    
    // Return appropriate view based on expanded state
    return isExpanded ? renderExpandedView() : renderCompactView();
};

export default WeeklyScheduleWidget;
