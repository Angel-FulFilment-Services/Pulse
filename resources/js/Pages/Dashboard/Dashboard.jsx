import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react'
import { format, startOfDay, endOfDay, subDays, addDays } from 'date-fns';

// Dashboard Components
import DashboardLayout from '../../Components/Dashboard/DashboardLayout.jsx';
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

const Dashboard = ({ token }) => {
    const { employee } = usePage().props;

    // Greeting section (full width at top)
    const greetingWidget = [
        { component: WelcomeCard, props: { employee }, span: 'col-span-12' },
    ];

    // Hero section widgets (top row after greeting) - 4 widgets
    const heroWidgets = [
        { component: ScheduleCard, props: { employee }, span: 'col-span-12 md:col-span-6 lg:col-span-3' },
        { component: QuickStatsCard, props: { employee }, span: 'col-span-12 md:col-span-6 lg:col-span-3' },
        { component: ManagersOnDutyCard, props: { employee }, span: 'col-span-12 md:col-span-6 lg:col-span-3' },
        { component: ScheduleWidget, props: { employee }, span: 'col-span-12 md:col-span-6 lg:col-span-3' },
    ];

    // Main content widgets (middle section) - 4 widgets
    const mainWidgets = [
        { component: ActivityFeedWidget, props: { employee }, span: 'col-span-12 lg:col-span-3' },
        { component: TeamUpdatesWidget, props: { employee }, span: 'col-span-12 lg:col-span-3' },
        { component: PayrollSummaryWidget, props: { employee }, span: 'col-span-12 lg:col-span-3' },
        { component: UpcomingEventsWidget, props: { employee }, span: 'col-span-12 lg:col-span-3' },
    ];

    // Secondary widgets (bottom section) - 4 widgets
    const secondaryWidgets = [
        { component: PerformanceInsightsWidget, props: { employee }, span: 'col-span-12 lg:col-span-6' },
        { component: BirthdayTrackerWidget, props: { employee }, span: 'col-span-12 lg:col-span-6' },
        { component: SiteAnnouncementsWidget, props: { employee }, span: 'col-span-12 lg:col-span-4' },
        { component: EquipmentStatusWidget, props: { employee }, span: 'col-span-12 lg:col-span-4' },
        { component: KnowledgeBaseWidget, props: { employee }, span: 'col-span-12 lg:col-span-4' },
    ];

    // Tertiary widgets (final row) - 3 widgets
    const tertiaryWidgets = [
        { component: MyDocumentsWidget, props: { employee }, span: 'col-span-12 lg:col-span-4' },
        { component: FeedbackSupportWidget, props: { employee }, span: 'col-span-12 lg:col-span-4' },
    ];

    return (
        <DashboardLayout
            greetingWidget={greetingWidget}
            heroWidgets={heroWidgets}
            mainWidgets={mainWidgets}
            secondaryWidgets={secondaryWidgets}
            tertiaryWidgets={tertiaryWidgets}
        />
    );
}

export default Dashboard