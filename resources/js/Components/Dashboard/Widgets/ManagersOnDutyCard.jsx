import React, { useMemo, useRef } from 'react';
import { ChatBubbleLeftEllipsisIcon, UserIcon as UserIconOutline } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import useFetchManagersOnDuty from '../../Fetches/Dashboard/useFetchManagersOnDuty.jsx';
import UserIcon from '../../User/UserIcon.jsx';
import ScrollHint from '../../Hints/ScrollHint';

const MIN_DISPLAY_COUNT = 4; // Always show at least 4 cards

const ManagersOnDutyCard = ({ employee, isExpanded }) => {
    const { managers, isLoading, isLoaded } = useFetchManagersOnDuty();
    const scrollRef = useRef(null);
    const initialLoadDone = useRef(false);
    
    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    
    // Only show loading skeleton on initial load, not on data refreshes
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);
    
    // Show all managers when expanded, only clocked in when collapsed
    // Use useMemo to prevent recalculation on every render
    const managersOnDuty = useMemo(() => {
        if (isExpanded) {
            return managers;
        }
        return managers.filter(m => m.is_clocked_in || m.is_online);
    }, [isExpanded, managers]);
        
    // Calculate how many empty slots we need
    const emptySlots = Math.max(0, MIN_DISPLAY_COUNT - managersOnDuty.length);

    const getStatusColor = (manager) => {
        if (manager.is_online) return 'bg-green-500 dark:bg-green-600';
        if (manager.is_clocked_in) return 'bg-yellow-500 dark:bg-yellow-600';
        return 'bg-gray-300 dark:bg-gray-400';
    };
    
    const getStatusText = (manager) => {
        if (manager.is_online) return 'Online';
        if (manager.is_clocked_in) return 'Away';
        return 'Offline';
    };
    
    const getRoleLabel = (rank) => {
        switch (rank) {
            case 'TM': return 'Team Manager';
            case 'DM': return 'Duty Manager';
            default: return 'Manager';
        }
    };
    
    const handleMessageClick = (manager) => {
        // Navigate to chat with the manager as a DM using correct URL format
        router.visit(`/chat?type=dm&id=${manager.user_id}`);
    };
    
    // Loading skeleton
    if (showSkeleton) {
        return (
            <div className="space-y-2.5 animate-pulse">
                
                {( !isExpanded ? [1, 2, 3 ,4] : [1, 2, 3, 4, 5, 6, 7]).map((i) => (
                    <div key={i} className="border border-gray-200 dark:border-dark-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-dark-700"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-dark-700 rounded"></div>
                                <div className="h-3 w-16 bg-gray-100 dark:bg-dark-800 rounded"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
            {/* Managers List - scrollable */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2.5">
                {managersOnDuty.map((manager) => (
                    <div 
                        key={manager.hr_id} 
                        className="border border-gray-200 dark:border-dark-700 rounded-lg p-3 py-3.5 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {/* Profile */}
                            <div className="relative flex-shrink-0">
                                <UserIcon size="medium" profilePhoto={manager.profile_photo} />
                                <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${getStatusColor(manager)} ring-2 ring-white dark:ring-dark-900`}></div>
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                                        {manager.name}
                                    </h4>
                                    <span className="text-xs text-gray-500 dark:text-dark-400">
                                        • {getStatusText(manager)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                                    {getRoleLabel(manager.rank)}
                                </p>
                            </div>
                            
                            {/* Message Button */}
                            <button 
                                onClick={() => handleMessageClick(manager)}
                                className="flex-shrink-0 flex items-center gap-1.5 bg-theme-50 hover:bg-theme-100 dark:bg-theme-900/20 dark:hover:bg-theme-900/40 text-theme-600 dark:text-theme-400 rounded-lg px-3 py-1.5 transition-colors border border-theme-200 dark:border-theme-800"
                            >
                                <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                                <span className="text-xs font-medium">Message</span>
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Empty placeholder slots */}
                {emptySlots > 0 && Array.from({ length: emptySlots }).map((_, index) => (
                    <div 
                        key={`empty-${index}`} 
                        className="border border-dashed border-gray-200 bg-gray-50/50 dark:bg-dark-800/50 dark:border-dark-700 rounded-lg p-4"
                    >
                        <div className="flex items-center gap-3">
                            {/* Empty Profile */}
                            <div className="relative flex-shrink-0">
                                <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center">
                                    
                                </div>
                            </div>
                            
                            {/* Empty Info */}
                            <div className="flex-1 min-w-0">
                                <div className="h-4 w-24 bg-gray-100 dark:bg-dark-800 rounded"></div>
                                <div className="h-3 w-16 bg-gray-100 dark:bg-dark-800 rounded mt-1.5"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Scroll hint */}
            <ScrollHint scrollRef={scrollRef} basic={false} />
        </div>
    );
};

export default ManagersOnDutyCard;