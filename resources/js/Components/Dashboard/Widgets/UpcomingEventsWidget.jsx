import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const UpcomingEventsWidget = ({ employee }) => {
    const events = [
        {
            id: 1,
            title: 'Team Standup Meeting',
            type: 'meeting',
            date: '2025-09-26',
            time: '9:00 AM',
            location: 'Conference Room A',
            attendees: 8
        },
        {
            id: 2,
            title: 'Fire Safety Training',
            type: 'training',
            date: '2025-09-28',
            time: '2:00 PM',
            location: 'Main Hall',
            attendees: 25
        },
        {
            id: 3,
            title: 'Monthly All-Hands',
            type: 'company',
            date: '2025-10-01',
            time: '10:00 AM',
            location: 'Virtual',
            attendees: 150
        }
    ];

    const getEventTypeColor = (type) => {
        switch (type) {
            case 'meeting': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
            case 'training': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
            case 'company': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <DashboardCard 
            title="Upcoming Events"
            headerAction={
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            }
        >
            <div className="space-y-4">
                {events.map((event) => (
                    <div key={event.id} className="border border-gray-200 dark:border-dark-700 rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100">
                                {event.title}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                                {event.type}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-dark-300">
                            <div className="flex items-center space-x-4">
                                <span>{formatDate(event.date)} at {event.time}</span>
                                <span>•</span>
                                <span>{event.location}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-dark-400">
                                {event.attendees} attending
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardCard>
    );
};

export default UpcomingEventsWidget;
