import React, { useState } from 'react';
import Badge from '../../Badges/Badge.jsx';

const BadgeWidget = ({ employee }) => {
    const [triggerFlip, setTriggerFlip] = useState(null);

    // Placeholder data - will be replaced with real data from API
    const badges = [
        ...Array.from({ length: 9 }, (_, index) => ({
            id: index + 1,
            name: `Badge ${index + 1}`,
            description: `This is a description for Badge ${index + 1}. Complete specific tasks to earn this achievement.`,
            icon: 'LightBulbIcon',
            tier: ['bronze', 'silver', 'gold', 'platinum', 'emerald', 'ruby', 'sapphire', 'diamond', 'alexandrite'][index % 9],
            category: 'performance',
            threshold: (index + 1) * 10,
            points: (index + 1) * 100,
            awarded_at: new Date(Date.now() - index * 86400000).toISOString(),
            isNew: index === 0,
            is_earned: true,
            repeatable: index === 2,
            max_awards: index === 4 ? 100 : null,
            awards_count: index === 4 ? 47 : null,
            tier_info: {
                name: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Ruby', 'Sapphire', 'Diamond', 'Alexandrite'][index % 9],
                color: ['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2', '#50C878', '#E0115F', '#0F52BA', '#B9F2FF', '#9C27B0'][index % 9]
            }
        })),
        // Non-tiered badge for testing
        {
            id: 10,
            name: 'Basic Badge',
            description: 'A basic achievement for getting started.',
            tier: 'basic',
            icon: 'TrophyIcon',
            category: 'general',
            threshold: 1,
            points: 10,
            awarded_at: new Date(Date.now() - 10 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            tier_info: {
                name: 'Basic',
                color: '#94a3b8'
            }
        },
        // Christmas Snow badge for testing
        {
            id: 11,
            name: 'Winter Wonderland',
            description: 'Celebrate the winter season with festive achievements.',
            tier: 'christmas_snow',
            icon: 'AcademicCapIcon',
            category: 'seasonal',
            threshold: 25,
            points: 500,
            awarded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            available_from: '2024-12-01',
            available_until: '2024-12-31',
            tier_info: {
                name: 'Seasonal',
                color: '#60a5fa'
            }
        },
        // Christmas Lights badge for testing
        {
            id: 12,
            name: 'Holiday Lights',
            description: 'Light up the holidays with exceptional performance.',
            tier: 'christmas_lights',
            icon: 'TrophyIcon',
            category: 'seasonal',
            threshold: 50,
            points: 750,
            awarded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
            tier_info: {
                name: 'Holiday',
                color: '#f59e0b'
            }
        },
        // New Years badge for testing
        {
            id: 13,
            name: 'New Year Celebration',
            description: 'Ring in the new year with outstanding achievements.',
            tier: 'new_years',
            icon: 'TrophyIcon',
            category: 'seasonal',
            threshold: 100,
            points: 1000,
            awarded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            tier_info: {
                name: 'New Year',
                color: '#8b5cf6'
            }
        },
        {
            id: 14,
            name: "Jack O Lantern",
            description: 'Spooky achievements for the Halloween season.',
            tier: 'jack_o_lantern',
            icon: 'TrophyIcon',
            category: 'seasonal',
            threshold: 31,
            points: 666,
            awarded_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            tier_info: {
                name: 'Halloween',
                color: '#fb923c'
            },
            prerequisite_badge: {
                id: 10,
                name: 'Basic Badge'
            }
        },
        // Spooky Ghost badge for testing
        {
            id: 15,
            name: 'Haunted Spirit',
            description: 'A ghostly achievement for brave souls.',
            tier: 'spooky_ghost',
            icon: 'TrophyIcon',
            category: 'seasonal',
            threshold: 13,
            points: 313,
            awarded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            tier_info: {
                name: 'Spooky',
                color: '#a78bfa'
            }
        },
        // Autumn badge for testing
        {
            id: 16,
            name: 'Autumn Harvest',
            description: 'Gather achievements like autumn leaves.',
            tier: 'autumn',
            icon: 'TrophyIcon',
            category: 'seasonal',
            threshold: 75,
            points: 850,
            awarded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            tier_info: {
                name: 'Autumn',
                color: '#f97316'
            }
        },
        // Test badge with icon only
        {
            id: 18,
            name: 'Achievement',
            description: 'Complete various tasks to unlock this achievement.',
            tier: 'gold',
            icon: 'TrophyIcon',
            category: 'performance',
            threshold: 50,
            points: 300,
            awarded_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            tier_info: {
                name: 'Gold',
                color: '#FFD700'
            }
        },
        // Test badge with image only
        {
            id: 19,
            name: 'Photo Badge',
            description: 'A special badge with custom imagery.',
            tier: 'silver',
            image: '/images/angel-logo.png',
            category: 'special',
            threshold: 25,
            points: 200,
            awarded_at: new Date(Date.now() - 4 * 86400000).toISOString(),
            isNew: false,
            is_earned: true,
            tier_info: {
                name: 'Silver',
                color: '#C0C0C0'
            }
        },
        // Locked badge example (requires prerequisite)
        {
            id: 21,
            name: 'Elite Performance',
            description: 'Unlock this badge by first earning the Achievement badge.',
            tier: 'diamond',
            icon: 'TrophyIcon',
            category: 'performance',
            threshold: 100,
            points: 1000,
            isNew: false,
            is_earned: false,
            tier_info: {
                name: 'Diamond',
                color: '#B9F2FF'
            },
            prerequisite_badge: {
                id: 18,
                name: 'Achievement',
                is_earned: false // Not earned yet, so badge 21 will be locked
            },
        },
        // Unearned badge example (unlocked but criteria not met)
        {
            id: 22,
            name: 'Winter Champion',
            description: 'Master the winter season challenges.',
            tier: 'christmas_lights',
            icon: 'LockClosedIcon',
            category: 'seasonal',
            threshold: 50,
            points: 750,
            isNew: false,
            is_earned: false, // Not earned yet
            tier_info: {
                name: 'Seasonal',
                color: '#60a5fa'
            },
            progress: {
                current_count: 23,
                percentage: 46 // 23/50 = 46%
            }
        }
    ];

    // Sort badges by: 1) Earned (latest first), 2) Unearned (closest to completion), 3) Locked
    const sortedBadges = [...badges].sort((a, b) => {
        const aIsLocked = a.prerequisite_badge && !a.prerequisite_badge.is_earned;
        const bIsLocked = b.prerequisite_badge && !b.prerequisite_badge.is_earned;
        
        // Locked badges go to the end
        if (aIsLocked && !bIsLocked) return 1;
        if (!aIsLocked && bIsLocked) return -1;
        
        // If both are earned, sort by awarded_at (latest first)
        if (a.is_earned && b.is_earned) {
            return new Date(b.awarded_at) - new Date(a.awarded_at);
        }
        
        // If both are unearned (not locked), sort by completion percentage (highest first)
        if (!a.is_earned && !b.is_earned && !aIsLocked && !bIsLocked) {
            const aProgress = a.progress?.percentage || 0;
            const bProgress = b.progress?.percentage || 0;
            return bProgress - aProgress;
        }
        
        // Earned badges come before unearned
        if (a.is_earned && !b.is_earned) return -1;
        if (!a.is_earned && b.is_earned) return 1;
        
        return 0;
    });

    const handleBadgeClick = (badgeId) => {
        setTriggerFlip(badgeId);
        setTimeout(() => setTriggerFlip(null), 2000); // Reset after animation
    };

    return (
        <div>
            <div className="grid grid-cols-5 gap-4">
                {sortedBadges.map((badge, index) => (
                    <div key={badge.id} className="flex flex-col items-center space-y-2">
                        <div className="relative w-20 h-20">
                            {/* Inset seat/cavity for badge - stays in place */}
                            <div
                                className="absolute rounded-3xl"
                                style={{
                                    top: 0,
                                    left: 0,
                                    width: '80px',
                                    height: '80px',
                                    background: 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                    boxShadow: `
                                        inset 1.5px 1.5px 4px rgba(0, 0, 0, 0.15),
                                        inset -1.5px -1.5px 4px rgba(255, 255, 255, 0.6),
                                        inset 3px 3px 7px rgba(0, 0, 0, 0.1)
                                    `,
                                    zIndex: 0,
                                }}
                            >
                                {/* Circular hole for broach pin */}
                                <div
                                    className="absolute"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #d0d0d0, #c0c0c0)',
                                        boxShadow: `
                                            inset 2px 2px 4px rgba(0, 0, 0, 0.3),
                                            inset -1px -1px 3px rgba(255, 255, 255, 0.3)
                                        `,
                                    }}
                                />
                            </div>
                            <Badge 
                                badge={badge} 
                                index={index}
                                shouldFlip={triggerFlip === badge.id}
                                onBadgeClick={() => handleBadgeClick(badge.id)}
                            />
                        </div>
                        
                        {/* Badge info */}
                        <div className="text-center">
                            <p className="text-xs font-medium text-gray-700 dark:text-dark-200 truncate max-w-[80px]">
                                {badge.name.charAt(0).toUpperCase() + badge.name.slice(1).replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-400">
                                {new Date(badge.awarded_at).toLocaleDateString('en-GB', { 
                                    day: 'numeric', 
                                    month: 'short' 
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BadgeWidget;
