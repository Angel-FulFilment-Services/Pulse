import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import '../../Components/Reporting/ReportingStyles.css';
import Header from '../../Components/KnowledgeBase/Header.jsx';
import Feed from '../../Components/KnowledgeBase/Feed.jsx';

const Reporting = () => {
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'technical_support', label: 'Technical Support', path: '/reporting/rota', current: true },
    ];

    const activeTab = tabs.find((tab) => location.pathname.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        setReport([]);
        setReportData([]);
        setReportError(false);
        setDateRange({ startDate: null, endDate: null });
        navigate(path);
    };

    useEffect(() => {
        switch (activeTab) {
            case 'rota':
                break;
            case 'assets':
                break;
            case 'system':
                break;
            case 'site':
                break;
            default:
                break;
        }
    }, [activeTab]);

    return (
        <div className="w-full flex flex-col h-screen bg-white dark:bg-dark-900">
            <div id="reporting_header" className="z-30">
                <div className="z-30">
                    <Header
                        tabs={tabs}
                        activeTab={activeTab}
                        handleTabClick={handleTabClick}
                        search={search}
                        setSearch={setSearch}
                    />
                </div>
            </div>
            {/* <div className="flex flex-col items-center justify-center py-56 -my-14 w-full">
                <ExclamationCircleIcon className="w-12 h-12 text-red-500 dark:text-red-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50 mt-2">Report Failed To Generate</h1>
                <p className="mt-2 text-gray-500 dark:text-dark-500">Please select another report or try again.</p>
            </div> */}

            <Feed />
        </div>
    );
};

export default Reporting;