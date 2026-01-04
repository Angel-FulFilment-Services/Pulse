import React from 'react';
import * as HeroIcons from '@heroicons/react/24/outline';

const BadgeFlyout = ({ badge, progress, tierInfo }) => {
    // Check if badge is locked
    const isLocked = badge.prerequisite_badge && !badge.prerequisite_badge.is_earned;
    
    const tierColors = {
        bronze: { primary: '#CD7F32', secondary: '#B8860B', accent: '#8B4513', emboss: '#CD7F32' },
        silver: { primary: '#C0C0C0', secondary: '#A9A9A9', accent: '#D3D3D3', emboss: '#C0C0C0' },
        gold: { primary: '#FFD700', secondary: '#FFA500', accent: '#DAA520', emboss: '#FFD700' },
        platinum: { primary: '#E5E4E2', secondary: '#C0C0C0', accent: '#A8A8A8', emboss: '#E5E4E2' },
        emerald: { primary: '#50C878', secondary: '#2E8B57', accent: '#00A86B', emboss: '#50C878' },
        ruby: { primary: '#E0115F', secondary: '#9B111E', accent: '#CC0044', emboss: '#E0115F' },
        sapphire: { primary: '#0F52BA', secondary: '#0A3D8F', accent: '#4169E1', emboss: '#0F52BA' },
        diamond: { primary: '#B9F2FF', secondary: '#87CEEB', accent: '#ADD8E6', emboss: '#B9F2FF' },
        alexandrite: { primary: '#4B0082', secondary: '#8B00FF', accent: '#9400D3', emboss: '#9400D3' },
        basic: { primary: '#A8A8A8', secondary: '#909090', accent: '#C0C0C0', emboss: '#A8A8A8' },
        locked: { primary: '#555555', secondary: '#444444', accent: '#666666', emboss: '#E5E4E2' },
        christmas_snow: { primary: '#E8F5F7', secondary: '#B8D9E8', accent: '#A0C8D8', emboss: '#F0FDFF' },
        christmas_lights: { primary: '#1a2332', secondary: '#2d3e50', accent: '#34495e', emboss: '#202466' },
        new_years: { primary: '#FFD700', secondary: '#FFA500', accent: '#FF6B6B', emboss: '#0F0F24' },
        jack_o_lantern: { primary: '#ff8c1a', secondary: '#ff6b00', accent: '#cc5500', emboss: '#FF7F27' },
        spooky_ghost: { primary: '#8383FF', secondary: '#C0C0D8', accent: '#A0A0C0', emboss: '#8383FF' },
        autumn: { primary: '#D2691E', secondary: '#CD853F', accent: '#DAA520', emboss: '#D2691E' },
    };

    const colors = tierInfo ? tierColors[badge.tier] : tierColors['basic'];


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

    // If badge is locked, show limited information
    if (isLocked) {
        return (
            <div className="p-3 w-72">
                {/* Header */}
                <div className="mb-2">
                    <h3 className="font-bold text-base text-gray-900 dark:text-dark-100 mb-0.5">
                        Locked Badge
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-dark-400 border border-gray-300 dark:border-dark-600">
                            Locked
                        </span>
                    </div>
                </div>

                {/* Locked message */}
                <div className="mb-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
                    <div className="flex items-start gap-2">
                        <HeroIcons.LockClosedIcon className="w-5 h-5 text-gray-400 dark:text-dark-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-gray-700 dark:text-dark-200 font-medium mb-1">
                                Badge Locked
                            </p>
                            <p className="text-xs text-gray-600 dark:text-dark-300 leading-relaxed">
                                {badge.prerequisite_badge 
                                    ? `To unlock this badge, you must first complete "${badge.prerequisite_badge.name}".`
                                    : 'The prerequisites to unlock this badge have not been met.'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 w-72">
            {/* Header */}
            <div className="mb-2">
                <h3 className="font-bold text-base text-gray-900 dark:text-dark-100 mb-0.5">
                    {badge.name}
                </h3>
                {tierInfo && (
                    <div className="flex items-center gap-1.5">
                        <span 
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ 
                                backgroundColor: `${colors.primary}20`,
                                color: colors.primary,
                                border: `1px solid ${colors.primary}40`
                            }}
                        >
                            {tierInfo.name}
                        </span>
                        {badge.points > 0 && (
                            <span className="text-xs text-gray-500 dark:text-dark-400">
                                {badge.points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} pts
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Description */}
            {badge.description && (
                <p className="text-sm text-gray-600 dark:text-dark-300 mb-3 leading-relaxed">
                    {badge.description}
                </p>
            )}

            {/* Progress Section */}
            {progress && !badge.is_earned && (
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-dark-200">
                            Progress
                        </span>
                        <span className="text-xs text-gray-500 dark:text-dark-400">
                            {progress.current_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}/{badge.threshold.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all duration-300 bg-theme-500 dark:bg-theme-600"
                            style={{ 
                                width: `${progressPercentage}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Requirement */}
            {badge.threshold && !badge.is_earned && (
                <div className="text-xs text-gray-600 dark:text-dark-300 mb-2">
                    <span className="font-medium">Required:</span> {badge.threshold.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {badge.category}
                </div>
            )}

            {/* Metadata Section */}
            <div className="space-y-1.5 text-xs">
                {/* Expiration Warning */}
                {daysUntilExpiration !== null && daysUntilExpiration <= 30 && (
                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                        <HeroIcons.ClockIcon className="w-3.5 h-3.5" />
                        <span>
                            Expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Limited Awards */}
                {badge.max_awards && (
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-dark-300">
                        <HeroIcons.UsersIcon className="w-3.5 h-3.5" />
                        <span>
                            {badge.awards_count || 0}/{badge.max_awards} awarded
                        </span>
                    </div>
                )}

                {/* Repeatable */}
                {badge.repeatable && (
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <HeroIcons.ArrowPathIcon className="w-3.5 h-3.5" />
                        <span>Repeatable badge</span>
                    </div>
                )}

                {/* Limited Time */}
                {limitedTimeText && (
                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                        <HeroIcons.CalendarIcon className="w-3.5 h-3.5" />
                        <span>{limitedTimeText}</span>
                    </div>
                )}
            </div>

            {/* Prerequisite Section */}
            {badge.prerequisite_badge && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-start gap-2">
                        <HeroIcons.ShieldCheckIcon className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-xs font-medium text-gray-700 dark:text-dark-200 mb-0.5">
                                Prerequisite Completed
                            </div>
                            <div className="text-xs text-gray-600 dark:text-dark-300">
                                {badge.prerequisite_badge.name}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BadgeFlyout;
