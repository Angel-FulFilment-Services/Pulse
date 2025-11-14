import React from 'react';
import { motion } from 'framer-motion';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';

const BadgeDetailsPanel = ({ badge, progress, tierInfo, colors }) => {
    // Calculate days until expiration
    const getDaysUntilExpiration = () => {
        if (!badge.expires_at) return null;
        const now = new Date();
        const expiresAt = new Date(badge.expires_at);
        const diffTime = expiresAt - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Format limited time availability
    const getLimitedTimeText = () => {
        if (!badge.available_from && !badge.available_until) return null;
        
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
            });
        };

        if (badge.available_from && badge.available_until) {
            return `${formatDate(badge.available_from)} - ${formatDate(badge.available_until)}`;
        } else if (badge.available_from) {
            return `From ${formatDate(badge.available_from)}`;
        } else {
            return `Until ${formatDate(badge.available_until)}`;
        }
    };

    const daysUntilExpiration = getDaysUntilExpiration();
    const limitedTimeText = getLimitedTimeText();
    const progressPercentage = progress ? Math.min((progress.current_count / badge.threshold) * 100, 100) : 0;

    return (
        <motion.div
            className="fixed right-0 top-0 h-full bg-white dark:bg-dark-900 shadow-2xl overflow-y-auto max-w-md w-full"
            style={{
                zIndex: 10001,
            }}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
            }}
        >
            <div className="p-6">
                {/* Header with tier accent */}
                <div 
                    className="mb-6 pb-4 border-b-2"
                    style={{ borderColor: tierInfo?.color || '#3b82f6' }}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-2">
                                {badge.name.charAt(0).toUpperCase() + badge.name.slice(1).replace('_', ' ')}
                            </h2>
                            {tierInfo && (
                                <div className="flex items-center gap-2">
                                    <span 
                                        className="text-sm font-semibold px-3 py-1 rounded-full"
                                        style={{ 
                                            backgroundColor: `${tierInfo.color}20`,
                                            color: tierInfo.color,
                                            border: `2px solid ${tierInfo.color}60`
                                        }}
                                    >
                                        {tierInfo.name}
                                    </span>
                                    {badge.points > 0 && (
                                        <span className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-dark-300">
                                            <HeroIconsSolid.StarIcon className="w-4 h-4 text-yellow-500" />
                                            {badge.points} pts
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Awarded Date */}
                    {badge.awarded_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400">
                            <HeroIcons.CalendarIcon className="w-4 h-4" />
                            <span>
                                Awarded {new Date(badge.awarded_at).toLocaleDateString('en-GB', { 
                                    day: 'numeric', 
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Description */}
                {badge.description && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-200 mb-2 flex items-center gap-2">
                            <HeroIcons.InformationCircleIcon className="w-4 h-4" />
                            Description
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-300 leading-relaxed">
                            {badge.description}
                        </p>
                    </div>
                )}

                {/* Requirements Section */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-200 mb-3 flex items-center gap-2">
                        <HeroIcons.CheckBadgeIcon className="w-4 h-4" />
                        Requirements
                    </h3>
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-dark-300">
                                {badge.category && badge.category.charAt(0).toUpperCase() + badge.category.slice(1)} count
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                                {badge.threshold}
                            </span>
                        </div>
                        
                        {/* Progress Bar (for non-earned badges) */}
                        {progress && !badge.is_earned && (
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-700 dark:text-dark-200">
                                        Your Progress
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-dark-400">
                                        {progress.current_count}/{badge.threshold}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-3 overflow-hidden">
                                    <motion.div 
                                        className="h-full rounded-full"
                                        style={{ 
                                            backgroundColor: tierInfo?.color || '#3b82f6'
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercentage}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                                    {Math.round(progressPercentage)}% Complete
                                </p>
                            </div>
                        )}
                        
                        {/* Completion Badge (for earned badges) */}
                        {badge.is_earned && (
                            <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                                <HeroIconsSolid.CheckCircleIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Completed</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Badge Properties */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-200 mb-3 flex items-center gap-2">
                        <HeroIcons.Cog6ToothIcon className="w-4 h-4" />
                        Badge Properties
                    </h3>
                    <div className="space-y-3">
                        {/* Expiration Warning */}
                        {daysUntilExpiration !== null && (
                            <div 
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                    daysUntilExpiration <= 7 
                                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                                        : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                                }`}
                            >
                                <HeroIcons.ClockIcon 
                                    className={`w-5 h-5 flex-shrink-0 ${
                                        daysUntilExpiration <= 7 
                                            ? 'text-red-600 dark:text-red-400' 
                                            : 'text-orange-600 dark:text-orange-400'
                                    }`}
                                />
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                        daysUntilExpiration <= 7 
                                            ? 'text-red-900 dark:text-red-100' 
                                            : 'text-orange-900 dark:text-orange-100'
                                    }`}>
                                        Expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-dark-400 mt-0.5">
                                        {new Date(badge.expires_at).toLocaleDateString('en-GB', { 
                                            day: 'numeric', 
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Limited Awards */}
                        {badge.max_awards && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <HeroIcons.UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Limited Edition
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-dark-400 mt-0.5">
                                        {badge.awards_count || 0} of {badge.max_awards} awarded
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {badge.awards_count || 0}/{badge.max_awards}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Repeatable */}
                        {badge.repeatable && (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <HeroIcons.ArrowPathIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                        Repeatable Badge
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-dark-400 mt-0.5">
                                        Can be earned multiple times
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Limited Time */}
                        {limitedTimeText && (
                            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <HeroIcons.CalendarDaysIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                        Limited Time
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-dark-400 mt-0.5">
                                        {limitedTimeText}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Prerequisite Section */}
                {badge.prerequisite_badge && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-200 mb-3 flex items-center gap-2">
                            <HeroIcons.LockClosedIcon className="w-4 h-4" />
                            Prerequisites
                        </h3>
                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                            <HeroIcons.ShieldCheckIcon className="w-5 h-5 text-gray-400 dark:text-dark-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-dark-100">
                                    Required Badge
                                </p>
                                <p className="text-sm text-gray-600 dark:text-dark-300 mt-1">
                                    {badge.prerequisite_badge.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                                    You must earn this badge first
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Tag */}
                {badge.category && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
                        <div className="flex items-center gap-2">
                            <HeroIcons.TagIcon className="w-4 h-4 text-gray-400 dark:text-dark-500" />
                            <span className="text-xs text-gray-500 dark:text-dark-400">Category:</span>
                            <span className="text-xs font-medium text-gray-700 dark:text-dark-200 px-2 py-1 bg-gray-100 dark:bg-dark-800 rounded">
                                {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default BadgeDetailsPanel;
