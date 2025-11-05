import React, { useState, useEffect } from 'react';
import { getWallboardList, getWallboard } from '../../Config/Wallboards';
import { PauseIcon, PlayIcon, XMarkIcon, ChevronDoubleUpIcon, ChevronDoubleDownIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ArrowsPointingOutIcon, ArrowUpLeftIcon, ArrowUpIcon, ArrowUpRightIcon, ArrowLeftIcon, ArrowRightIcon, ArrowDownLeftIcon, ArrowDownIcon, ArrowDownRightIcon } from '@heroicons/react/24/solid';
import { hasPermission } from '../../Utils/Permissions.jsx';
import PrinterStatus from '../../Components/Wallboard/PrinterStatus';

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
 * Supports 4 size states: hidden, small, medium, fullscreen
 */
const PictureInPictureOverlay = ({ pip, refreshKey }) => {
    // Load saved position from localStorage first, before setting initial state
    const getSavedPosition = () => {
        const saved = localStorage.getItem('pip-custom-position');
        return saved || null;
    };
    
    const [size, setSize] = useState('small'); // 'hidden', 'small', 'medium', 'fullscreen'
    const [customPosition, setCustomPosition] = useState(getSavedPosition()); // Initialize with saved position if available
    const [isDragging, setIsDragging] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false); // Track inertia animation
    const [dragPosition, setDragPosition] = useState(null); // Temporary position while dragging
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [lastDragTime, setLastDragTime] = useState(Date.now());
    const [lastDragPosition, setLastDragPosition] = useState(null);
    const containerRef = React.useRef(null);
    const animationFrameRef = React.useRef(null);
    
    // Save position to localStorage when it changes
    useEffect(() => {
        if (customPosition) {
            localStorage.setItem('pip-custom-position', customPosition);
        }
    }, [customPosition]);
    
    if (!pip || !pip.source) return null;
    
    // Position mapping for small/medium sizes
    // Using only left/top to avoid transform conflicts with right/bottom
    const positionClasses = {
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'top-right': 'top-4 left-[calc(100%-1rem)] -translate-x-full',
        'center-left': 'top-1/2 left-4 -translate-y-1/2',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'center-right': 'top-1/2 left-[calc(100%-1rem)] -translate-x-full -translate-y-1/2',
        'bottom-left': 'top-[calc(100%-1rem)] left-4 -translate-y-full',
        'bottom-center': 'top-[calc(100%-1rem)] left-1/2 -translate-x-1/2 -translate-y-full',
        'bottom-right': 'top-[calc(100%-1rem)] left-[calc(100%-1rem)] -translate-x-full -translate-y-full',
    };
    
    // Icon mapping based on position (arrow pointing to where the pip is)
    const positionIcons = {
        'top-left': ArrowDownRightIcon,
        'top-center': ArrowDownIcon,
        'top-right': ArrowDownLeftIcon,
        'center-left': ArrowRightIcon,
        'center': ArrowsPointingOutIcon,
        'center-right': ArrowLeftIcon,
        'bottom-left': ArrowUpRightIcon,
        'bottom-center': ArrowUpIcon,
        'bottom-right': ArrowUpLeftIcon,
    };

    // Position mapping for small/medium sizes
    const positionIconClasses = {
        'top-left': 'bottom-4 right-4',
        'top-center': 'bottom-4 left-1/2 -translate-x-1/2',
        'top-right': 'bottom-4 left-4',
        'center-left': 'top-1/2 right-4 -translate-y-1/2',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'center-right': 'top-1/2 left-4 -translate-y-1/2',
        'bottom-left': 'top-2 right-2',
        'bottom-center': 'top-2 left-1/2 -translate-x-1/2',
        'bottom-right': 'top-2 left-2',
    };
    
    const position = positionClasses[pip.position] || positionClasses['bottom-right'];
    const opacity = pip.opacity || 'opacity-75';
    
    // Size configurations
    const sizeConfigs = {
        small: {
            width: pip.sizes.small.width || 'w-96',
            height: pip.sizes.small.height || 'h-56',
            scale: pip.sizes.small.scale || 0.5,
        },
        medium: {
            width: pip.sizes.medium.width || 'w-[50vw]',
            height: pip.sizes.medium.height || 'h-[50vh]',
            scale: pip.sizes.medium.scale || 1,
        },
        fullscreen: {
            width: pip.sizes.fullscreen.width || 'w-screen',
            height: pip.sizes.fullscreen.height || 'h-screen',
            scale: pip.sizes.fullscreen.scale || 1.6,
        },
    };
    
    const cycleSize = () => {
        const cycle = { hidden: 'small', small: 'medium', medium: 'fullscreen', fullscreen: 'hidden' };
        setSize(cycle[size]);
    };
    
    // Reset to default position
    const resetPosition = () => {
        setCustomPosition(null);
        localStorage.removeItem('pip-custom-position');
    };
    
    // Calculate which preset position is closest to a given x,y coordinate
    const findClosestPosition = (x, y) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return pip.position;
        
        const centerX = x + rect.width / 2;
        const centerY = y + rect.height / 2;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Define the center points for each position
        const positions = {
            'top-left': { x: rect.width / 2 + 16, y: rect.height / 2 + 16 },
            'top-center': { x: viewportWidth / 2, y: rect.height / 2 + 16 },
            'top-right': { x: viewportWidth - rect.width / 2 - 16, y: rect.height / 2 + 16 },
            'center-left': { x: rect.width / 2 + 16, y: viewportHeight / 2 },
            'center': { x: viewportWidth / 2, y: viewportHeight / 2 },
            'center-right': { x: viewportWidth - rect.width / 2 - 16, y: viewportHeight / 2 },
            'bottom-left': { x: rect.width / 2 + 16, y: viewportHeight - rect.height / 2 - 16 },
            'bottom-center': { x: viewportWidth / 2, y: viewportHeight - rect.height / 2 - 16 },
            'bottom-right': { x: viewportWidth - rect.width / 2 - 16, y: viewportHeight - rect.height / 2 - 16 },
        };
        
        // Find closest position using distance formula
        let closestPosition = pip.position;
        let minDistance = Infinity;
        
        Object.entries(positions).forEach(([posName, pos]) => {
            const distance = Math.sqrt(
                Math.pow(centerX - pos.x, 2) + Math.pow(centerY - pos.y, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPosition = posName;
            }
        });
        
        return closestPosition;
    };
    
    // Handle drag start
    const handleMouseDown = (e) => {
        if (size === 'fullscreen' || size === 'hidden') return;
        
        // Only drag if clicking on the container itself or specific drag areas, not buttons
        if (e.target.tagName === 'BUTTON') return;
        
        setIsDragging(true);
        
        const rect = containerRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        
        e.preventDefault();
    };
    
    // Handle dragging
    useEffect(() => {
        if (!isDragging) return;
        
        const handleMouseMove = (e) => {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // Constrain to viewport
            const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 0);
            const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 0);
            
            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));
            
            // Calculate velocity based on position change and time
            const now = Date.now();
            const timeDelta = now - lastDragTime;
            
            if (lastDragPosition && timeDelta > 0) {
                const vx = (constrainedX - lastDragPosition.x) / timeDelta;
                const vy = (constrainedY - lastDragPosition.y) / timeDelta;
                setVelocity({ x: vx, y: vy });
            }
            
            setLastDragTime(now);
            setLastDragPosition({ x: constrainedX, y: constrainedY });
            setDragPosition({ x: constrainedX, y: constrainedY });
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
            
            // Apply momentum if velocity is significant
            if (dragPosition) {
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                const velocityThreshold = 0.3; // Reduced threshold (was 0.5) - easier to trigger momentum
                
                if (speed > velocityThreshold) {
                    // Apply inertia - continue motion with decay
                    setIsAnimating(true); // Mark as animating so position stays as inline style
                    applyInertia(dragPosition.x, dragPosition.y, velocity.x, velocity.y);
                } else {
                    // Snap immediately if not moving fast
                    const closestPos = findClosestPosition(dragPosition.x, dragPosition.y);
                    setCustomPosition(closestPos);
                    setDragPosition(null);
                }
            }
            
            // Reset velocity tracking
            setVelocity({ x: 0, y: 0 });
            setLastDragPosition(null);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, dragPosition, velocity, lastDragTime, lastDragPosition]);
    
    // Apply inertia/momentum after release
    const applyInertia = (startX, startY, vx, vy) => {
        const friction = 0.65; // Decay factor per frame
        const minVelocity = 0.5; // Stop when velocity is very low
        let currentX = startX;
        let currentY = startY;
        let currentVx = vx * 50; // Much more subtle momentum
        let currentVy = vy * 50;
        
        const animate = () => {
            // Apply friction
            currentVx *= friction;
            currentVy *= friction;
            
            // Update position
            currentX += currentVx;
            currentY += currentVy;
            
            // Constrain to viewport
            const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 400);
            const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 300);
            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));
            
            setDragPosition({ x: currentX, y: currentY });
            
            // Continue animation if velocity is significant
            if (Math.abs(currentVx) > minVelocity || Math.abs(currentVy) > minVelocity) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete - snap to closest position
                setIsAnimating(false);
                const closestPos = findClosestPosition(currentX, currentY);
                setCustomPosition(closestPos);
                setDragPosition(null);
            }
        };
        
        requestAnimationFrame(animate);
    };
    
    // Cleanup animation frame on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);
    
    // Fullscreen positioning based on PiP position - expands from the corner/edge where PiP is located
    // For center positions, we need to maintain the transforms to avoid jumping
    // Using only left/top to avoid transform conflicts
    const fullscreenPositionClasses = {
        'top-left': 'top-0 left-0',
        'top-center': 'top-0 left-1/2 -translate-x-1/2',
        'top-right': 'top-0 left-full -translate-x-full',
        'center-left': 'top-1/2 left-0 -translate-y-1/2',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'center-right': 'top-1/2 left-full -translate-x-full -translate-y-1/2',
        'bottom-left': 'top-full left-0 -translate-y-full',
        'bottom-center': 'top-full left-1/2 -translate-x-1/2 -translate-y-full',
        'bottom-right': 'top-full left-full -translate-x-full -translate-y-full',
    };
    
    // Get the appropriate fullscreen position based on pip position
    const fullscreenPosition = fullscreenPositionClasses[pip.position] || fullscreenPositionClasses['bottom-right'];
    
    // Determine the current position to use (custom or default)
    const currentPosition = customPosition || pip.position;
    const currentPositionClass = positionClasses[currentPosition] || positionClasses['bottom-right'];
    const currentPositionIcon = positionIconClasses[currentPosition] || positionIconClasses['bottom-right'];
    const CurrentPositionIcon = positionIcons[currentPosition] || ChevronDoubleUpIcon;
    
    // Determine the size class
    let sizeClass;
    let positionStyle = {};
    
    if (size === 'fullscreen') {
        const fullscreenPos = fullscreenPositionClasses[currentPosition] || fullscreenPositionClasses['bottom-right'];
        sizeClass = `${fullscreenPos} w-screen h-screen`;
    } else if ((isDragging || isAnimating) && dragPosition) {
        // While dragging or animating, use inline styles for free positioning
        sizeClass = `${sizeConfigs[size]?.width} ${sizeConfigs[size]?.height}`;
        positionStyle = {
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
        };
    } else {
        // Use preset position (either custom or default)
        sizeClass = `${currentPositionClass} ${sizeConfigs[size]?.width} ${sizeConfigs[size]?.height}`;
    }
    
    return (
        <>
            {/* Drag guide - show position guides when dragging */}
            {/* {isDragging && (
                <div className="fixed inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-4">
                        {[
                            'top-left', 'top-center', 'top-right',
                            'center-left', 'center', 'center-right',
                            'bottom-left', 'bottom-center', 'bottom-right'
                        ].map((pos) => (
                            <div
                                key={pos}
                                className="border-2 border-dashed border-theme-500/25 rounded-lg bg-theme-200/5 flex items-center justify-center"
                            >
                                <span className="text-theme-500/60 text-xs font-medium uppercase">
                                    {pos.replace('-', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )} */}
            
            {/* Hidden state - show only a button */}
            {size === 'hidden' && (
                <button
                    onClick={cycleSize}
                    className={`group fixed ${currentPositionClass} z-30 bg-neutral-900/75 hover:bg-neutral-900/90 opacity-75 dark:bg-dark-700/75 dark:hover:bg-dark-600/90 text-white rounded-full p-2 shadow-2xl transition-all duration-200`}
                    title="Show Picture-in-Picture"
                >
                    <CurrentPositionIcon className="h-4 w-4" />
                </button>
            )}
            
            {/* PrinterStatus container - always mounted, just visually hidden when size is 'hidden' */}
            <div 
                ref={containerRef}
                onMouseDown={handleMouseDown}
                className={`fixed ${sizeClass} z-30 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm group ${
                    size === 'hidden' ? 'opacity-0 pointer-events-none' : ''
                } ${
                    size === 'fullscreen' 
                        ? 'cursor-default transition-all duration-300' 
                        : isDragging 
                            ? 'cursor-grabbing transition-none' 
                            : 'cursor-grab transition-all duration-300'
                }`}
                style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    ...positionStyle,
                }}
            >
                {/* Expand/Collapse Button */}
                <button
                    onClick={cycleSize}
                    className={`absolute ${currentPositionIcon} z-40 bg-neutral-900/75 hover:bg-neutral-900/90 dark:bg-dark-700/75 dark:hover:bg-dark-600/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-75 transition-opacity duration-200 shadow-lg`}
                    title={size === 'small' ? 'Expand to Medium' : size === 'medium' ? 'Expand to Fullscreen' : 'Hide'}
                >   
                    { size === 'fullscreen' ? (<XMarkIcon className="h-4 w-4" />) : (
                        <ArrowsPointingOutIcon className="h-4 w-4" />
                    )}
                </button>
                
                <div className={`${opacity} overflow-hidden pointer-events-none`} style={{ width: '100%', height: '100%' }}>
                    <div style={{ 
                        width: `${100 / sizeConfigs[size]?.scale}%`, 
                        height: `${100 / sizeConfigs[size]?.scale}%`, 
                        transform: `scale(${sizeConfigs[size]?.scale})`, 
                        transformOrigin: 'top left' 
                    }}>
                        <PrinterStatus setSize={setSize} />
                    </div>
                </div>
            </div>
        </>
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
    
    // Setup periodic refresh if configured
    useEffect(() => {
        if (!config?.refreshInterval) return; // Skip if no refresh interval configured
        
        const intervalMs = config.refreshInterval * 1000; // Convert seconds to milliseconds
        
        const intervalId = setInterval(() => {
            setRefreshKey(Date.now()); // Trigger iframe refresh
        }, intervalMs);
        
        return () => clearInterval(intervalId);
    }, [config?.refreshInterval]);
    
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
