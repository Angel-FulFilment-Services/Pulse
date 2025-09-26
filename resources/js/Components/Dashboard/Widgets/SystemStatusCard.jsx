import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import { 
    ExclamationTriangleIcon, 
    CheckCircleIcon,
    InformationCircleIcon 
} from '@heroicons/react/24/outline';

const SystemStatusCard = ({ employee }) => {
    // Mock system status data
    const alerts = [
        {
            type: 'info',
            message: 'System maintenance scheduled for Sunday 2AM',
            icon: InformationCircleIcon,
            color: 'blue'
        }
    ];

    const systemStatus = 'operational'; // operational, warning, error

    const getStatusConfig = () => {
        switch (systemStatus) {
            case 'operational':
                return {
                    icon: CheckCircleIcon,
                    color: 'green',
                    text: 'All Systems Operational',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    textColor: 'text-green-800 dark:text-green-200'
                };
            case 'warning':
                return {
                    icon: ExclamationTriangleIcon,
                    color: 'yellow',
                    text: 'Minor Issues Detected',
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                    textColor: 'text-yellow-800 dark:text-yellow-200'
                };
            case 'error':
                return {
                    icon: ExclamationTriangleIcon,
                    color: 'red',
                    text: 'System Issues',
                    bgColor: 'bg-red-50 dark:bg-red-900/20',
                    textColor: 'text-red-800 dark:text-red-200'
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    return (
        <DashboardCard title="System Status">
            <div className="space-y-3">
                {/* System Status */}
                <div className={`flex items-center space-x-2 p-2 rounded-lg ${statusConfig.bgColor}`}>
                    <StatusIcon className={`h-4 w-4 text-${statusConfig.color}-600`} />
                    <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                        {statusConfig.text}
                    </span>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div className="space-y-2">
                        {alerts.map((alert, index) => {
                            const AlertIcon = alert.icon;
                            return (
                                <div key={index} className="flex items-start space-x-2">
                                    <AlertIcon className={`h-4 w-4 text-${alert.color}-500 mt-0.5 flex-shrink-0`} />
                                    <p className="text-xs text-gray-600 dark:text-dark-300">
                                        {alert.message}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardCard>
    );
};

export default SystemStatusCard;
