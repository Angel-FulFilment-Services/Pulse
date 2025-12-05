import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../Components/Reporting/ReportingStyles.css';
import Header from '../../Components/Employees/Header.jsx';
import Feed from '../../Components/Employees/Feed.jsx';

const Employees = () => {
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Get current URL to determine active tab
    const currentPath = window.location.pathname;

    const tabs = [
        { id: 'all', label: 'All Employees', path: '/employees', current: true },
        { id: 'active', label: 'Active Employees', path: '/employees/active', current: true },
        { id: 'former', label: 'Former Employees', path: '/employees/former', current: true },
        { id: 'onboarding', label: 'Onboarding', path: '/employees/onboarding', current: true },
    ];

    const activeTab = tabs.find((tab) => currentPath.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        router.visit(path);
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
                        setRefreshTrigger={setRefreshTrigger}
                    />
                </div>
            </div>
            <Feed 
                searchTerm={search} 
                activeTab={activeTab} 
                refreshTrigger={refreshTrigger}
            />
        </div>
    );
};

export default Employees;