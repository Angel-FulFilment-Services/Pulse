import React from 'react';
import { MagnifyingGlassIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

const KnowledgeBaseWidget = ({ employee }) => {
    const recentArticles = [
        {
            id: 1,
            title: 'Employee Handbook Updates',
            category: 'Policy',
            readTime: '5 min read',
            icon: '📚',
            views: 42
        },
        {
            id: 2,
            title: 'IT Support Guidelines',
            category: 'Technical',
            readTime: '3 min read',
            icon: '💻',
            views: 28
        },
        {
            id: 3,
            title: 'Holiday Request Process',
            category: 'HR',
            readTime: '2 min read',
            icon: '🏖️',
            views: 67
        }
    ];

    return (
        <div className="relative">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-indigo-900/10 dark:via-dark-900 dark:to-cyan-900/10 rounded-2xl"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            
            <div className="relative p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                            <DocumentTextIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                            📖 Knowledge Base
                        </h3>
                    </div>
                    <button className="flex items-center space-x-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors">
                        <MagnifyingGlassIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Search</span>
                    </button>
                </div>

                {/* Articles */}
                <div className="space-y-3">
                    {recentArticles.map((article, index) => (
                        <div 
                            key={article.id} 
                            className="group bg-white/60 dark:bg-dark-900/40 backdrop-blur-sm rounded-lg p-3 hover:bg-white/80 dark:hover:bg-dark-900/60 border border-white/50 dark:border-dark-700/50 cursor-pointer transition-all hover:scale-[1.02]"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <span className="text-lg">{article.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {article.title}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300">
                                            {article.category}
                                        </span>
                                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-dark-400">
                                            <ClockIcon className="h-3 w-3" />
                                            <span>{article.readTime}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-dark-500">•</span>
                                        <span className="text-xs text-gray-500 dark:text-dark-400">{article.views} views</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBaseWidget;
