import { motion, useMotionValue } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';

// Unified burst pattern component with memoization
function BurstPattern({ firework }) {
    const particles = useMemo(() => {
        const particleArray = [];
        
        // Palm pattern - special handling
        if (firework.burstPattern === 'palm') {
            const shells = 4;
            const particlesPerShell = 8;
        
            for (let shell = 0; shell < shells; shell++) {
                const shellDistance = (shell + 1) * 5;
                const shellDelay = shell * 0.15;
                
                for (let p = 0; p < particlesPerShell; p++) {
                    const angle = (p / particlesPerShell) * 360;
                    const xPosition = Math.cos((angle * Math.PI) / 180) * shellDistance;
                    const yPosition = Math.sin((angle * Math.PI) / 180) * shellDistance;
                    
                    const normalizedAngle = (angle + 360) % 360;
                    
                    // Skip top particles based on angle and shell
                    if (Math.abs(normalizedAngle - 90) < 1 && shell >= shells - 3) continue;
                    if ((Math.abs(normalizedAngle - 45) < 1 || Math.abs(normalizedAngle - 135) < 1) && shell >= shells - 2) continue;
                    if ((Math.abs(normalizedAngle - 0) < 1 || Math.abs(normalizedAngle - 180) < 1) && shell >= shells - 1) continue;
                    
                    // Droop calculation
                    const horizontalDistance = Math.abs(xPosition);
                    const maxDistance = 20;
                    const edgeness = horizontalDistance / maxDistance;
                    const baseFall = 3;
                    const archDroop = edgeness * 40;
                    const shellDroop = shellDistance * 2;
                    const fallDistance = baseFall + archDroop + shellDroop + Math.random() * 5;
                    
                    const baseDuration = 12.0;
                    const durationReduction = (edgeness + (shell / shells)) * 4.0;
                    const fallDuration = baseDuration - durationReduction;
                    
                    particleArray.push(
                        <motion.div
                            key={`palm-${shell}-${p}`}
                            initial={{
                                x: firework.targetX + xPosition,
                                y: firework.targetY + yPosition,
                                opacity: 0,
                            }}
                            animate={{
                                x: firework.targetX + xPosition,
                                y: firework.targetY + yPosition + fallDistance,
                                opacity: [0, 1, 1, 0.7, 0.4, 0.1, 0],
                            }}
                            transition={{
                                x: {
                                    duration: fallDuration,
                                    delay: shellDelay + 1.0,
                                    ease: [0.2, 0, 0.8, 1],
                                },
                                y: {
                                    duration: fallDuration,
                                    delay: shellDelay + 1.0,
                                    ease: [0.2, 0, 0.8, 1],
                                },
                                opacity: {
                                    duration: 3.5,
                                    delay: shellDelay + 1.0,
                                    ease: "easeOut",
                                },
                            }}
                            style={{
                                position: 'absolute',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: '#FFD700',
                                boxShadow: '0 0 4px #FFD700',
                            }}
                        />
                    );
                }
            }
        } else {
            // All other burst patterns
            for (let i = 0; i < 12; i++) {
                let angle, distance, extraY;
                
                // Different burst patterns
                if (firework.burstPattern === 'circle') {
                    angle = (i * 360) / 12;
                    distance = 15;
                    extraY = 5;
                } else if (firework.burstPattern === 'ring') {
                    angle = (i * 360) / 12;
                    distance = 18;
                    extraY = 3;
                } else if (firework.burstPattern === 'willow') {
                    angle = (i * 360) / 12;
                    distance = 12;
                    extraY = 10 + i * 0.5;
                } else if (firework.burstPattern === 'crossette') {
                    if (i % 3 !== 0) continue;
                    angle = (i * 360) / 12;
                    distance = 20;
                    extraY = 5;
                } else if (firework.burstPattern === 'radial') {
                    angle = (i * 360) / 12;
                    distance = 10 + (i % 3) * 5;
                    extraY = 2;
                } else if (firework.burstPattern === 'star') {
                    angle = (i * 360) / 12;
                    distance = (i % 2 === 0) ? 20 : 10;
                    extraY = 3;
                } else if (firework.burstPattern === 'split') {
                    angle = (i * 360) / 12;
                    distance = 15;
                    extraY = 5;
                } else if (firework.burstPattern === 'saturn') {
                    angle = (i * 360) / 12;
                    distance = 15;
                    extraY = 5;
                } else if (firework.burstPattern === 'angel') {
                    continue; // Angel pattern handled after loop
                }
                
                // Determine particle color for split pattern
                let particleBurstColor = firework.burstColor;
                let particleFizzleColor = firework.fizzleColor;
                
                if (firework.burstPattern === 'split') {
                    if (angle >= 90 && angle < 270) {
                        particleBurstColor = firework.splitColorLeft;
                        particleFizzleColor = firework.splitColorLeft;
                    } else {
                        particleBurstColor = firework.splitColorRight;
                        particleFizzleColor = firework.splitColorRight;
                    }
                }
                
                particleArray.push(
                    <motion.div
                        key={`burst-${i}`}
                        initial={{
                            x: firework.targetX,
                            y: firework.targetY,
                            opacity: 0,
                            scale: 0,
                        }}
                        animate={{
                            x: firework.targetX + Math.cos((angle * Math.PI) / 180) * distance,
                            y: firework.targetY + Math.sin((angle * Math.PI) / 180) * distance + extraY,
                            opacity: [0, 1, 0.8, 0.4, 0],
                            scale: [0, 1, 0.9, 0.7, 0],
                            background: [
                                particleBurstColor,
                                particleBurstColor,
                                particleFizzleColor,
                                particleFizzleColor
                            ],
                        }}
                        transition={{
                            duration: 2,
                            delay: 0.8,
                            ease: "easeOut",
                        }}
                        style={{
                            position: 'absolute',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: firework.burstColor,
                            boxShadow: `0 0 8px ${firework.burstColor}`,
                        }}
                    />
                );
            }
            
            // Angel pattern - render text
            if (firework.burstPattern === 'angel') {
                const letterA = [[2, 0], [1, 2], [3, 2], [0, 4], [4, 4], [0, 6], [4, 6], [0, 7], [4, 7], [1, 4], [2, 4], [3, 4]];
                const letterN = [[0, 0], [0, 2], [0, 4], [0, 6], [0, 7], [1, 2], [2, 3], [3, 5], [4, 0], [4, 2], [4, 4], [4, 6], [4, 7]];
                const letterG = [[1, 0], [2, 0], [3, 0], [0, 1], [0, 3], [0, 5], [1, 7], [2, 7], [3, 7], [4, 5], [4, 6], [2, 4], [3, 4], [4, 4]];
                const letterE = [[0, 0], [0, 2], [0, 4], [0, 6], [0, 7], [1, 0], [2, 0], [3, 0], [4, 0], [1, 4], [2, 4], [3, 4], [1, 7], [2, 7], [3, 7], [4, 7]];
                const letterL = [[0, 0], [0, 2], [0, 4], [0, 6], [0, 7], [1, 7], [2, 7], [3, 7], [4, 7]];
                
                const allParticles = [];
                const spacing = 6;
                const scale = 2.5;
                const totalWidth = (spacing * 4 + 5) * scale;
                const startX = -totalWidth / 2;
                const startY = -9;
                
                letterA.forEach(([x, y]) => allParticles.push({ x: startX + x * scale, y: startY + y * scale }));
                letterN.forEach(([x, y]) => allParticles.push({ x: startX + (spacing + x) * scale, y: startY + y * scale }));
                letterG.forEach(([x, y]) => allParticles.push({ x: startX + (spacing * 2 + x) * scale, y: startY + y * scale }));
                letterE.forEach(([x, y]) => allParticles.push({ x: startX + (spacing * 3 + x) * scale, y: startY + y * scale }));
                letterL.forEach(([x, y]) => allParticles.push({ x: startX + (spacing * 4 + x) * scale, y: startY + y * scale }));
                
                allParticles.forEach((particle, i) => {
                    particleArray.push(
                        <motion.div
                            key={`angel-${i}`}
                            initial={{
                                x: firework.targetX,
                                y: firework.targetY,
                                opacity: 0,
                                scale: 0,
                            }}
                            animate={{
                                x: firework.targetX + particle.x,
                                y: firework.targetY + particle.y,
                                opacity: [0, 1, 1, 1, 0.8, 0.4, 0],
                                scale: [0, 1, 1, 1, 1, 1, 0.8],
                            }}
                            transition={{
                                duration: 3,
                                delay: 0.8,
                                ease: "easeOut",
                            }}
                            style={{
                                position: 'absolute',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: firework.burstColor,
                                boxShadow: `0 0 6px ${firework.burstColor}`,
                            }}
                        />
                    );
                });
            }
        }
        
        return particleArray;
    }, [firework.id, firework.burstPattern, firework.targetX, firework.targetY, firework.burstColor, firework.fizzleColor, firework.splitColorLeft, firework.splitColorRight]);
    
    return <>{particles}</>;
}

