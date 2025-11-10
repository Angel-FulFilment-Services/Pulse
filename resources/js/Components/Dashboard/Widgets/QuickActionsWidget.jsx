import React from 'react';
import ButtonControl from '../../Controls/ButtonControl.jsx';
import { 
    CalendarDaysIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';

const QuickActionsWidget = ({ employee }) => {
    const quickActions = [
        {
            id: 'request-time-off',
            label: 'Request Time Off',
            icon: CalendarDaysIcon,
            color: 'theme'
        },
        {
            id: 'view-payslip',
            label: 'View Latest Payslip',
            icon: DocumentTextIcon,
            color: 'theme'
        },
        {
            id: 'clock-in-out',
            label: 'Clock In/Out',
            icon: ClockIcon,
            color: 'theme'
        },
        {
            id: 'report-issue',
            label: 'Report Issue',
            icon: ExclamationTriangleIcon,
            color: 'theme'
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => {
                        const IconComponent = action.icon;
                        return (
                            <button
                                key={action.id}
                                className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-dark-600 rounded-lg hover:border-theme-300 dark:hover:border-theme-700 hover:bg-theme-50 dark:hover:bg-theme-900/20 transition-colors"
                                onClick={() => console.log('Action clicked:', action.id)}
                            >
                                <IconComponent className="h-6 w-6 text-theme-600 dark:text-theme-400 mb-2" />
                                <span className="text-xs font-medium text-gray-900 dark:text-dark-100 text-center">
                                    {action.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
    );
};

export default QuickActionsWidget;
