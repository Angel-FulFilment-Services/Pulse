import React, { useRef, useEffect, useMemo, useState } from 'react';
import { BanknotesIcon, ClockIcon, GiftIcon, CalendarDaysIcon, ExclamationTriangleIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import useFetchPayrollEstimate from '../../../Fetches/Payroll/useFetchPayrollEstimate.jsx';
import useFetchPayrollHistory from '../../../Fetches/Payroll/useFetchPayrollHistory.jsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const PayrollWidget = ({ employee, isExpanded = false, isHovered = false, isPreview = false }) => {
    // Get theme color for chart
    const [themeRgb, setThemeRgb] = useState('249 115 22');
    
    const toRgbString = (rgbString) => rgbString.split(/\s+/).join(', ');
    
    const rgbToHexAlpha = (rgbString, alpha) => {
        try {
            const parts = rgbString.split(/[,\s]+/).map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
            if (parts.length < 3) return `rgba(249, 115, 22, ${alpha})`;
            const [r, g, b] = parts;
            const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
            return hex + alphaHex;
        } catch {
            return `rgba(249, 115, 22, ${alpha})`;
        }
    };
    
    useEffect(() => {
        const updateThemeColor = () => {
            const rgb = getComputedStyle(document.body).getPropertyValue('--theme-500').trim();
            if (rgb) setThemeRgb(rgb);
        };
        setTimeout(updateThemeColor, 0);
        const observer = new MutationObserver(updateThemeColor);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Preview mode - return static dummy content
    if (isPreview) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                {/* Main estimate card */}
                <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 mb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                                <BanknotesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase tracking-wide">
                                    Estimated Earnings
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-dark-100">
                                    £1,245.50
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                            <span>Estimate before tax & deductions</span>
                        </div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 border border-gray-100 dark:border-dark-700">
                        <div className="flex items-center gap-2 mb-1">
                            <ClockIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase">Hours</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-dark-100">124.5h</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 border border-gray-100 dark:border-dark-700">
                        <div className="flex items-center gap-2 mb-1">
                            <BanknotesIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase">Base</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-dark-100">£1,120</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 border border-gray-100 dark:border-dark-700">
                        <div className="flex items-center gap-2 mb-1">
                            <GiftIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase">Bonus</p>
                        </div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">£125.50</p>
                    </div>
                </div>

                {/* Expanded view */}
                <div className="mt-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-center justify-between mb-3 py-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                            Payroll History
                        </h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                            <p className="text-xs text-gray-500 dark:text-dark-400 mb-2">Avg. Net Pay</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-dark-100">£1,150.75</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                            <p className="text-xs text-gray-500 dark:text-dark-400 mb-2">Total Earned</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-dark-100">£13,808.25</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                            <p className="text-xs text-gray-500 dark:text-dark-400 mb-2">Avg. Deductions</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-dark-100">£220.40</p>
                        </div>
                    </div>
                    <div className="h-[15.80rem] bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700 p-3 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-32 w-full max-w-sm flex items-end justify-center gap-3">
                                {[40, 60, 45, 70, 55, 80, 65, 50, 75, 60, 85, 70].map((height, i) => (
                                    <div key={i} className="w-4 bg-gray-200 dark:bg-dark-700 rounded-t" style={{ height: `${height}%` }}></div>
                                ))}
                            </div>
                            <div className="h-5 w-[21rem] bg-gray-200/75 dark:bg-dark-700/25 rounded-md"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fetch payroll estimate and history
    const { payrollData, isLoading, isLoaded } = useFetchPayrollEstimate();
    const { payrollHistory, isLoading: isLoadingHistory, isLoaded: isLoadedHistory } = useFetchPayrollHistory();
    const initialLoadDone = useRef(false);
    const historyLoadDone = useRef(false);

    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    if (isLoadedHistory && !historyLoadDone.current) {
        historyLoadDone.current = true;
    }

    // Only show loading skeleton on initial load
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);
    const showHistorySkeleton = isExpanded && !historyLoadDone.current && (isLoadingHistory || !isLoadedHistory);
    
    // Plugin to extend line to chart edges with matching curve
    const extendLinePlugin = {
        id: 'extendLine',
        afterDatasetsDraw: (chart) => {
            const lineDataset = chart.data.datasets.find(ds => ds.type === 'line');
            if (!lineDataset) return;
            
            const datasetIndex = chart.data.datasets.indexOf(lineDataset);
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta.data || meta.data.length < 2) return;
            
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;
            const firstPoint = meta.data[0];
            const secondPoint = meta.data[1];
            const lastPoint = meta.data[meta.data.length - 1];
            const secondLastPoint = meta.data[meta.data.length - 2];
            
            // Offset to account for point radius + border
            const pointOffset = (lineDataset.pointRadius || 4) + 0.5;
            
            ctx.save();
            ctx.strokeStyle = lineDataset.borderColor;
            ctx.lineWidth = lineDataset.borderWidth;
            ctx.setLineDash([]);
            
            // Calculate curve tension factor
            const tension = lineDataset.tension || 0.3;
            
            // Extend line to left edge with curve
            // Use the tangent from first to second point to determine curve direction
            const leftDx = firstPoint.x - secondPoint.x;
            const leftDy = firstPoint.y - secondPoint.y;
            const leftDistance = chartArea.left - (firstPoint.x - pointOffset);
            const leftControlX = firstPoint.x - pointOffset + (leftDistance * tension);
            const leftControlY = firstPoint.y + (leftDy * tension * 0.5);
            
            ctx.beginPath();
            ctx.moveTo(chartArea.left, firstPoint.y + (leftDy * tension * 0.3));
            ctx.quadraticCurveTo(leftControlX, leftControlY, firstPoint.x - pointOffset, firstPoint.y);
            ctx.stroke();
            
            // Extend line to right edge with curve
            // Use the tangent from second-last to last point to determine curve direction
            const rightDx = lastPoint.x - secondLastPoint.x;
            const rightDy = lastPoint.y - secondLastPoint.y;
            const rightDistance = chartArea.right - (lastPoint.x + pointOffset);
            const rightControlX = lastPoint.x + pointOffset + (rightDistance * (1 - tension));
            const rightControlY = lastPoint.y + (rightDy * tension * 0.5);
            
            ctx.beginPath();
            ctx.moveTo(lastPoint.x + pointOffset, lastPoint.y);
            ctx.quadraticCurveTo(rightControlX, rightControlY, chartArea.right, lastPoint.y + (rightDy * tension * 0.3));
            ctx.stroke();
            
            ctx.restore();
        }
    };

    // Process history data for bar + line chart
    const chartData = useMemo(() => {
        if (!payrollHistory || payrollHistory.length === 0) {
            return { labels: [], datasets: [] };
        }
        
        const labels = payrollHistory.map(record => {
            try {
                return format(parseISO(record.enddate), 'MMM yy');
            } catch {
                return record.enddate;
            }
        });
        
        return {
            labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Net Pay',
                    data: payrollHistory.map(r => parseFloat(r.net_pay) || 0),
                    backgroundColor: `rgba(${toRgbString(themeRgb)}, 0.15)`,
                    borderColor: `rgb(${toRgbString(themeRgb)})`,
                    borderWidth: 2,
                    borderRadius: { topLeft: 4, topRight: 4 },
                    borderSkipped: 'bottom',
                    order: 2,
                },
                {
                    type: 'line',
                    label: 'Gross Pay',
                    data: payrollHistory.map(r => parseFloat(r.gross_pay_pre_sacrifice) || 0),
                    borderColor: 'rgba(156, 163, 175, 0.8)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(156, 163, 175, 0.8)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    order: 1,
                },
            ],
        };
    }, [payrollHistory, themeRgb]);
    
    // Calculate summary stats from history
    const historyStats = useMemo(() => {
        if (!payrollHistory || payrollHistory.length === 0) {
            return { avgNetPay: 0, totalEarned: 0, avgDeductions: 0, monthsCount: 0 };
        }
        
        const totalNet = payrollHistory.reduce((sum, r) => sum + (parseFloat(r.net_pay) || 0), 0);
        const totalGross = payrollHistory.reduce((sum, r) => sum + (parseFloat(r.gross_pay_pre_sacrifice) || 0), 0);
        const totalDeductions = totalGross - totalNet;
        
        return {
            avgNetPay: totalNet / payrollHistory.length,
            totalEarned: totalNet,
            avgDeductions: totalDeductions / payrollHistory.length,
            monthsCount: payrollHistory.length,
        };
    }, [payrollHistory]);

    // Loading skeleton
    if (showSkeleton) {
        return (
            <div className="flex flex-col flex-1 min-h-0 animate-pulse">
                {/* Main estimate card skeleton */}
                <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-4 pb-2 mb-3 h-[6.75rem]">
                    
                </div>

                {/* Stats grid skeleton */}
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-100 dark:bg-dark-800 rounded-lg p-2.5 h-[5.25rem]">                            
                        </div>
                    ))}
                </div>
                
                {/* Expanded skeleton */}
                {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-700">
                        <div className="flex items-center justify-between mb-3 py-1">
                            <div className="h-3 w-32 bg-gray-200 dark:bg-dark-700 rounded"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3 py-4 h-20">
                                    
                                </div>
                            ))}
                        </div>
                        <div className="h-[15.80rem] bg-gray-100 dark:bg-dark-800 rounded-lg flex items-center justify-center">
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Error or no data state
    if (!payrollData || payrollData.error) {
        return (
            <div className="flex flex-col flex-1 min-h-0 relative">
                {/* Skeleton-like background */}
                <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-4 pb-2 border border-gray-100 dark:border-dark-700 mb-3 opacity-30 h-[6.75rem]">
                    <div className="flex items-center gap-3">
                        
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 opacity-30">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 py-5 border border-gray-100 dark:border-dark-700 h-[5.25rem]"></div>
                    ))}
                </div>
                
                {/* Centered overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="backdrop-blur-sm px-4 py-3 bg-white/70 dark:bg-dark-900/70 rounded-lg border border-gray-200 dark:border-dark-700 text-center">
                        <BanknotesIcon className="h-8 w-8 text-gray-400 dark:text-dark-500 mx-auto mb-2" />
                        <p className="text-lg font-medium text-gray-600 dark:text-dark-200">No Pay Data</p>
                        <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">Payroll data is not available yet.</p>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-700 opacity-30">
                        <div className="flex items-center justify-between mb-3 py-1">
                            <div className="h-3 w-32 bg-gray-200 dark:bg-dark-700 rounded"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3 py-4 h-20">
                                    
                                </div>
                            ))}
                        </div>
                        <div className="h-[15.80rem] bg-gray-100 dark:bg-dark-800 rounded-lg flex items-center justify-center">
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatPayday = (dateStr) => {
        try {
            return format(parseISO(dateStr), 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 rounded-b-lg relative">
            {/* Privacy overlay text - shown when not hovered */}
            <div 
                className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ease-in-out ${isHovered || isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <div className="text-center px-4">
                    <EyeSlashIcon className="h-8 w-8 text-gray-400 dark:text-dark-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600 dark:text-dark-300">Payroll Estimate Hidden</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">Hover to view your pay details</p>
                </div>
            </div>

            {/* Content container - blurred when not hovered */}
            <div className={`transition-all duration-300 ease-in-out ${isHovered || isExpanded ? 'blur-none' : 'blur-[6px]'}`}>
                {/* Main estimate card */}
                <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 pb-2 border border-gray-100 dark:border-dark-700 mb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                                <BanknotesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase tracking-wide">
                                    Estimated Earnings
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-dark-100">
                                    {formatCurrency(payrollData.estimated_pay)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase tracking-wide">
                                Next Payday
                            </p>
                            <p className="text-sm font-semibold text-gray-700 dark:text-dark-200">
                                {formatPayday(payrollData.next_payday)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-700">
                        <div className="flex items-center gap-1.5 text-[11px] text-theme-500 dark:text-theme-600">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                            <span>Estimate before tax & deductions</span>
                        </div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 border border-gray-100 dark:border-dark-700">
                        <div className="flex items-center gap-2 mb-1">
                            <ClockIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase">Hours</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-dark-100">{payrollData.hours_worked}h </p>
                        {payrollData.variable_rate && payrollData.hourly_rates ? (
                            <p className="text-[10px] text-gray-400 dark:text-dark-500">
                                @ {payrollData.hourly_rates.map(r => formatCurrency(r)).join(' - ')}/hr
                            </p>
                        ) : (
                            <p className="text-[10px] text-gray-400 dark:text-dark-500">@ {formatCurrency(payrollData.hourly_rate)}/hr</p>
                        )}
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 border border-gray-100 dark:border-dark-700">
                        <div className="flex items-center gap-2 mb-1">
                            <BanknotesIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase">Base Pay</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-dark-100">{formatCurrency(payrollData.base_pay)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5 border border-gray-100 dark:border-dark-700">
                        <div className="flex items-center gap-2 mb-1">
                            <GiftIcon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500" />
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase">Bonus</p>
                        </div>
                        <p className={`text-lg font-bold ${payrollData.bonus > 0 ? 'text-theme-500 dark:text-theme-600' : 'text-gray-900 dark:text-dark-100'}`}>
                            {formatCurrency(payrollData.bonus)}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Expanded Content - Payroll History Chart */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 flex-1">
                    {/* Header */}
                    <p className="text-[10px] font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide mb-4">
                        Payroll History ({historyStats.monthsCount} months)
                    </p>
                    
                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase mb-1">Avg Net Pay</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-dark-100">{formatCurrency(historyStats.avgNetPay)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase mb-1">Total Earned</p>
                            <p className="text-lg font-bold text-theme-500 dark:text-theme-600">{formatCurrency(historyStats.totalEarned)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 border border-gray-100 dark:border-dark-700">
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 uppercase mb-1">Avg Deductions</p>
                            <p className="text-lg font-bold text-gray-500 dark:text-dark-400">{formatCurrency(historyStats.avgDeductions)}</p>
                        </div>
                    </div>
                    
                    {/* Chart */}
                    {showHistorySkeleton ? (
                        <div className="h-[15.5rem] bg-gray-100 dark:bg-dark-800 rounded-lg flex items-center justify-center animate-pulse"></div>
                    ) : payrollHistory && payrollHistory.length > 0 ? (
                        <div className="h-64">
                            <Bar
                                data={chartData}
                                plugins={[extendLinePlugin]}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    interaction: {
                                        mode: 'index',
                                        intersect: false,
                                    },
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top',
                                            align: 'end',
                                            labels: {
                                                boxWidth: 12,
                                                boxHeight: 12,
                                                usePointStyle: true,
                                                font: { size: 10 },
                                                color: '#9ca3af',
                                                padding: 12
                                            }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                            titleFont: { size: 11, weight: 'bold' },
                                            bodyFont: { size: 10 },
                                            padding: 12,
                                            callbacks: {
                                                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
                                                afterBody: (tooltipItems) => {
                                                    const dataIndex = tooltipItems[0].dataIndex;
                                                    const record = payrollHistory[dataIndex];
                                                    if (!record) return [];
                                                    
                                                    const deductions = [
                                                        { label: 'PAYE Tax', value: parseFloat(record.paye_tax) || 0 },
                                                        { label: 'NI', value: parseFloat(record.employee_nic) || 0 },
                                                        { label: 'Pension', value: parseFloat(record.employee_pension) || 0 },
                                                        { label: 'Student Loan', value: parseFloat(record.student_loan) || 0 },
                                                    ].filter(d => d.value > 0);
                                                    
                                                    if (deductions.length === 0) return [];
                                                    
                                                    return [
                                                        '',
                                                        '── Deductions ──',
                                                        ...deductions.map(d => `${d.label}: ${formatCurrency(d.value)}`)
                                                    ];
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            grid: { display: false },
                                            ticks: {
                                                font: { size: 9 },
                                                color: '#9ca3af',
                                            }
                                        },
                                        y: {
                                            beginAtZero: true,
                                            grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                            ticks: {
                                                font: { size: 10 },
                                                color: '#9ca3af',
                                                callback: (value) => `£${value.toLocaleString()}`
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="h-48 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700 flex items-center justify-center">
                            <div className="text-center">
                                <BanknotesIcon className="h-8 w-8 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-dark-400">No payroll history available</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PayrollWidget;
