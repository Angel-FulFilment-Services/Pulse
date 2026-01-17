import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { PlusIcon, ChevronDownIcon, MinusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { 
    WIDGET_REGISTRY, 
    WIDGET_CATEGORIES, 
    CATEGORY_LABELS,
    getWidgetsByCategory,
    getAvailableCategories 
} from './config/widgetConfig.js';

// Category descriptions
const CATEGORY_DESCRIPTIONS = {
    [WIDGET_CATEGORIES.CORE]: 'Persistent widgets that remain visible across all presets and transitions.',
    [WIDGET_CATEGORIES.PERSONAL]: 'Personal widgets for your dashboard including schedules, stats, and quick info.',
    [WIDGET_CATEGORIES.LAYOUT]: 'Spacers and dividers to organize and structure your dashboard layout.',
};

// Lazy load widget components for preview
const widgetComponents = {
    // Core
    GreetingWidget: lazy(() => import('./Widgets/Core/GreetingWidget.jsx')),
    AnnouncementsWidget: lazy(() => import('./Widgets/Core/AnnouncementsWidget.jsx')),
    // Personal
    TodayScheduleWidget: lazy(() => import('./Widgets/Personal/TodayScheduleWidget.jsx')),
    WeeklyScheduleWidget: lazy(() => import('./Widgets/Personal/WeeklyScheduleWidget.jsx')),
    ShiftStatsWidget: lazy(() => import('./Widgets/Personal/ShiftStatsWidget.jsx')),
    AttendanceStatsWidget: lazy(() => import('./Widgets/Personal/AttendanceStatsWidget.jsx')),
    ManagersOnDutyWidget: lazy(() => import('./Widgets/Personal/ManagersOnDutyWidget.jsx')),
    KnowledgeBaseWidget: lazy(() => import('./Widgets/Personal/KnowledgeBaseWidget.jsx')),
    EquipmentStatusWidget: lazy(() => import('./Widgets/Personal/EquipmentStatusWidget.jsx')),
    BadgesWidget: lazy(() => import('./Widgets/Personal/BadgesWidget.jsx')),
    PayrollWidget: lazy(() => import('./Widgets/Personal/PayrollWidget.jsx')),
    MessagesWidget: lazy(() => import('./Widgets/Personal/MessagesWidget.jsx')),
    // Layout
    DividerWidget: lazy(() => import('./Widgets/Layout/DividerWidget.jsx')),
    SectionDividerWidget: lazy(() => import('./Widgets/Layout/SectionDividerWidget.jsx')),
    SpacerWidget: lazy(() => import('./Widgets/Layout/SpacerWidget.jsx')),
};

// Preview skeleton while loading
const PreviewSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-1.5"></div>
        <div className="h-2 bg-gray-100 dark:bg-dark-800 rounded w-1/2"></div>
    </div>
);

