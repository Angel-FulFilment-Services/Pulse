import React, { useState, useEffect, useRef } from 'react';
import { 
    PencilIcon, 
    PlusIcon,
    CheckIcon,
    XMarkIcon,
    Squares2X2Icon,
    ClockIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { 
    PencilSquareIcon,
    PlayIcon,
    PauseIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/solid';
import WidgetPickerDropdown from './WidgetPickerDropdown.jsx';

const ControlTray = ({
    isEditMode,
    onToggleEditMode,
    onAddWidget,
    currentWidgetIds = [],
    onSave,
    onCancel,
    presets = [],
    activePresetIndex = 0,
    onPresetChange,
    onAddPreset,
    onDeletePreset,
    onRenamePreset,
    isCycling = false,
    onToggleCycle,
    cycleInterval = 20,
    onCycleIntervalChange,
    hasUnsavedChanges = false,
    maxPresets = 10,
    isSmallScreen = false,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isHovering, setIsHovering] = useState(false);
    const [showPresetMenu, setShowPresetMenu] = useState(false);
    const [showCycleSettings, setShowCycleSettings] = useState(false);
    const [editingPresetName, setEditingPresetName] = useState(null);
    const [newPresetName, setNewPresetName] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showPresetLabel, setShowPresetLabel] = useState(false);
    const [displayedPresetName, setDisplayedPresetName] = useState('');
    const hideTimeoutRef = useRef(null);
    const transitionTimeoutRef = useRef(null);
    const presetLabelTimeoutRef = useRef(null);
    const trayRef = useRef(null);
    const presetMenuRef = useRef(null);
    const cycleSettingsRef = useRef(null);
    const prevActivePresetRef = useRef(activePresetIndex);

    // Show preset name briefly when preset changes
    useEffect(() => {
        if (prevActivePresetRef.current !== activePresetIndex && presets[activePresetIndex]) {
            // Clear any existing timeout
            if (presetLabelTimeoutRef.current) {
                clearTimeout(presetLabelTimeoutRef.current);
            }
            
            // Set the name and show it
            setDisplayedPresetName(presets[activePresetIndex].name || `Preset ${activePresetIndex + 1}`);
            setShowPresetLabel(true);
            
            // Hide after 2 seconds
            presetLabelTimeoutRef.current = setTimeout(() => {
                setShowPresetLabel(false);
            }, 2000);
        }
        prevActivePresetRef.current = activePresetIndex;
        
        return () => {
            if (presetLabelTimeoutRef.current) {
                clearTimeout(presetLabelTimeoutRef.current);
            }
        };
    }, [activePresetIndex, presets]);

    // Handle mouse enter/leave for visibility
    useEffect(() => {
        const handleMouseMove = (e) => {
            // Show tray when mouse is in the top 100px of the viewport
            const isNearTop = e.clientY < 100;
            
            if (isNearTop || isEditMode) {
                setIsVisible(true);
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                    hideTimeoutRef.current = null;
                }
            } else if (!isHovering && !isEditMode) {
                // Start hide timer
                if (!hideTimeoutRef.current) {
                    hideTimeoutRef.current = setTimeout(() => {
                        setIsVisible(false);
                        hideTimeoutRef.current = null;
                    }, 2000);
                }
            }
        };

        const handleMouseLeave = () => {
            if (!isEditMode && !isHovering) {
                hideTimeoutRef.current = setTimeout(() => {
                    setIsVisible(false);
                    hideTimeoutRef.current = null;
                }, 1000);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, [isEditMode, isHovering]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (presetMenuRef.current && !presetMenuRef.current.contains(e.target)) {
                setShowPresetMenu(false);
            }
            if (cycleSettingsRef.current && !cycleSettingsRef.current.contains(e.target)) {
                setShowCycleSettings(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Always visible during edit mode
    useEffect(() => {
        if (isEditMode) {
            setIsVisible(true);
        }
    }, [isEditMode]);

    const handlePresetClick = (index) => {
        if (index !== activePresetIndex && !isTransitioning) {
            onPresetChange(index);
            
            // Disable preset buttons during transition
            setIsTransitioning(true);
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
            transitionTimeoutRef.current = setTimeout(() => {
                setIsTransitioning(false);
            }, 1000); // Match total transition duration (300ms fade out + 50ms position + 400ms fade in + buffer)
        }
        setShowPresetMenu(false);
    };

    const handleAddPreset = () => {
        if (presets.length < maxPresets) {
            onAddPreset();
            setShowPresetMenu(false);
        }
    };

    const handleRenamePreset = (index, name) => {
        onRenamePreset(index, name);
        setEditingPresetName(null);
        setNewPresetName('');
    };

    // Hide the entire tray on small screens
    if (isSmallScreen) {
        return null;
    }

    return (
        <>
            {/* Top Control Tray */}
            <div
                ref={trayRef}
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 md:left-[288px] ${
                    isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
                }`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <div className="bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-dark-700 shadow-sm">
                    <div className="container mx-auto px-6 py-2">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left side - Edit mode controls */}
                            <div className="flex items-center gap-2">
                                {!isEditMode ? (
                                    <button
                                        onClick={onToggleEditMode}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        <span>Edit Dashboard</span>
                                    </button>
                                ) : (
                                    <>
                                        <WidgetPickerDropdown 
                                            onAddWidget={onAddWidget}
                                            currentWidgetIds={currentWidgetIds}
                                        />
                                        
                                        <div className="h-6 w-px bg-gray-200 dark:bg-dark-700 mx-1" />
                                        
                                        <button
                                            onClick={onSave}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-theme-500 hover:bg-theme-600 rounded-lg transition-colors"
                                        >
                                            <CheckIcon className="h-4 w-4" />
                                            <span>Save</span>
                                        </button>
                                        
                                        <button
                                            onClick={onCancel}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                            <span>Cancel</span>
                                        </button>
                                        
                                        {hasUnsavedChanges && (
                                            <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                                                Unsaved changes
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Center - Presets */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-800 rounded-lg p-1">
                                    {presets.map((preset, index) => (
                                        <button
                                            key={preset.id || index}
                                            onClick={() => handlePresetClick(index)}
                                            onDoubleClick={() => {
                                                if (isEditMode) {
                                                    setEditingPresetName(index);
                                                    setNewPresetName(preset.name || `Preset ${index + 1}`);
                                                }
                                            }}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                                index === activePresetIndex
                                                    ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 shadow-sm'
                                                    : 'text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200'
                                            }`}
                                            title={preset.name || `Preset ${index + 1}`}
                                        >
                                            {editingPresetName === index ? (
                                                <input
                                                    type="text"
                                                    value={newPresetName}
                                                    onChange={(e) => setNewPresetName(e.target.value)}
                                                    onBlur={() => handleRenamePreset(index, newPresetName)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleRenamePreset(index, newPresetName);
                                                        } else if (e.key === 'Escape') {
                                                            setEditingPresetName(null);
                                                        }
                                                    }}
                                                    className="w-16 px-1 py-0 text-xs bg-transparent border-b border-theme-500 focus:outline-none"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                preset.name || `${index + 1}`
                                            )}
                                        </button>
                                    ))}
                                    
                                    {isEditMode && presets.length < maxPresets && (
                                        <button
                                            onClick={handleAddPreset}
                                            className="p-1 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 rounded transition-colors"
                                            title="Add Preset"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                    
                                    {isEditMode && presets.length > 1 && (
                                        <button
                                            onClick={() => onDeletePreset(activePresetIndex)}
                                            className="p-1 text-red-400 hover:text-red-600 rounded transition-colors ml-1"
                                            title="Delete Current Preset"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Bottom center - Preset label, dots & cycle controls */}
            {!isEditMode && presets.length >= 1 && (
                <div className="fixed bottom-4 left-0 right-0 md:left-[288px] z-40 flex flex-col items-center pointer-events-none group">
                    {/* Preset name label - shows briefly when changing presets */}
                    <div 
                        className={`mb-2 transition-all duration-500 ${
                            showPresetLabel 
                                ? 'group-hover:opacity-100 opacity-50 translate-y-0' 
                                : 'opacity-0 translate-y-2'
                        }`}
                    >
                        <span className="text-md text-theme-500 font-semibold">
                            {displayedPresetName}
                        </span>
                    </div>
                    
                    {/* Preset dots & cycle controls */}
                    <div className="flex items-center gap-2 pointer-events-auto pt-2 border-t border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 px-6 hover:opacity-100 opacity-50 transition-opacity duration-500">
                        {/* Preset dots */}
                        {presets.map((preset, index) => (
                            <button
                                key={preset.id || index}
                                onClick={() => !isTransitioning && handlePresetClick(index)}
                                disabled={isTransitioning}
                                className={`h-3 rounded-full transition-all duration-300 ${
                                    isTransitioning ? 'cursor-not-allowed' : ''
                                } ${
                                    index === activePresetIndex 
                                        ? 'bg-theme-500 w-8' 
                                        : 'bg-gray-400/45 dark:bg-dark-500/70 w-3 hover:bg-gray-500/60'
                                }`}
                                title={preset.name || `Preset ${index + 1}`}
                            />
                        ))}
                        
                        {/* Play/Pause */}
                        <button 
                            onClick={onToggleCycle}
                            className="ml-1"
                            title={isCycling ? 'Pause cycling' : 'Start cycling'}
                        >
                            {isCycling ? (
                                <PauseIcon className="w-6 h-6 text-gray-400/45 hover:text-theme-500 cursor-pointer transition-colors stroke-2" />
                            ) : (
                                <PlayIcon className="w-6 h-6 text-gray-400/45 hover:text-theme-500 cursor-pointer transition-colors stroke-2" />
                            )}
                        </button>
                        
                        {/* Settings cog */}
                        <div className="relative flex items-center justify-center border-l border-gray-200 dark:border-dark-700 pl-2" ref={cycleSettingsRef}>
                            <button 
                                onClick={() => setShowCycleSettings(!showCycleSettings)}
                                className=""
                                title="Cycle settings"
                            >
                                <Cog6ToothIcon className={`w-6 h-6 cursor-pointer transition-colors ${
                                    showCycleSettings 
                                        ? 'text-theme-500' 
                                        : 'text-gray-400/45 hover:text-theme-500'
                                }`} />
                            </button>
                            
                            {showCycleSettings && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 p-3 z-50">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-dark-400 mb-1 block">
                                                Interval (seconds)
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="120"
                                                    step="5"
                                                    value={cycleInterval}
                                                    onChange={(e) => onCycleIntervalChange(parseInt(e.target.value))}
                                                    className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full appearance-none cursor-pointer accent-theme-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700 dark:text-dark-200 w-8 text-right">
                                                    {cycleInterval}s
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ControlTray;
