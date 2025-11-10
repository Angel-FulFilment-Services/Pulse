import React from 'react';
import { usePage } from '@inertiajs/react';
import { CakeIcon, CalendarDaysIcon, ChartBarIcon, UserGroupIcon, ClockIcon, 
         SpeakerWaveIcon, BookOpenIcon, DocumentTextIcon, WrenchScrewdriverIcon,
         FolderIcon, ChatBubbleBottomCenterTextIcon, TrophyIcon } from '@heroicons/react/24/outline';

// Import widgets
import WelcomeCard from '../../Components/Dashboard/Widgets/WelcomeCard.jsx';
import ScheduleCard from '../../Components/Dashboard/Widgets/ScheduleCard.jsx';
import QuickStatsCard from '../../Components/Dashboard/Widgets/QuickStatsCard.jsx';
import ManagersOnDutyCard from '../../Components/Dashboard/Widgets/ManagersOnDutyCard.jsx';
import ScheduleWidget from '../../Components/Dashboard/Widgets/ScheduleWidget.jsx';
import ActivityFeedWidget from '../../Components/Dashboard/Widgets/ActivityFeedWidget.jsx';
import PayrollSummaryWidget from '../../Components/Dashboard/Widgets/PayrollSummaryWidget.jsx';
import KnowledgeBaseWidget from '../../Components/Dashboard/Widgets/KnowledgeBaseWidget.jsx';
import PerformanceInsightsWidget from '../../Components/Dashboard/Widgets/PerformanceInsightsWidget.jsx';
import TeamUpdatesWidget from '../../Components/Dashboard/Widgets/TeamUpdatesWidget.jsx';
import UpcomingEventsWidget from '../../Components/Dashboard/Widgets/UpcomingEventsWidget.jsx';
import SiteAnnouncementsWidget from '../../Components/Dashboard/Widgets/SiteAnnouncementsWidget.jsx';
import EquipmentStatusWidget from '../../Components/Dashboard/Widgets/EquipmentStatusWidget.jsx';
import MyDocumentsWidget from '../../Components/Dashboard/Widgets/MyDocumentsWidget.jsx';
import FeedbackSupportWidget from '../../Components/Dashboard/Widgets/FeedbackSupportWidget.jsx';
import BirthdayTrackerWidget from '../../Components/Dashboard/Widgets/BirthdayTrackerWidget.jsx';
import BadgeWidget from '../../Components/Dashboard/Widgets/BadgeWidget.jsx';

// Import grid components
import DraggableGrid from '../../Components/Dashboard/DraggableGrid.jsx';
import { useWidgetLayout } from '../../hooks/useWidgetLayout.js';
import { useUserStates } from '../../Components/Context/ActiveStateContext';

const Dashboard = ({ token }) => {
    const { employee } = usePage().props;
    const { userStates } = useUserStates();

    // Define all available widgets with their metadata
    const initialWidgets = [
        {
            id: 'welcome',
            title: null, // No title for welcome card
            content: <WelcomeCard employee={employee} userStates={userStates} />,
            headerAction: null,
            showHeader: false, // Special flag for welcome card
            locked: true, // Lock this widget from being moved
            x: 0, y: 0, w: 12, h: 3,
            minW: 12, minH: 3, maxH: 3
        },
        {
            id: 'badges',
            title: 'Recent Badges',
            content: <BadgeWidget employee={employee} />,
            headerAction: <TrophyIcon className="h-5 w-5 text-gray-400" />,
            x: 0, y: 1, w: 12, h: 14,
            minW: 4, minH: 5
        },
    ];

    const { widgets, handleLayoutChange } = useWidgetLayout(
        initialWidgets, 
        'dashboard-layout-v1'
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
            <div className="container mx-auto p-6">
                {/* Draggable Grid */}
                <DraggableGrid
                    widgets={widgets}
                    onLayoutChange={handleLayoutChange}
                    className="dashboard-grid"
                />
            </div>
        </div>
    );
};

export default Dashboard;