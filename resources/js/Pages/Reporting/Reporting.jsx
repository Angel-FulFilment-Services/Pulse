import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import rotaReportsConfig from '../../Config/RotaReportsConfig.jsx';
import ReportingHeader from '../../Components/Reporting/ReportingHeader.jsx';
import ReportingTable from '../../Components/Reporting/ReportingTable.jsx';
import FilterControl from '../../Components/Controls/FilterControl.jsx';
import '../../Components/Reporting/ReportingStyles.css';
import {exportTableToExcel} from '../../Utils/Exports.jsx'

const Reporting = () => {
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [lastUpdated, setLastUpdated] = useState(null);
    const [reports, setReports] = useState([]);
    const [report, setReport] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [filters, setFilters] = useState([]);
    const [reportError, setReportError] = useState(false);
    const [pollingDisabled, setPollingDisabled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const pollingIntervalRef = useRef(null);
    const tableRef = useRef(null);

    const tabs = [
        { id: 'rota', label: 'Rota', path: '/reporting/rota', current: true },
    ];

    const activeTab = tabs.find((tab) => location.pathname.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        navigate(path);
    };

    const handleReportChange = (report) => {
        setReportError(false);
        setReport(rotaReportsConfig.find((r) => r.id === report.value));
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

    const regenerateReport = () => {
        setReportData([]);
        setReportError(false);
        if (Object.values(report).length && dateRange.startDate && dateRange.endDate) {
            generateReport({ startDate: dateRange.startDate, endDate: dateRange.endDate }, report);
        }
    };

    const generateReport = async (dateRange, report) => {
        try {
            const reportData = await report.generate({ dateRange, report });
            setLastUpdated(new Date());
            setReportData(reportData);
            setReportError(false);
        } catch (error) {
            console.error('Error generating report:', error);
            setReportError(true);
        }
    };

    const startPolling = (interval) => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current); // Clear any existing interval
        }

        pollingIntervalRef.current = setInterval(() => {
            if (Object.values(report).length && dateRange.startDate && dateRange.endDate) {
                setReportError(false);
                generateReport({ startDate: dateRange.startDate, endDate: dateRange.endDate }, report);
            }
        }, interval);
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const clearFilters = () => {
        const updatedFilters = filters.map((section) => ({
            ...section,
            options: section.options.map((option) => ({ ...option, checked: false })),
        }));
        setFilters(updatedFilters);
    };

    useEffect(() => {
        setReportData([]);
        setReportError(false);
        setFilters([]);

        if (report && report.parameters && report.parameters.dateRange && report.parameters.dateRange.default) {
            const { startDate, endDate } = report.parameters.dateRange.default;
            setDateRange({
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            });

            generateReport({ startDate, endDate }, report);
        }

        return () => stopPolling(); // Cleanup polling on component unmount or report change
    }, [report]);


    useEffect(() => {
        if (Object.values(report).length && dateRange.startDate && dateRange.endDate) {
            if (report.parameters.polling) {
                startPolling(report.parameters.polling);
            } else {
                stopPolling(); // Stop polling if the new report doesn't have polling
            }
        }
    }, [dateRange])

    useEffect(() => {
        if (report && report.parameters && report.parameters.filters) {
            if (!filters.some((filter) => filter.options.some((option) => option.checked))) {
                const calculatedFilters = report.parameters.filters.map((filter) => ({
                    ...filter,
                    options: filter.calculateOptions ? filter.calculateOptions(reportData) : filter.options,
                }));

                setFilters(calculatedFilters);
            }
        }
    }, [report, reportData]);

    useEffect(() => {
        switch (activeTab) {
            case 'rota':
                setReports(
                    rotaReportsConfig.map((report) => ({
                        id: report.id,
                        value: report.id,
                        displayValue: report.label,
                    }))
                );
                break;
            default:
                setReports([]);
                break;
        }
    }, [activeTab]);

    return (
        <div className="w-full flex flex-col h-screen bg-white">
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
                    handleTogglePolling={setPollingDisabled}
                    isPolling={pollingIntervalRef.current !== null}
                    isPollingDisabled={pollingDisabled}
                    lastUpdated={lastUpdated}
                />
            </div>
            { report && report.parameters && report.parameters.filters && report.parameters.filters.length > 0 &&
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 shadow-sm slide-down z-20">
                     <FilterControl filters={filters} onFilterChange={handleFilterChange} clearFilters={clearFilters} />
                 </div>
             }
            {reportError ? (
                <div className="flex flex-col items-center justify-center py-56 -my-14 w-full">
                    <ExclamationCircleIcon className="w-12 h-12 text-red-500" />
                    <h1 className="text-2xl font-bold text-gray-900 mt-2">Report Failed To Generate</h1>
                    <p className="mt-2 text-gray-500">Please select another report or try again.</p>
                </div>
            ) : !Object.values(report).length ? (
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <h1 className="text-2xl font-bold text-gray-900">No Report Selected</h1>
                    <p className="mt-4 text-gray-500">Select a report from the dropdown above to view.</p>
                </div>
            ) : Object.values(report).length && (dateRange.startDate === null || dateRange.endDate === null) ? (
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <h1 className="text-2xl font-bold text-gray-900">No Date Selected</h1>
                    <p className="mt-4 text-gray-500">Select a date from the date selector above to view.</p>
                </div>
            ) : reportData && reportData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <div className="flex gap-3 justify-center">
                        <div className="w-5 h-5 bg-gray-300 rounded-full animate-loader"></div>
                        <div className="w-5 h-5 bg-gray-300 rounded-full animate-loader animation-delay-200"></div>
                        <div className="w-5 h-5 bg-gray-300 rounded-full animate-loader animation-delay-[400ms]"></div>
                    </div>
                </div>
            ) : (
                <div ref={tableRef} className="px-6 py-2 h-full">
                    <ReportingTable parameters={{ ...report.parameters, structure: undefined, filters: undefined, date: undefined, dateRange: undefined }}  structure={report.parameters.structure} filters={filters} data={reportData} />
                </div>
            )}
        </div>
    );
};

export default Reporting;