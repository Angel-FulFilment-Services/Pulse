import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../Components/Reporting/ReportingStyles.css';
import Exports from './Exports';

const Payroll = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'exports', label: 'Exports', path: '/payroll/exports', current: true }
    ];

    const activeTab = tabs.find((tab) => location.pathname.includes(tab.id))?.id || tabs[0].id;

    const handleTabClick = (path) => {
        navigate(path);
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'exports':
                return <Exports tabs={tabs} handleTabClick={handleTabClick} activeTab={activeTab}/>;
            default:
                return <Exports tabs={tabs} handleTabClick={handleTabClick} activeTab={activeTab} />;
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

export default Payroll;