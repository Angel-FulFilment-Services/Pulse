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
        <div>
            {/* Search button */}
            <div className="mb-4">
                <button className="border border-gray-200 dark:border-dark-700 flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-dark-800 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors w-full">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-dark-400">Search knowledge base...</span>
                </button>
            </div>

            {/* Articles */}
            <div className="space-y-3">
                {recentArticles.map((article, index) => (
                    <div 
                        key={article.id} 
                        className="border border-gray-200 dark:border-dark-700 group bg-gray-50 dark:bg-dark-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <span className="text-lg">{article.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors">
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
    );
};

export default KnowledgeBaseWidget;
