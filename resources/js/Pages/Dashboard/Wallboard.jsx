import React, { useState, useEffect } from 'react';
import { getWallboardList, getWallboard } from '../../Config/Wallboards';
import { PauseIcon, PlayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { hasPermission } from '../../Utils/Permissions.jsx';

/**
 * IFrame Component - Reusable iframe wrapper
 */
const IFrame = ({ source, title, refreshKey }) => {
    return (
        <iframe 
            key={refreshKey}
            src={source}
            className="w-full h-full border-0"
            title={title || 'Display'}
        />
    );
};

/**
 * Picture-in-Picture Overlay Component
 * Displays a semi-transparent overlay on top of any layout
 */
const PictureInPictureOverlay = ({ pip, refreshKey }) => {
    if (!pip || !pip.source) return null;
    
    // Position mapping
    const positionClasses = {
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'top-right': 'top-4 right-4',
        'center-left': 'top-1/2 left-4 -translate-y-1/2',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'center-right': 'top-1/2 right-4 -translate-y-1/2',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
    };
    
    const position = positionClasses[pip.position] || positionClasses['bottom-right'];
    const width = pip.width || 'w-96';
    const height = pip.height || 'h-56';
    const opacity = pip.opacity || 'opacity-75';
    const scale = pip.scale || 1;
    
    return (
        <div 
            className={`fixed ${position} ${width} ${height} z-30 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
        >
            <div className={`${opacity} overflow-hidden`} style={{ width: '100%', height: '100%' }}>
                <div style={{ 
                    width: `${100 / scale}%`, 
                    height: `${100 / scale}%`, 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top left' 
                }}>
                    <IFrame source={pip?.source} title={pip?.title} refreshKey={refreshKey} />
                </div>
            </div>
        </div>
    );
};

/**
 * Layout Components
 */

// Single full-screen tile
const LayoutSingle = ({ sources, refreshKey }) => {
    const source = sources[0];
    return (
        <div className="w-full h-full">
            <IFrame source={source?.source} title={source?.title} refreshKey={refreshKey} />
        </div>
    );
};

// 65% / 35% vertical split
const LayoutSplitVertical6535 = ({ sources, refreshKey }) => {
    const tile1 = sources.find(s => s.tile_id === 1) || sources[0];
    const tile2 = sources.find(s => s.tile_id === 2) || sources[1];
    
    return (
        <div className="flex h-full w-full">
            <div className="w-[65%] h-full">
                <IFrame source={tile1?.source} title={tile1?.title} refreshKey={refreshKey} />
            </div>
            <div className="w-[35%] h-full">
                <IFrame source={tile2?.source} title={tile2?.title} refreshKey={refreshKey} />
            </div>
        </div>
    );
};

// 50% / 50% vertical split
const LayoutSplitVertical5050 = ({ sources, refreshKey }) => {
    const tile1 = sources.find(s => s.tile_id === 1) || sources[0];
    const tile2 = sources.find(s => s.tile_id === 2) || sources[1];
    
    return (
        <div className="flex h-full w-full">
            <div className="w-1/2 h-full">
                <IFrame source={tile1?.source} title={tile1?.title} refreshKey={refreshKey} />
            </div>
            <div className="w-1/2 h-full">
                <IFrame source={tile2?.source} title={tile2?.title} refreshKey={refreshKey} />
            </div>
        </div>
    );
};

// 50% / 50% horizontal split
const LayoutSplitHorizontal5050 = ({ sources, refreshKey }) => {
    const tile1 = sources.find(s => s.tile_id === 1) || sources[0];
    const tile2 = sources.find(s => s.tile_id === 2) || sources[1];
    
    return (
        <div className="flex flex-col h-full w-full">
            <div className="w-full h-1/2">
                <IFrame source={tile1?.source} title={tile1?.title} refreshKey={refreshKey} />
            </div>
            <div className="w-full h-1/2">
                <IFrame source={tile2?.source} title={tile2?.title} refreshKey={refreshKey} />
            </div>
        </div>
    );
};

// 2x2 Grid
const LayoutGrid2x2 = ({ sources, refreshKey }) => {
    // Fill tiles in order, respecting tile_id if specified
    const tiles = [1, 2, 3, 4].map(tileNum => {
        // First check if there's a source with this specific tile_id
        const assignedSource = sources.find(s => s.tile_id === tileNum);
        if (assignedSource) return assignedSource;
        
        // Otherwise, find the first source without a tile_id that hasn't been used
        return sources.find(s => !s.tile_id && !sources.some(used => used === s));
    });
    
    return (
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0">
            {tiles.map((tile, index) => (
                <div key={index} className="w-full h-full">
                    {tile && <IFrame source={tile.source} title={tile.title} refreshKey={refreshKey} />}
                </div>
            ))}
        </div>
    );
};

// 3x3 Grid
const LayoutGrid3x3 = ({ sources, refreshKey }) => {
    const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(tileNum => {
        const assignedSource = sources.find(s => s.tile_id === tileNum);
        if (assignedSource) return assignedSource;
        return sources.find(s => !s.tile_id && !sources.some(used => used === s));
    });
    
    return (
        <div className="grid grid-cols-3 grid-rows-3 h-full w-full gap-0">
            {tiles.map((tile, index) => (
                <div key={index} className="w-full h-full">
                    {tile && <IFrame source={tile.source} title={tile.title} refreshKey={refreshKey} />}
                </div>
            ))}
        </div>
    );
};

// Triple column layout
const LayoutTripleColumn = ({ sources, refreshKey }) => {
    const tile1 = sources.find(s => s.tile_id === 1) || sources[0];
    const tile2 = sources.find(s => s.tile_id === 2) || sources[1];
    const tile3 = sources.find(s => s.tile_id === 3) || sources[2];
    
    return (
        <div className="flex h-full w-full">
            <div className="w-1/3 h-full">
                <IFrame source={tile1?.source} title={tile1?.title} refreshKey={refreshKey} />
            </div>
            <div className="w-1/3 h-full">
                <IFrame source={tile2?.source} title={tile2?.title} refreshKey={refreshKey} />
            </div>
            <div className="w-1/3 h-full">
                <IFrame source={tile3?.source} title={tile3?.title} refreshKey={refreshKey} />
            </div>
        </div>
    );
};

// Main area with sidebar (70% / 30%)
const LayoutMainSidebar = ({ sources, refreshKey }) => {
    const tile1 = sources.find(s => s.tile_id === 1) || sources[0];
    const tile2 = sources.find(s => s.tile_id === 2) || sources[1];
    
    return (
        <div className="flex h-full w-full">
            <div className="w-[70%] h-full">
                <IFrame source={tile1?.source} title={tile1?.title} refreshKey={refreshKey} />
            </div>
            <div className="w-[30%] h-full">
                <IFrame source={tile2?.source} title={tile2?.title} refreshKey={refreshKey} />
            </div>
        </div>
    );
};

// Slideshow - cycles through sources with configurable timing
const LayoutSlideshow = ({ sources, slideInterval = 10, refreshKey }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    
    useEffect(() => {
        if (sources.length <= 1 || isPaused) return;
        
        // Use the current source's slideInterval if specified, otherwise use global default
        const currentSource = sources[currentIndex];
        const interval = currentSource?.slideInterval || slideInterval;
        
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % sources.length);
        }, interval * 1000);
        
        return () => clearInterval(timer);
    }, [sources, currentIndex, slideInterval, isPaused]);
    
    return (
        <div className="w-full h-full relative">
            {/* Render all iframes but only show the current one */}
            {sources.map((source, index) => (
                <div 
                    key={index}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                        index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    <IFrame source={source?.source} title={source?.title} refreshKey={refreshKey} />
                </div>
            ))}
            
            {/* Slide indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20">
                {sources.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentIndex 
                                ? 'bg-theme-500 w-8' 
                                : 'bg-gray-400/45 dark:bg-dark-500/70'
                        }`}
                    />
                ))}
                {isPaused ? (
                    <button onClick={() => setIsPaused(false)}>
                        <PlayIcon className="w-6 h-6 text-gray-400/45 hover:text-theme-500 cursor-pointer transition-colors" />
                    </button>
                ) : (
                    <button onClick={() => setIsPaused(true)}>
                        <PauseIcon className="w-6 h-6 text-gray-400/45 hover:text-theme-500 cursor-pointer transition-colors" />
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Layout Renderer - Selects the appropriate layout component
 */
const LayoutRenderer = ({ layout, sources, slideInterval, refreshKey, pip }) => {
    // Process sources to auto-assign tiles
    const processedSources = [...sources];
    let nextAvailableTile = 1;
    
    // Auto-assign tile_id to sources that don't have one
    processedSources.forEach(source => {
        if (!source.tile_id) {
            // Find next available tile that's not already assigned
            while (processedSources.some(s => s.tile_id === nextAvailableTile)) {
                nextAvailableTile++;
            }
            source.tile_id = nextAvailableTile;
            nextAvailableTile++;
        }
    });
    
    const layoutMap = {
        'single': LayoutSingle,
        'split-vertical-65-35': LayoutSplitVertical6535,
        'split-vertical-50-50': LayoutSplitVertical5050,
        'split-horizontal-50-50': LayoutSplitHorizontal5050,
        'grid-2x2': LayoutGrid2x2,
        'grid-3x3': LayoutGrid3x3,
        'triple-column': LayoutTripleColumn,
        'main-sidebar': LayoutMainSidebar,
        'slideshow': LayoutSlideshow,
    };
    
    const LayoutComponent = layoutMap[layout] || LayoutSingle;
    
    return (
        <>
            <LayoutComponent sources={processedSources} slideInterval={slideInterval} refreshKey={refreshKey} />
            <PictureInPictureOverlay pip={pip} refreshKey={refreshKey} />
        </>
    );
};

/**
 * Wallboard Selection Screen
 */
const WallboardSelector = ({ onSelect }) => {
    const wallboards = getWallboardList();
    
    // Filter wallboards based on permissions
    const accessibleWallboards = wallboards.filter(wallboard => 
        !wallboard.permission || hasPermission(wallboard.permission)
    );
    
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-white dark:bg-dark-900">
            <div className="max-w-4xl w-full p-8">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-dark-50 mb-8 text-center">
                    Select Wallboard
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {accessibleWallboards.map((wallboard) => (
                        <button
                            key={wallboard.id}
                            onClick={() => onSelect(wallboard.id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:text-dark-100 p-6 rounded-lg transition-colors duration-200 border-2 border-gray-200 hover:border-theme-500 dark:bg-dark-800 dark:border-dark-700 dark:hover:border-theme-600"
                        >
                            <h2 className="text-xl font-semibold mb-2">
                                {wallboard.name}
                            </h2>
                            <p className="text-gray-500 dark:text-dark-400 text-sm">
                                Layout: {wallboard.layout_name}
                            </p>
                        </button>
                    ))}
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-gray-600 dark:text-dark-500 text-sm">
                        Click on a wallboard to display it
                    </p>
                </div>
            </div>
        </div>
    );
};

/**
 * Main Wallboard Engine Component
 */
const Wallboard = () => {
    const [selectedWallboard, setSelectedWallboard] = useState(null);
    const [config, setConfig] = useState(null);
    const [refreshKey, setRefreshKey] = useState(Date.now());
    
    useEffect(() => {
        // Check if there's a wallboard ID in the URL
        const params = new URLSearchParams(window.location.search);
        const wallboardId = params.get('board');
        
        if (wallboardId) {
            handleWallboardSelect(wallboardId);
        }
    }, []);
    
    // Setup daily refresh at midnight
    useEffect(() => {
        const scheduleNextRefresh = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0); // Next midnight
            
            const msUntilMidnight = tomorrow - now;
            
            return setTimeout(() => {
                setRefreshKey(Date.now()); // Trigger iframe refresh
                scheduleNextRefresh(); // Schedule next day's refresh
            }, msUntilMidnight);
        };
        
        const timeoutId = scheduleNextRefresh();
        
        return () => clearTimeout(timeoutId);
    }, []);
    
    const handleWallboardSelect = (wallboardId) => {
        const wallboardConfig = getWallboard(wallboardId);
        setSelectedWallboard(wallboardId);
        setConfig(wallboardConfig);
        
        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('board', wallboardId);
        window.history.pushState({}, '', url);
    };
    
    const handleBackToSelection = () => {
        setSelectedWallboard(null);
        setConfig(null);
        
        // Remove board parameter from URL
        const url = new URL(window.location);
        url.searchParams.delete('board');
        window.history.pushState({}, '', url);
    };
    
    // Show selection screen if no wallboard is selected
    if (!selectedWallboard || !config) {
        return <WallboardSelector onSelect={handleWallboardSelect} />;
    }
    
    // Render the selected wallboard
    return (
        <div className="h-screen w-screen overflow-hidden bg-white dark:bg-dark-900 relative">
            {/* Back button - shows on hover */}
            <div className="group max-w-xs w-full h-20 absolute top-4 left-1/2 transform -translate-x-1/2 z-40 flex justify-center">
                <button
                    onClick={handleBackToSelection}
                    className="dark:bg-dark-700 dark:hover:bg-dark-800 text-white bg-neutral-900/50 hover:bg-neutral-900/60 px-2 py-2 rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
            </div>
            
            {/* Render the layout */}
            <LayoutRenderer 
                layout={config.layout} 
                sources={config.sources} 
                slideInterval={config.slideInterval}
                refreshKey={refreshKey}
                pip={config.pip}
            />
        </div>
    );
};

export default Wallboard;
