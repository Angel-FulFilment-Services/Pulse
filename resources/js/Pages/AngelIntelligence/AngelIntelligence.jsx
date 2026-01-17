import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import '../../Components/Reporting/ReportingStyles.css';
import Header from '../../Components/AngelIntelligence/Header.jsx';
import { hasPermission } from '../../Utils/Permissions.jsx';

const AngelIntelligence = () => {
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Get current URL to determine active tab
    const currentPath = window.location.pathname;

    const allTabs = [
        { id: 'call_quality', label: 'Call Quality', path: '/ai-analytics/call-quality', current: true, permission: null },
    ];

    // Filter tabs based on user permissions
    const tabs = useMemo(() => 
        allTabs.filter(tab => !tab.permission || hasPermission(tab.permission)),
    []);

    const activeTab = tabs.find((tab) => currentPath.includes(tab.id.replace('_', '-')))?.id || tabs[0]?.id;

    const handleTabClick = (path) => {
        router.visit(path);
    };

    const renderFeed = () => {
        switch (activeTab) {
            case 'call_quality':
                return (
                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-dark-400">
                        <div className="text-center">
                            <p className="text-lg font-medium">Call Quality Analytics</p>
                            <p className="text-sm mt-1">Coming soon...</p>
                        </div>
                    </div>
                );
            default:
                return (<></>);
        }
    };

    return (
        <div className="w-full flex flex-col h-dvh bg-white dark:bg-dark-900">
            <div id="angel_intelligence_header" className="z-30">
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

export default AngelIntelligence;
