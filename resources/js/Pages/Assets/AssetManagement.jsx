import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../Components/Reporting/ReportingStyles.css';
import Kits from './Kits.jsx';

const AssetManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'kits', label: 'Kits', path: '/asset-management/kits', current: true },
        { id: 'assets', label: 'Assets', path: '/asset-management/assets', current: true },
        { id: 'pat', label: 'PAT Testing', path: '/asset-management/pat-testing', current: false },
        { id: 'knowledge', label: 'Knowledge Base', path: '/asset-management/knowledge-tree', current: false },
    ];

    const activeTab = tabs.find((tab) => location.pathname.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        navigate(path);
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'kits':
                return <Kits tabs={tabs} handleTabClick={handleTabClick} activeTab={activeTab}/>;
            case 'assets':
                // return <Assets tabs={tabs} handleTabClick={handleTabClick} activeTab={activeTab}/>;
            case 'pat':
                // return <PAT tabs={tabs} handleTabClick={handleTabClick} activeTab={activeTab}/>;
            case 'knowledge':
                // return <Knowledge tabs={tabs} handleTabClick={handleTabClick} activeTab={activeTab}/>;
            default:
                // return <Kits tabs={tabs} handleTabClick={handleTabClick} activeTab={activeTab} />;
        }
    };

    return (
        <div className="w-full flex flex-col h-screen bg-white dark:bg-dark-900">
            <div className="flex flex-col w-full h-full">
                {renderTab()}
            </div>
        </div>
    );
};

export default AssetManagement;