import React from 'react';

const DashboardCard = ({ 
    title, 
    children, 
    className = '', 
    headerAction = null,
    isLoading = false 
}) => {
    return (
        <div className={`bg-white dark:bg-dark-900 shadow-sm ring-1 ring-gray-200 dark:ring-dark-700 rounded-lg overflow-hidden ${className}`}>
            {title && (
                <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-dark-100">
                            {title}
                        </h3>
                        {headerAction && (
                            <div className="flex-shrink-0">
                                {headerAction}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="p-4">
                {isLoading ? (
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/2"></div>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default DashboardCard;
