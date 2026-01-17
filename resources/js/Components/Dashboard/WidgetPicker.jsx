import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { 
    WIDGET_REGISTRY, 
    WIDGET_CATEGORIES, 
    CATEGORY_LABELS,
    getWidgetsByCategory,
    getAvailableCategories 
} from './config/widgetConfig.js';

// Lazy load widget components for preview
const widgetComponents = {
    WelcomeCard: lazy(() => import('./Widgets/WelcomeCard.jsx')),
    AnnouncementsWidget: lazy(() => import('./Widgets/AnnouncementsWidget.jsx')),
    ScheduleCard: lazy(() => import('./Widgets/ScheduleCard.jsx')),
    ScheduleWidget: lazy(() => import('./Widgets/ScheduleWidget.jsx')),
    QuickStatsCard: lazy(() => import('./Widgets/QuickStatsCard.jsx')),
    PerformanceInsightsWidget: lazy(() => import('./Widgets/PerformanceInsightsWidget.jsx')),
    ManagersOnDutyCard: lazy(() => import('./Widgets/ManagersOnDutyCard.jsx')),
    KnowledgeBaseWidget: lazy(() => import('./Widgets/KnowledgeBaseWidget.jsx')),
    EquipmentStatusWidget: lazy(() => import('./Widgets/EquipmentStatusWidget.jsx')),
    BadgeWidget: lazy(() => import('./Widgets/BadgeWidget.jsx')),
    PayrollSummaryWidget: lazy(() => import('./Widgets/PayrollSummaryWidget.jsx')),
};

// Preview skeleton while loading
const PreviewSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-100 dark:bg-dark-800 rounded w-1/2"></div>
    </div>
);

// Widget Preview Card
const WidgetPreviewCard = ({ widget, onAdd, isAlreadyAdded }) => {
    const [isHovered, setIsHovered] = useState(false);
    const WidgetComponent = widgetComponents[widget.component];
    const IconComponent = widget.headerIcon;

    // Calculate preview scale based on widget size
    const previewScale = Math.min(0.35, 200 / (widget.defaultSize.w * 100));
    const previewHeight = Math.min(180, widget.defaultSize.h * 30);

    return (
        <div
            className={`relative bg-white dark:bg-dark-800 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                isAlreadyAdded
                    ? 'border-gray-200 dark:border-dark-700 opacity-50 cursor-not-allowed'
                    : isHovered
                    ? 'border-theme-400 dark:border-theme-600 shadow-lg scale-[1.02]'
                    : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Widget Preview */}
            <div 
                className="relative overflow-hidden bg-gray-50 dark:bg-dark-900 p-2"
                style={{ height: previewHeight }}
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
                            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                                <div className="flex items-center gap-2">
                                    {IconComponent && (
                                        <IconComponent className="h-5 w-5 text-gray-400 dark:text-dark-500" />
                                    )}
                                    <span className="text-sm font-medium text-gray-900 dark:text-dark-100">
                                        {widget.title || 'Widget'}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="p-4">
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
            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                            {widget.title || 'Widget'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 line-clamp-2">
                            {widget.description}
                        </p>
                    </div>
                    
                    {!isAlreadyAdded && (
                        <button
                            onClick={() => onAdd(widget.id)}
                            className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                                isHovered
                                    ? 'bg-theme-500 text-white scale-110'
                                    : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-400 hover:bg-theme-100 dark:hover:bg-theme-900/20 hover:text-theme-600 dark:hover:text-theme-400'
                            }`}
                        >
                            <PlusIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                {isAlreadyAdded && (
                    <span className="inline-flex items-center mt-2 text-xs text-gray-400 dark:text-dark-500">
                        Already added
                    </span>
                )}
            </div>
        </div>
    );
};

const WidgetPicker = ({ isOpen, onClose, onAddWidget, currentWidgetIds = [] }) => {
    const [activeCategory, setActiveCategory] = useState(WIDGET_CATEGORIES.GENERAL);
    const modalRef = useRef(null);
    const categories = getAvailableCategories();

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const widgetsInCategory = getWidgetsByCategory(activeCategory);

    const handleAddWidget = (widgetId) => {
        onAddWidget(widgetId);
        // Don't close - allow adding multiple widgets
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
            <div
                ref={modalRef}
                className="w-full max-w-4xl max-h-[calc(100vh-160px)] bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-700 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                            Add Widget
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-dark-400 mt-0.5">
                            Choose a widget to add to your dashboard
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:text-dark-500 dark:hover:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="px-6 pt-4 border-b border-gray-200 dark:border-dark-700">
                    <div className="flex gap-1">
                        {categories.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
                                    activeCategory === key
                                        ? 'text-theme-600 dark:text-theme-400 bg-theme-50 dark:bg-theme-900/20'
                                        : 'text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-800'
                                }`}
                            >
                                {label}
                                {activeCategory === key && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Widget Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {widgetsInCategory.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {widgetsInCategory.map((widget) => (
                                <WidgetPreviewCard
                                    key={widget.id}
                                    widget={widget}
                                    onAdd={handleAddWidget}
                                    isAlreadyAdded={currentWidgetIds.includes(widget.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mb-4">
                                <PlusIcon className="h-8 w-8 text-gray-400 dark:text-dark-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-100 mb-1">
                                No widgets available
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-dark-400">
                                Widgets in this category are coming soon
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-dark-400">
                            {currentWidgetIds.length} widgets currently on dashboard
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WidgetPicker;
