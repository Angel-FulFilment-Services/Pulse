import React from 'react';
import { ChatBubbleLeftEllipsisIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const ManagersOnDutyCard = ({ employee }) => {
    // Mock data for managers on duty
    const managersOnDuty = [
        {
            id: 1,
            name: 'Sarah Johnson',
            role: 'Team Manager',
            isActive: true,
            profilePhoto: null,
            status: 'Available',
            responseTime: '~2 min'
        },
        {
            id: 2,
            name: 'Mike Chen',
            role: 'Shift Supervisor',
            isActive: true,
            profilePhoto: null,
            status: 'In Meeting',
            responseTime: '~10 min'
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return 'bg-green-500';
            case 'In Meeting': return 'bg-yellow-500';
            case 'Busy': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-theme-200 dark:border-dark-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Header with gradient accent */}
            <div className="bg-gradient-to-r from-theme-500 to-theme-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <UserGroupIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">On Duty</h3>
                            <p className="text-theme-100 text-sm">{managersOnDuty.length} managers available</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <ShieldCheckIcon className="h-4 w-4 text-theme-100" />
                        <span className="text-sm font-medium text-white">Protected</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3">
                {/* Managers List */}
                {managersOnDuty.map((manager, index) => (
                    <div key={manager.id} className="bg-theme-50 dark:bg-dark-800 rounded-xl p-4 border border-theme-100 dark:border-dark-700 hover:bg-theme-100 dark:hover:bg-dark-700 transition-all duration-200">
                        <div className="flex items-center space-x-4">
                            {/* Profile */}
                            <div className="relative flex-shrink-0">
                                <div className="h-12 w-12 rounded-full bg-theme-200 dark:bg-dark-700 border-2 border-theme-300 dark:border-dark-600 flex items-center justify-center">
                                    <span className="text-sm font-bold text-theme-700 dark:text-theme-300">
                                        {manager.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full ${getStatusColor(manager.status)} ring-2 ring-white dark:ring-dark-900`}></div>
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                                        {manager.name}
                                    </h4>
                                    <span className="text-xs text-theme-600 dark:text-theme-400 bg-theme-200 dark:bg-dark-700 px-2 py-1 rounded-full">
                                        {manager.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-dark-300 mt-1">
                                    {manager.role}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500 dark:text-dark-400">
                                        Response: {manager.responseTime}
                                    </span>
                                    <button className="flex items-center space-x-1 bg-theme-200 hover:bg-theme-300 dark:bg-dark-700 dark:hover:bg-dark-600 rounded-lg px-3 py-1.5 transition-all duration-200 border border-theme-300 dark:border-dark-600">
                                        <ChatBubbleLeftEllipsisIcon className="h-3 w-3 text-theme-700 dark:text-theme-300" />
                                        <span className="text-xs font-medium text-theme-700 dark:text-theme-300">Message</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Quick Action */}
                <div className="pt-2 border-t border-theme-200 dark:border-dark-700">
                    <button className="w-full bg-theme-100 hover:bg-theme-200 dark:bg-dark-800 dark:hover:bg-dark-700 rounded-lg py-3 px-4 transition-all duration-200 border border-theme-200 dark:border-dark-700 hover:border-theme-300 dark:hover:border-dark-600">
                        <div className="flex items-center justify-center space-x-2">
                            <UserGroupIcon className="h-4 w-4 text-theme-700 dark:text-theme-300" />
                            <span className="text-sm font-medium text-theme-700 dark:text-theme-300">View All Staff</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagersOnDutyCard;