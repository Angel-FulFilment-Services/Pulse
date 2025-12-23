import React, { useState, useEffect, useRef, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../Components/Reporting/ReportingStyles.css';
import Header from '../../Components/Administration/Header.jsx';
import Feed from '../../Components/Administration/Feed.jsx';
import RestrictedWordsFeed from '../../Components/Administration/RestrictedWordsFeed.jsx';
import { hasPermission } from '../../Utils/Permissions.jsx';

const Reporting = () => {
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Get current URL to determine active tab
    const currentPath = window.location.pathname;

    const allTabs = [
        { id: 'free_gifts', label: 'Free Gifts', path: '/administration/free-gifts', current: true, permission: 'pulse_view_free_gifts' },
        { id: 'restricted_words', label: 'Restricted Words', path: '/administration/restricted-words', current: false, permission: 'pulse_manage_restricted_words' },
    ];

    // Filter tabs based on user permissions
    const tabs = useMemo(() => 
        allTabs.filter(tab => !tab.permission || hasPermission(tab.permission)),
    []);

    const activeTab = tabs.find((tab) => currentPath.includes(tab.id.replace('_', '-')))?.id || tabs[0]?.id;

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

    const renderFeed = () => {
        switch (activeTab) {
            case 'restricted_words':
                return (
                    <RestrictedWordsFeed
                        searchTerm={search}
                        refreshTrigger={refreshTrigger}
                        setRefreshTrigger={setRefreshTrigger}
                    />
                );
            case 'free_gifts':
                return (
                    <Feed 
                        searchTerm={search} 
                        activeTab={activeTab} 
                        refreshTrigger={refreshTrigger}
                    />
                );
            default:
                return (<></>);
        }
    };

    return (
        <div className="w-full flex flex-col h-dvh bg-white dark:bg-dark-900">
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
            {renderFeed()}
        </div>
    );
};

export default Reporting;