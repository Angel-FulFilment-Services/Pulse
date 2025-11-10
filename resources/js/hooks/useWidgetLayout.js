import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage dashboard widget layouts
 * Handles saving/loading layouts to localStorage and provides layout management
 */
export const useWidgetLayout = (initialWidgets = [], storageKey = 'dashboard-layout') => {
    const [widgets, setWidgets] = useState(initialWidgets);
    const [layouts, setLayouts] = useState({});

    // Load saved layouts from localStorage on mount
    useEffect(() => {
        const savedLayouts = localStorage.getItem(storageKey);
        if (savedLayouts) {
            try {
                setLayouts(JSON.parse(savedLayouts));
            } catch (error) {
                console.warn('Failed to parse saved layouts:', error);
            }
        }
    }, [storageKey]);

    // Handle layout changes and save to localStorage
    const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
        setLayouts(allLayouts);
        localStorage.setItem(storageKey, JSON.stringify(allLayouts));
    }, [storageKey]);

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

    return {
        widgets,
        layouts,
        handleLayoutChange,
        addWidget,
        removeWidget,
        updateWidget,
        resetLayouts,
        getWidget
    };
};