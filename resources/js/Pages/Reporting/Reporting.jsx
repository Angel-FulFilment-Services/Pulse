import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import rotaReportsConfig from '../../Config/RotaReportsConfig.jsx';

import ReportingHeader from '../../Components/Reporting/ReportingHeader.jsx';
import ReportingTable from '../../Components/Reporting/ReportingTable.jsx';
import FilterControl from '../../Components/Controls/FilterControl';
import '../../Components/Reporting/ReportingStyles.css'

const Reporting = () => {
    const [dateRange, setDateRange ] = useState({
        startDate: null, 
        endDate: null
    });
    const [reports, setReports] = useState([]);
    const [report, setReport] = useState([]);
    const [reportData, setReportData] = useState([]);  
    const [filters, setFilters] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'rota', label: 'Rota', path: '/reporting/rota', current: true },
    ];

    // Determine the active tab based on the current URL
    const activeTab = tabs.find((tab) => location.pathname.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        navigate(path);
    };

    const handleReportChange = (report) => {
        setReport(rotaReportsConfig.find((r) => r.id === report.value));
    };

    const handleDateChange = (item) => {   
        setDateRange({startDate: item[0].value, endDate: item[1].value});
        if(Object.values(report).length) {
            setReportData([]);
            generateReport({ startDate: item[0].value, endDate: item[1].value }, report);
        }
    }

    const generateReport = async (dateRange, report) => {        
        try {
          const reportData = await report.generate({ dateRange, report });
          setReportData(reportData);
        } catch (error) {
          console.error('Error generating report:', error);
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

    const clearFilters = () => {
        const updatedFilters = filters.map((section) => ({
            ...section,
            options: section.options.map((option) => ({ ...option, checked: false })),
        }));
        setFilters(updatedFilters);
    };

    useEffect(() => {
        setReportData([]);

        if(report && report.parameters && report.parameters.dateRange && report.parameters.dateRange.default) {
            const { startDate, endDate } = report.parameters.dateRange.default;
            setDateRange({
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            });
            
            generateReport({ startDate, endDate }, report);
        }
    }, [report]);

    useEffect(() => {
        if (report && report.parameters && report.parameters.filters) {
            const calculatedFilters = report.parameters.filters.map((filter) => ({
                ...filter,
                options: filter.calculateOptions ? filter.calculateOptions(reportData) : filter.options,
            }));

          setFilters(calculatedFilters);
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
                <ReportingHeader dateRange={dateRange} tabs={tabs} activeTab={activeTab} handleTabClick={handleTabClick} handleDateChange={handleDateChange} reports={reports} report={report} handleReportChange={handleReportChange} />
            </div>
            { report && report.parameters && report.parameters.filters && report.parameters.filters.length > 0 &&
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 shadow-sm slide-down z-20">
                    <FilterControl filters={filters} onFilterChange={handleFilterChange} clearFilters={clearFilters} />
                </div>
            }
            {!Object.values(report).length ? (
                // No report selected
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <h1 className="text-2xl font-bold text-gray-900">No Report Selected</h1>
                    <p className="mt-4 text-gray-500">Select a report from the dropdown above to view.</p>
                </div>
            ) : Object.values(report).length && (dateRange.startDate === null || dateRange.endDate === null) ? (
                // Report selected but no data
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <h1 className="text-2xl font-bold text-gray-900">No Date Selected</h1>
                    <p className="mt-4 text-gray-500">Select a date from the date selector above to view.</p>
                </div>
            ) : reportData && reportData.length === 0 ? (
                // Report selected but no data
                <div className="flex flex-col items-center justify-center py-56 w-full">
                    <div className="flex gap-3 justify-center">
                    <div className="w-5 h-5 bg-gray-300 rounded-full animate-loader"></div>
                    <div className="w-5 h-5 bg-gray-300 rounded-full animate-loader animation-delay-200"></div>
                    <div className="w-5 h-5 bg-gray-300 rounded-full animate-loader animation-delay-[400ms]"></div>
                    </div>
                </div>
            ) : (
                // Report data loaded
                <div className="px-6 py-2 h-full">
                    <ReportingTable structure={report.parameters.structure} filters={filters} data={reportData} />
                </div>
            )}
        </div>
    );
}

export default Reporting