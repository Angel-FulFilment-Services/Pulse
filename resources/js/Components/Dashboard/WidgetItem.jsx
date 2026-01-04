import React from 'react';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, LockClosedIcon as LockClosedIconSolid } from '@heroicons/react/24/solid';

const WidgetItem = ({ 
    title, 
    headerAction, 
    children, 
    className = "",
    onExpand,
    isExpanded = false,
    canExpand = true,
    canRefresh = false,
    onRefresh,
    onLock,
    isLocked = false,
    dragEnabled = true,
    ...props 
}) => {
    return (
        <div 
            className={`bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-700 h-full flex flex-col ${className}`}
            {...props}
        >
            {/* Header */}
            <div className={`px-6 py-4 rounded-t-2xl border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 flex-shrink-0 drag-handle ${!dragEnabled ? 'cursor-default' : isLocked ? 'cursor-not-allowed' : 'cursor-move'}`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-dark-100 flex-1">
                        {title}
                    </h3>
                    <div className="flex items-center flex-shrink-0 divide-x divide-gray-200 dark:divide-dark-700">
                        {dragEnabled && onLock && !isExpanded && (
                            <div className="px-1">
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLock();
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                                    aria-label={isLocked ? "Unlock widget" : "Lock widget"}
                                    title={isLocked ? "Unlock" : "Lock"}
                                >
                                    {isLocked ? (
                                        <LockClosedIconSolid className="h-5 w-5 text-theme-400 dark:text-theme-500" />
                                    ) : (
                                        <LockOpenIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />
                                    )}
                                </button>
                            </div>
                        )}
                        {canExpand && onExpand && (
                            <div className="px-1">
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onExpand();
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                                    aria-label={isExpanded ? "Collapse widget" : "Expand widget"}
                                    title={isExpanded ? "Collapse" : "Expand"}
                                >
                                    {isExpanded ? (
                                        <ArrowsPointingInIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />
                                    ) : (
                                        <ArrowsPointingOutIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />
                                    )}
                                </button>
                        </div>
                        )}
                        {canRefresh && (
                            <div className="px-1">
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRefresh();
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                                    aria-label="Refresh widget"
                                    title="Refresh"
                                >
                                    <ArrowPathIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />
                                </button>
                        </div>
                        )}
                        <div className="px-1">
                            {headerAction && (
                                <div className="flex-shrink-0 p-1.5">
                                    {headerAction}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Content */}
            <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default WidgetItem;