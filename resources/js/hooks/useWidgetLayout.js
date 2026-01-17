import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Hook to manage dashboard widget layouts
 * Handles saving/loading layouts to localStorage and provides layout management
 * 
 * @param {Array|Function} initialWidgets - Array of widgets or function that returns widgets
 * @param {string} storageKey - Key for localStorage
 * @param {boolean} isEditMode - Whether the dashboard is in edit mode (shows hidden widgets)
 */
export const useWidgetLayout = (initialWidgets = [], storageKey = 'dashboard-layout', isEditMode = false) => {
    // Track previous storage key to detect preset changes
    const prevStorageKeyRef = useRef(storageKey);
    
    // Resolve widgets - can be array or function
    const resolvedWidgets = useMemo(() => {
        if (typeof initialWidgets === 'function') {
            return initialWidgets();
        }
        return initialWidgets;
    }, [initialWidgets]);
    
    // Initialize collapsed widgets from widgets with startCollapsed: true
    const initialCollapsedWidgets = useMemo(() => {
        return resolvedWidgets
            .filter(widget => widget.startCollapsed)
            .map(widget => widget.key || widget.id);
    }, [resolvedWidgets]);
    
    // Track collapsed widgets (widgets that should have 0 height when not in edit mode)
    const [collapsedWidgets, setCollapsedWidgets] = useState(initialCollapsedWidgets);
    
    // Set widget collapsed state - for widgets that want to collapse to 0 height when empty
    const setWidgetCollapsed = useCallback((widgetId, isCollapsed) => {
        setCollapsedWidgets(prev => {
            if (isCollapsed) {
                return prev.includes(widgetId) ? prev : [...prev, widgetId];
            } else {
                return prev.filter(id => id !== widgetId);
            }
        });
    }, []);

    // Load saved layouts synchronously (skip in testing)
    const loadSavedLayouts = useCallback(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load saved layouts:', error);
            return {};
        }
    }, [storageKey]);
    
    // Load saved widget data (titles, custom settings, etc.)
    const loadSavedWidgetData = useCallback(() => {
        try {
            const saved = localStorage.getItem(`${storageKey}-data`);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load saved widget data:', error);
            return {};
        }
    }, [storageKey]);

    // Saved layouts - reactive to storageKey changes
    const savedLayouts = useMemo(() => loadSavedLayouts(), [loadSavedLayouts]);
    
    // Saved widget data - reactive to storageKey changes
    const savedWidgetData = useMemo(() => loadSavedWidgetData(), [loadSavedWidgetData, storageKey]);

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
    const [widgetData, setWidgetData] = useState(savedWidgetData);
    
    // Initialize expanded widgets from persisted state
    const initialExpandedWidgets = useMemo(() => {
        return initializedWidgets
            .filter(widget => widget.persistedExpanded)
            .map(widget => widget.key || widget.id);
    }, [initializedWidgets]);
    
    const [expandedWidgets, setExpandedWidgets] = useState(initialExpandedWidgets);
    
    // Update widget data (e.g., section divider titles)
    const updateWidgetData = useCallback((widgetId, data) => {
        setWidgetData(prev => ({
            ...prev,
            [widgetId]: {
                ...(prev[widgetId] || {}),
                ...data
            }
        }));
    }, []);
    
    // Sync widgets, layouts, widgetData and expanded state ONLY when preset changes (storageKey changes)
    useEffect(() => {
        // Only reset when actually switching presets
        if (prevStorageKeyRef.current !== storageKey) {
            // Load fresh data from localStorage for the new preset
            const freshWidgetData = loadSavedWidgetData();
            
            setWidgets(initializedWidgets);
            setLayouts(savedLayouts);
            setWidgetData(freshWidgetData);
            
            // Re-calculate persisted expanded widgets for the new preset
            const persistedExpanded = initializedWidgets
                .filter(widget => widget.persistedExpanded)
                .map(widget => widget.key || widget.id);
            setExpandedWidgets(persistedExpanded);
            
            prevStorageKeyRef.current = storageKey;
        }
    }, [storageKey, initializedWidgets, savedLayouts, loadSavedWidgetData]);



    // Handle layout changes - update state but DON'T save to localStorage
    const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
        // Build layouts to save (but don't persist yet)
        const layoutsToSave = {};
        
        Object.keys(allLayouts).forEach(breakpoint => {
            layoutsToSave[breakpoint] = allLayouts[breakpoint].map(item => {
                const widget = widgets.find(w => (w.key || w.id) === item.i);
                const isExpanded = expandedWidgets.includes(item.i);
                
                // Always save original (non-expanded) dimensions
                // Expansion is handled dynamically - the 'expanded' flag in lockedWidgets handles persistence
                if (isExpanded && widget) {
                    return {
                        i: item.i,
                        x: item.x,
                        y: item.y,
                        w: widget.w,  // Original width
                        h: widget.h,  // Original height
                        locked: widget?.locked,
                    };
                }
                
                // Not expanded - save current dimensions
                return {
                    ...item,
                    locked: widget?.locked,
                };
            });
        });
        
        setLayouts(layoutsToSave);
        
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
    }, [widgets, expandedWidgets]);
    
    // Save current layouts and widget data to localStorage (called on explicit save)
    const saveLayoutsToStorage = useCallback(() => {
        localStorage.setItem(storageKey, JSON.stringify(layouts));
        localStorage.setItem(`${storageKey}-data`, JSON.stringify(widgetData));
    }, [storageKey, layouts, widgetData]);

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

    // Reload widgets and layouts from saved state (for cancel operation)
    // Accepts optional widgetCreator function that returns fresh widgets
    const reloadFromSaved = useCallback((widgetCreator) => {
        // Reload saved layouts from localStorage
        const saved = loadSavedLayouts();
        setLayouts(saved);
        
        // Use provided widget creator, or fall back to initialWidgets
        let freshWidgets;
        if (widgetCreator) {
            freshWidgets = widgetCreator();
        } else {
            freshWidgets = typeof initialWidgets === 'function' 
                ? initialWidgets() 
                : initialWidgets;
        }
        
        // Reset widgets to initial state with saved positions applied
        const reloadedWidgets = freshWidgets.map(widget => {
            const key = widget.key || widget.id;
            const savedLayout = saved.lg?.find(l => l.i === key);
            
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
        
        setWidgets(reloadedWidgets);
        
        // Reload saved widget data
        const savedData = loadSavedWidgetData();
        setWidgetData(savedData);
        
        // Reset expanded widgets to persisted state
        const persistedExpanded = reloadedWidgets
            .filter(widget => widget.persistedExpanded)
            .map(widget => widget.key || widget.id);
        setExpandedWidgets(persistedExpanded);
    }, [initialWidgets, loadSavedWidgetData]);

    return {
        widgets,
        layouts,
        widgetData,
        updateWidgetData,
        handleLayoutChange,
        saveLayoutsToStorage,
        addWidget,
        removeWidget,
        updateWidget,
        resetLayouts,
        reloadFromSaved,
        getWidget,
        expandedWidgets,
        handleExpandWidget,
        handleLockWidget,
        collapsedWidgets,
        setWidgetCollapsed
    };
};