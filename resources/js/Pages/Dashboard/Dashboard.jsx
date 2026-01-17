import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

// Import grid and control components
import DraggableGrid from '../../Components/Dashboard/DraggableGrid.jsx';
import ControlTray from '../../Components/Dashboard/ControlTray.jsx';

// Import hooks
import { useWidgetLayout } from '../../hooks/useWidgetLayout.js';
import { useDashboardPresets } from '../../hooks/useDashboardPresets.js';
import { useUserStates } from '../../Components/Context/ActiveStateContext';

// Import widget factory
import { createWidgets } from '../../Components/Dashboard/widgetFactory.jsx';
import { PERSISTENT_WIDGET_IDS, WIDGET_REGISTRY } from '../../Components/Dashboard/config/widgetConfig.js';

const Dashboard = ({ token }) => {
    const { employee } = usePage().props;
    const { userStates } = useUserStates();
    
    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Track if we're in small screen mode (single column layout)
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1120);
    
    // Track viewport width for small screen detection
    useEffect(() => {
        const handleResize = () => {
            const small = window.innerWidth < 1120;
            console.log('Viewport resize, isSmallScreen:', small);
            setIsSmallScreen(small);
            // Auto-exit edit mode when entering small screen
            if (small && isEditMode) {
                setIsEditMode(false);
                setHasUnsavedChanges(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isEditMode]);
    
    // Preset management
    const {
        presets,
        activePresetIndex,
        currentPreset,
        getPresetWidgets,
        getBasePresetWidgets,
        addPreset,
        deletePreset,
        renamePreset,
        switchPreset,
        addWidgetToPreset,
        removeWidgetFromPreset,
        updatePresetLayouts,
        updateLockedWidgets,
        discardPendingChanges,
        isCycling,
        cycleInterval,
        toggleCycle,
        updateCycleInterval,
        isTransitioning,
        transitionDirection,
        maxPresets,
        persistentWidgetIds,
    } = useDashboardPresets();

    // Props to pass to widgets
    const widgetProps = useMemo(() => ({
        employee,
        userStates,
        isEditMode,
    }), [employee, userStates, isEditMode]);

    // Track the preset we're actually rendering (delayed during transitions)
    const [renderedPresetIndex, setRenderedPresetIndex] = useState(activePresetIndex);
    const previousWidgetsRef = useRef(null);
    
    // Only update renderedPresetIndex after transition exit animation completes
    useEffect(() => {
        if (!isTransitioning && renderedPresetIndex !== activePresetIndex) {
            setRenderedPresetIndex(activePresetIndex);
        }
    }, [isTransitioning, activePresetIndex, renderedPresetIndex]);

    // Get the preset we should render (may be delayed during transitions)
    const presetToRender = isTransitioning ? presets[renderedPresetIndex] : currentPreset;

    // Create widget function for the current preset
    const getWidgetsForPreset = useCallback(() => {
        // During transitions, use the old preset
        const baseWidgetIds = presetToRender?.widgets || [];
        // Create a new array to avoid mutation
        const widgetIds = [...baseWidgetIds];
        // Always include persistent widgets at the start
        PERSISTENT_WIDGET_IDS.forEach(id => {
            if (!widgetIds.includes(id)) {
                widgetIds.unshift(id);
            }
        });
        
        return createWidgets(
            widgetIds, 
            widgetProps, 
            presetToRender?.layouts || {}, 
            presetToRender?.lockedWidgets || {}
        );
    }, [presetToRender, widgetProps]);
    
    // Create widget function from base preset (without pending changes) - for cancel
    const getBaseWidgetsForPreset = useCallback(() => {
        const baseWidgetIds = getBasePresetWidgets();
        
        return createWidgets(
            baseWidgetIds, 
            widgetProps, 
            presetToRender?.layouts || {}, 
            presetToRender?.lockedWidgets || {}
        );
    }, [getBasePresetWidgets, presetToRender, widgetProps]);
    // Widget layout management
    const { 
        widgets, 
        layouts, 
        widgetData,
        updateWidgetData,
        handleLayoutChange: baseHandleLayoutChange, 
        expandedWidgets, 
        handleExpandWidget, 
        handleLockWidget: baseLockWidget,
        removeWidget: baseRemoveWidget,
        addWidget,
        collapsedWidgets,
        setWidgetCollapsed,
        reloadFromSaved,
        saveLayoutsToStorage
    } = useWidgetLayout(
        getWidgetsForPreset, 
        `dashboard-preset-${presetToRender?.id || 'default'}`,
        isEditMode
    );

    // Handle widget data changes (e.g., section divider titles)
    const handleWidgetDataChange = useCallback((widgetId, data) => {
        updateWidgetData(widgetId, data);
        if (isEditMode) {
            setHasUnsavedChanges(true);
        }
    }, [updateWidgetData, isEditMode]);

    // Handle layout changes and track unsaved changes
    const handleLayoutChange = useCallback((layout, allLayouts) => {
        baseHandleLayoutChange(layout, allLayouts);
        if (isEditMode) {
            setHasUnsavedChanges(true);
        }
    }, [baseHandleLayoutChange, isEditMode]);

    // Handle lock widget with dimension tracking
    const handleLockWidget = useCallback((widgetKey) => {
        const widget = widgets.find(w => (w.key || w.id) === widgetKey);
        const isWidgetExpanded = expandedWidgets.includes(widgetKey);
        
        if (widget) {
            const isCurrentlyLocked = widget.locked;
            if (!isCurrentlyLocked) {
                // Locking - save the widget's BASE dimensions (not expanded dimensions)
                // The expanded flag will be used to re-expand on load
                updateLockedWidgets(widgetKey, true, {
                    w: widget.w,
                    h: widget.h,
                    expanded: isWidgetExpanded,
                });
            } else {
                // Unlocking - also collapse if it's expanded
                updateLockedWidgets(widgetKey, false);
                if (isWidgetExpanded) {
                    handleExpandWidget(widgetKey); // Toggle to collapse
                }
            }
        }
        
        baseLockWidget(widgetKey);
        setHasUnsavedChanges(true);
    }, [widgets, baseLockWidget, updateLockedWidgets, expandedWidgets, handleExpandWidget]);

    // Handle remove widget
    const handleRemoveWidget = useCallback((widgetKey) => {
        removeWidgetFromPreset(widgetKey);
        baseRemoveWidget(widgetKey);
        setHasUnsavedChanges(true);
    }, [removeWidgetFromPreset, baseRemoveWidget]);

    // Handle add widget from picker
    const handleAddWidget = useCallback((widgetId) => {
        // For layout widgets (spacer, divider), generate unique instance IDs
        const baseConfig = WIDGET_REGISTRY[widgetId];
        let instanceId = widgetId;
        
        if (baseConfig?.allowMultiple) {
            // Find the next available instance number from current preset
            // Use regex to match exact widget ID followed by underscore and number
            const currentWidgetIds = currentPreset?.widgets || [];
            const instancePattern = new RegExp(`^${widgetId}_(\\d+)$`);
            const existingInstances = currentWidgetIds.filter(id => 
                id === widgetId || instancePattern.test(id)
            );
            instanceId = `${widgetId}_${existingInstances.length + 1}`;
        }
        
        addWidgetToPreset(instanceId);
        
        // Create the new widget and add to current layout
        // Place at y: 999 to ensure it goes to the bottom - the grid's vertical 
        // compaction will move it up to the first available slot
        const newWidgets = createWidgets([instanceId], widgetProps, {}, {});
        if (newWidgets.length > 0) {
            const newWidget = {
                ...newWidgets[0],
                x: 0,
                y: 999, // High value - grid compaction will place it at the bottom
            };
            addWidget(newWidget);
        }
        
        setHasUnsavedChanges(true);
    }, [addWidgetToPreset, widgetProps, addWidget, currentPreset]);

    // Toggle edit mode
    const handleToggleEditMode = useCallback(() => {
        if (isEditMode && hasUnsavedChanges) {
            // Exiting edit mode without saving - could add confirmation
        }
        setIsEditMode(prev => !prev);
        if (!isEditMode) {
            // Entering edit mode
            setHasUnsavedChanges(false);
        }
    }, [isEditMode, hasUnsavedChanges]);

    // Save changes
    const handleSave = useCallback(() => {
        // Save layouts to localStorage and to current preset
        saveLayoutsToStorage();
        updatePresetLayouts(layouts);
        setHasUnsavedChanges(false);
        setIsEditMode(false);
    }, [layouts, updatePresetLayouts, saveLayoutsToStorage]);

    // Cancel changes
    const handleCancel = useCallback(() => {
        // Discard pending changes first
        discardPendingChanges();
        setHasUnsavedChanges(false);
        setIsEditMode(false);
        
        // Reload using base widgets (without pending changes)
        reloadFromSaved(getBaseWidgetsForPreset);
    }, [discardPendingChanges, reloadFromSaved, getBaseWidgetsForPreset]);

    // Handle preset change
    const handlePresetChange = useCallback((index) => {
        if (hasUnsavedChanges) {
            // Discard pending changes when switching presets
            discardPendingChanges();
        }
        switchPreset(index);
        setHasUnsavedChanges(false);
    }, [switchPreset, hasUnsavedChanges, discardPendingChanges]);

    // Handle add preset
    const handleAddPreset = useCallback(() => {
        addPreset();
    }, [addPreset]);

    // Handle delete preset
    const handleDeletePreset = useCallback((index) => {
        if (presets.length > 1) {
            deletePreset(index);
        }
    }, [deletePreset, presets.length]);

    // Get current widget IDs for the picker
    const currentWidgetIds = useMemo(() => {
        return widgets.map(w => w.key || w.id);
    }, [widgets]);

    // Disable cycling while in edit mode
    useEffect(() => {
        if (isEditMode && isCycling) {
            toggleCycle();
        }
    }, [isEditMode, isCycling, toggleCycle]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-800">
            <div className="container mx-auto p-6 relative">
                {/* Control Tray */}
                <ControlTray
                    isEditMode={isEditMode}
                    onToggleEditMode={handleToggleEditMode}
                    onAddWidget={handleAddWidget}
                    currentWidgetIds={currentWidgetIds}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    presets={presets}
                    activePresetIndex={activePresetIndex}
                    onPresetChange={handlePresetChange}
                    onAddPreset={handleAddPreset}
                    onDeletePreset={handleDeletePreset}
                    onRenamePreset={renamePreset}
                    isCycling={isCycling}
                    onToggleCycle={toggleCycle}
                    cycleInterval={cycleInterval}
                    onCycleIntervalChange={updateCycleInterval}
                    hasUnsavedChanges={hasUnsavedChanges}
                    maxPresets={maxPresets}
                    isSmallScreen={isSmallScreen}
                />
                {/* Draggable Grid */}
                <DraggableGrid
                    widgets={widgets}
                    savedLayouts={layouts}
                    onLayoutChange={handleLayoutChange}
                    expandedWidgets={expandedWidgets}
                    onExpandWidget={handleExpandWidget}
                    onLockWidget={handleLockWidget}
                    onRemoveWidget={handleRemoveWidget}
                    dragEnabled={true}
                    isEditMode={isEditMode}
                    isTransitioning={isTransitioning}
                    transitionDirection={transitionDirection}
                    persistentWidgetIds={persistentWidgetIds}
                    presetId={presetToRender?.id || 'default'}
                    collapsedWidgets={collapsedWidgets}
                    setWidgetCollapsed={setWidgetCollapsed}
                    widgetData={widgetData}
                    onWidgetDataChange={handleWidgetDataChange}
                    className="dashboard-grid"
                />
            </div>
        </div>
    );
};

export default Dashboard;