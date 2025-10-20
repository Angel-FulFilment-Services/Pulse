import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../Components/Reporting/ReportingStyles.css';
import Header from '../../Components/Administration/Header.jsx';
import Feed from '../../Components/Administration/Feed.jsx';

const Reporting = () => {
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Get current URL to determine active tab
    const currentPath = window.location.pathname;

    const tabs = [
        { id: 'free_gifts', label: 'Free Gifts', path: '/administration/free-gifts', current: true },
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

export default Reporting;