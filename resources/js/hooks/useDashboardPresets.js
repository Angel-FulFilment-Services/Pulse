import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { WIDGET_REGISTRY, DEFAULT_WIDGET_IDS, PERSISTENT_WIDGET_IDS } from '../Components/Dashboard/config/widgetConfig.js';

const STORAGE_KEY = 'dashboard-presets';
const CYCLE_STORAGE_KEY = 'dashboard-cycle-settings';
const MAX_PRESETS = 10;

/**
 * Hook for managing dashboard presets
 * Handles creation, deletion, renaming, and switching between preset configurations
 */
export const useDashboardPresets = (storageKey = STORAGE_KEY) => {
    // Load initial presets from localStorage
    const loadPresets = () => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load presets:', e);
        }
        
        // Return default preset with all default widgets
        return [{
            id: 'default',
            name: 'Default',
            widgets: DEFAULT_WIDGET_IDS,
            layouts: {},
            lockedWidgets: {},
            expandedSizes: {},
        }];
    };

    const loadCycleSettings = () => {
        try {
            const saved = localStorage.getItem(CYCLE_STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load cycle settings:', e);
        }
        return { interval: 20, enabled: false };
    };

    // Get initial preset index from URL
    const getInitialPresetIndex = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const presetParam = urlParams.get('preset');
        if (presetParam !== null) {
            const index = parseInt(presetParam, 10);
            const presetsData = loadPresets();
            if (!isNaN(index) && index >= 0 && index < presetsData.length) {
                return index;
            }
        }
        return 0;
    };

    const [presets, setPresets] = useState(loadPresets);
    const [activePresetIndex, setActivePresetIndex] = useState(getInitialPresetIndex);
    const [isCycling, setIsCycling] = useState(false);
    const [cycleInterval, setCycleInterval] = useState(20);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState('left'); // 'left' or 'right'
    
    // Pending changes - only applied on save
    const [pendingLockedWidgets, setPendingLockedWidgets] = useState(null);
    const [pendingWidgetChanges, setPendingWidgetChanges] = useState({ added: [], removed: [] });
    const cycleIntervalRef = useRef(null);

    // Update URL query parameters
    const updateUrlParams = useCallback((presetIndex, cycling) => {
        const url = new URL(window.location.href);
        
        // Update preset param
        if (presetIndex > 0) {
            url.searchParams.set('preset', presetIndex.toString());
        } else {
            url.searchParams.delete('preset');
        }
        
        // Update cycle param
        if (cycling) {
            url.searchParams.set('cycle', 'true');
        } else {
            url.searchParams.delete('cycle');
        }
        
        // Update URL without page reload
        window.history.replaceState({}, '', url.toString());
    }, []);

    // Load cycle settings on mount and check URL params
    useEffect(() => {
        const settings = loadCycleSettings();
        setCycleInterval(settings.interval);
        
        // Check for cycle query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const cycleParam = urlParams.get('cycle');
        if (cycleParam === 'true') {
            setIsCycling(true);
        }
    }, []);

    // Update URL when preset or cycling changes
    useEffect(() => {
        updateUrlParams(activePresetIndex, isCycling);
    }, [activePresetIndex, isCycling, updateUrlParams]);

    // Save presets to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(presets));
        } catch (e) {
            console.warn('Failed to save presets:', e);
        }
    }, [presets, storageKey]);

    // Save cycle settings
    useEffect(() => {
        try {
            localStorage.setItem(CYCLE_STORAGE_KEY, JSON.stringify({
                interval: cycleInterval,
                enabled: isCycling,
            }));
        } catch (e) {
            console.warn('Failed to save cycle settings:', e);
        }
    }, [cycleInterval, isCycling]);

    // Get current preset (base, without pending changes)
    const basePreset = presets[activePresetIndex] || presets[0];
    
    // Current preset merges base with pending changes for UI rendering
    const currentPreset = useMemo(() => {
        if (!basePreset) return null;
        
        // Apply pending widget changes
        let widgets = [...(basePreset.widgets || [])];
        pendingWidgetChanges.added.forEach(id => {
            if (!widgets.includes(id)) widgets.push(id);
        });
        pendingWidgetChanges.removed.forEach(id => {
            widgets = widgets.filter(w => w !== id);
        });
        
        return {
            ...basePreset,
            widgets,
            lockedWidgets: pendingLockedWidgets !== null 
                ? pendingLockedWidgets 
                : basePreset.lockedWidgets,
        };
    }, [basePreset, pendingLockedWidgets, pendingWidgetChanges]);

    // Get widgets for current preset, including persistent widgets
    const getPresetWidgets = useCallback(() => {
        if (!currentPreset) return [];
        
        const widgetIds = new Set(currentPreset.widgets || []);
        
        // Always include persistent widgets
        PERSISTENT_WIDGET_IDS.forEach(id => widgetIds.add(id));
        
        return Array.from(widgetIds);
    }, [currentPreset]);

    // Add a new preset
    const addPreset = useCallback(() => {
        if (presets.length >= MAX_PRESETS) return null;
        
        const newPreset = {
            id: `preset-${Date.now()}`,
            name: `Preset ${presets.length + 1}`,
            widgets: [...DEFAULT_WIDGET_IDS],
            layouts: {},
            lockedWidgets: {},
            expandedSizes: {},
        };
        
        const newIndex = presets.length;
        setPresets(prev => [...prev, newPreset]);
        setActivePresetIndex(newIndex);
        return newPreset;
    }, [presets.length]);

    // Delete a preset
    const deletePreset = useCallback((index) => {
        if (presets.length <= 1) return; // Can't delete the last preset
        
        setPresets(prev => {
            const newPresets = prev.filter((_, i) => i !== index);
            return newPresets;
        });
        
        // Adjust active index if needed
        if (activePresetIndex >= presets.length - 1) {
            setActivePresetIndex(Math.max(0, presets.length - 2));
        } else if (activePresetIndex > index) {
            setActivePresetIndex(prev => prev - 1);
        }
    }, [presets.length, activePresetIndex]);

    // Rename a preset
    const renamePreset = useCallback((index, newName) => {
        setPresets(prev => prev.map((preset, i) => 
            i === index ? { ...preset, name: newName || `Preset ${index + 1}` } : preset
        ));
    }, []);

    // Switch to a different preset with animation
    const switchPreset = useCallback((newIndex) => {
        if (newIndex === activePresetIndex || newIndex < 0 || newIndex >= presets.length) return;
        
        // Determine animation direction
        const direction = newIndex > activePresetIndex ? 'left' : 'right';
        setTransitionDirection(direction);
        setIsTransitioning(true);
        
        // Switch preset index immediately - the Dashboard will delay rendering the new widgets
        setActivePresetIndex(newIndex);
        
        // End transition after animation completes
        setTimeout(() => {
            setIsTransitioning(false);
        }, 400);
    }, [activePresetIndex, presets.length]);

    // Add widget to current preset (pending - only applied on save)
    const addWidgetToPreset = useCallback((widgetId) => {
        setPendingWidgetChanges(prev => {
            // If it was previously marked for removal, just remove from removed list
            if (prev.removed.includes(widgetId)) {
                return {
                    ...prev,
                    removed: prev.removed.filter(id => id !== widgetId),
                };
            }
            // Otherwise add to added list (if not already there)
            if (prev.added.includes(widgetId)) return prev;
            // Check if already in base preset
            if (basePreset?.widgets?.includes(widgetId)) return prev;
            return {
                ...prev,
                added: [...prev.added, widgetId],
            };
        });
    }, [basePreset]);

    // Remove widget from current preset (pending - only applied on save)
    const removeWidgetFromPreset = useCallback((widgetId) => {
        // Don't remove persistent widgets
        if (PERSISTENT_WIDGET_IDS.includes(widgetId)) return;
        
        setPendingWidgetChanges(prev => {
            // If it was previously marked for addition, just remove from added list
            if (prev.added.includes(widgetId)) {
                return {
                    ...prev,
                    added: prev.added.filter(id => id !== widgetId),
                };
            }
            // Otherwise add to removed list (if not already there)
            if (prev.removed.includes(widgetId)) return prev;
            return {
                ...prev,
                removed: [...prev.removed, widgetId],
            };
        });
    }, []);

    // Update layouts for current preset (and commit all pending changes)
    const updatePresetLayouts = useCallback((layouts) => {
        setPresets(prev => prev.map((preset, i) => {
            if (i !== activePresetIndex) return preset;
            
            // Apply pending widget changes
            let widgets = [...(preset.widgets || [])];
            pendingWidgetChanges.added.forEach(id => {
                if (!widgets.includes(id)) widgets.push(id);
            });
            pendingWidgetChanges.removed.forEach(id => {
                widgets = widgets.filter(w => w !== id);
            });
            
            return {
                ...preset,
                layouts,
                widgets,
                // Commit pending locked widgets if any
                lockedWidgets: pendingLockedWidgets !== null 
                    ? pendingLockedWidgets 
                    : preset.lockedWidgets,
            };
        }));
        // Clear all pending changes after commit
        setPendingLockedWidgets(null);
        setPendingWidgetChanges({ added: [], removed: [] });
    }, [activePresetIndex, pendingLockedWidgets, pendingWidgetChanges]);

    // Update locked widgets (pending - only applied on save)
    const updateLockedWidgets = useCallback((widgetId, isLocked, dimensions = null) => {
        setPendingLockedWidgets(prev => {
            // Start from current pending or base preset's locked widgets
            const base = prev !== null ? prev : (basePreset?.lockedWidgets || {});
            const newLockedWidgets = { ...base };
            if (isLocked && dimensions) {
                newLockedWidgets[widgetId] = dimensions;
            } else {
                delete newLockedWidgets[widgetId];
            }
            return newLockedWidgets;
        });
    }, [basePreset]);
    
    // Discard pending changes
    const discardPendingChanges = useCallback(() => {
        setPendingLockedWidgets(null);
        setPendingWidgetChanges({ added: [], removed: [] });
    }, []);

    // Cycle to next preset
    const cycleToNext = useCallback(() => {
        const nextIndex = (activePresetIndex + 1) % presets.length;
        switchPreset(nextIndex);
    }, [activePresetIndex, presets.length, switchPreset]);

    // Toggle cycling
    const toggleCycle = useCallback(() => {
        setIsCycling(prev => !prev);
    }, []);

    // Update cycle interval
    const updateCycleInterval = useCallback((interval) => {
        setCycleInterval(Math.max(5, Math.min(120, interval)));
    }, []);

    // Handle auto-cycling
    useEffect(() => {
        if (isCycling && presets.length > 1) {
            cycleIntervalRef.current = setInterval(() => {
                cycleToNext();
            }, cycleInterval * 1000);
            
            return () => {
                if (cycleIntervalRef.current) {
                    clearInterval(cycleIntervalRef.current);
                }
            };
        } else if (cycleIntervalRef.current) {
            clearInterval(cycleIntervalRef.current);
            cycleIntervalRef.current = null;
        }
    }, [isCycling, cycleInterval, presets.length, cycleToNext]);

    // Duplicate a preset
    const duplicatePreset = useCallback((index) => {
        if (presets.length >= MAX_PRESETS) return null;
        
        const source = presets[index];
        const newPreset = {
            ...source,
            id: `preset-${Date.now()}`,
            name: `${source.name} (Copy)`,
        };
        
        setPresets(prev => [...prev, newPreset]);
        return newPreset;
    }, [presets]);
    
    // Get base preset widgets (without pending changes) - used for cancel/reload
    const getBasePresetWidgets = useCallback(() => {
        if (!basePreset) return [];
        
        const widgetIds = new Set(basePreset.widgets || []);
        
        // Always include persistent widgets
        PERSISTENT_WIDGET_IDS.forEach(id => widgetIds.add(id));
        
        return Array.from(widgetIds);
    }, [basePreset]);

    return {
        presets,
        activePresetIndex,
        currentPreset,
        getPresetWidgets,
        getBasePresetWidgets,
        addPreset,
        deletePreset,
        renamePreset,
        duplicatePreset,
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
        maxPresets: MAX_PRESETS,
        persistentWidgetIds: PERSISTENT_WIDGET_IDS,
    };
};

export default useDashboardPresets;
