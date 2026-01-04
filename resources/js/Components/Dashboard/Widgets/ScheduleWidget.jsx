import React, { useMemo } from 'react';
import { CalendarDaysIcon, ClockIcon, MapPinIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { format, addDays, startOfDay, endOfDay, isSameDay, differenceInMinutes } from 'date-fns';
import useFetchShifts from '../../Fetches/Rota/useFetchShifts.jsx';
import useFetchTimesheets from '../../Fetches/Rota/useFetchTimesheets.jsx';
import PopoverFlyout from '../../Flyouts/PopoverFlyout.jsx';

const ScheduleWidget = ({ employee }) => {
    const { employee: currentEmployee } = usePage().props;
    const hrId = employee?.hr_id || currentEmployee?.hr_id;
    
    // Get date range for upcoming days (today + next 6 days = 7 days total)
    const today = new Date();
    const startDate = format(startOfDay(today), 'yyyy-MM-dd');
    const endDate = format(endOfDay(addDays(today, 6)), 'yyyy-MM-dd');
    
    // Fetch shifts and timesheets for the week
    const { shifts, isLoading: isLoadingShifts, isLoaded: isLoadedShifts } = useFetchShifts(startDate, endDate, 965);
    const { timesheets, isLoading: isLoadingTimesheets, isLoaded: isLoadedTimesheets } = useFetchTimesheets(startDate, endDate, 965);
    
    const isLoading = isLoadingShifts || isLoadingTimesheets;
    const isLoaded = isLoadedShifts && isLoadedTimesheets;
    
    // Process schedule for each day
    const weekSchedule = useMemo(() => {
        const days = [];
        const now = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = addDays(today, i);
            const dayShift = shifts?.find(shift => {
                const shiftDate = new Date(shift.shiftdate);
                return isSameDay(shiftDate, date);
            });
            
            let shiftTime = null;
            let workedPercentage = null;
            let category = null;
            
            if (dayShift) {
                const startHour = Math.floor(dayShift.shiftstart / 100);
                const startMin = dayShift.shiftstart % 100;
                const endHour = Math.floor(dayShift.shiftend / 100);
                const endMin = dayShift.shiftend % 100;
                
                const formatTime = (h, m) => {
                    const period = h >= 12 ? 'pm' : 'am';
                    const hour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                    return m > 0 ? `${hour}:${String(m).padStart(2, '0')}${period}` : `${hour}${period}`;
                };
                
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
                isToday: i === 0,
                isPast: date < startOfDay(now),
                type: dayShift ? 'shift' : 'off',
                time: shiftTime,
                location: dayShift?.shiftloc || null,
                category,
                workedPercentage,
            });
        }
        
        return days;
    }, [shifts, timesheets, today]);

    // Loading skeleton
    if (isLoading || !isLoaded) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="grid grid-cols-7 gap-2 flex-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="border border-gray-200 dark:border-dark-700 text-center bg-gray-50 dark:bg-dark-800 rounded-lg p-2 animate-pulse">
                            <div className="mb-2">
                                <div className="text-xs uppercase tracking-wide text-transparent bg-gray-200 dark:bg-dark-700 rounded mx-auto w-8 mb-1">&nbsp;</div>
                                <div className="text-lg font-bold text-transparent bg-gray-200 dark:bg-dark-700 rounded mx-auto w-5">&nbsp;</div>
                            </div>
                            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-dark-700 mb-1"></div>
                            <div className="text-[10px] text-transparent bg-gray-200 dark:bg-dark-700 rounded mx-auto w-6">&nbsp;</div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-dark-400 mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-center space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-gray-200 dark:bg-dark-700 rounded-full"></div>
                        <span className="text-transparent bg-gray-200 dark:bg-dark-700 rounded">Shift</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-gray-200 dark:bg-dark-700 rounded-full"></div>
                        <span className="text-transparent bg-gray-200 dark:bg-dark-700 rounded">Off</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Calendar-style grid */}
            <div className="grid grid-cols-7 gap-2 flex-1">
                {weekSchedule.map((day, index) => (
                    <PopoverFlyout
                        key={index}
                        placement="top"
                        enabled={day.type === 'shift'}
                        content={
                            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 p-3 min-w-[180px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                                        {format(day.fullDate, 'EEEE, MMM d')}
                                    </span>
                                </div>
                                
                                {day.category && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-300 mb-1.5">
                                        <BriefcaseIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                                        <span>{day.category}</span>
                                    </div>
                                )}
                                
                                {day.time && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-300 mb-1.5">
                                        <ClockIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                                        <span>{day.time}</span>
                                    </div>
                                )}
                                
                                {day.location && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-300 mb-1.5">
                                        <MapPinIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                                        <span>{day.location}</span>
                                    </div>
                                )}
                                
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
                            className={`border text-center rounded-lg p-2 transition-all cursor-default ${
                                day.isToday 
                                    ? 'border-theme-300 dark:border-theme-700 bg-theme-50 dark:bg-theme-900/20 ring-1 ring-theme-200 dark:ring-theme-800' 
                                    : 'border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700'
                            }`}
                        >
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
            
            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-dark-400 mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
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

export default ScheduleWidget;
