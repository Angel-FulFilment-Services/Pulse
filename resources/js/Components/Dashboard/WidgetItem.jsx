import React from 'react';

const WidgetItem = ({ 
    title, 
    headerAction, 
    children, 
    className = "",
    ...props 
}) => {
    return (
        <div 
            className={`bg-white dark:bg-dark-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-700 h-full ${className}`}
            {...props}
        >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                        {title}
                    </h3>
                    {headerAction && (
                        <div className="flex-shrink-0">
                            {headerAction}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-hidden flex-1">
                {children}
            </div>
        </div>
    );
};

export default WidgetItem;