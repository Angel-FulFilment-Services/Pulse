import { useState, useEffect, useCallback, useMemo } from 'react';

// Check if we're in a testing/development environment
const isTestingEnvironment = import.meta.env.DEV || import.meta.env.MODE === 'test';

/**
 * Hook to manage dashboard widget layouts
 * Handles saving/loading layouts to localStorage and provides layout management
 * 
 * @param {Array|Function} initialWidgets - Array of widgets or function that receives setWidgetVisibility and returns widgets
 * @param {string} storageKey - Key for localStorage
 */
export const useWidgetLayout = (initialWidgets = [], storageKey = 'dashboard-layout') => {
    // Set widget visibility - generic callback for any widget to show/hide itself
    const setWidgetVisibility = useCallback((widgetId, isVisible) => {
        setHiddenWidgets(prev => {
            if (isVisible) {
                // Remove from hidden list
                return prev.filter(id => id !== widgetId);
            } else {
                // Add to hidden list (if not already there)
                return prev.includes(widgetId) ? prev : [...prev, widgetId];
            }
        });
    }, []);
    
    // Resolve widgets - can be array or function that receives setWidgetVisibility
    const resolvedWidgets = useMemo(() => {
        if (typeof initialWidgets === 'function') {
            return initialWidgets(setWidgetVisibility);
        }
        return initialWidgets;
    }, [initialWidgets, setWidgetVisibility]);
    
    // Initialize hidden widgets from widgets with startHidden: true
    const initialHiddenWidgets = useMemo(() => {
        return resolvedWidgets
            .filter(widget => widget.startHidden)
            .map(widget => widget.key || widget.id);
    }, [resolvedWidgets]);
    
    const [hiddenWidgets, setHiddenWidgets] = useState(initialHiddenWidgets);

    // Load saved layouts synchronously on initialization (skip in testing)
    const loadSavedLayouts = () => {
        if (isTestingEnvironment) {
            return {};
        }
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load saved layouts:', error);
            return {};
        }
    };

    const savedLayouts = loadSavedLayouts();

    // Apply saved positions to resolved widgets
    const initializedWidgets = useMemo(() => {
        return resolvedWidgets.map(widget => {
            const key = widget.key || widget.id;
            const savedLayout = savedLayouts.lg?.find(l => l.i === key);
            
            if (savedLayout) {
                return {
                    ...widget,
                    x: savedLayout.x,
                    y: savedLayout.y,
                    w: savedLayout.w,
                    h: savedLayout.h,
                    locked: savedLayout.locked !== undefined ? savedLayout.locked : widget.locked,
                };
            }
            return widget;
        });
    }, [resolvedWidgets, savedLayouts]);

    const [widgets, setWidgets] = useState(initializedWidgets);
    const [layouts, setLayouts] = useState(savedLayouts);
    const [expandedWidgets, setExpandedWidgets] = useState([]);

    // Get visible widgets (excluding hidden ones)
    const visibleWidgets = widgets.filter(widget => {
        const key = widget.key || widget.id;
        return !hiddenWidgets.includes(key);
    });

    // Handle layout changes and save to localStorage
    const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
        // Don't save layout changes when any widget is expanded
        if (expandedWidgets.length > 0) {
            return;
        }
        
        // Save layouts and update widget positions
        const layoutsToSave = {};
        
        Object.keys(allLayouts).forEach(breakpoint => {
            layoutsToSave[breakpoint] = allLayouts[breakpoint].map(item => {
                const widget = widgets.find(w => (w.key || w.id) === item.i);
                return {
                    ...item,
                    locked: widget?.locked,
                };
            });
        });
        
        setLayouts(layoutsToSave);
        
        // Only save to localStorage if not in testing environment
        if (!isTestingEnvironment) {
            localStorage.setItem(storageKey, JSON.stringify(layoutsToSave));
        }
        
        // Update widget positions with the current layout (excluding expanded)
        setWidgets(prev => prev.map(widget => {
            const key = widget.key || widget.id;
            const layoutItem = currentLayout.find(item => item.i === key);
            
            // Don't update locked widgets or expanded widgets with new positions
            if (widget.locked || expandedWidgets.includes(key) || !layoutItem) {
                return widget;
            }
            
            return {
                ...widget,
                x: layoutItem.x,
                y: layoutItem.y,
                w: layoutItem.w,
                h: layoutItem.h,
            };
        }));
    }, [storageKey, widgets, expandedWidgets]);

    // Add a new widget
    const addWidget = useCallback((newWidget) => {
        const widgetWithKey = {
            ...newWidget,
            key: newWidget.key || newWidget.id || `widget-${Date.now()}`,
            x: newWidget.x || 0,
            y: newWidget.y || 0,
            w: newWidget.w || 3,
            h: newWidget.h || 4
        };
        
        setWidgets(prev => [...prev, widgetWithKey]);
    }, []);

    // Remove a widget
    const removeWidget = useCallback((widgetKey) => {
        setWidgets(prev => prev.filter(widget => 
            (widget.key || widget.id) !== widgetKey
        ));
    }, []);

    // Update widget properties
    const updateWidget = useCallback((widgetKey, updates) => {
        setWidgets(prev => prev.map(widget => 
            (widget.key || widget.id) === widgetKey 
                ? { ...widget, ...updates }
                : widget
        ));
    }, []);

    // Reset layouts to default
    const resetLayouts = useCallback(() => {
        localStorage.removeItem(storageKey);
        setLayouts({});
    }, [storageKey]);

    // Get widget by key
    const getWidget = useCallback((widgetKey) => {
        return widgets.find(widget => (widget.key || widget.id) === widgetKey);
    }, [widgets]);

    // Handle widget expand/collapse - supports multiple expanded widgets
    const handleExpandWidget = useCallback((widgetKey) => {
        setExpandedWidgets(prev => {
            if (prev.includes(widgetKey)) {
                return prev.filter(k => k !== widgetKey);
            } else {
                return [...prev, widgetKey];
            }
        });
    }, []);

    // Handle widget lock/unlock
    const handleLockWidget = useCallback((widgetKey) => {
        setWidgets(prev => prev.map(widget => {
            const key = widget.key || widget.id;
            if (key === widgetKey) {
                // Get current position from layouts if available
                const currentLayout = layouts.lg?.find(l => l.i === widgetKey);
                if (currentLayout) {
                    return { 
                        ...widget, 
                        locked: !widget.locked,
                        x: currentLayout.x,
                        y: currentLayout.y,
                        w: currentLayout.w,
                        h: currentLayout.h
                    };
                }
                return { ...widget, locked: !widget.locked };
            }
            return widget;
        }));
    }, [layouts]);

    return {
        widgets: visibleWidgets,
        allWidgets: widgets, // Include all widgets for reference
        layouts,
        handleLayoutChange,
        addWidget,
        removeWidget,
        updateWidget,
        resetLayouts,
        getWidget,
        expandedWidgets,
        handleExpandWidget,
        handleLockWidget,
        hiddenWidgets,
        setWidgetVisibility
    };
};