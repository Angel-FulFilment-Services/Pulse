import React from 'react';

const TeamUpdatesWidget = ({ employee }) => {
    const updates = [
        {
            id: 1,
            type: 'announcement',
            title: 'Q4 Team Goals Released',
            preview: 'Check out our updated objectives and key results for the quarter...',
            timestamp: '2 hours ago',
            priority: 'high',
            emoji: '🎯'
        },
        {
            id: 2,
            type: 'news',
            title: 'New Employee Benefits Program',
            preview: 'Enhanced health insurance and wellness packages now available...',
            timestamp: '1 day ago',
            priority: 'medium',
            emoji: '🏥'
        },
        {
            id: 3,
            type: 'update',
            title: 'Office Christmas Party Planning',
            preview: 'Help us plan this year\'s celebration! Survey closes Friday...',
            timestamp: '2 days ago',
            priority: 'low',
            emoji: '🎄'
        }
    ];

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-50 dark:bg-red-900/20 border-l-red-500 text-red-700 dark:text-red-300';
            case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500 text-yellow-700 dark:text-yellow-300';
            case 'low': return 'bg-green-50 dark:bg-green-900/20 border-l-green-500 text-green-700 dark:text-green-300';
            default: return 'bg-gray-50 dark:bg-gray-900/20 border-l-gray-500 text-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-4">
            {/* Floating header */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-20"></div>
                <div className="relative bg-white dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                        📢 Team Updates
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-dark-400">Latest company news</p>
                </div>
            </div>

            {/* Stacked cards */}
            <div className="space-y-3">
                {updates.map((update, index) => (
                    <div 
                        key={update.id} 
                        className={`border-l-4 p-4 rounded-r-xl shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 ${getPriorityStyles(update.priority)}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <span className="text-lg">{update.emoji}</span>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                                    {update.title}
                                </h4>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/60 dark:bg-dark-900/60">
                                {update.timestamp}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-dark-300 line-clamp-2">
                            {update.preview}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamUpdatesWidget;
