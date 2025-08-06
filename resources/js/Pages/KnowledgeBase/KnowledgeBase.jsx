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
        setArticle([]);
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
            <Feed searchTerm={search} />
        </div>
    );
};

export default Reporting;