import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import WidgetItem from './WidgetItem.jsx';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DraggableGrid = ({ 
    widgets = [], 
    savedLayouts = {},
    onLayoutChange,
    expandedWidgets = [],
    onExpandWidget,
    onLockWidget,
    dragEnabled = true,
    className = "",
    ...gridProps 
}) => {
    const gridRef = useRef(null);
    const expandedWidgetRef = useRef(null);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [isReady, setIsReady] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentLayout, setCurrentLayout] = useState(null); // Track the actual current layout
    const [prevExpandedWidgets, setPrevExpandedWidgets] = useState([]);
    
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
    const defaultBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const defaultCols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    
    // Track viewport height changes
    useEffect(() => {
        const handleResize = () => setViewportHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Generate layouts from widgets (saved/default positions)
    const layouts = useMemo(() => {
        const defaultLayout = widgets.map((widget, index) => {
            const widgetKey = widget.key || widget.id || `widget-${index}`;
            const isLocked = widget.locked || false;
            const savedLayout = savedLayouts.lg?.find(l => l.i === widgetKey);
            
            return {
                i: widgetKey,
                x: savedLayout?.x ?? (widget.x !== undefined ? widget.x : (index % 4) * 3),
                y: savedLayout?.y ?? (widget.y !== undefined ? widget.y : Math.floor(index / 4) * 4),
                w: savedLayout?.w ?? (widget.w !== undefined ? widget.w : 3),
                h: savedLayout?.h ?? (widget.h !== undefined ? widget.h : 4),
                minW: widget.minW || 2,
                minH: widget.minH || 3,
                maxW: widget.maxW || 12,
                maxH: widget.maxH || 8,
                static: isLocked,
                ...widget.gridProps
            };
        });

        return {
            lg: defaultLayout,
            md: defaultLayout.map(item => ({
                ...item,
                w: Math.min(item.w, 5),
                x: item.x >= 10 ? 0 : item.x
            })),
            sm: defaultLayout.map(item => ({
                ...item,
                w: Math.min(item.w, 3),
                x: item.x >= 6 ? 0 : item.x
            })),
            xs: defaultLayout.map(item => ({
                ...item,
                w: Math.min(item.w, 2),
                x: item.x >= 4 ? 0 : item.x
            })),
            xxs: defaultLayout.map(item => ({
                ...item,
                w: 2,
                x: 0
            }))
        };
    }, [widgets, savedLayouts]);

    // Compute final layout with expansion logic applied
    const computedLayouts = useMemo(() => {
        if (!expandedWidgets || expandedWidgets.length === 0) {
            // No expansion, use normal layouts
            return layouts;
        }

        // Always use the base layouts.lg for original dimensions
        // This ensures collapsed widgets return to their original size
        const modifiedLg = layouts.lg.map(item => {
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
        });

        return {
            lg: modifiedLg,
            md: modifiedLg.map(item => ({
                ...item,
                w: Math.min(item.w, 5),
                x: item.x >= 10 ? 0 : item.x
            })),
            sm: modifiedLg.map(item => ({
                ...item,
                w: Math.min(item.w, 3),
                x: item.x >= 6 ? 0 : item.x
            })),
            xs: modifiedLg.map(item => ({
                ...item,
                w: Math.min(item.w, 2),
                x: item.x >= 4 ? 0 : item.x
            })),
            xxs: modifiedLg.map(item => ({
                ...item,
                w: 2,
                x: 0
            }))
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layouts, expandedWidgets.join(','), widgets, viewportHeight, currentLayout]);

    const handleLayoutChange = (layout, allLayouts) => {
        setCurrentLayout(layout);
        
        if (onLayoutChange) {
            onLayoutChange(layout, allLayouts);
        }
    };

    return (
        <div ref={gridRef} style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>
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
                isDraggable={dragEnabled && expandedWidgets.length === 0}
                isResizable={false}
                compactType="vertical"
                preventCollision={false}
                draggableHandle=".drag-handle"
                useCSSTransforms={true}
                {...gridProps}
            >
                {widgets.map((widget, index) => {
                    const key = widget.key || widget.id || `widget-${index}`;
                    const isExpanded = expandedWidgets.includes(key);
                    const isLocked = widget.locked || false;
                    
                    return (
                        <div 
                            key={key} 
                            className="widget-container"
                            data-widget-id={key}
                        >
                            {widget.showHeader === false ? (
                                // Render content directly without WidgetItem wrapper for special cases like WelcomeCard
                                React.cloneElement(widget.content, { 
                                    isExpanded,
                                    onToggleExpand: () => onExpandWidget?.(key)
                                })
                            ) : (
                                <WidgetItem
                                    title={widget.title}
                                    headerAction={widget.headerAction}
                                    className="h-full"
                                    onExpand={() => onExpandWidget?.(key)}
                                    isExpanded={isExpanded}
                                    canExpand={widget.canExpand !== false}
                                    onLock={() => onLockWidget?.(key)}
                                    isLocked={isLocked}
                                    dragEnabled={dragEnabled}
                                    canRefresh={widget.canRefresh}
                                    onRefresh={() => onRefreshWidget?.(key)}
                                >
                                    {React.cloneElement(widget.content, { 
                                        isExpanded,
                                        onToggleExpand: () => onExpandWidget?.(key),
                                        onRefresh: () => onRefreshWidget?.(key)
                                    })}
                                </WidgetItem>
                            )}
                        </div>
                    );
                })}
            </ResponsiveGridLayout>
        </div>
    );
};

export default DraggableGrid;