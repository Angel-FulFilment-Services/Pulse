import React, { useMemo, useRef } from 'react';
import { CubeIcon, ComputerDesktopIcon, SignalIcon, ExclamationTriangleIcon, CheckCircleIcon, SignalSlashIcon, WifiIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import useFetchKit from '../../../Fetches/Assets/useFetchKit.jsx';

// Stat card component matching PerformanceInsightsWidget style
const StatCard = ({ title, value, unit, status, icon: Icon, isExpanded }) => {
    const getStatusStyles = () => {
        switch (status) {
            case 'critical':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-100 dark:border-red-900/30',
                    text: 'text-red-600 dark:text-red-400',
                    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    badgeText: 'Needs work'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                    border: 'border-yellow-100 dark:border-yellow-900/30',
                    text: 'text-yellow-600 dark:text-yellow-400',
                    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    badgeText: 'Borderline'
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-dark-800',
                    border: 'border-gray-100 dark:border-dark-700',
                    text: 'text-gray-900 dark:text-dark-100',
                    badge: null,
                    badgeText: null
                };
        }
    };

    const styles = getStatusStyles();

    return (
        <div className={`${styles.bg} rounded-lg px-3 py-2.5 border ${styles.border}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${styles.text}`} />
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${styles.text}`}>
                        {title}
                    </span>
                </div>
                {(styles.badge && isExpanded) ? (
                    <ExclamationTriangleIcon className={`h-3.5 w-3.5 ${status === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
                ) : null}
            </div>
            <p className={`text-xl font-bold ${styles.text}`}>
                {value}{unit}
            </p>
        </div>
    );
};