export default function NewYearsFace({ mouseX, mouseY, isHovering, embossingContent }) {
    const [badgeIsHovered, setBadgeIsHovered] = useState(false);
    const [fireworks, setFireworks] = useState([]);
    const [nextId, setNextId] = useState(0);
    const badgeIsHoveredRef = useRef(false);
    const mouseXRef = useRef(mouseX);
    
    // Generate stars once with minimum distance between them
    const stars = useRef((() => {
        const stars = [];
        const minDistance = 15; // Minimum distance between stars (in percentage)
        const maxAttempts = 100;
        
        while (stars.length < 20) {
            let attempts = 0;
            let validPosition = false;
            let newStar;
            
            while (!validPosition && attempts < maxAttempts) {
                newStar = {
                    id: stars.length,
                    left: Math.random() * 100,
                    top: Math.random() * 67, // Only top 2/3 of badge
                    size: 1 + Math.random() * 2,
                    delay: Math.random() * 2,
                    duration: 2 + Math.random() * 2,
                };
                
                // Check distance from all existing stars
                validPosition = stars.every(star => {
                    const dx = newStar.left - star.left;
                    const dy = newStar.top - star.top;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance >= minDistance;
                });
                
                attempts++;
            }
            
            if (validPosition) {
                stars.push(newStar);
            } else {
                // If we can't find a valid position, reduce the required count
                break;
            }
        }
        
        return stars;
    })()).current;

    // Subscribe to badge hover changes
    useEffect(() => {
        const unsubscribe = isHovering.on('change', (value) => {
            setBadgeIsHovered(value);
            badgeIsHoveredRef.current = value;
        });
        setBadgeIsHovered(isHovering.get());
        badgeIsHoveredRef.current = isHovering.get();
        return unsubscribe;
    }, [isHovering]);

    // Update mouseX ref
    useEffect(() => {
        mouseXRef.current = mouseX;
    }, [mouseX]);

    // Rainbow colors for explosions
    const rainbowColors = [
        '#FF0000', // Red
        '#FF7F00', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3', // Violet
    ];

    // Launch fireworks - always active, not just on hover
    useEffect(() => {
        let currentId = nextId;
        let isMounted = true;

        const launchSingleFirework = () => {
            if (!isMounted) return;
            
            // If hovered, launch from mouse X position, otherwise random
            const startX = badgeIsHoveredRef.current 
                ? mouseXRef.current.get() * 80 
                : 20 + Math.random() * 40;
            
            const targetY = 15 + Math.random() * 25; // Explode at 15-40px height
            const horizontalDrift = (Math.random() - 0.5) * 40; // Increased horizontal movement
            const targetX = startX + horizontalDrift;
            const burstColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            const fizzleColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            
            // For split pattern, pick two additional colors
            const splitColorLeft = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            const splitColorRight = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            
            // For saturn pattern, pick a contrasting ring color
            const saturnRingColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            
            // Random burst pattern - angel is very rare (5% chance)
            const burstPatterns = ['circle', 'ring', 'willow', 'crossette', 'radial', 'star', 'split', 'palm', 'saturn'];
            let burstPattern;
            
            // 5% chance for angel pattern
            if (Math.random() < 0.05) {
                burstPattern = 'angel';
            } else {
                burstPattern = burstPatterns[Math.floor(Math.random() * burstPatterns.length)];
            }

            const firework = {
                id: currentId,
                startX,
                targetX,
                targetY,
                horizontalDrift,
                burstColor,
                fizzleColor,
                splitColorLeft,
                splitColorRight,
                saturnRingColor,
                burstPattern,
            };

            setFireworks(prev => [...prev, firework]);

            // Remove firework after animation completes
            // Palm pattern needs longer: shell expansion (0.6s) + pause (1s) + fall (up to 12s) = ~14s
            const animationDuration = firework.burstPattern === 'palm' ? 15000 : 3000;
            setTimeout(() => {
                setFireworks(prev => prev.filter(f => f.id !== firework.id));
            }, animationDuration);
            
            currentId++;
            setNextId(currentId);
            
            // Schedule next firework with random delay (800-1800ms)
            const nextDelay = 500 + Math.random() * 1000;
            setTimeout(launchSingleFirework, nextDelay);
        };

        // Start the continuous firework launches
        launchSingleFirework();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div style={{
            width: '80px',
            height: '80px',
            position: 'relative',
            background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 50%, #2a2a4a 100%)',
            overflow: 'hidden',
        }}>            
            {/* Background stars */}
            {stars.map((star) => (
                <motion.div
                    key={`star-${star.id}`}
                    initial={{
                        opacity: 0.3,
                    }}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        delay: star.delay,
                        ease: "easeInOut",
                    }}
                    style={{
                        position: 'absolute',
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        background: 'white',
                        boxShadow: '0 0 2px rgba(255,255,255,0.8)',
                    }}
                />
            ))}
            
            {/* Fireworks */}
            {fireworks.map((firework) => (
                <div key={firework.id} style={{ position: 'relative', zIndex: 35 }}>
                    {/* Rising trail with golden sparks */}
                    <motion.div
                        initial={{
                            x: firework.startX,
                            y: 80,
                            opacity: 1,
                        }}
                        animate={{
                            x: [firework.startX, firework.startX + firework.horizontalDrift * 0.3, firework.targetX],
                            y: [80, 50, firework.targetY],
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.8,
                            ease: "easeOut",
                        }}
                        style={{
                            position: 'absolute',
                            width: '3px',
                            height: '3px',
                            borderRadius: '50%',
                            background: 'linear-gradient(to top, #FFD700, #FFA500)',
                            boxShadow: '0 0 8px #FFD700, 0 0 4px #FFA500',
                        }}
                    />

                    {/* Sparkling trail particles */}
                    {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                            key={`trail-${i}`}
                            initial={{
                                x: firework.startX,
                                y: 80 - i * 5,
                                opacity: 0,
                            }}
                            animate={{
                                x: firework.startX + (Math.random() - 0.5) * 3,
                                y: 80 - i * 5,
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 0.3,
                                delay: i * 0.08,
                            }}
                            style={{
                                position: 'absolute',
                                width: '2px',
                                height: '2px',
                                borderRadius: '50%',
                                background: '#FFD700',
                                boxShadow: '0 0 4px #FFD700',
                            }}
                        />
                    ))}

                    {/* Burst explosion - all patterns */}
                    <BurstPattern firework={firework} />
                    
                    {/* Saturn rings - additional particles in opposing color */}
                    {firework.burstPattern === 'saturn' && Array.from({ length: 24 }).map((_, i) => {
                        const angle = (i * 360) / 24;
                        // Create elliptical ring on a diagonal
                        const radiusX = 25; // Wider horizontal spread
                        const radiusY = 8;  // Compressed vertical spread
                        
                        return (
                            <motion.div
                                key={`saturn-ring-${i}`}
                                initial={{
                                    x: firework.targetX,
                                    y: firework.targetY,
                                    opacity: 0,
                                    scale: 0,
                                }}
                                animate={{
                                    x: firework.targetX + Math.cos((angle * Math.PI) / 180) * radiusX,
                                    y: firework.targetY + Math.sin((angle * Math.PI) / 180) * radiusY + 4,
                                    opacity: [0, 0.6, 0.5, 0.3, 0],
                                    scale: [0, 1, 0.9, 0.7, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    delay: 0.8,
                                    ease: "easeOut",
                                }}
                                style={{
                                    position: 'absolute',
                                    width: '3px',
                                    height: '3px',
                                    borderRadius: '50%',
                                    background: firework.saturnRingColor,
                                    boxShadow: `0 0 6px ${firework.saturnRingColor}`,
                                }}
                            />
                        );
                    })}

                </div>
            ))}

            {/* Embossed icon/image - behind fireworks */}
            <div style={{  }}>
                {embossingContent}
            </div>

            {/* Ground glow effect */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '20px',
                background: 'linear-gradient(to top, rgba(255, 215, 0, 0.2), transparent)',
            }} />
        </div>
    );
}
