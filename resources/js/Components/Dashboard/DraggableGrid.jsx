import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import WidgetItem from './WidgetItem.jsx';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DraggableGrid = ({ 
    widgets = [], 
    savedLayouts = {},
    onLayoutChange,
    expandedWidget,
    onExpandWidget,
    onLockWidget,
    className = "",
    ...gridProps 
}) => {
    const gridRef = useRef(null);
    const expandedWidgetRef = useRef(null);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [isReady, setIsReady] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentLayout, setCurrentLayout] = useState(null); // Track the actual current layout
    
    // Callback ref to ensure we capture the element
    const setExpandedWidgetRef = (element) => {
        console.log('setExpandedWidgetRef called with:', element);
        expandedWidgetRef.current = element;
        if (element && expandedWidget) {
            // Scroll when ref is set
            setTimeout(() => {
                scrollExpandedIntoView(element);
            }, 400);
        }
    };
    
    const scrollExpandedIntoView = (element) => {
        if (!element) return;
        
        // Get element position
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Check if widget is fully visible
        const viewportHeight = window.innerHeight;
        const isFullyVisible = rect.top >= 0 && rect.bottom <= viewportHeight;
                
        if (!isFullyVisible) {
            // Scroll to show the top of the widget with some padding
            const elementTop = rect.top + scrollTop;
            console.log('Scrolling to:', elementTop - 80);
            window.scrollTo({
                top: Math.max(0, elementTop - 80),
                behavior: 'smooth'
            });
        }
    };
    
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
        if (!expandedWidget) {
            // No expansion, use normal layouts
            return layouts;
        }

        // When there's an expanded widget, just expand it in place
        const baseLg = (currentLayout && currentLayout.length > 0) ? currentLayout : layouts.lg;
        
        const expandedWidgetData = widgets.find(w => (w.key || w.id) === expandedWidget);
        const minExpandedHeight = expandedWidgetData?.minExpandedH || expandedWidgetData?.minH || 10;
        
        // Calculate expanded height based on viewport
        const rowHeight = 42;
        const marginPerRow = 20;
        const headerAndPadding = 100;
        const availableHeight = viewportHeight - headerAndPadding;
        const calculatedHeight = Math.floor(availableHeight / (rowHeight + marginPerRow));
        const expandedHeight = Math.max(calculatedHeight, minExpandedHeight);
        
        // Modify layout with expanded widget
        const modifiedLg = baseLg.map(item => {
            const widget = widgets.find(w => (w.key || w.id) === item.i);
            const isWelcome = widget?.showHeader === false;
            
            if (item.i === expandedWidget) {
                // Expand in place - full width and calculated height
                return {
                    ...item,
                    w: 12,
                    h: expandedHeight,
                    minW: 12,
                    minH: minExpandedHeight,
                    maxW: 12,
                };
            }
            
            // Don't unlock the welcome widget
            if (isWelcome) {
                return item;
            }
            
            // Unlock all other widgets during expansion (including locked ones)
            return {
                ...item,
                static: false,
            };
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
    }, [layouts, expandedWidget, widgets, viewportHeight, currentLayout]);

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
                isDraggable={!expandedWidget}
                isResizable={false}
                compactType="vertical"
                preventCollision={false}
                draggableHandle=".drag-handle"
                useCSSTransforms={true}
                {...gridProps}
            >
                {widgets.map((widget, index) => {
                    const key = widget.key || widget.id || `widget-${index}`;
                    const isExpanded = expandedWidget === key;
                    const isLocked = widget.locked || false;
                    
                    return (
                        <div 
                            key={key} 
                            className="widget-container"
                            ref={isExpanded ? setExpandedWidgetRef : null}
                            style={{
                                opacity: expandedWidget && !isExpanded && !isLocked ? 0.3 : 1,
                                transition: 'opacity 0.3s ease-in-out'
                            }}
                        >
                            {widget.showHeader === false ? (
                                // Render content directly without WidgetItem wrapper for special cases like WelcomeCard
                                React.cloneElement(widget.content, { 
                                    isExpanded,
                                    onToggleExpand: () => onExpandWidget?.(isExpanded ? null : key)
                                })
                            ) : (
                                <WidgetItem
                                    title={widget.title}
                                    headerAction={widget.headerAction}
                                    className="h-full"
                                    onExpand={() => onExpandWidget?.(isExpanded ? null : key)}
                                    isExpanded={isExpanded}
                                    onLock={() => onLockWidget?.(key)}
                                    isLocked={isLocked}
                                    canRefresh={widget.canRefresh}
                                    onRefresh={() => onRefreshWidget?.(key)}
                                >
                                    {React.cloneElement(widget.content, { 
                                        isExpanded,
                                        onToggleExpand: () => onExpandWidget?.(isExpanded ? null : key),
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