const EquipmentStatusWidget = ({ employee, isExpanded, isPreview = false }) => {
    // Preview mode - return static dummy content
    if (isPreview) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-theme-50 dark:bg-theme-900/30 border border-theme-200 dark:border-theme-800">
                            <ComputerDesktopIcon className="h-5 w-5 text-theme-600 dark:text-theme-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100">Kit: AFS-LM307</h4>
                            <p className="text-xs text-gray-500 dark:text-dark-400">9 items assigned</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'MIN', value: '0ms' },
                        { label: 'MAX', value: '128ms' },
                        { label: 'AVG', value: '35ms' },
                        { label: 'LOST', value: '2.12%' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2 border border-gray-100 dark:border-dark-700 text-center">
                            <p className="text-[10px] text-gray-500 dark:text-dark-400">{stat.label}</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-dark-100">{stat.value}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-theme-50 dark:bg-theme-900/30 border border-theme-200 dark:border-theme-800 rounded-md">
                                        <CubeIcon className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-dark-100">Laptop Model X</p>
                                        <p className="text-xs text-gray-500 dark:text-dark-400">AFS-ID: 6755</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const { employee: currentEmployee } = usePage().props;
    const hrId = employee?.hr_id || currentEmployee?.hr_id;
    
    // Get last 7 days date range for latency data
    const today = new Date();
    const startDate = format(subDays(startOfDay(today), 7), 'yyyy-MM-dd');
    const endDate = format(endOfDay(today), 'yyyy-MM-dd');
    
    // Fetch kit and latency responses
    const { kit, responses, isLoading, isLoaded } = useFetchKit(startDate, endDate, 6755);
    const initialLoadDone = useRef(false);
    
    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    
    // Only show loading skeleton on initial load, not on data refreshes
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);
    
    // Calculate latency statistics
    const latencyStats = useMemo(() => {
        if (!responses || responses.length === 0) return null;
        
        const minValues = responses.map(r => Number(r.min));
        const maxValues = responses.map(r => Number(r.max));
        const avgValues = responses.map(r => Number(r.avg));
        const lostValues = responses.map(r => Number(r.lost_rate) * 100);
        
        const overallMin = Math.min(...minValues);
        const overallMax = Math.max(...maxValues);
        const overallAvg = Math.round(avgValues.reduce((a, b) => a + b, 0) / avgValues.length);
        const overallLost = Math.round((lostValues.reduce((a, b) => a + b, 0) / lostValues.length) * 100) / 100;
        
        // Determine status
        let status = 'good';
        if (overallAvg > 150 || overallLost > 5) {
            status = 'critical';
        } else if (overallAvg > 100 || overallLost > 2.5) {
            status = 'warning';
        }
        
        return {
            min: overallMin,
            max: overallMax,
            avg: overallAvg,
            lost: overallLost,
            status,
            testCount: responses.length
        };
    }, [responses]);
    
    // Get kit alias/ID
    const kitInfo = useMemo(() => {
        if (!kit || kit.length === 0) return null;
        return {
            id: kit[0]?.kit_alias || kit[0]?.afs_id || 'Unknown',
            items: kit
        };
    }, [kit]);

    // Loading skeleton
    if (showSkeleton) {
        return (
            <div className="flex flex-col flex-1 min-h-0 animate-pulse">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-dark-700 rounded"></div>
                            <div className="h-3 w-32 bg-gray-100 dark:bg-dark-800 rounded"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pb-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[78px] bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700"></div>
                        ))}
                    </div>
                    {/* Expanded loading state - show kit item placeholders */}
                    {isExpanded && (
                        <div className="mt-2 pt-3 border-t border-gray-200 dark:border-dark-700">
                            <div className="h-3 w-28 bg-gray-200 dark:bg-dark-700 rounded mb-2"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                    <div key={i} className="h-16 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700"></div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Empty state - no kit assigned
    if (!kitInfo) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-dark-700 dark:to-dark-800 flex items-center justify-center shadow-inner">
                        <CubeIcon className="h-10 w-10 text-gray-400 dark:text-dark-500" />
                    </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-dark-200 mb-1">No Equipment Assigned</h4>
                <p className="text-sm text-gray-500 dark:text-dark-400 max-w-[200px]">
                    No kit has been assigned to you yet.
                </p>
            </div>
        );
    }

    // Get status styling
    const getStatusStyles = (status) => {
        switch (status) {
            case 'critical':
                return {
                    bg: 'bg-red-100 dark:bg-red-900/30',
                    text: 'text-red-700 dark:text-red-400',
                    icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
                    label: 'Issues Detected'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    text: 'text-yellow-700 dark:text-yellow-400',
                    icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
                    label: 'Borderline'
                };
            default:
                return {
                    bg: 'bg-green-100 dark:bg-green-900/30',
                    text: 'text-green-700 dark:text-green-400',
                    icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
                    label: 'All Good'
                };
        }
    };

    const statusStyles = latencyStats ? getStatusStyles(latencyStats.status) : getStatusStyles('good');

    // Collapsed view - compact summary matching PerformanceInsightsWidget style
    if (!isExpanded) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                {/* Kit Header */}
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-lg bg-theme-50 border border-theme-200 dark:border-theme-800 dark:bg-theme-900/30`}>
                        <ComputerDesktopIcon className={`h-5 w-5 text-theme-600 dark:text-theme-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                                Kit: {kitInfo.id}
                            </h4>
                            {latencyStats && latencyStats.status !== 'good' && statusStyles.icon}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-dark-400">
                            {kitInfo.items.length} item{kitInfo.items.length !== 1 ? 's' : ''} assigned
                        </p>
                    </div>
                </div>

                {/* Latency Stats Grid - matching PerformanceInsightsWidget */}
                {latencyStats ? (
                    <>
                        <div className="grid grid-cols-4 gap-2">
                            <StatCard 
                                title="Min"
                                value={latencyStats.min}
                                unit="ms"
                                status="good"
                                icon={SignalIcon}
                                isExpanded={false}
                            />
                            <StatCard 
                                title="Max"
                                value={latencyStats.max}
                                unit="ms"
                                status="good"
                                icon={SignalIcon}
                                isExpanded={false}
                            />
                            <StatCard 
                                title="Avg"
                                value={latencyStats.avg}
                                unit="ms"
                                status={latencyStats.avg > 150 ? 'critical' : latencyStats.avg > 100 ? 'warning' : 'good'}
                                icon={WifiIcon}
                                isExpanded={false}
                            />
                            <StatCard 
                                title="Lost"
                                value={latencyStats.lost}
                                unit="%"
                                status={latencyStats.lost > 5 ? 'critical' : latencyStats.lost > 2.5 ? 'warning' : 'good'}
                                icon={SignalSlashIcon}
                                isExpanded={false}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-dark-500 mt-2 text-center">
                            Based on {latencyStats.testCount} tests in the last 7 days
                        </p>
                    </>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-dark-400 py-4 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700">
                        <SignalSlashIcon className="h-4 w-4" />
                        <span>No latency data available</span>
                    </div>
                )}
            </div>
        );
    }

    // Expanded view - show kit items visually
    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Kit Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-lg bg-theme-50 border border-theme-200 dark:border-theme-800 dark:bg-theme-900/30`}>
                    <ComputerDesktopIcon className={`h-5 w-5 text-theme-600 dark:text-theme-400`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                            Kit: {kitInfo.id}
                        </h4>
                        {latencyStats && latencyStats.status !== 'good' && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                                {statusStyles.icon}
                                {statusStyles.label}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                        {kitInfo.items.length} item{kitInfo.items.length !== 1 ? 's' : ''} assigned
                    </p>
                </div>
            </div>

            {/* Latency Stats Grid */}
            {latencyStats && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <StatCard 
                        title="Min"
                        value={latencyStats.min}
                        unit="ms"
                        status="good"
                        icon={SignalIcon}
                        isExpanded={true}
                    />
                    <StatCard 
                        title="Max"
                        value={latencyStats.max}
                        unit="ms"
                        status="good"
                        icon={SignalIcon}
                        isExpanded={true}
                    />
                    <StatCard 
                        title="Avg"
                        value={latencyStats.avg}
                        unit="ms"
                        status={latencyStats.avg > 150 ? 'critical' : latencyStats.avg > 100 ? 'warning' : 'good'}
                        icon={WifiIcon}
                        isExpanded={true}
                    />
                    <StatCard 
                        title="Lost"
                        value={latencyStats.lost}
                        unit="%"
                        status={latencyStats.lost > 5 ? 'critical' : latencyStats.lost > 2.5 ? 'warning' : 'good'}
                        icon={SignalSlashIcon}
                        isExpanded={true}
                    />
                </div>
            )}

            {/* Kit Items List */}
            <div className="flex-1 overflow-y-auto mt-2 pt-3 border-t border-gray-200 dark:border-dark-700">
                <h5 className="text-[10px] font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide mb-2">
                    Assigned Equipment
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {kitInfo.items.map((item, index) => (
                        <div 
                            key={index}
                            className="bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-lg p-3"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-theme-50 border border-theme-200 dark:border-theme-800 dark:bg-theme-900/30 rounded-md">
                                    <CubeIcon className="h-4 w-4 text-theme-600 dark:text-theme-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                                        {item.alias || 'Unknown Item'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-dark-400">
                                        {item.type || 'N/A'} • {item.afs_id || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {latencyStats && (
                <p className="text-[10px] text-gray-400 dark:text-dark-500 mt-3 text-center pt-2 border-t border-gray-100 dark:border-dark-700">
                    Latency based on {latencyStats.testCount} tests in the last 7 days
                </p>
            )}
        </div>
    );
};

export default EquipmentStatusWidget;
