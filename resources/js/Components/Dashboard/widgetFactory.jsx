/**
 * Widget Factory
 * 
 * Creates widget instances from the widget registry configuration.
 * Handles dynamic component loading and prop injection.
 */

import React from 'react';
import { WIDGET_REGISTRY } from './config/widgetConfig.js';

// Import all widget components
import GreetingWidget from './Widgets/Core/GreetingWidget.jsx';
import AnnouncementsWidget from './Widgets/Core/AnnouncementsWidget.jsx';
import TodayScheduleWidget from './Widgets/Personal/TodayScheduleWidget.jsx';
import WeeklyScheduleWidget from './Widgets/Personal/WeeklyScheduleWidget.jsx';
import ShiftStatsWidget from './Widgets/Personal/ShiftStatsWidget.jsx';
import AttendanceStatsWidget from './Widgets/Personal/AttendanceStatsWidget.jsx';
import ManagersOnDutyWidget from './Widgets/Personal/ManagersOnDutyWidget.jsx';
import KnowledgeBaseWidget from './Widgets/Personal/KnowledgeBaseWidget.jsx';
import EquipmentStatusWidget from './Widgets/Personal/EquipmentStatusWidget.jsx';
import BadgesWidget from './Widgets/Personal/BadgesWidget.jsx';
import PayrollWidget from './Widgets/Personal/PayrollWidget.jsx';
import MessagesWidget from './Widgets/Personal/MessagesWidget.jsx';
import DividerWidget from './Widgets/Layout/DividerWidget.jsx';
import SectionDividerWidget from './Widgets/Layout/SectionDividerWidget.jsx';
import SpacerWidget from './Widgets/Layout/SpacerWidget.jsx';

// Component map for dynamic rendering
const COMPONENT_MAP = {
    GreetingWidget,
    AnnouncementsWidget,
    TodayScheduleWidget,
    WeeklyScheduleWidget,
    ShiftStatsWidget,
    AttendanceStatsWidget,
    ManagersOnDutyWidget,
    KnowledgeBaseWidget,
    EquipmentStatusWidget,
    BadgesWidget,
    PayrollWidget,
    MessagesWidget,
    DividerWidget,
    SectionDividerWidget,
    SpacerWidget,
};

/**
 * Create a single widget instance from its ID
 * 
 * @param {string} widgetId - The widget ID from the registry (may include instance suffix like "spacer_1")
 * @param {Object} props - Props to pass to the widget (employee, userStates, etc.)
 * @param {Object} layoutOverrides - Optional layout overrides (x, y, w, h, locked)
 * @returns {Object|null} Widget configuration object for DraggableGrid
 */
export const createWidget = (widgetId, props = {}, layoutOverrides = {}) => {
    // First try exact match
    let config = WIDGET_REGISTRY[widgetId];
    
    // If not found, check if this is an instance of a multi-instance widget (e.g., "spacer_1", "divider_2")
    // Only do this for widgets that have allowMultiple: true
    if (!config) {
        // Try to find the base widget by checking each registered widget
        for (const [registryId, registryConfig] of Object.entries(WIDGET_REGISTRY)) {
            if (registryConfig.allowMultiple) {
                // Check if widgetId matches pattern: baseId_number
                const pattern = new RegExp(`^${registryId}_(\\d+)$`);
                if (pattern.test(widgetId)) {
                    config = registryConfig;
                    break;
                }
            }
        }
    }
    
    if (!config) {
        console.warn(`Widget "${widgetId}" not found in registry`);
        return null;
    }

    const Component = COMPONENT_MAP[config.component];
    if (!Component) {
        console.warn(`Component "${config.component}" not found for widget "${widgetId}"`);
        return null;
    }

    // Build props for the component
    const componentProps = {};
    config.requiresProps?.forEach(propName => {
        if (props[propName] !== undefined) {
            componentProps[propName] = props[propName];
        }
    });

    // Get header icon component
    const IconComponent = config.headerIcon;
    const headerAction = IconComponent ? (
        <IconComponent className="h-5 w-5 text-gray-400 dark:text-dark-500" />
    ) : null;

    // Determine if this widget can be resized
    // Only spacers can be resized (unless explicitly set in config)
    const canResize = config.canResize ?? false;

    return {
        id: widgetId,
        key: widgetId,
        title: config.title,
        content: <Component {...componentProps} />,
        headerAction,
        showHeader: config.showHeader !== false,
        canExpand: config.canExpand !== false,
        canRefresh: config.canRefresh || false,
        persistent: config.persistent || false,
        startCollapsed: config.startCollapsed || false,
        locked: layoutOverrides.locked ?? config.locked ?? false,
        persistedExpanded: layoutOverrides.persistedExpanded || false,
        isLayoutWidget: config.isLayoutWidget || false,
        canResize,
        
        // Layout properties
        x: layoutOverrides.x ?? 0,
        y: layoutOverrides.y ?? 0,
        w: layoutOverrides.w ?? config.defaultSize.w,
        h: layoutOverrides.h ?? config.defaultSize.h,
        minW: config.minSize?.w || 2,
        minH: config.minSize?.h || 3,
        maxW: config.maxSize?.w || 12,
        maxH: config.maxSize?.h || 12,
        maxExpandedW: config.maxExpandedSize?.w,
        maxExpandedH: config.maxExpandedSize?.h,
    };
};

