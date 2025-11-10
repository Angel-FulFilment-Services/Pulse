import React from 'react';
import { CubeIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const EquipmentStatusWidget = ({ employee }) => {
    const equipment = [
        {
            id: 1,
            name: 'Laptop - Dell XPS 13',
            assetId: 'LAP-001',
            status: 'good',
            lastChecked: '2025-09-20',
            returnDate: null
        },
        {
            id: 2,
            name: 'Mobile Phone - iPhone 14',
            assetId: 'MOB-045',
            status: 'good',
            lastChecked: '2025-09-15',
            returnDate: null
        },
        {
            id: 3,
            name: 'Headset - Sony WH-1000XM4',
            assetId: 'AUD-012',
            status: 'issue',
            lastChecked: '2025-09-10',
            returnDate: '2025-09-30',
            issue: 'Microphone not working properly'
        }
    ];

    const getStatusIcon = (status) => {
        if (status === 'good') {
            return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
        }
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
    };

    const getStatusColor = (status) => {
        if (status === 'good') {
            return 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300';
        }
        return 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300';
    };

    return (
        <div className="space-y-4">
                {equipment.map((item) => (
                    <div key={item.id} className="border border-gray-200 dark:border-dark-700 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    {getStatusIcon(item.status)}
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100">
                                        {item.name}
                                    </h4>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-dark-400 mb-2">
                                    Asset ID: {item.assetId}
                                </p>
                                {item.issue && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                                        Issue: {item.issue}
                                    </p>
                                )}
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.status}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-400">
                            <span>Last checked: {new Date(item.lastChecked).toLocaleDateString()}</span>
                            {item.returnDate && (
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                    Return by: {new Date(item.returnDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                ))})
            </div>
    );
};

export default EquipmentStatusWidget;
