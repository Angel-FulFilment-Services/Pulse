import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { TrashIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { LockClosedIcon as LockClosedIconSolid } from '@heroicons/react/24/solid';
import WidgetItem from './WidgetItem.jsx';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DraggableGrid = ({ 
    widgets = [], 
    savedLayouts = {},
    onLayoutChange,
    expandedWidgets = [],
    onExpandWidget,
    onLockWidget,
    onRemoveWidget,
    dragEnabled = true,
    isEditMode = false,
    isTransitioning = false,
    transitionDirection = 'left',
    persistentWidgetIds = [],
    presetId = 'default',
    collapsedWidgets = [],
    setWidgetCollapsed,
    widgetData = {},
    onWidgetDataChange,
    className = "",
    ...gridProps 
}) => {
    const gridRef = useRef(null);
    const expandedWidgetRef = useRef(null);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [isReady, setIsReady] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentLayout, setCurrentLayout] = useState(null); // Track the actual current layout
    const currentBreakpointRef = useRef('lg'); // Track the current breakpoint (ref for sync updates)
    const [prevExpandedWidgets, setPrevExpandedWidgets] = useState([]);
    
    // Transition state: 'idle' | 'fading-out' | 'hidden' | 'fading-in'
    const [transitionState, setTransitionState] = useState('idle');
    
    // Rendered presetId - lags behind actual presetId during transitions
    // This controls when widgets actually remount
    const [renderedPresetId, setRenderedPresetId] = useState(presetId);
    const prevPresetIdRef = useRef(presetId);
    
    // Track base positions (non-expanded) for preserving layout when adding widgets
    const basePositionsRef = useRef({});
    
    // Clear cached positions when savedLayouts changes (e.g., on cancel/reload)
    const savedLayoutsKey = JSON.stringify(savedLayouts);
    useEffect(() => {
        basePositionsRef.current = {};
    }, [savedLayoutsKey]);
    
    // Track if we're waiting for layout to be applied after preset change
    const waitingForLayoutRef = useRef(false);
    const fadeInTimeoutRef = useRef(null);
    
    // Trigger fade-in (called from onLayoutChange or fallback timeout)
    const triggerFadeIn = () => {
        if (waitingForLayoutRef.current) {
            waitingForLayoutRef.current = false;
            if (fadeInTimeoutRef.current) {
                clearTimeout(fadeInTimeoutRef.current);
                fadeInTimeoutRef.current = null;
            }
            
            // Wait for react-grid-layout to apply transforms, then fade in
            // The transforms are applied via inline styles after onLayoutChange
            // We need multiple RAFs + a small delay to ensure they're painted
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Additional delay to ensure transforms are fully applied
                    setTimeout(() => {
                        setTransitionState('fading-in');
                        
                        // Clear after fade-in animation completes
                        setTimeout(() => {
                            setTransitionState('idle');
                        }, 400);
                    }, 50);
                });
            });
        }
    };
    
    // Detect preset changes and manage transition states
    useEffect(() => {
        if (prevPresetIdRef.current !== presetId) {
            // Preset is changing - start fade out (keep old widgets rendered)
            setTransitionState('fading-out');
            
            // After fade-out completes, switch to new preset (triggers remount)
            const fadeOutTimer = setTimeout(() => {
                setRenderedPresetId(presetId);
                setTransitionState('hidden');
                waitingForLayoutRef.current = true;
                
                // Fallback: if onLayoutChange doesn't fire within 500ms, trigger fade-in anyway
                fadeInTimeoutRef.current = setTimeout(() => {
                    triggerFadeIn();
                }, 500);
            }, 300); // Fade-out duration
            
            prevPresetIdRef.current = presetId;
            return () => {
                clearTimeout(fadeOutTimer);
                if (fadeInTimeoutRef.current) {
                    clearTimeout(fadeInTimeoutRef.current);
                }
            };
        }
    }, [presetId]);
    
    // Constants for calculating heights (must match grid config)
    const ROW_HEIGHT = 42;
    const MARGIN = 16;
    
    // Calculate the final pixel height of an expanded widget
    const calculateExpandedPixelHeight = (widgetId) => {
        const widgetData = widgets.find(w => (w.key || w.id) === widgetId);
        if (!widgetData) return null;
        
        const minExpandedHeight = widgetData?.minExpandedH || widgetData?.minH || 10;
        const maxExpandedWidth = widgetData?.maxExpandedW;
        const maxExpandedHeight = widgetData?.maxExpandedH;
        
        let expandedHeightUnits;
        
        if (maxExpandedWidth !== undefined && maxExpandedHeight !== undefined) {
            expandedHeightUnits = maxExpandedHeight;
        } else {
            // Full screen expansion
            const headerAndPadding = 100;
            const availableHeight = viewportHeight - headerAndPadding;
            const calculatedHeight = Math.floor(availableHeight / (ROW_HEIGHT + MARGIN));
            expandedHeightUnits = Math.max(calculatedHeight, minExpandedHeight);
        }
        
        // Convert grid units to pixels: height = (units * rowHeight) + ((units - 1) * margin)
        return (expandedHeightUnits * ROW_HEIGHT) + ((expandedHeightUnits - 1) * MARGIN);
    };
    
    // Scroll expanded widget into view when expansion changes
    useEffect(() => {
        // Find newly expanded widgets (in current but not in previous)
        const newlyExpanded = expandedWidgets.filter(w => !prevExpandedWidgets.includes(w));
        
        if (newlyExpanded.length > 0) {
            // Scroll to the first newly expanded widget
            const expandedWidgetKey = newlyExpanded[0];
            const expandedElement = document.querySelector(`[data-widget-id="${expandedWidgetKey}"]`);
            
            if (expandedElement) {
                const finalHeight = calculateExpandedPixelHeight(expandedWidgetKey);
                const scrollContainer = document.querySelector('main.overflow-y-auto');
                
                if (scrollContainer && finalHeight) {
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const containerHeight = scrollContainer.clientHeight;
                    const padding = 40;
                    
                    // Calculate target scroll position based on initial element position
                    const initialElementRect = expandedElement.getBoundingClientRect();
                    const elementTopInContent = initialElementRect.top - containerRect.top + scrollContainer.scrollTop;
                    const finalBottomInContent = elementTopInContent + finalHeight;
                    
                    // Determine scroll target
                    let scrollTarget = null;
                    
                    if (finalHeight >= containerHeight - padding) {
                        // Widget will be taller than viewport - scroll to show top
                        scrollTarget = elementTopInContent - padding;
                    } else {
                        // Widget fits - position so bottom is visible
                        scrollTarget = finalBottomInContent - containerHeight + padding;
                    }
                    
                    if (scrollTarget !== null && scrollTarget > scrollContainer.scrollTop) {
                        const maxScrollNow = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                        
                        // Check if we can already reach the target
                        if (scrollTarget <= maxScrollNow) {
                            // Target is already reachable - use smooth scroll
                            scrollContainer.scrollTo({
                                top: Math.max(0, scrollTarget),
                                behavior: 'smooth'
                            });
                        } else {
                            // Need to wait for content to grow - use progressive scroll
                            const animationDuration = 400;
                            let animationFrame;
                            
                            const progressiveScroll = () => {
                                const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                                const targetForNow = Math.min(scrollTarget, maxScroll);
                                
                                // Smoothly interpolate toward target
                                const diff = targetForNow - scrollContainer.scrollTop;
                                if (Math.abs(diff) > 2) {
                                    // Move 15% of the remaining distance each frame for smooth motion
                                    scrollContainer.scrollTop += diff * 0.15;
                                }
                                
                                // Continue if we haven't reached target and content might still be growing
                                if (scrollContainer.scrollTop < scrollTarget - 5) {
                                    animationFrame = requestAnimationFrame(progressiveScroll);
                                }
                            };
                            
                            animationFrame = requestAnimationFrame(progressiveScroll);
                            
                            // Stop after animation duration
                            const stopTimer = setTimeout(() => {
                                if (animationFrame) {
                                    cancelAnimationFrame(animationFrame);
                                }
                            }, animationDuration);
                            
                            setPrevExpandedWidgets([...expandedWidgets]);
                            return () => {
                                if (animationFrame) cancelAnimationFrame(animationFrame);
                                clearTimeout(stopTimer);
                            };
                        }
                    }
                }
            }
        }
        
        setPrevExpandedWidgets([...expandedWidgets]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expandedWidgets.join(','), widgets, viewportHeight]);
    
    // Wait for grid to mount and position items
    useEffect(() => {
        setMounted(true);
        // Give React Grid Layout time to calculate and apply positions
        const timer = setTimeout(() => setIsReady(true), 300);
        return () => clearTimeout(timer);
    }, []);
    
    // Default breakpoints and columns
    // lg/md: 12 columns (normal layout)
    // sm/xs: 1 column (stacked widgets)
    const defaultBreakpoints = { lg: 1200, md: 768, sm: 480, xs: 0 };
    const defaultCols = { lg: 12, md: 12, sm: 1, xs: 1 };
    
    // Track viewport height changes
    useEffect(() => {
        const handleResize = () => setViewportHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Add resizable-spacer-item class to grid items containing spacers
    // Use MutationObserver because react-grid-layout re-renders and may remove classes
    useEffect(() => {
        if (!gridRef.current) return;
        
        const applySpacerClasses = () => {
            const spacerContainers = gridRef.current?.querySelectorAll('.resizable-spacer');
            spacerContainers?.forEach(container => {
                const gridItem = container.closest('.react-grid-item');
                if (gridItem && !gridItem.classList.contains('resizable-spacer-item')) {
                    gridItem.classList.add('resizable-spacer-item');
                }
            });
        };
        
        // Initial application
        applySpacerClasses();
        
        // Watch for DOM changes and reapply
        const observer = new MutationObserver(() => {
            applySpacerClasses();
        });
        
        observer.observe(gridRef.current, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
        
        return () => observer.disconnect();
    }, [widgets, isEditMode]);

    // Generate layouts from widgets (using tracked base positions, then saved, then defaults)
    const layouts = useMemo(() => {
        const defaultLayout = widgets.map((widget, index) => {
            const widgetKey = widget.key || widget.id || `widget-${index}`;
            const isLocked = widget.locked || false;
            
            // Priority: tracked base position > saved layout > widget defaults
            const basePosition = basePositionsRef.current[widgetKey];
            const savedLayout = savedLayouts.lg?.find(l => l.i === widgetKey);
            
            // Get dimensions from saved layout or widget config
            const w = savedLayout?.w ?? (widget.w !== undefined ? widget.w : 3);
            const h = savedLayout?.h ?? (widget.h !== undefined ? widget.h : 4);
            
            // Get position: prefer tracked base position, then saved, then calculate default
            const x = basePosition?.x ?? savedLayout?.x ?? (widget.x !== undefined ? widget.x : (index % 4) * 3);
            const y = basePosition?.y ?? savedLayout?.y ?? (widget.y !== undefined ? widget.y : Math.floor(index / 4) * 4);
            
            // Only spacers can be resized (canResize: true), all other widgets are not resizable
            const canResize = widget.canResize === true;
            
            return {
                i: widgetKey,
                x: x,
                y: y,
                w: basePosition?.w ?? w,
                h: basePosition?.h ?? h,
                minW: widget.minW || 2,
                minH: widget.minH || 3,
                maxW: widget.maxW || 12,
                maxH: widget.maxH || 12,
                static: isLocked,
                // Only allow resize for spacers - set both isResizable and resizeHandles
                isResizable: canResize && !isLocked,
                resizeHandles: canResize && !isLocked ? ['se'] : [],
                ...widget.gridProps
            };
        });

        // Generate small screen layouts - stack all widgets (1 column)
        // Sort by y position first, then x, so they stack in a logical order
        const sortedForSmall = [...defaultLayout].sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });
        
        let currentY = 0;
        const smallLayout = sortedForSmall.map(item => {
            const result = {
                ...item,
                w: 1,   // 1 column width (full width in 1-column grid)
                x: 0,   // Start at left
                y: currentY,
            };
            currentY += item.h;
            return result;
        });

        return {
            lg: defaultLayout,
            md: defaultLayout,  // Same as lg - 12 columns
            sm: smallLayout,    // Stacked layout for small screens (1 column)
            xs: smallLayout,    // Stacked layout for extra small (1 column)
        };
    }, [widgets, savedLayouts]);

    // Compute final layout with expansion and collapse logic applied
    const computedLayouts = useMemo(() => {
        // Check if we have any modifications to apply
        const hasExpanded = expandedWidgets && expandedWidgets.length > 0;
        
        // Always use the base layouts.lg for original dimensions
        const baseLg = hasExpanded ? layouts.lg.map(item => {
            const widget = widgets.find(w => (w.key || w.id) === item.i);
            const isExpanded = expandedWidgets.includes(item.i);
            
            if (isExpanded && widget) {
                const minExpandedHeight = widget.minExpandedH || widget.minH || 10;
                const maxExpandedWidth = widget.maxExpandedW;
                const maxExpandedHeight = widget.maxExpandedH;
                
                // Calculate expanded dimensions
                let expandedWidth;
                let expandedHeight;
                
                if (maxExpandedWidth !== undefined && maxExpandedHeight !== undefined) {
                    // Use the specified max dimensions
                    expandedWidth = maxExpandedWidth;
                    expandedHeight = maxExpandedHeight;
                } else {
                    // Full screen expansion (original behavior)
                    expandedWidth = 12;
                    const rowHeight = 42;
                    const marginPerRow = 20;
                    const headerAndPadding = 100;
                    const availableHeight = viewportHeight - headerAndPadding;
                    const calculatedHeight = Math.floor(availableHeight / (rowHeight + marginPerRow));
                    expandedHeight = Math.max(calculatedHeight, minExpandedHeight);
                }
                
                // Expand to calculated dimensions
                return {
                    ...item,
                    w: expandedWidth,
                    h: expandedHeight,
                    minW: widget.minW || item.minW,
                    minH: minExpandedHeight,
                    maxW: expandedWidth,
                };
            }
            
            // Return original dimensions for non-expanded widgets
            return item;
        }) : layouts.lg;

        // Generate small screen layouts - stack all widgets (1 column)
        // Sort by y position first, then x, so they stack in a logical order
        const sortedForSmall = [...baseLg].sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });
        
        let currentY = 0;
        const smallLayout = sortedForSmall.map(item => {
            const result = {
                ...item,
                w: 1,   // 1 column width (full width in 1-column grid)
                x: 0,   // Start at left
                y: currentY,
            };
            currentY += item.h;
            return result;
        });

        return {
            lg: baseLg,
            md: baseLg,  // Same as lg - 12 columns
            sm: smallLayout,  // Stacked layout for small screens (1 column)
            xs: smallLayout,  // Stacked layout for extra small (1 column)
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layouts, expandedWidgets.join(','), widgets, viewportHeight, currentLayout]);

    // Calculate the visual offset for widgets below collapsed widgets
    // This allows us to visually shift content up without changing the grid layout
    const getCollapsedOffset = useCallback((widgetKey) => {
        if (isEditMode || !collapsedWidgets || collapsedWidgets.length === 0) {
            return 0;
        }
        
        // Find this widget's position in the current layout
        const currentWidgetLayout = computedLayouts.lg?.find(l => l.i === widgetKey);
        if (!currentWidgetLayout) return 0;
        
        let totalOffset = 0;
        
        // For each collapsed widget, check if it's above this widget
        collapsedWidgets.forEach(collapsedId => {
            const collapsedLayout = computedLayouts.lg?.find(l => l.i === collapsedId);
            if (!collapsedLayout) return;
            
            // If the collapsed widget is above this widget (lower y value)
            if (collapsedLayout.y < currentWidgetLayout.y) {
                // Calculate the pixel height of the collapsed widget
                // Height = rows * rowHeight + (rows - 1) * margin
                const collapsedHeight = (collapsedLayout.h * ROW_HEIGHT) + ((collapsedLayout.h - 1) * MARGIN) + MARGIN;
                totalOffset += collapsedHeight;
            }
        });
        
        return totalOffset;
    }, [isEditMode, collapsedWidgets, computedLayouts.lg, ROW_HEIGHT, MARGIN]);

    const handleLayoutChange = (layout, allLayouts) => {
        setCurrentLayout(layout);
        
        // If we're waiting for layout after a preset change, trigger fade-in
        if (waitingForLayoutRef.current) {
            triggerFadeIn();
        }
        
        // Only update base positions and propagate changes when on lg/md breakpoints
        // This prevents small screen layouts from overwriting the normal layout
        const bp = currentBreakpointRef.current;
        if (bp === 'lg' || bp === 'md') {
            // Store current positions in ref for preserving layout when adding new widgets
            // BUT skip expanded widgets - we don't want to store their expanded dimensions
            layout.forEach(item => {
                const isExpanded = expandedWidgets.includes(item.i);
                if (!isExpanded) {
                    basePositionsRef.current[item.i] = {
                        x: item.x,
                        y: item.y,
                        w: item.w,
                        h: item.h,
                    };
                }
            });
            
            if (onLayoutChange) {
                onLayoutChange(layout, allLayouts);
            }
        }
    };
    
    // Handle breakpoint changes - use ref for synchronous updates
    const handleBreakpointChange = (newBreakpoint) => {
        currentBreakpointRef.current = newBreakpoint;
    };

    return (
        <div 
            ref={gridRef} 
            style={{ 
                opacity: isReady ? 1 : 0, 
                transition: 'opacity 0.5s ease-in',
                paddingTop: isEditMode ? '48px' : '0',
            }}
        >
            <style>{`
                .react-grid-item {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    cursor: default !important;
                }
                .react-grid-item.cssTransforms {
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                                width 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                                height 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .react-grid-item.react-grid-placeholder {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .react-grid-item.react-draggable-dragging {
                    transition: none !important;
                }
                .react-grid-item.static {
                    cursor: default !important;
                }
                
                /* Hide all resize handles by default */
                .react-grid-item > .react-resizable-handle,
                .react-grid-item > .react-resizable-handle-se,
                .react-grid-item > .react-resizable-handle-s,
                .react-grid-item > .react-resizable-handle-e {
                    display: none !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }
                
                /* Show resize handle ONLY for spacers in edit mode */
                .react-grid-item.resizable-spacer-item > .react-resizable-handle-se {
                    display: ${isEditMode ? 'block' : 'none'} !important;
                    visibility: ${isEditMode ? 'visible' : 'hidden'} !important;
                    pointer-events: ${isEditMode ? 'auto' : 'none'} !important;
                    width: 24px !important;
                    height: 24px !important;
                    position: absolute !important;
                    bottom: 0 !important;
                    right: 0 !important;
                    cursor: se-resize !important;
                    background: transparent !important;
                    z-index: 100 !important;
                }
                .react-grid-item.resizable-spacer-item > .react-resizable-handle-se::after {
                    content: '';
                    position: absolute;
                    right: 6px;
                    bottom: 6px;
                    width: 10px;
                    height: 10px;
                    border-right: 3px solid rgba(107, 114, 128, 0.8);
                    border-bottom: 3px solid rgba(107, 114, 128, 0.8);
                    border-radius: 1px;
                }
                
                /* Preset transition - fade out non-persistent widgets */
                .widget-container.transitioning-out {
                    opacity: 0;
                    transition: opacity 0.3s ease-out;
                    pointer-events: none;
                }
                .widget-content-wrapper.transitioning-out {
                    transform: scale(0.95);
                    transition: transform 0.3s ease-out;
                }
                
                /* Keep widgets hidden while grid positions them */
                .widget-container.positioning {
                    opacity: 0 !important;
                    visibility: hidden !important;
                    transition: none !important;
                }
                .widget-content-wrapper.positioning {
                    transform: scale(0.95);
                }
                
                /* Fade in animation for widgets appearing after transition */
                .widget-container.transitioning-in {
                    visibility: visible !important;
                    animation: widgetFadeIn 0.4s ease-out forwards;
                }
                .widget-content-wrapper.transitioning-in {
                    animation: widgetScaleIn 0.4s ease-out forwards;
                }
                
                @keyframes widgetFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes widgetScaleIn {
                    from {
                        transform: scale(0.95);
                    }
                    to {
                        transform: scale(1);
                    }
                }
                
                /* Persistent widgets stay visible during transition */
                .widget-container.persistent {
                    opacity: 1 !important;
                    animation: none !important;
                }
                
                /* Collapsed widgets - visually hide but keep in layout */
                .widget-container.collapsed-widget {
                    height: 0 !important;
                    min-height: 0 !important;
                    overflow: hidden !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
                
                /* Layout widget drag handles */
                .layout-widget-container {
                    cursor: ${isEditMode ? 'move' : 'default'};
                }
                .layout-widget-container .resize-handle {
                    display: ${isEditMode ? 'flex' : 'none'};
                }
                
            `}</style>
            <ResponsiveGridLayout
                className={`layout ${className}`}
                layouts={computedLayouts}
                breakpoints={defaultBreakpoints}
                cols={defaultCols}
                rowHeight={42}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={handleBreakpointChange}
                isDraggable={isEditMode && dragEnabled && !isTransitioning}
                isResizable={isEditMode}
                resizeHandles={['se']}
                compactType="vertical"
                preventCollision={false}
                draggableHandle=".drag-handle"
                useCSSTransforms={true}
                {...gridProps}
            >
                {widgets.map((widget, index) => {
                    const widgetKey = widget.key || widget.id || `widget-${index}`;
                    const isExpanded = expandedWidgets.includes(widgetKey);
                    const isLocked = widget.locked || false;
                    const canRemove = !widget.persistent && isEditMode;
                    const isPersistent = persistentWidgetIds.includes(widgetKey) || widget.persistent;
                    const isLayoutWidget = widget.isLayoutWidget || false;
                    const canResize = widget.canResize === true;
                    
                    // Check if this widget is collapsed (not in edit mode)
                    const isCollapsed = !isEditMode && collapsedWidgets.includes(widgetKey);
                    
                    // Calculate visual offset - how much to shift this widget up due to collapsed widgets above it
                    const collapsedOffset = getCollapsedOffset(widgetKey);
                    
                    // For non-persistent widgets, use renderedPresetId in content key to force React to unmount/remount
                    // This only changes AFTER fade-out completes, ensuring smooth transitions
                    // The outer key must match layout `i` values, but inner content can have different key
                    const contentKey = isPersistent ? widgetKey : `${renderedPresetId}-${widgetKey}`;
                    
                    // Determine transition classes based on state machine
                    let transitionClass = '';
                    if (!isPersistent) {
                        if (transitionState === 'fading-out') {
                            transitionClass = 'transitioning-out';
                        } else if (transitionState === 'hidden') {
                            transitionClass = 'positioning';
                        } else if (transitionState === 'fading-in') {
                            transitionClass = 'transitioning-in';
                        }
                    }
                    
                    return (
                        <div 
                            key={widgetKey} 
                            className={`widget-container relative group ${transitionClass} ${isPersistent ? 'persistent' : ''} ${canResize ? 'resizable-spacer' : ''} ${isCollapsed ? 'collapsed-widget' : ''}`}
                            data-widget-id={widgetKey}
                            style={collapsedOffset > 0 ? { marginTop: `-${collapsedOffset}px` } : undefined}
                        >
                            {/* Inner wrapper for scale animation - doesn't interfere with grid's translate transform */}
                            <div className={`widget-content-wrapper h-full ${transitionClass}`}>
                                {/* Edit controls for layout and frameless widgets */}
                                {isEditMode && (isLayoutWidget || widget.showHeader === false) && (
                                    <div className="absolute -top-2 right-0 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {/* Lock button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLockWidget?.(widgetKey);
                                            }}
                                            className={`p-1.5 rounded-full shadow-lg transition-colors bg-white hover:bg-gray-100 dark:bg-dark-800 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-400 border border-gray-200 dark:border-dark-600`}
                                            title={isLocked ? 'Unlock position' : 'Lock position'}
                                        >
                                            {isLocked ? (
                                                <LockClosedIconSolid className="h-4 w-4 text-theme-400" />
                                            ) : (
                                                <LockOpenIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                        
                                        {/* Delete button - only for non-persistent */}
                                        {canRemove && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveWidget?.(widgetKey);
                                                }}
                                                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                                                title="Remove widget"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                {/* Remove button - only visible in edit mode for regular widgets */}
                                {canRemove && !isLayoutWidget && widget.showHeader !== false && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveWidget?.(widgetKey);
                                        }}
                                        className="absolute -top-2 -right-2 z-20 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        title="Remove widget"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                                
                                {isLayoutWidget ? (
                                    // Layout widgets (spacer, divider) render without wrapper - entire container is drag handle
                                    <div key={contentKey} className={`layout-widget-container h-full w-full ${isEditMode && !isLocked ? 'drag-handle' : ''}`}>
                                        {React.cloneElement(widget.content, { 
                                            isEditMode,
                                            canResize
                                        })}
                                    </div>
                                ) : widget.showHeader === false ? (
                                    // Frameless widgets - entire widget is draggable in edit mode
                                    <div key={contentKey} className={`h-full w-full ${isEditMode && !isLocked ? 'drag-handle cursor-move' : ''}`}>
                                        {React.cloneElement(widget.content, { 
                                            isExpanded,
                                            isEditMode,
                                            widgetId: widgetKey,
                                            setWidgetCollapsed,
                                            onToggleExpand: () => onExpandWidget?.(widgetKey)
                                        })}
                                    </div>
                                ) : (
                                    <WidgetItem
                                        key={contentKey}
                                        title={widget.title}
                                        headerAction={widget.headerAction}
                                        className="h-full"
                                        onExpand={() => onExpandWidget?.(widgetKey)}
                                        isExpanded={isExpanded}
                                        canExpand={widget.canExpand !== false}
                                        onLock={isEditMode ? () => onLockWidget?.(widgetKey) : undefined}
                                        isLocked={isLocked}
                                        dragEnabled={isEditMode && dragEnabled}
                                        canRefresh={widget.canRefresh}
                                        onRefresh={() => onRefreshWidget?.(widgetKey)}
                                        isEditMode={isEditMode}
                                    >
                                        {React.cloneElement(widget.content, { 
                                            isExpanded,
                                            onToggleExpand: () => onExpandWidget?.(widgetKey),
                                            onRefresh: () => onRefreshWidget?.(widgetKey)
                                        })}
                                    </WidgetItem>
                                )}
                            </div>
                        </div>
                    );
                })}
            </ResponsiveGridLayout>
        </div>
    );
};

export default DraggableGrid;