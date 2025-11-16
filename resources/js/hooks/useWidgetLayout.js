import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage dashboard widget layouts
 * Handles saving/loading layouts to localStorage and provides layout management
 */
export const useWidgetLayout = (initialWidgets = [], storageKey = 'dashboard-layout') => {
    // Load saved layouts synchronously on initialization
    const loadSavedLayouts = () => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load saved layouts:', error);
            return {};
        }
    };

    const savedLayouts = loadSavedLayouts();

    // Apply saved positions to initial widgets
    const initializedWidgets = initialWidgets.map(widget => {
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

    const [widgets, setWidgets] = useState(initializedWidgets);
    const [layouts, setLayouts] = useState(savedLayouts);
    const [expandedWidget, setExpandedWidget] = useState(null);

    // Handle layout changes and save to localStorage
    const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
        // Don't save layout changes when a widget is expanded
        if (expandedWidget) {
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
        localStorage.setItem(storageKey, JSON.stringify(layoutsToSave));
        
        // Update widget positions with the current layout (excluding expanded)
        setWidgets(prev => prev.map(widget => {
            const key = widget.key || widget.id;
            const layoutItem = currentLayout.find(item => item.i === key);
            
            // Don't update locked widgets or expanded widgets with new positions
            if (widget.locked || expandedWidget === key || !layoutItem) {
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
    }, [storageKey, widgets, expandedWidget]);

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

    // Handle widget expand/collapse
    const handleExpandWidget = useCallback((widgetKey) => {
        // If clicking the same widget, collapse it. Otherwise, collapse any other expanded widget and expand this one
        setExpandedWidget(prev => prev === widgetKey ? null : widgetKey);
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
        widgets,
        layouts,
        handleLayoutChange,
        addWidget,
        removeWidget,
        updateWidget,
        resetLayouts,
        getWidget,
        expandedWidget,
        handleExpandWidget,
        handleLockWidget
    };
};