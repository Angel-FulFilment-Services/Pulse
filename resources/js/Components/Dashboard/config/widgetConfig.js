/**
 * Widget Configuration
 * 
 * Defines all available widgets, their categories, permissions, and default settings.
 * Widgets are organized by category for the widget picker UI.
 */

import { 
    CalendarDaysIcon, 
    ChartBarIcon, 
    UserGroupIcon, 
    ClockIcon,
    BookOpenIcon, 
    TrophyIcon, 
    ComputerDesktopIcon,
    BanknotesIcon,
    ChatBubbleLeftRightIcon,
    MinusIcon,
    Bars2Icon,
    ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

// Widget Categories
export const WIDGET_CATEGORIES = {
    CORE: 'core',
    PERSONAL: 'personal',
    ADMINISTRATION: 'administration',
    SYSTEM: 'system',
    LAYOUT: 'layout',
};

export const CATEGORY_LABELS = {
    [WIDGET_CATEGORIES.CORE]: 'Core',
    [WIDGET_CATEGORIES.PERSONAL]: 'Personal',
    [WIDGET_CATEGORIES.ADMINISTRATION]: 'Administration',
    [WIDGET_CATEGORIES.SYSTEM]: 'System',
    [WIDGET_CATEGORIES.LAYOUT]: 'Layout',
};

/**
 * Widget Registry
 * 
 * Each widget definition includes:
 * - id: Unique identifier
 * - title: Display title (null for headerless widgets)
 * - description: Short description for the widget picker
 * - component: The widget component name (string for dynamic import)
 * - category: Which category this widget belongs to
 * - permission: Required permission to access this widget
 * - persistent: If true, widget stays in place during preset transitions
 * - showHeader: Whether to show the widget header
 * - canExpand: Whether the widget can be expanded
 * - headerIcon: Icon component for the header
 * - defaultSize: Default width and height in grid units
 * - minSize: Minimum width and height
 * - maxSize: Maximum width and height (optional)
 * - maxExpandedSize: Maximum size when expanded (optional)
 * - startCollapsed: Whether widget starts collapsed (0 height) until it has content
 * - requiresProps: Array of prop names this widget needs from the dashboard
 */
export const WIDGET_REGISTRY = {
    // ==================== CORE WIDGETS ====================
    // These widgets persist across preset transitions
    greeting: {
        id: 'greeting',
        title: null,
        description: 'Welcome message with greeting and status',
        component: 'GreetingWidget',
        category: WIDGET_CATEGORIES.CORE,
        permission: 'angel_employee',
        persistent: true, // Stays during preset transitions
        showHeader: false,
        canExpand: false,
        locked: true,
        headerIcon: null,
        defaultSize: { w: 12, h: 3 },
        minSize: { w: 12, h: 3 },
        maxSize: { w: 12, h: 3 },
        requiresProps: ['employee', 'userStates'],
    },
    
    announcements: {
        id: 'announcements',
        title: null,
        description: 'Important announcements and alerts',
        component: 'AnnouncementsWidget',
        category: WIDGET_CATEGORIES.CORE,
        permission: 'angel_employee',
        persistent: true,
        showHeader: false,
        canExpand: false,
        startCollapsed: true,
        headerIcon: null,
        defaultSize: { w: 12, h: 2 },
        minSize: { w: 12, h: 2 },
        maxSize: { w: 12, h: 2 },
        requiresProps: ['isEditMode'],
    },

    // ==================== PERSONAL WIDGETS ====================
    today_schedule: {
        id: 'today_schedule',
        title: "Today's Schedule",
        description: "View today's shift and clock status",
        component: 'TodayScheduleWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: false,
        headerIcon: CalendarDaysIcon,
        defaultSize: { w: 4, h: 4 },
        minSize: { w: 4, h: 4 },
        requiresProps: ['employee'],
    },
    
    weekly_schedule: {
        id: 'weekly_schedule',
        title: "This Week's Schedule",
        description: 'Weekly schedule overview',
        component: 'WeeklyScheduleWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: true,
        headerIcon: ClockIcon,
        defaultSize: { w: 6, h: 4 },
        minSize: { w: 6, h: 4 },
        maxExpandedSize: { w: 6, h: 12 },
        requiresProps: ['employee'],
    },
    
    shift_stats: {
        id: 'shift_stats',
        title: 'Shift Stats',
        description: 'Personal attendance and performance stats',
        component: 'ShiftStatsWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: false,
        headerIcon: ChartBarIcon,
        defaultSize: { w: 2, h: 4 },
        minSize: { w: 2, h: 4 },
        requiresProps: ['employee'],
    },
    
    attendance_stats: {
        id: 'attendance_stats',
        title: 'Shift Attendance',
        description: 'Attendance metrics and trends',
        component: 'AttendanceStatsWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: true,
        headerIcon: ChartBarIcon,
        defaultSize: { w: 6, h: 3 },
        minSize: { w: 4, h: 3 },
        maxExpandedSize: { w: 6, h: 7 },
        requiresProps: ['employee'],
    },
    
    managers_on_duty: {
        id: 'managers_on_duty',
        title: 'Managers On Duty',
        description: 'See who is currently managing',
        component: 'ManagersOnDutyWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: true,
        headerIcon: UserGroupIcon,
        defaultSize: { w: 3, h: 7 },
        minSize: { w: 3, h: 4 },
        maxExpandedSize: { w: 4, h: 13 },
        requiresProps: [],
    },
    
    knowledge_base: {
        id: 'knowledge_base',
        title: 'Knowledge Base',
        description: 'Search and browse knowledge articles',
        component: 'KnowledgeBaseWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: true,
        headerIcon: BookOpenIcon,
        defaultSize: { w: 4, h: 7 },
        minSize: { w: 3, h: 5 },
        maxExpandedSize: { w: 6, h: 12 },
        requiresProps: [],
    },
    
    equipment_status: {
        id: 'equipment_status',
        title: 'Equipment Status',
        description: 'Monitor your assigned equipment',
        component: 'EquipmentStatusWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: true,
        headerIcon: ComputerDesktopIcon,
        defaultSize: { w: 4, h: 4 },
        minSize: { w: 3, h: 4 },
        maxExpandedSize: { w: 7, h: 9 },
        requiresProps: [],
    },
    
    badges: {
        id: 'badges',
        title: 'Your Badges',
        description: 'View earned badges and achievements',
        component: 'BadgesWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: true,
        headerIcon: TrophyIcon,
        defaultSize: { w: 4, h: 8 },
        minSize: { w: 2, h: 4 },
        requiresProps: ['employee'],
    },
    
    payroll: {
        id: 'payroll',
        title: 'Payroll Estimate',
        description: 'Estimated earnings before tax',
        component: 'PayrollWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: true,
        headerIcon: BanknotesIcon,
        defaultSize: { w: 4, h: 5 },
        minSize: { w: 4, h: 5 },
        maxExpandedSize: { w: 7, h: 12 },
        requiresProps: ['employee'],
    },
    
    messages: {
        id: 'messages',
        title: 'Recent Messages',
        description: 'View and reply to recent chat messages',
        component: 'MessagesWidget',
        category: WIDGET_CATEGORIES.PERSONAL,
        permission: 'angel_employee',
        showHeader: true,
        canExpand: true,
        headerIcon: ChatBubbleLeftRightIcon,
        defaultSize: { w: 3, h: 7 },
        minSize: { w: 3, h: 4 },
        maxExpandedSize: { w: 4, h: 13 },
        requiresProps: [],
    },

    // ==================== ADMINISTRATION WIDGETS ====================
    // Future administration widgets will go here
    // Example:
    // team_overview: {
    //     id: 'team_overview',
    //     title: 'Team Overview',
    //     description: 'View and manage your team',
    //     component: 'TeamOverviewWidget',
    //     category: WIDGET_CATEGORIES.ADMINISTRATION,
    //     permission: 'manage_team',
    //     ...
    // },

    // ==================== SYSTEM WIDGETS ====================
    // Future system widgets will go here
    // Example:
    // system_health: {
    //     id: 'system_health',
    //     title: 'System Health',
    //     description: 'Monitor system status',
    //     component: 'SystemHealthWidget',
    //     category: WIDGET_CATEGORIES.SYSTEM,
    //     permission: 'system_admin',
    //     ...
    // },

    // ==================== LAYOUT WIDGETS ====================
    divider: {
        id: 'divider',
        title: 'Divider',
        description: 'Visual horizontal divider line',
        component: 'DividerWidget',
        category: WIDGET_CATEGORIES.LAYOUT,
        permission: 'angel_employee',
        isLayoutWidget: true,
        allowMultiple: true,
        showHeader: false,
        canExpand: false,
        canResize: false,
        headerIcon: MinusIcon,
        defaultSize: { w: 12, h: 1 },
        minSize: { w: 2, h: 1 },
        maxSize: { w: 12, h: 1 },
        requiresProps: [],
    },
    
    section_divider: {
        id: 'section_divider',
        title: 'Section Divider',
        description: 'Titled divider with editable label',
        component: 'SectionDividerWidget',
        category: WIDGET_CATEGORIES.LAYOUT,
        permission: 'angel_employee',
        isLayoutWidget: true,
        allowMultiple: true,
        showHeader: false,
        canExpand: false,
        canResize: false,
        headerIcon: Bars2Icon,
        defaultSize: { w: 12, h: 1 },
        minSize: { w: 4, h: 1 },
        maxSize: { w: 12, h: 1 },
        requiresProps: ['isEditMode'],
    },
    
    spacer: {
        id: 'spacer',
        title: 'Spacer',
        description: 'Invisible resizable space',
        component: 'SpacerWidget',
        category: WIDGET_CATEGORIES.LAYOUT,
        permission: 'angel_employee',
        isLayoutWidget: true,
        allowMultiple: true,
        showHeader: false,
        canExpand: false,
        canResize: true,
        headerIcon: ArrowsPointingOutIcon,
        defaultSize: { w: 2, h: 2 },
        minSize: { w: 1, h: 1 },
        maxSize: { w: 12, h: 12 },
        requiresProps: ['isEditMode'],
    },
};

/**
 * Get widgets by category
 */
export const getWidgetsByCategory = (category) => {
    return Object.values(WIDGET_REGISTRY).filter(widget => widget.category === category);
};

/**
 * Get all available categories that have widgets
 */
export const getAvailableCategories = () => {
    const categoriesWithWidgets = new Set(
        Object.values(WIDGET_REGISTRY).map(widget => widget.category)
    );
    return Object.entries(CATEGORY_LABELS)
        .filter(([key]) => categoriesWithWidgets.has(key))
        .map(([key, label]) => ({ key, label }));
};

/**
 * Check if user has permission for a widget
 */
export const hasWidgetPermission = (widgetId, userPermissions = []) => {
    const widget = WIDGET_REGISTRY[widgetId];
    if (!widget) return false;
    
    // For now, check if user has the required permission
    // 'angel_employee' is the base permission all employees have
    if (widget.permission === 'angel_employee') return true;
    
    return userPermissions.includes(widget.permission);
};

/**
 * Get the default layout for a set of widgets
 * This creates initial x,y positions for widgets
 */
export const getDefaultLayout = (widgetIds) => {
    const layout = [];
    let currentY = 0;
    let currentX = 0;
    const maxCols = 12;
    
    widgetIds.forEach(widgetId => {
        const widget = WIDGET_REGISTRY[widgetId];
        if (!widget) return;
        
        const { w, h } = widget.defaultSize;
        
        // Check if widget fits in current row
        if (currentX + w > maxCols) {
            currentX = 0;
            currentY += h;
        }
        
        layout.push({
            i: widgetId,
            x: currentX,
            y: currentY,
            w,
            h,
            minW: widget.minSize?.w,
            minH: widget.minSize?.h,
            maxW: widget.maxSize?.w,
            maxH: widget.maxSize?.h,
        });
        
        currentX += w;
    });
    
    return layout;
};

/**
 * Default widget set for new users
 */
export const DEFAULT_WIDGET_IDS = [
    'greeting',
    'today_schedule',
    'weekly_schedule',
    'shift_stats',
    'attendance_stats',
    'managers_on_duty',
    'knowledge_base',
    'equipment_status',
    'badges',
];

/**
 * Persistent widgets that stay during preset transitions
 */
export const PERSISTENT_WIDGET_IDS = ['greeting', 'announcements'];

export default WIDGET_REGISTRY;
