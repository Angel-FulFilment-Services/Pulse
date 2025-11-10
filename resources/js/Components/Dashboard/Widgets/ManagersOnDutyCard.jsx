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
        <div className="space-y-4">
                {/* Managers List */}
                {managersOnDuty.map((manager, index) => (
                    <div key={manager.id} className="border border-gray-200 dark:border-dark-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center space-x-4">
                            {/* Profile */}
                            <div className="relative flex-shrink-0">
                                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-dark-700 border-2 border-gray-200 dark:border-dark-600 flex items-center justify-center">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
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
                                    <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded-full">
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
                                    <button className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 rounded-lg px-3 py-1.5 transition-all duration-200 border border-gray-200 dark:border-dark-600">
                                        <ChatBubbleLeftEllipsisIcon className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Message</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Quick Action */}
                <div className="pt-2 border-t border-gray-200 dark:border-dark-700">
                    <button className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-dark-800 dark:hover:bg-dark-700 rounded-lg py-3 px-4 transition-all duration-200 border border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600">
                        <div className="flex items-center justify-center space-x-2">
                            <UserGroupIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View All Staff</span>
                        </div>
                    </button>
                </div>
            </div>
    );
};

export default ManagersOnDutyCard;