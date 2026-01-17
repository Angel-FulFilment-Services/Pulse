import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { MegaphoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import useFetchAnnouncements from '../../../Fetches/Dashboard/useFetchAnnouncements.jsx';

// Local storage key for locally dismissed announcements in dashboard
const DISMISSED_ANNOUNCEMENTS_KEY = 'dashboard_dismissed_announcements';

// Get dismissed announcement IDs from local storage
const getDismissedAnnouncementIds = () => {
    try {
        const stored = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Save dismissed announcement ID to local storage
const saveDismissedAnnouncementId = (id) => {
    try {
        const dismissed = getDismissedAnnouncementIds();
        if (!dismissed.includes(id)) {
            dismissed.push(id);
            localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(dismissed));
        }
    } catch {
        // Ignore storage errors
    }
};

const AnnouncementsWidget = ({ isPreview = false, isEditMode = false, widgetId, setWidgetCollapsed }) => {
    // Preview mode - return static dummy content
    if (isPreview) {
        return (
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                        <MegaphoneIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">Sample Announcement</h4>
                        <p className="text-xs text-white/80">This is a preview of an announcement widget</p>
                    </div>
                </div>
            </div>
        );
    }

    const { announcements, isLoading, isLoaded } = useFetchAnnouncements();
    const [locallyDismissed, setLocallyDismissed] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const initialLoadDone = useRef(false);
    
    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    
    // Only show loading skeleton on initial load, not on data refreshes
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);

    // Load locally dismissed announcements on mount
    useEffect(() => {
        setLocallyDismissed(getDismissedAnnouncementIds());
    }, []);

    // Filter out expired and locally dismissed announcements
    const activeAnnouncements = announcements.filter(a => {
        // Check if expired
        if (a.expires_at && new Date(a.expires_at) <= new Date()) return false;
        // Check if locally dismissed
        if (locallyDismissed.includes(a.id)) return false;
        return true;
    });

    // Notify grid about collapsed state based on whether we have content
    useEffect(() => {
        if (isLoaded && setWidgetCollapsed && widgetId) {
            const shouldCollapse = activeAnnouncements.length === 0;
            setWidgetCollapsed(widgetId, shouldCollapse);
        }
    }, [isLoaded, activeAnnouncements.length, setWidgetCollapsed, widgetId]);

    // Reset index when announcements change
    useEffect(() => {
        setCurrentIndex(0);
    }, [activeAnnouncements.length]);

    const formatTime = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return '';
        }
    };

    const handleDismiss = (announcementId) => {
        saveDismissedAnnouncementId(announcementId);
        setLocallyDismissed(prev => [...prev, announcementId]);
        // Adjust index if needed
        if (currentIndex >= activeAnnouncements.length - 1) {
            setCurrentIndex(prev => Math.max(0, prev - 1));
        }
    };

    const handlePrevious = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => Math.min(activeAnnouncements.length - 1, prev + 1));
    };

    // Loading skeleton - simple banner style
    if (showSkeleton) {
        return (
            <div className="h-full w-full flex flex-col animate-pulse">
                <div className="flex-1 bg-theme-50 dark:bg-theme-900/20 border border-theme-200 dark:border-theme-800 rounded-xl px-5 py-4 flex items-center">
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-6 w-6 bg-theme-200 dark:bg-theme-700 rounded"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-48 bg-theme-200 dark:bg-theme-700 rounded"></div>
                            <div className="h-4 w-full max-w-md bg-theme-100 dark:bg-theme-800 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state - render minimal placeholder (invisible unless in edit mode)
    if (activeAnnouncements.length === 0) {
        if (isEditMode) {
            // Show placeholder in edit mode so widget can be managed
            return (
                <div className="h-full w-full flex flex-col">
                    <div className="flex-1 bg-theme-50 dark:bg-theme-900/20 border-2 border-dashed border-theme-200 dark:border-theme-800 rounded-xl px-5 py-4 flex items-center justify-center">
                        <div className="flex items-center gap-3 text-theme-600 dark:text-theme-400">
                            <MegaphoneIcon className="w-6 h-6" />
                            <div>
                                <p className="text-sm font-medium">Announcements</p>
                                <p className="text-xs">No active announcements - hidden when not editing</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        // When not in edit mode and no announcements, render invisible but space-preserving placeholder
        return <div className="h-full w-full" />;
    }

    const safeIndex = Math.min(currentIndex, activeAnnouncements.length - 1);
    const announcement = activeAnnouncements[safeIndex];

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-1 bg-theme-50 dark:bg-theme-900/20 border border-theme-200 dark:border-theme-800 rounded-xl px-5 py-4 flex items-center">
                <div className="flex items-start gap-4 w-full">
                    {/* Megaphone Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                        <MegaphoneIcon className="w-6 h-6 text-theme-700 dark:text-theme-400" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Creator info line */}
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-theme-700 dark:text-theme-400 font-medium mb-1">
                            <span>{announcement.creator?.name || 'Someone'}</span>
                            <span>•</span>
                            <span>{formatTime(announcement.created_at)}</span>
                            {announcement.scope === 'global' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-theme-200 dark:bg-theme-800 text-theme-700 dark:text-theme-300">
                                    <GlobeAltIcon className="w-3.5 h-3.5" />
                                    Global
                                </span>
                            ) : announcement.team?.name && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-theme-200 dark:bg-theme-800 text-theme-700 dark:text-theme-300">
                                    {announcement.team.name}
                                </span>
                            )}
                        </div>
                        
                        {/* Announcement message */}
                        <p className="text-sm text-theme-900 dark:text-theme-100 leading-relaxed">
                            {announcement.message}
                        </p>
                    </div>
                    
                    {/* Navigation & Dismiss */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {/* Navigation for multiple announcements */}
                        {activeAnnouncements.length > 1 && (
                            <div className="flex items-center gap-1 mr-2">
                                <button
                                    onClick={handlePrevious}
                                    disabled={safeIndex === 0}
                                    className="p-1 rounded text-theme-600 dark:text-theme-400 hover:bg-theme-200 dark:hover:bg-theme-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </button>
                                <span className="text-xs text-theme-600 dark:text-theme-400 font-medium min-w-[40px] text-center">
                                    {safeIndex + 1} / {activeAnnouncements.length}
                                </span>
                                <button
                                    onClick={handleNext}
                                    disabled={safeIndex === activeAnnouncements.length - 1}
                                    className="p-1 rounded text-theme-600 dark:text-theme-400 hover:bg-theme-200 dark:hover:bg-theme-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        
                        {/* Dismiss button */}
                        <button
                            onClick={() => handleDismiss(announcement.id)}
                            className="p-1.5 rounded-lg text-theme-500 dark:text-theme-400 hover:bg-theme-200 dark:hover:bg-theme-800 hover:text-theme-700 dark:hover:text-theme-300 transition-colors"
                            title="Dismiss announcement"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsWidget;