// Layout Widget Preview Card - simpler design for dividers/spacers
const LayoutPreviewCard = ({ widget, onAdd }) => {
    const IconComponent = widget.headerIcon;
    const WidgetComponent = widgetComponents[widget.component];

    return (
        <button
            onClick={() => onAdd(widget.id)}
            className="w-full text-left bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 hover:border-theme-400 dark:hover:border-theme-600 hover:shadow-md cursor-pointer transition-all duration-150 overflow-hidden"
        >
            {/* Preview */}
            <div className="relative overflow-hidden bg-gray-50 dark:bg-dark-900 p-3" style={{ height: 60 }}>
                <Suspense fallback={<PreviewSkeleton />}>
                    {WidgetComponent && (
                        <WidgetComponent isPreview={true} />
                    )}
                </Suspense>
            </div>

            {/* Info */}
            <div className="px-2.5 py-2 flex items-center gap-2">
                {IconComponent && (
                    <IconComponent className="h-4 w-4 text-gray-400 dark:text-dark-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-gray-900 dark:text-dark-100 truncate">
                        {widget.title || 'Widget'}
                    </h4>
                    <p className="text-[10px] text-gray-400 dark:text-dark-500 truncate">
                        {widget.description}
                    </p>
                </div>
                <PlusIcon className="h-3.5 w-3.5 text-theme-500 flex-shrink-0" />
            </div>
        </button>
    );
};

// Widget Preview Card - compact version for dropdown
const WidgetPreviewCard = ({ widget, onAdd, isAlreadyAdded }) => {
    const WidgetComponent = widgetComponents[widget.component];
    const IconComponent = widget.headerIcon;
    
    // Allow multiple if specified, otherwise check if already added
    const canAdd = widget.allowMultiple || !isAlreadyAdded;

    // Smaller preview for dropdown
    const previewScale = 0.25;

    return (
        <button
            onClick={() => canAdd && onAdd(widget.id)}
            disabled={!canAdd}
            className={`w-full text-left bg-white dark:bg-dark-800 rounded-lg border transition-all duration-150 overflow-hidden ${
                !canAdd
                    ? 'border-gray-200 dark:border-dark-700 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-dark-700 hover:border-theme-400 dark:hover:border-theme-600 hover:shadow-md cursor-pointer'
            }`}
        >
            {/* Widget Preview */}
            <div 
                className="relative overflow-hidden bg-gray-50 dark:bg-dark-900 p-1.5"
                style={{ height: 100 }}
            >
                <div 
                    className="origin-top-left pointer-events-none"
                    style={{ 
                        transform: `scale(${previewScale})`,
                        width: `${100 / previewScale}%`,
                        height: `${100 / previewScale}%`,
                    }}
                >
                    <div className="bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                        {widget.showHeader !== false && (
                            <div className="px-3 py-2 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium text-gray-900 dark:text-dark-100">
                                        {widget.title || 'Widget'}
                                    </span>
                                    {IconComponent && (
                                        <IconComponent className="h-4 w-4 text-gray-400 dark:text-dark-500" />
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="p-3">
                            <Suspense fallback={<PreviewSkeleton />}>
                                {WidgetComponent && (
                                    <WidgetComponent isPreview={true} />
                                )}
                            </Suspense>
                        </div>
                    </div>
                </div>
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-dark-800 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Widget Info */}
            <div className="px-2.5 py-2 flex items-center gap-2">
                {IconComponent && (
                    <IconComponent className="h-4 w-4 text-gray-400 dark:text-dark-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-gray-900 dark:text-dark-100 truncate">
                        {widget.title || 'Widget'}
                    </h4>
                </div>
                {!canAdd ? (
                    <span className="text-[10px] text-gray-400 dark:text-dark-500 flex-shrink-0">Added</span>
                ) : (
                    <PlusIcon className="h-3.5 w-3.5 text-theme-500 flex-shrink-0" />
                )}
            </div>
        </button>
    );
};

const WidgetPickerDropdown = ({ onAddWidget, currentWidgetIds = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(WIDGET_CATEGORIES.PERSONAL);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const categories = getAvailableCategories();

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(e.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const widgetsInCategory = getWidgetsByCategory(activeCategory);

    const handleAddWidget = (widgetId) => {
        onAddWidget(widgetId);
        // Don't close - allow adding multiple widgets
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
                    isOpen
                        ? 'text-theme-700 dark:text-theme-300 bg-theme-100 dark:bg-theme-900/30 border-theme-300 dark:border-theme-700'
                        : 'text-theme-600 dark:text-theme-400 hover:bg-theme-50 dark:hover:bg-theme-900/20 border-theme-200 dark:border-theme-800'
                }`}
            >
                <PlusIcon className="h-4 w-4" />
                <span>Add Widget</span>
                <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-2 w-[580px] bg-white dark:bg-dark-900 rounded-xl shadow-xl border border-gray-200 dark:border-dark-700 overflow-hidden z-50"
                >
                    {/* Category Tabs */}
                    <div className="">
                        <div className="flex border-b border-gray-200 dark:border-dark-700">
                            {categories.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`relative text-xs font-medium transition-colors h-10 text-center flex items-center justify-center w-full ${
                                        activeCategory === key
                                            ? 'text-theme-600 dark:text-theme-400'
                                            : 'text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-800/50'
                                    }`}
                                >
                                    {label}
                                    {/* Active indicator */}
                                    {activeCategory === key && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-500 dark:bg-theme-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Description */}
                    {CATEGORY_DESCRIPTIONS[activeCategory] && (
                        <div className="px-3 py-2 bg-gray-50/50 dark:bg-dark-800/50 border-b border-gray-100 dark:border-dark-800">
                            <p className="text-xs text-gray-500 dark:text-dark-400">
                                {CATEGORY_DESCRIPTIONS[activeCategory]}
                            </p>
                        </div>
                    )}

                    {/* Widget Grid */}
                    <div className="p-3 max-h-[500px] overflow-y-auto">
                        {widgetsInCategory.length > 0 ? (
                            activeCategory === WIDGET_CATEGORIES.LAYOUT ? (
                                // Layout widgets use a simpler 2-column layout
                                <div className="grid grid-cols-2 gap-2">
                                    {widgetsInCategory.map((widget) => (
                                        <LayoutPreviewCard
                                            key={widget.id}
                                            widget={widget}
                                            onAdd={handleAddWidget}
                                        />
                                    ))}
                                </div>
                            ) : (
                                // Regular widgets use 3-column layout
                                <div className="grid grid-cols-3 gap-2">
                                    {widgetsInCategory.map((widget) => {
                                        // Check if widget is already added - use exact match only
                                        const isAlreadyAdded = currentWidgetIds.includes(widget.id);
                                        return (
                                            <WidgetPreviewCard
                                                key={widget.id}
                                                widget={widget}
                                                onAdd={handleAddWidget}
                                                isAlreadyAdded={isAlreadyAdded}
                                            />
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mb-2">
                                    <PlusIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-dark-400">
                                    No widgets in this category
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 bg-gray-50 dark:bg-dark-800 border-t border-gray-100 dark:border-dark-800">
                        <p className="text-[10px] text-gray-400 dark:text-dark-500 text-center">
                            Click a widget to add it • {currentWidgetIds.length} widgets on dashboard
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WidgetPickerDropdown;
