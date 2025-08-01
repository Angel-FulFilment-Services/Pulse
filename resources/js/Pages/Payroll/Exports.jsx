import React, { useState, useEffect, useRef } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import payrollReportsConfig from '../../Config/PayrollReportsConfig.jsx';
import PayrollHeader from '../../Components/Payroll/PayrollHeader.jsx';
import ReportingTable from '../../Components/Reporting/ReportingTable.jsx';
import FilterControl from '../../Components/Controls/FilterControl.jsx';
import '../../Components/Reporting/ReportingStyles.css';
import {exportTableToExcel} from '../../Utils/Exports.jsx'
import { toast } from 'react-toastify';
import axios from 'axios';

const Payroll = ({ tabs, handleTabClick, activeTab }) => {
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [lastUpdated, setLastUpdated] = useState(null);
    const [report, setReport] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [targets, setTargets] = useState([]);
    const [filters, setFilters] = useState([]);
    const [reportError, setReportError] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reports, setReports] = useState(
        payrollReportsConfig.map((report) => ({
            id: report.id,
            value: report.id,
            displayValue: report.label,
        })).sort((a, b) => a.displayValue.localeCompare(b.displayValue))
    );
    const pollingIntervalRef = useRef(null);
    const hasChangesRef = useRef(false);
    const tableRef = useRef(null);
    const abortControllerRef = useRef(null);

    const handleTabChange = (path) => {
        setReport([]);
        setReportData([]);
        setReportError(false);
        setDateRange({ startDate: null, endDate: null });
        handleTabClick(path);
    };

    const handleReportChange = (report) => {
        setReportData([]);
        setReportError(false);
        setReport(payrollReportsConfig.find((r) => r.id === report.value));
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
        // Abort any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // Create a new controller for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const reports = await report.generate({ dateRange, report }, controller);
            const reportData = reports.data;
            if(updateTargets) {
                generateTargets(reports.targets);
            }
            setLastUpdated(new Date());
            setReportData(reportData);
            setReportError(false);
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                // Request was aborted, do not set error state
                return;
            }
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

        return () => stopPolling();
    }, [report]);

    useEffect(() => {

        const handleRegenerate = () => {
            if (report && ((dateRange.startDate && dateRange.endDate) || (!report.parameters.date && !report.parameters.dateRange))) {
                setReportError(false);
                
                if (report && report.parameters && report.parameters.dateRange) {
                    generateReport({ startDate: dateRange.startDate, endDate: dateRange.endDate }, report, false);
                }

                if(report && report.parameters && (!report.parameters.date && !report.parameters.dateRange)) {
                    setDateRange({ startDate: null, endDate: null });
                    generateReport({ startDate: null, endDate: null }, report);
                }
            }
        };

        window.addEventListener('regenerate-report', handleRegenerate);

        return () => window.removeEventListener('regenerate-report', handleRegenerate);
    }, [report, dateRange])

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (Object.values(report).length && ((dateRange.startDate && dateRange.endDate) || (!report.parameters.date && !report.parameters.dateRange))) {
            if (report.parameters.polling) {
                startPolling(report.parameters.polling);
            } else {
                stopPolling(); // Stop polling if the new report doesn't have polling
            }
        }
    }, [dateRange])

    return (
        <>
            <div id="reporting_header" className="z-30">
                <div className="z-30">
                    <PayrollHeader
                        dateRange={dateRange}
                        tabs={tabs}
                        activeTab={activeTab}
                        handleTabClick={handleTabChange}
                        handleDateChange={handleDateChange}
                        reports={reports}
                        report={report}
                        handleReportChange={handleReportChange}
                        handleReportToExcel={() => {
                            const filename = `${report.label} - ${new Date(dateRange.startDate).toLocaleDateString('en-GB')} - ${new Date(dateRange.endDate).toLocaleDateString('en-GB')} .xlsx`
                            report.toExcel ? 
                                report.toExcel(reportData, filename, dateRange.startDate, dateRange.endDate) 
                                : exportTableToExcel(tableRef.current, filename)}}
                        handleReportRegenerate={regenerateReport}
                        handleTogglePolling={togglePolling}
                        handleReportEdit={toggleEditing}
                        isPolling={isPolling}
                        isEditing={isEditing}
                        isGenerating={isGenerating}
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50 mt-2">Export Failed To Generate</h1>
                    <p className="mt-2 text-gray-500 dark:text-dark-500">Please select another export or try again.</p>
                </div>
            ) : !Object.values(report).length ? (
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50">No Export Selected</h1>
                    <p className="mt-4 text-gray-500 dark:text-dark-500">Select a export from the dropdown above to view.</p>
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
                    <ReportingTable parameters={{ ...report.parameters, structure: undefined, filters: undefined, date: undefined, dateRange: undefined }} structure={report.parameters.structure} filters={filters} data={reportData} targets={targets} editing={isEditing} handleTargetChange={handleTargetChange} setReportData={setReportData} dateRange={dateRange}/>
                </div>
            )}
        </>
    );
};

export default Payroll;