/**
 * Create multiple widgets from an array of IDs
 * 
 * @param {Array<string>} widgetIds - Array of widget IDs
 * @param {Object} props - Props to pass to widgets
 * @param {Object} savedLayouts - Saved layout positions from localStorage
 * @param {Object} lockedWidgets - Map of widget IDs to their locked dimensions
 * @returns {Array<Object>} Array of widget configuration objects
 */
export const createWidgets = (widgetIds, props = {}, savedLayouts = {}, lockedWidgets = {}) => {
    const widgets = [];
    
    widgetIds.forEach(widgetId => {
        // Get saved layout for this widget
        const savedLayout = savedLayouts.lg?.find(l => l.i === widgetId);
        const lockedDimensions = lockedWidgets[widgetId];
        
        const layoutOverrides = {};
        if (savedLayout) {
            layoutOverrides.x = savedLayout.x;
            layoutOverrides.y = savedLayout.y;
            layoutOverrides.w = savedLayout.w;
            layoutOverrides.h = savedLayout.h;
        }
        if (lockedDimensions) {
            layoutOverrides.locked = true;
            layoutOverrides.w = lockedDimensions.w;
            layoutOverrides.h = lockedDimensions.h;
            if (lockedDimensions.expanded) {
                layoutOverrides.persistedExpanded = true;
            }
        }
        
        const widget = createWidget(widgetId, props, layoutOverrides);
        if (widget) {
            widgets.push(widget);
        }
    });
    
    return widgets;
};

/**
 * Get default layout for initial widget placement
 * 
 * @param {Array<Object>} widgets - Array of widget objects
 * @returns {Object} Layout object with breakpoint configurations
 */
export const getDefaultLayoutsFromWidgets = (widgets) => {
    const lgLayout = [];
    let currentY = 0;
    let currentX = 0;
    const maxCols = 12;
    let rowMaxHeight = 0;
    
    widgets.forEach((widget, index) => {
        const w = widget.w || 3;
        const h = widget.h || 4;
        
        // Check if widget fits in current row
        if (currentX + w > maxCols) {
            currentX = 0;
            currentY += rowMaxHeight;
            rowMaxHeight = 0;
        }
        
        lgLayout.push({
            i: widget.key || widget.id,
            x: widget.x ?? currentX,
            y: widget.y ?? currentY,
            w,
            h,
            minW: widget.minW || 2,
            minH: widget.minH || 3,
            maxW: widget.maxW || 12,
            maxH: widget.maxH || 12,
            static: widget.locked || false,
        });
        
        currentX += w;
        rowMaxHeight = Math.max(rowMaxHeight, h);
    });
    
    return {
        lg: lgLayout,
        md: lgLayout.map(item => ({
            ...item,
            w: Math.min(item.w, 5),
            x: item.x >= 10 ? 0 : item.x
        })),
        sm: lgLayout.map(item => ({
            ...item,
            w: Math.min(item.w, 3),
            x: item.x >= 6 ? 0 : item.x
        })),
        xs: lgLayout.map(item => ({
            ...item,
            w: Math.min(item.w, 2),
            x: item.x >= 4 ? 0 : item.x
        })),
        xxs: lgLayout.map(item => ({
            ...item,
            w: 2,
            x: 0
        })),
    };
};

export default createWidgets;
