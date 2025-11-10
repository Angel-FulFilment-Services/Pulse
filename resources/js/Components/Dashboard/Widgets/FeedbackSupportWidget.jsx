import React from 'react';
import { 
    ChatBubbleLeftRightIcon, 
    WrenchScrewdriverIcon, 
    UserGroupIcon,
    ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/outline';

const FeedbackSupportWidget = ({ employee }) => {
    const supportOptions = [
        {
            id: 1,
            title: 'Submit Feedback',
            description: 'Share your thoughts and suggestions',
            icon: ChatBubbleLeftRightIcon,
            action: 'feedback',
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
        },
        {
            id: 2,
            title: 'IT Support',
            description: 'Technical issues and requests',
            icon: WrenchScrewdriverIcon,
            action: 'it-support',
            color: 'text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40'
        },
        {
            id: 3,
            title: 'HR Enquiries',
            description: 'Questions about policies and procedures',
            icon: UserGroupIcon,
            action: 'hr-enquiry',
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40'
        }
    ];

    const handleSupportAction = (action) => {
        console.log('Support action:', action);
        // This will later connect to actual support systems
    };

    return (
        <div className="space-y-3">
                {supportOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                        <button
                            key={option.id}
                            onClick={() => handleSupportAction(option.action)}
                            className={`w-full text-left p-3 rounded-lg border-2 border-dashed border-transparent transition-all ${option.color}`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium">
                                        {option.title}
                                    </h4>
                                    <p className="text-xs opacity-75">
                                        {option.description}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4 opacity-50" />
                                </div>
                            </div>
                        </button>
                    );
                })}

                {/* Quick stats */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">2</p>
                            <p className="text-xs text-gray-500 dark:text-dark-400">Open Tickets</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">4.8</p>
                            <p className="text-xs text-gray-500 dark:text-dark-400">Avg Response Time (hrs)</p>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default FeedbackSupportWidget;
