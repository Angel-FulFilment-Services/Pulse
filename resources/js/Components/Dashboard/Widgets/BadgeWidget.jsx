import React, { useState } from 'react';
import Badge from '../../Badges/Badge.jsx';

const BadgeWidget = ({ employee }) => {
    const [triggerFlip, setTriggerFlip] = useState(null);

    // Placeholder data - will be replaced with real data from API
    const badges = [
        ...Array.from({ length: 9 }, (_, index) => ({
            id: index + 1,
            name: `Badge ${index + 1}`,
            tier: ['bronze', 'silver', 'gold', 'platinum', 'emerald', 'ruby', 'sapphire', 'diamond', 'alexandrite'][index % 9],
            awarded_at: new Date(Date.now() - index * 86400000).toISOString(), // Last 9 days
            isNew: index === 0, // Mark first and third badges as new
        })),
        // Non-tiered badge for testing
        {
            id: 10,
            name: 'Basic Badge',
            tier: 'basic',
            awarded_at: new Date(Date.now() - 10 * 86400000).toISOString(),
            isNew: false,
        },
        // Christmas Snow badge for testing
        {
            id: 11,
            name: 'Winter Wonderland',
            tier: 'christmas_snow',
            awarded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            isNew: false,
        },
        // Christmas Lights badge for testing
        {
            id: 12,
            name: 'Holiday Lights',
            tier: 'christmas_lights',
            awarded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            isNew: false,
        },
        // New Years badge for testing
        {
            id: 13,
            name: 'New Year Celebration',
            tier: 'new_years',
            awarded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            isNew: false,
        },
        {
            id: 14,
            name: "Jack O Lantern",
            tier: 'jack_o_lantern',
            awarded_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            isNew: false,
        },
        // Spooky Ghost badge for testing
        {
            id: 15,
            name: 'Haunted Spirit',
            tier: 'spooky_ghost',
            awarded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            isNew: false,
        },
        // Autumn badge for testing
        {
            id: 16,
            name: 'Autumn Harvest',
            tier: 'autumn',
            awarded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            isNew: false,
        }
    ];

    const handleBadgeClick = (badgeId) => {
        setTriggerFlip(badgeId);
        setTimeout(() => setTriggerFlip(null), 2000); // Reset after animation
    };

    return (
        <div>
            <div className="grid grid-cols-4 gap-4">
                {badges.map((badge, index) => (
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
                            />
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
