import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Badge from '../../../Badges/Badge.jsx';
import useFetchBadges from '../../../Fetches/Dashboard/useFetchBadges.jsx';
import SelectControl from '../../../Controls/SelectControl.jsx';
import { TrophyIcon } from '@heroicons/react/24/outline';

// Transition delay when expanding/collapsing (ms)
const TRANSITION_DELAY = 1000;

const BadgesWidget = React.memo(({ employee, isExpanded, onToggleExpand, onRefresh, onRefreshStateChange, isPreview = false }) => {
    // Preview mode - return static dummy content
    if (isPreview) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-theme-100 text-theme-700 dark:bg-theme-900/30 dark:text-theme-400 rounded-lg">All</span>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-dark-800 dark:text-dark-300 rounded-lg">Obtained</span>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-square bg-gradient-to-br from-theme-100 to-theme-50 dark:from-theme-900/30 dark:to-theme-900/10 rounded-lg flex items-center justify-center border border-theme-200 dark:border-theme-800">
                            <TrophyIcon className="h-8 w-8 text-theme-400 dark:text-theme-600" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const [triggerFlip, setTriggerFlip] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [filter, setFilter] = useState('all'); // all, obtained, in-progress, locked
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState({ id: 'default', value: 'default', displayValue: 'Sort: Default' });
    const [processedNewBadges, setProcessedNewBadges] = useState(new Set());
    const [isTransitioning, setIsTransitioning] = useState(false); // Show loading during expand/collapse
    const transitionTimeoutRef = useRef(null);
    const BADGES_PER_PAGE = 30;
    
    // Fetch badges from API
    const { badges, statistics, isLoading, isLoaded, markBadgeAsViewed } = useFetchBadges();
    const initialLoadDone = useRef(false);
    
    // Track if we've done the initial load
    if (isLoaded && !initialLoadDone.current) {
        initialLoadDone.current = true;
    }
    
    // Only show loading skeleton on initial load, not on data refreshes
    const showSkeleton = !initialLoadDone.current && (isLoading || !isLoaded);

    // Listen for dark mode changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkMode(document.documentElement.classList.contains('dark'));
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // Show loading state during expand/collapse transition
    useEffect(() => {
        // Clear any pending timeout
        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
        }
        
        // Start transition
        setIsTransitioning(true);
        
        // End transition after delay
        transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(false);
        }, TRANSITION_DELAY);
        
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, [isExpanded]);

    useEffect(() => {
        setSortBy({ id: 'default', value: 'default', displayValue: 'Default' });
        setFilter('all');
        setSearchQuery('');
        setCurrentPage(1);
    }, [isExpanded]);
    
    // Mark new badges as viewed when they appear
    useEffect(() => {
        if (badges && markBadgeAsViewed) {
            const newBadges = badges.filter(badge => badge.isNew && !processedNewBadges.has(badge.id));
            
            if (newBadges.length > 0) {
                // Mark these badges as processed immediately
                setProcessedNewBadges(prev => {
                    const updated = new Set(prev);
                    newBadges.forEach(badge => updated.add(badge.id));
                    return updated;
                });

                // Flip first badge immediately, then stagger the rest
                newBadges.forEach((badge, index) => {
                    // Subsequent badges are staggered
                    setTimeout(() => {
                        setTriggerFlip(badge.id);
                        setTimeout(() => setTriggerFlip(null), 2000);
                        markBadgeAsViewed(badge.id);
                    }, index * 2100);
                });
            }
        }
    }, [badges, markBadgeAsViewed, processedNewBadges]);
    
    // Sorting options
    const sortOptions = [
        { id: 'default', value: 'default', displayValue: 'Default' },
        { id: 'rarity', value: 'rarity', displayValue: 'Rarity' },
        { id: 'alphabetical', value: 'alphabetical', displayValue: 'A-Z' },
        { id: 'points', value: 'points', displayValue: 'Points' },
        { id: 'category', value: 'category', displayValue: 'Category' },
    ];

    // Sort badges based on selected sort option
    const sortedBadges = [...(badges || [])].sort((a, b) => {
        const aIsLocked = a.prerequisite_badge && !a.prerequisite_badge.is_earned;
        const bIsLocked = b.prerequisite_badge && !b.prerequisite_badge.is_earned;
        
        // Apply custom sorting
        if (sortBy.value === 'rarity') {
            // Tier order: alexandrite > diamond > sapphire > ruby > emerald > platinum > gold > silver > bronze > basic
            const tierOrder = {
                'alexandrite': 10,
                'diamond': 9,
                'sapphire': 8,
                'ruby': 7,
                'emerald': 6,
                'platinum': 5,
                'gold': 4,
                'silver': 3,
                'bronze': 2,
                'basic': 1
            };
            const aTier = tierOrder[a.tier] || 0;
            const bTier = tierOrder[b.tier] || 0;
            return bTier - aTier;
        }
        
        if (sortBy.value === 'alphabetical') {
            return a.name.localeCompare(b.name);
        }
        
        if (sortBy.value === 'points') {
            return (b.points || 0) - (a.points || 0);
        }
        
        if (sortBy.value === 'category') {
            const categoryCompare = a.category.localeCompare(b.category);
            if (categoryCompare !== 0) return categoryCompare;
            // Within same category, sort by earned status
            if (a.is_earned && !b.is_earned) return -1;
            if (!a.is_earned && b.is_earned) return 1;
            return 0;
        }
        
        // Default sorting
        // Locked badges go to the end
        if (aIsLocked && !bIsLocked) return 1;
        if (!aIsLocked && bIsLocked) return -1;
        
        // If both are earned, sort by awarded_at (latest first)
        if (a.is_earned && b.is_earned) {
            return new Date(b.awarded_at) - new Date(a.awarded_at);
        }
        
        // If both are unearned (not locked), sort by completion percentage (highest first)
        if (!a.is_earned && !b.is_earned && !aIsLocked && !bIsLocked) {
            const aProgress = a.progress?.percentage || 0;
            const bProgress = b.progress?.percentage || 0;
            return bProgress - aProgress;
        }
        
        // Earned badges come before unearned
        if (a.is_earned && !b.is_earned) return -1;
        if (!a.is_earned && b.is_earned) return 1;
        
        return 0;
    });

    const handleBadgeClick = (badge) => {
        // Trigger the flip animation
        setTriggerFlip(badge.id);
        setTimeout(() => setTriggerFlip(null), 2000); // Reset after animation
    };
    
    // Filter badges based on selected filter and search query
    const filteredBadges = sortedBadges.filter(badge => {
        // Apply category filter
        let matchesFilter = false;
        if (filter === 'all') matchesFilter = true;
        else if (filter === 'obtained') matchesFilter = badge.is_earned === true;
        else if (filter === 'in-progress') {
            const isLocked = badge.prerequisite_badge && !badge.prerequisite_badge.is_earned;
            matchesFilter = badge.is_earned === false && !isLocked;
        }
        else if (filter === 'locked') {
            const isLocked = badge.prerequisite_badge && !badge.prerequisite_badge.is_earned;
            matchesFilter = isLocked;
        }
        
        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                badge.name.toLowerCase().includes(query) ||
                (badge.description && badge.description.toLowerCase().includes(query)) ||
                (badge.category && badge.category.toLowerCase().includes(query));
            return matchesFilter && matchesSearch;
        }
        
        return matchesFilter;
    });
    
    // Reset to page 1 when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery]);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredBadges.length / BADGES_PER_PAGE);
    const startIndex = (currentPage - 1) * BADGES_PER_PAGE;
    const endIndex = startIndex + BADGES_PER_PAGE;
    const paginatedBadges = isExpanded 
        ? filteredBadges.slice(startIndex, endIndex)
        : filteredBadges.slice(0, 9); // Show only 9 in collapsed view
    
    // Calculate empty slots to fill the page
    const emptySlots = isExpanded ? BADGES_PER_PAGE - paginatedBadges.length : 0;
    
    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };
    
    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    // Always render all badges, but control visibility with CSS
    return (
        <div className="h-full flex flex-col">
            {/* Add shimmer animation styles */}
            <style>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
            
            {/* Filter buttons and search - only show when expanded */}
            {isExpanded && (
                <div className="flex justify-between items-center gap-4 flex-shrink-0 border-b pb-4 border-gray-200 dark:border-dark-700">
                    <div className="flex gap-2 h-9">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-nowrap ${
                                filter === 'all'
                                    ? 'bg-theme-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('obtained')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-nowrap ${
                                filter === 'obtained'
                                    ? 'bg-theme-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                            }`}
                        >
                            Acquired
                        </button>
                        <button
                            onClick={() => setFilter('in-progress')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-nowrap ${
                                filter === 'in-progress'
                                ? 'bg-theme-500 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                        }`}
                        >
                        In Progress
                        </button>
                        <button
                            onClick={() => setFilter('locked')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-nowrap ${
                                filter === 'locked'
                                    ? 'bg-theme-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                            }`}
                        >
                            Locked
                        </button>
                    </div>
                    
                    {/* Sort and Search on the right */}
                    <div className="flex items-center gap-2 divide-x divide-gray-300 dark:divide-dark-600">
                        {/* Sort dropdown */}
                        <div className="flex-grow flex items-center justify-center">
                            <p className="relative cursor-pointer py-1 pl-3 dark:text-dark-200 text-sm transition-colors block text-nowrap text-center text-gray-500 font-semibold mb-0.5">Sort by:</p>
                            <SelectControl
                                id="badge-sort"
                                items={sortOptions}
                                onSelectChange={(selected) => setSortBy(selected.value ? sortOptions.find(opt => opt.value === selected.value) : sortOptions[0])}
                                defaultSelected={sortBy}
                                width="w-full"
                                opaque={true}
                            />
                        </div>
                        
                        {/* Search box */}
                        <div className="w-64 pl-4">
                            <input
                                type="text"
                                placeholder="Search badges..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Loading state - skeleton badges (also shown during expand/collapse transition) */}
            {showSkeleton || isTransitioning ? (
                <div className={`grid ${isExpanded ? 'grid-cols-5 pt-6 mt-3' : 'grid-cols-3'} gap-4 flex-1 overflow-y-visible`}>
                    {Array.from({ length: isExpanded ? BADGES_PER_PAGE : 9 }).map((_, index) => (
                        <div 
                            key={`skeleton-${index}`}
                            className="flex flex-col items-center space-y-2"
                        >
                            <div className="relative w-20 h-20 overflow-hidden rounded-3xl">
                                {/* Skeleton badge cavity with shimmer */}
                                <div
                                    className="absolute rounded-3xl bg-gray-100 dark:bg-dark-800"
                                    style={{
                                        top: 0,
                                        left: 0,
                                        width: '80px',
                                        height: '80px',
                                        zIndex: 0,
                                    }}
                                >
                                    {/* Circular hole for broach pin */}
                                    <div
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-gray-300 dark:bg-dark-700"
                                    />
                                    
                                    {/* Shimmer overlay */}
                                    <div 
                                        className="absolute inset-0 overflow-hidden w-44 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:from-transparent dark:via-white/10 dark:to-transparent"
                                        style={{
                                            animation: 'shimmer 2s infinite',
                                        }}
                                    />
                                </div>
                            </div>
                            
                            {/* Skeleton badge info */}
                            <div className="text-center space-y-1 w-full animate-pulse">
                                <div className="h-4 bg-gray-300 dark:bg-dark-700 rounded mx-auto" style={{ width: '60px' }}></div>
                                <div className="h-3 bg-gray-200 dark:bg-dark-800 rounded mx-auto" style={{ width: '40px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Badges content */}
            {!showSkeleton && !isTransitioning && (
                <>
                    <div 
                        className={`grid ${isExpanded ? 'grid-cols-5 pt-6 mt-3' : 'grid-cols-3'} gap-4 flex-1 overflow-y-visible`}
                    >
                        {paginatedBadges.map((badge, index) => (
                            <div 
                                key={badge.id} 
                                className={`flex flex-col items-center space-y-2 transition-transform duration-300`}
                            >
                                <div className="relative w-20 h-20">
                                    {/* Inset seat/cavity for badge - stays in place */}
                                    <div
                                        className="absolute rounded-3xl bg-gradient-to-br from-gray-200 to-gray-100 dark:from-dark-800 dark:to-dark-700 border border-black/10 dark:border-dark-900/5"
                                        style={{
                                            top: 0,
                                            left: 0,
                                            width: '80px',
                                            height: '80px',
                                            boxShadow: isDarkMode 
                                                ? `
                                                    inset 1.5px 1.5px 4px rgba(0, 0, 0, 0.5),
                                                    inset -1.5px -1.5px 4px rgba(255, 255, 255, 0.05),
                                                    inset 3px 3px 7px rgba(0, 0, 0, 0.4)
                                                `
                                                : `
                                                    inset 1.5px 1.5px 4px rgba(0, 0, 0, 0.15),
                                                    inset -1.5px -1.5px 4px rgba(255, 255, 255, 0.6),
                                                    inset 3px 3px 7px rgba(0, 0, 0, 0.1)
                                                `,
                                            zIndex: 0,
                                        }}
                                    >
                                        {/* Circular hole for broach pin */}
                                        <div
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-600 dark:to-dark-700"
                                            style={{
                                                boxShadow: isDarkMode
                                                    ? `
                                                        inset 2px 2px 4px rgba(0, 0, 0, 0.6),
                                                        inset -1px -1px 3px rgba(255, 255, 255, 0.05)
                                                    `
                                                    : `
                                                        inset 2px 2px 4px rgba(0, 0, 0, 0.3),
                                                        inset -1px -1px 3px rgba(255, 255, 255, 0.3)
                                                    `,
                                            }}
                                        />
                                    </div>
                                    <Badge 
                                        badge={badge} 
                                        index={index}
                                        shouldFlip={triggerFlip === badge.id}
                                        onBadgeClick={() => handleBadgeClick(badge)}
                                        onToggleExpand={onToggleExpand}
                                        isExpanded={isExpanded}
                                        isNew={processedNewBadges.has(badge.id)}
                                    />
                                </div>
                                
                                {/* Badge info */}
                                <div className="text-center">
                                    {isExpanded && (
                                        <p className="text-xs font-medium text-gray-700 dark:text-dark-200 truncate max-w-sm">
                                            {badge.name.charAt(0).toUpperCase() + badge.name.slice(1).replace('_', ' ')}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-dark-400">
                                        {new Date(badge.awarded_at).toLocaleDateString('en-GB', { 
                                            day: 'numeric', 
                                            month: 'short' 
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        
                        {/* Empty cavities to fill the page */}
                        {Array.from({ length: emptySlots }).map((_, index) => (
                            <div 
                                key={`empty-${index}`}
                                className="flex flex-col items-center space-y-2"
                            >
                                <div className="relative w-20 h-20">
                                    {/* Empty inset seat/cavity */}
                                    <div
                                        className="absolute rounded-3xl bg-gradient-to-br from-gray-200 to-gray-100 dark:from-dark-800 dark:to-dark-700 border border-black/10 dark:border-dark-900/5"
                                        style={{
                                            top: 0,
                                            left: 0,
                                            width: '80px',
                                            height: '80px',
                                            boxShadow: isDarkMode 
                                                ? `
                                                    inset 1.5px 1.5px 4px rgba(0, 0, 0, 0.5),
                                                    inset -1.5px -1.5px 4px rgba(255, 255, 255, 0.05),
                                                    inset 3px 3px 7px rgba(0, 0, 0, 0.4)
                                                `
                                                : `
                                                    inset 1.5px 1.5px 4px rgba(0, 0, 0, 0.15),
                                                    inset -1.5px -1.5px 4px rgba(255, 255, 255, 0.6),
                                                    inset 3px 3px 7px rgba(0, 0, 0, 0.1)
                                                `,
                                            zIndex: 0,
                                        }}
                                    >
                                        {/* Circular hole for broach pin */}
                                        <div
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-600 dark:to-dark-700"
                                            style={{
                                                boxShadow: isDarkMode
                                                    ? `
                                                        inset 2px 2px 4px rgba(0, 0, 0, 0.6),
                                                        inset -1px -1px 3px rgba(255, 255, 255, 0.05)
                                                    `
                                                    : `
                                                        inset 2px 2px 4px rgba(0, 0, 0, 0.3),
                                                        inset -1px -1px 3px rgba(255, 255, 255, 0.3)
                                                    `,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="h-8">
                                    <p className="text-xs font-medium text-gray-400 dark:text-dark-500 italic">
                                        Empty Slot
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Pagination controls - only show when expanded and there are multiple pages */}
            {isExpanded && (
                <div className="flex items-center justify-between mt-7 pt-4 border-t border-gray-200 dark:border-dark-700 flex-shrink-0">
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1 || totalPages === 0}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === 1 || totalPages === 0
                                ? 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500 cursor-not-allowed'
                                : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-200 hover:bg-gray-300 dark:hover:bg-dark-600'
                        }`}
                    >
                        ← Previous
                    </button>
                    
                    <span className="text-sm text-gray-600 dark:text-dark-200">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === totalPages || totalPages === 0
                                ? 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500 cursor-not-allowed'
                                : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-200 hover:bg-gray-300 dark:hover:bg-dark-600'
                        }`}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
});

BadgesWidget.displayName = 'BadgesWidget';

export default BadgesWidget;
