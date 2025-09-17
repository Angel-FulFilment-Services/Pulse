import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import '../../Components/Reporting/ReportingStyles.css';
import Header from '../../Components/KnowledgeBase/Header.jsx';
import Feed from '../../Components/KnowledgeBase/Feed.jsx';

const Reporting = () => {
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Get current URL to determine active tab
    const currentPath = window.location.pathname;

    const tabs = [
        { id: 'technical-support', label: 'Technical Support', path: '/knowledge-base/technical-support', current: true },
        { id: 'call-hub', label: 'Call Hub', path: '/knowledge-base/call-hub', current: true },
    ];

    const activeTab = tabs.find((tab) => currentPath.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        router.visit(path);
    };

    const handlePostCreated = (newPost) => {
        // Trigger refresh of the feed
        setRefreshTrigger(prev => prev + 1);
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
                        onPostCreated={handlePostCreated}
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