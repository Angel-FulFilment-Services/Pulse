import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import rotaReportsConfig from '../../Config/RotaReportsConfig.jsx';
import assetsReportsConfig from '../../Config/AssetsReportsConfig.jsx';
import systemReportsConfig from '../../Config/SystemReportsConfig.jsx';
import siteReportsConfig from '../../Config/SiteReportsConfig.jsx';
import ReportingHeader from '../../Components/Reporting/ReportingHeader.jsx';
import ReportingTable from '../../Components/Reporting/ReportingTable.jsx';
import FilterControl from '../../Components/Controls/FilterControl.jsx';
import '../../Components/Reporting/ReportingStyles.css';
import {exportTableToExcel} from '../../Utils/Exports.jsx'
import { toast } from 'react-toastify';
import axios from 'axios';
import { set } from 'date-fns';

const Reporting = () => {
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [lastUpdated, setLastUpdated] = useState(null);
    const [reports, setReports] = useState([]);
    const [report, setReport] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [targets, setTargets] = useState([]);
    const [filters, setFilters] = useState([]);
    const [reportError, setReportError] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const pollingIntervalRef = useRef(null);
    const hasChangesRef = useRef(false);
    const tableRef = useRef(null);

    const tabs = [
        { id: 'rota', label: 'Rota', path: '/reporting/rota', current: true },
        { id: 'assets', label: 'Assets', path: '/reporting/assets', current: false },
        { id: 'system', label: 'System', path: '/reporting/system', current: false },
        { id: 'site', label: 'Site', path: '/reporting/site', current: false },
    ];

    const activeTab = tabs.find((tab) => location.pathname.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        setReport([]);
        setReportData([]);
        setReportError(false);
        setDateRange({ startDate: null, endDate: null });
        navigate(path);
    };

    const handleReportChange = (report) => {
        setReportData([]);
        setReportError(false);

        switch (activeTab) {
            case 'rota':
                setReport(rotaReportsConfig.find((r) => r.id === report.value));
                break;
            case 'assets':
                setReport(assetsReportsConfig.find((r) => r.id === report.value));
                break;
            case 'system':
                setReport(systemReportsConfig.find((r) => r.id === report.value));
                break;
            case 'site':
                setReport(siteReportsConfig.find((r) => r.id === report.value));
                break;
            default:
                setReport([]);
                break;
        }
    };

    const handleDateChange = (item) => {
        setReportData([]);
        setReportError(false);
        setDateRange({ startDate: item[0].value, endDate: item[1].value });
        if (Object.values(report).length && item[0].value && item[1].value) {
            generateReport({ startDate: item[0].value, endDate: item[1].value }, report);
        }
    };

    const handleFilterChange = (filter) => {
        const updatedFilters = filters.map((section) => {
            if (section.id === filter.id) {
            return {
                ...section,
                options: section.options.map((option) =>
                option.value === filter.value ? { ...option, checked: filter.checked } : option
                ),
            };
            }
            return section;
        });
        setFilters(updatedFilters);
    }

    const handleTargetChange = (target) => {

        const updatedTargets = targets.map((t) => {
            if (t.id === target.id) {
                // Update the specific key in the target property
                if(target.key == "targetDirection"){
                    return {
                        ...t,
                        targetDirection: target.target, // Update the targetDirection directly
                    };
                }

                if(target.key == "high" || target.key == "low"){
                    return {
                        ...t,
                        target: {
                            ...t.target,
                            [target.key]: target.target, // Dynamically update the key (e.g., "high" or "low")
                        },
                    };
                }
            }
            return t; // Return the target unchanged if no match
        });
        
        const hasChanges = JSON.stringify(updatedTargets) !== JSON.stringify(targets);
        if (hasChanges) {
            hasChangesRef.current = true; // Update the ref value
        }

        setTargets(updatedTargets); // Update the state with the modified targets
    }

    const regenerateReport = () => {
        if (isGenerating) {
            toast.info('Report generation is already in progress. Please wait...', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
            return;
        }
        setReportData([]);
        setReportError(false);
        if (Object.values(report).length && ((dateRange.startDate && dateRange.endDate) || (!report.parameters.date && !report.parameters.dateRange))) {
            generateReport({ startDate: dateRange.startDate, endDate: dateRange.endDate }, report, false);
        }
    };

    const generateReport = async (dateRange, report, updateTargets = true) => {
        setIsGenerating(true);
        try {
            const reports = await report.generate({ dateRange, report });
            const reportData = reports.data;
            if(updateTargets) {
                generateTargets(reports.targets);
            }
            setLastUpdated(new Date());
            setReportData(reportData);
            setReportError(false);
        } catch (error) {
            console.error('Error generating report:', error);
            setReportError(true);
        }
        setIsGenerating(false);
    };

    const generateTargets = (targets) => {
        if (report && report.parameters && report.parameters.structure) {
            const newTargets = report.parameters.structure.map((structure) => {
                // Find a matching target in the targets array
                const matchingTarget = targets ? targets.find((target) => target.id === structure.id) : null;
    
                return {
                    id: structure.id,
                    target: matchingTarget ? matchingTarget.target : structure.target,
                    targetDirection: structure.targetDirection,
                };
            });
    
            setTargets(newTargets);
        }
    };

    const startPolling = (interval) => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current); // Clear any existing interval
        }

        pollingIntervalRef.current = setInterval(() => {
            if (isGenerating) {
                return;
            }
            if (Object.values(report).length && ((dateRange.startDate && dateRange.endDate) || (!report.parameters.date && !report.parameters.dateRange))) {
                setReportError(false);
                generateReport({ startDate: dateRange.startDate, endDate: dateRange.endDate }, report, false);
            }
        }, interval);

        setIsPolling(true);
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setIsPolling(false);
        }
    };

    const togglePolling = () => {
        if (isPolling) {
            stopPolling();
        } else {
            startPolling(report.parameters.polling);
        }
    }

    const toggleEditing = async () => {
        if (isEditing) {
            // If exiting editing mode and there are changes, save the targets
            if (hasChangesRef.current) {
                try {
                    const response = await axios.post('/reporting/reports/targets/set', { targets: targets, report: report });
                    if (response.status === 200) {
                        toast.success('Targets updated successfully!', {
                            position: 'top-center',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: false,
                            draggable: true,
                            progress: undefined,
                            theme: 'light',
                        });
                        hasChangesRef.current = false;
                    } else {
                        toast.error('Failed to update targets. Please try again.', {
                            position: 'top-center',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: false,
                            draggable: true,
                            progress: undefined,
                            theme: 'light',
                        });
                    }
                } catch (error) {
                    console.error('Error updating targets:', error);
                    toast.error('An error occurred while updating targets.', {
                        position: 'top-center',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: true,
                        progress: undefined,
                        theme: 'light',
                    });
                }
            }
        }

        setIsEditing(!isEditing);
    }

    const clearFilters = () => {
        const updatedFilters = filters.map((section) => {
            if (section.id === "include") {
                return section;
            }
    
            return {
                ...section,
                options: section.options.map((option) => ({ ...option, checked: false })),
            };
        });
        setFilters(updatedFilters);
    };

    useEffect(() => {
        if (Object.values(report).length && ((dateRange.startDate && dateRange.endDate) || (!report.parameters.date && !report.parameters.dateRange))) {
            if (report.parameters.polling) {
                startPolling(report.parameters.polling);
            } else {
                stopPolling(); // Stop polling if the new report doesn't have polling
            }
        }
    }, [dateRange])

    useEffect(() => {
        if (report && report.parameters && report.parameters.filters) {
            const updatedFilters = report.parameters.filters.map((filter) => {
                const existingFilter = filters.find((f) => f.id === filter.id);
    
                // Calculate new options if a calculateOptions function exists
                const newOptions = filter.calculateOptions
                    ? filter.calculateOptions(reportData)
                    : filter.options;

                // Merge new options with existing options
                const mergedOptions = newOptions.map((newOption) => {
                    const existingOption = existingFilter?.options.find((opt) => opt.value === newOption.value);
                    return {
                        ...newOption,
                        checked: existingOption ? existingOption.checked : newOption.checked || false, // Preserve `checked` state
                    };
                });
    
                // Include any existing options that are not in the new options
                const additionalOptions = existingFilter?.options.filter(
                    (existingOption) => !newOptions.some((newOption) => newOption.value === existingOption.value)
                ) || [];
    
                return {
                    ...filter,
                    options: [...mergedOptions, ...additionalOptions], // Combine merged and additional options
                };
            });
    
            setFilters(updatedFilters);
        }
    }, [report, reportData]);

    useEffect(() => {
        setFilters([]);
        setReportData([]);
        setReportError(false);

        if (report && report.parameters && report.parameters.dateRange && report.parameters.dateRange.default) {
            const { startDate, endDate } = report.parameters.dateRange.default;
            setDateRange({
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            });

            generateReport({ startDate, endDate }, report);
        }
        
        if(report && report.parameters && (!report.parameters.date && !report.parameters.dateRange)) {
            setDateRange({ startDate: null, endDate: null });
            generateReport({ startDate: null, endDate: null }, report);
        }

        return () => stopPolling(); // Cleanup polling on component unmount or report change
    }, [report]);

    useEffect(() => {
        switch (activeTab) {
            case 'rota':
                setReports(
                    rotaReportsConfig.map((report) => ({
                        id: report.id,
                        value: report.id,
                        displayValue: report.label,
                    })).sort((a, b) => a.displayValue.localeCompare(b.displayValue))
                );
                break;
            case 'assets':
                setReports(
                    assetsReportsConfig.map((report) => ({
                        id: report.id,
                        value: report.id,
                        displayValue: report.label,
                    })).sort((a, b) => a.displayValue.localeCompare(b.displayValue))
                );
                break;
            case 'system':
                setReports(
                    systemReportsConfig.map((report) => ({
                        id: report.id,
                        value: report.id,
                        displayValue: report.label,
                    })).sort((a, b) => a.displayValue.localeCompare(b.displayValue))
                );
                break;
            case 'site':
                setReports(
                    siteReportsConfig.map((report) => ({
                        id: report.id,
                        value: report.id,
                        displayValue: report.label,
                    })).sort((a, b) => a.displayValue.localeCompare(b.displayValue))
                );
                break;
            default:
                setReports([]);
                break;
        }
    }, [activeTab]);

    return (
        <div className="w-full flex flex-col h-screen bg-white dark:bg-dark-900">
            <div id="reporting_header" className="z-30">
                <div className="z-30">
                    <ReportingHeader
                        dateRange={dateRange}
                        tabs={tabs}
                        activeTab={activeTab}
                        handleTabClick={handleTabClick}
                        handleDateChange={handleDateChange}
                        reports={reports}
                        report={report}
                        handleReportChange={handleReportChange}
                        handleReportToExcel={() => exportTableToExcel(tableRef.current, `${report.label} - ${new Date(dateRange.startDate).toLocaleDateString('en-GB')} - ${new Date(dateRange.endDate).toLocaleDateString('en-GB')} .xlsx`)}
                        handleReportRegenerate={regenerateReport}
                        handleTogglePolling={togglePolling}
                        handleReportEdit={toggleEditing}
                        isPolling={isPolling}
                        isEditing={isEditing}
                        lastUpdated={lastUpdated}
                    />
                </div>
                { report && report.parameters && report.parameters.filters && report.parameters.filters.length > 0 &&
                    <div className={`px-6 py-4 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 shadow-sm slide-down z-20 ${isGenerating ? 'pointer-events-none' : ''}`}>
                        <FilterControl filters={filters} onFilterChange={handleFilterChange} clearFilters={clearFilters} />
                    </div>
                }
            </div>
            {reportError ? (
                <div className="flex flex-col items-center justify-center py-56 -my-14 w-full">
                    <ExclamationCircleIcon className="w-12 h-12 text-red-500 dark:text-red-600" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50 mt-2">Report Failed To Generate</h1>
                    <p className="mt-2 text-gray-500 dark:text-dark-500">Please select another report or try again.</p>
                </div>
            ) : !Object.values(report).length ? (
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50">No Report Selected</h1>
                    <p className="mt-4 text-gray-500 dark:text-dark-500">Select a report from the dropdown above to view.</p>
                </div>
            ) : Object.values(report).length && (dateRange.startDate === null || dateRange.endDate === null) && (report.parameters.date || report.parameters.dateRange) ? (
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50">No Date Selected</h1>
                    <p className="mt-4 text-gray-500 dark:text-dark-500">Select a date from the date selector above to view.</p>
                </div>
            ) : reportData && reportData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <div className="flex gap-3 justify-center">
                        <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader"></div>
                        <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader animation-delay-200"></div>
                        <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader animation-delay-[400ms]"></div>
                    </div>
                </div>
            ) : (
                <div ref={tableRef} className="px-6 py-2 h-full">
                    <ReportingTable parameters={{ ...report.parameters, structure: undefined, filters: undefined, date: undefined, dateRange: undefined }} structure={report.parameters.structure} filters={filters} data={reportData} targets={targets} editing={isEditing} handleTargetChange={handleTargetChange}  dateRange={dateRange}/>
                </div>
            )}
        </div>
    );
};

export default Reporting;