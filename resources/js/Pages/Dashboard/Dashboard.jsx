import React from 'react';
import { usePage } from '@inertiajs/react';
import { CakeIcon, CalendarDaysIcon, ChartBarIcon, UserGroupIcon, ClockIcon, 
         SpeakerWaveIcon, BookOpenIcon, DocumentTextIcon, WrenchScrewdriverIcon,
         FolderIcon, ChatBubbleBottomCenterTextIcon, TrophyIcon, MegaphoneIcon, 
         ComputerDesktopIcon} from '@heroicons/react/24/outline';

// Import widgets
import WelcomeCard from '../../Components/Dashboard/Widgets/WelcomeCard.jsx';
import ScheduleCard from '../../Components/Dashboard/Widgets/ScheduleCard.jsx';
import ScheduleWidget from '../../Components/Dashboard/Widgets/ScheduleWidget.jsx';
import BadgeWidget from '../../Components/Dashboard/Widgets/BadgeWidget.jsx';

import PerformanceInsightsWidget from '../../Components/Dashboard/Widgets/PerformanceInsightsWidget.jsx';
import ManagersOnDutyCard from '../../Components/Dashboard/Widgets/ManagersOnDutyCard.jsx';
import KnowledgeBaseWidget from '../../Components/Dashboard/Widgets/KnowledgeBaseWidget.jsx';
import AnnouncementsWidget from '../../Components/Dashboard/Widgets/AnnouncementsWidget.jsx';
import EquipmentStatusWidget from '../../Components/Dashboard/Widgets/EquipmentStatusWidget.jsx';

import QuickStatsCard from '../../Components/Dashboard/Widgets/QuickStatsCard.jsx';
import ActivityFeedWidget from '../../Components/Dashboard/Widgets/ActivityFeedWidget.jsx';
import PayrollSummaryWidget from '../../Components/Dashboard/Widgets/PayrollSummaryWidget.jsx';
import UpcomingEventsWidget from '../../Components/Dashboard/Widgets/UpcomingEventsWidget.jsx';

// Import grid components
import DraggableGrid from '../../Components/Dashboard/DraggableGrid.jsx';
import { useWidgetLayout } from '../../hooks/useWidgetLayout.js';
import { useUserStates } from '../../Components/Context/ActiveStateContext';

const Dashboard = ({ token }) => {
    const { employee } = usePage().props;
    const { userStates } = useUserStates();

    // Define all available widgets with their metadata
    // Widgets that may have no content can use setWidgetVisibility to hide themselves
    const getInitialWidgets = (setWidgetVisibility) => [
        {
            id: 'welcome',
            title: null,
            content: <WelcomeCard employee={employee} userStates={userStates} />,
            headerAction: null,
            showHeader: false,
            locked: true,
            x: 0, y: 0, w: 12, h: 3,
            minW: 12, minH: 3, maxH: 3
        },
        {
            id: 'announcements',
            title: null,
            content: <AnnouncementsWidget widgetId="announcements" setWidgetVisibility={setWidgetVisibility} />,
            headerAction: null,
            showHeader: false,
            canExpand: false,
            startHidden: true, // Start hidden until fetch confirms there's content
            x: 0, y: 3, w: 12, h: 2,
            minW: 6, minH: 2,
            maxH: 5
        },
        {
            id: 'schedule',
            title: 'Today\'s Schedule',
            content: <ScheduleCard employee={employee} />,
            headerAction: <CalendarDaysIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />,
            x: 0, y: 5, w: 4, h: 5,
            minW: 4, minH: 5,
            minExpandedH: 12
        },
        {
            id: 'schedule_widget',
            title: 'This Week\'s Schedule',
            content: <ScheduleWidget employee={employee} />,
            headerAction: <ClockIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />,
            x: 4, y: 5, w: 6, h: 5,
            minW: 6, minH: 6,
            canExpand: false,
        },
        {
            id: 'performance_insights',
            title: 'Shift Attendance',
            content: <PerformanceInsightsWidget employee={employee} />,
            headerAction: <ChartBarIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />,
            x: 4, y: 9, w: 7, h: 4,
            minW: 2, minH: 5,
            maxExpandedH: 8,
            maxExpandedW: 7
        },
        {
            id: 'managers_on_duty',
            title: 'Managers On Duty',
            content: <ManagersOnDutyCard />,
            headerAction: <UserGroupIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />,
            x: 0, y: 14, w: 4, h: 8,
            minW: 3, minH: 4,
            maxExpandedH: 13,
            maxExpandedW: 4
        },
        {
            id: 'knowledge_base',
            title: 'Knowledge Base',
            content: <KnowledgeBaseWidget setWidgetVisibility={setWidgetVisibility} />,
            headerAction: <BookOpenIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />,
            x: 4, y: 22, w: 4, h: 8,
            minW: 3, minH: 5,
            maxExpandedH: 13,
            maxExpandedW: 6
        },
        {
            id: 'equipment_status',
            title: 'Equipment Status',
            content: <EquipmentStatusWidget />,
            headerAction: <ComputerDesktopIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />,
            x: 0, y: 9, w: 4, h: 5,
            minW: 2, minH: 5,
            maxExpandedH: 10,
            maxExpandedW: 7
        },
        {
            id: 'badge', 
            title: 'Your Badges',
            content: <BadgeWidget employee={employee} />,
            headerAction: <TrophyIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />,
            x: 0, y: 22, w: 4, h: 9,
            minW: 2, minH: 4,
        },
        {
            id: 'quick_stats',
            title: 'Quick Stats',
            content: <QuickStatsCard employee={employee} />,
            headerAction: <ChartBarIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" />,
            x: 4, y: 14, w: 4, h: 8,
            minW: 3, minH: 4,
        }
    ];

    const { 
        widgets, 
        allWidgets,
        layouts, 
        handleLayoutChange, 
        expandedWidgets, 
        handleExpandWidget, 
        handleLockWidget,
        hiddenWidgets,
        setWidgetVisibility 
    } = useWidgetLayout(
        getInitialWidgets, 
        'dashboard-layout-v1'
    );

    // Get hidden widgets that need to stay mounted (for fetching, etc.)
    const hiddenWidgetComponents = allWidgets
        .filter(widget => hiddenWidgets.includes(widget.key || widget.id))
        .map(widget => (
            <div key={widget.key || widget.id} className="hidden" aria-hidden="true">
                {widget.content}
            </div>
        ));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-800">
            <div className="container mx-auto p-6">
                {/* Hidden widgets - mounted but not in grid */}
                {hiddenWidgetComponents}
                
                {/* Draggable Grid */}
                <DraggableGrid
                    widgets={widgets}
                    savedLayouts={layouts}
                    onLayoutChange={handleLayoutChange}
                    expandedWidgets={expandedWidgets}
                    onExpandWidget={handleExpandWidget}
                    onLockWidget={handleLockWidget}
                    dragEnabled={false}
                    className="dashboard-grid"
                />
            </div>
        </div>
    );
};

export default Dashboard;