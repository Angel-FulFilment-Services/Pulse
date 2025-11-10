import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useAnimation } from 'framer-motion';
import AlexandriteFace from './Faces/AlexandriteFace.jsx';
import ChristmasSnowFace from './Faces/ChristmasSnowFace.jsx';
import ChristmasLightsFace from './Faces/ChristmasLightsFace.jsx';
import NewYearsFace from './Faces/NewYearsFace.jsx';
import JackOLanternFace from './Faces/JackOLanternFace.jsx';
import SpookyGhostFace from './Faces/SpookyGhostFace.jsx';
import AutumnFace from './Faces/AutumnFace.jsx';

const Badge = ({ badge, index, shouldFlip = false, onBadgeClick }) => {
    const badgeRef = useRef(null);
    const containerRef = useRef(null);
    const controls = useAnimation();
    const [isFlipping, setIsFlipping] = useState(false);
    const [isHoveringBadge, setIsHoveringBadge] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [highZIndex, setHighZIndex] = useState(false);
    const [enlargeTransform, setEnlargeTransform] = useState({ x: 0, y: 0, scale: 1 });
    const hasFlippedRef = useRef(false);
    
    // Calculate transform to center when enlarging
    useEffect(() => {
        if (isEnlarged && containerRef.current) {
            setHighZIndex(true); // Set high z-index immediately when enlarging
            const rect = containerRef.current.getBoundingClientRect();
            
            // Find the badge widget container (parent with class containing 'badge')
            let widgetContainer = containerRef.current.closest('.grid') || containerRef.current.closest('[class*="badge"]');
            
            // If we can't find a specific container, use the viewport
            if (!widgetContainer) {
                widgetContainer = document.body;
            }
            
            const widgetRect = widgetContainer.getBoundingClientRect();
            const centerX = widgetRect.left + widgetRect.width / 2;
            const centerY = widgetRect.top + widgetRect.height / 2;
            
            // Calculate distance from current position to center of widget
            const currentCenterX = rect.left + rect.width / 2;
            const currentCenterY = rect.top + rect.height / 2;
            
            const deltaX = centerX - currentCenterX;
            const deltaY = centerY - currentCenterY;
            
            setEnlargeTransform({
                x: deltaX,
                y: deltaY,
                scale: 4,
            });
        } else {
            setEnlargeTransform({
                x: 0,
                y: 0,
                scale: 1,
            });
            // Delay lowering z-index until after animation completes (spring takes ~1 second)
            const timeout = setTimeout(() => {
                setHighZIndex(false);
            }, 200);
            
            // Cleanup timeout if component unmounts or isEnlarged changes again
            return () => clearTimeout(timeout);
        }
    }, [isEnlarged]);
    
    // Motion values for mouse/gyro position (0-1 range)
    // Start at bottom-right (1, 1) for alexandrite spectrum
    const mouseX = useMotionValue(1);
    const mouseY = useMotionValue(1);
    const isHovering = useMotionValue(false);
    
    // Motion values for tilt effect
    const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
    const rotateY = useSpring(0, { stiffness: 300, damping: 30 });
    
    // Glare appears on the OPPOSITE side of the mouse
    // If mouse is at 25% (left), glare should be at 75% (right)
    const glareX = useTransform(mouseX, [0, 1], [100, 0]);
    const glareY = useTransform(mouseY, [0, 1], [100, 0]);
    
    // 3D edge transforms (always created, but only used when enlarged)
    const topEdgeTransform = useTransform(rotateX, [-40, 0, 40], ['rotateX(-90deg) translateY(-2px)', 'rotateX(0deg)', 'rotateX(0deg)']);
    const topEdgeOpacity = useTransform(rotateX, [-40, -10, 0], [1, 0.5, 0]);
    const bottomEdgeTransform = useTransform(rotateX, [-40, 0, 40], ['rotateX(0deg)', 'rotateX(0deg)', 'rotateX(90deg) translateY(2px)']);
    const bottomEdgeOpacity = useTransform(rotateX, [0, 10, 40], [0, 0.5, 1]);
    const leftEdgeTransform = useTransform(rotateY, [-40, 0, 40], ['rotateY(-90deg) translateX(-2px)', 'rotateY(0deg)', 'rotateY(0deg)']);
    const leftEdgeOpacity = useTransform(rotateY, [-40, -10, 0], [1, 0.5, 0]);
    const rightEdgeTransform = useTransform(rotateY, [-40, 0, 40], ['rotateY(0deg)', 'rotateY(0deg)', 'rotateY(90deg) translateX(2px)']);
    const rightEdgeOpacity = useTransform(rotateY, [0, 10, 40], [0, 0.5, 1]);
    
    // Badge tier colors
    const tierColors = {
        bronze: { primary: '#CD7F32', secondary: '#B8860B', accent: '#8B4513' },
        silver: { primary: '#C0C0C0', secondary: '#A9A9A9', accent: '#D3D3D3' },
        gold: { primary: '#FFD700', secondary: '#FFA500', accent: '#DAA520' },
        platinum: { primary: '#E5E4E2', secondary: '#C0C0C0', accent: '#A8A8A8' },
        emerald: { primary: '#50C878', secondary: '#2E8B57', accent: '#00A86B' },
        ruby: { primary: '#E0115F', secondary: '#9B111E', accent: '#CC0044' },
        sapphire: { primary: '#0F52BA', secondary: '#0A3D8F', accent: '#4169E1' },
        diamond: { primary: '#B9F2FF', secondary: '#87CEEB', accent: '#ADD8E6' },
        alexandrite: { primary: '#4B0082', secondary: '#8B00FF', accent: '#9400D3' },
        basic: { primary: '#A8A8A8', secondary: '#909090', accent: '#C0C0C0' },
        christmas_snow: { primary: '#E8F5F7', secondary: '#B8D9E8', accent: '#A0C8D8' },
        christmas_lights: { primary: '#1a2332', secondary: '#2d3e50', accent: '#34495e' },
        new_years: { primary: '#FFD700', secondary: '#FFA500', accent: '#FF6B6B' },
        jack_o_lantern: { primary: '#ff8c1a', secondary: '#ff6b00', accent: '#cc5500' },
        spooky_ghost: { primary: '#E8E8F0', secondary: '#C0C0D8', accent: '#A0A0C0' },
        autumn: { primary: '#D2691E', secondary: '#CD853F', accent: '#DAA520' },
    };
    
    const colors = tierColors[badge.tier] || tierColors.silver;
    const isAlexandrite = badge.tier === 'alexandrite';
    const isChristmasSnow = badge.tier === 'christmas_snow';
    const isChristmasLights = badge.tier === 'christmas_lights';
    const isNewYears = badge.tier === 'new_years';
    const isJackOLantern = badge.tier === 'jack_o_lantern';
    const isSpookyGhost = badge.tier === 'spooky_ghost';
    const isAutumn = badge.tier === 'autumn';
    const hasCustomFace = isAlexandrite || isChristmasSnow || isChristmasLights || isNewYears || isJackOLantern || isSpookyGhost || isAutumn;
    
    // Determine glare intensity based on badge tier (darker badges get reduced glare)
    const darkBadges = ['sapphire', 'alexandrite', 'emerald', 'basic'];
    const subtleBadges = ['christmas_lights', 'new_years', 'spooky_ghost', 'jack_o_lantern', 'autumn'];
    const glareIntensity = darkBadges.includes(badge.tier) ? 0.75 : subtleBadges.includes(badge.tier) ? 0.25 : 1;
        
    // Device orientation (gyro) tracking
    useEffect(() => {
        let permissionGranted = false;
        
        const handleOrientation = (event) => {
            if (event.beta !== null && event.gamma !== null) {
                // Normalize values to 0-1 range
                const normalizedBeta = (event.beta + 90) / 180;
                const normalizedGamma = (event.gamma + 90) / 180;
                
                mouseX.set(Math.max(0, Math.min(1, normalizedGamma)));
                mouseY.set(Math.max(0, Math.min(1, normalizedBeta)));
                
                rotateY.set((normalizedGamma - 0.5) * 30);
                rotateX.set((normalizedBeta - 0.5) * -30);
            }
        };
        
        // Check if we need to request permission (iOS 13+)
        if (typeof DeviceMotionEvent !== 'undefined' && 
            typeof DeviceMotionEvent.requestPermission === 'function') {
            const requestPermission = () => {
                DeviceMotionEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            permissionGranted = true;
                            window.addEventListener('deviceorientation', handleOrientation, true);
                        }
                    })
                    .catch(console.error);
            };
            
            document.addEventListener('click', requestPermission, { once: true });
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            permissionGranted = true;
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        
        return () => {
            if (permissionGranted) {
                window.removeEventListener('deviceorientation', handleOrientation, true);
            }
        };
    }, [mouseX, mouseY, rotateX, rotateY]);
    
    // Mouse move effect for desktop
    const handleMouseMove = (e) => {
        if (!badgeRef.current || isFlipping) return;
        
        const rect = badgeRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        // Update position for glare/shine
        mouseX.set(x);
        mouseY.set(y);
        isHovering.set(true);
        setIsHoveringBadge(true);
        
        // Calculate rotation based on distance from center
        const rotationY = (x - 0.5) * 40;
        const rotationX = (y - 0.5) * -40;

        rotateY.set(rotationY);
        rotateX.set(rotationX);
    };
    
    const handleMouseLeave = () => {
        if (isFlipping) return;
        
        mouseX.set(1);
        mouseY.set(1);
        isHovering.set(false);
        setIsHoveringBadge(false);
        rotateX.set(0);
        rotateY.set(0);
    };

    // Flip animation trigger
    useEffect(() => {
        if (shouldFlip && !hasFlippedRef.current && !isEnlarged) {
            hasFlippedRef.current = true;
            setIsFlipping(true);
            
            // Reset spring rotations before flip (instantly, no animation)
            rotateX.jump(0);
            rotateY.jump(0);
            
            controls.start({
                scale: [1, 1.5, 1.5, 1.5, 1],
                rotateY: [0, 180, 360, 540, 720],
                z: [0, 50, 50, 50, 0],
                transition: {
                    duration: 1.8,
                    times: [0, 0.3, 0.5, 0.7, 1],
                    ease: [0.25, 0.46, 0.45, 0.94],
                }
            }).then(() => {
                setIsFlipping(false);
                rotateX.jump(0);
                rotateY.jump(0);
            });
        } else if (!shouldFlip) {
            hasFlippedRef.current = false;
        }
    }, [shouldFlip, controls, rotateX, rotateY, isEnlarged]);
    
    // Memoize particle burst to prevent re-renders from canceling animation
    const particleBurst = useMemo(() => {
        if (!isFlipping) return null;
        
        return (
            <div className="absolute" style={{ 
                top: '0',
                left: '0',
                width: '80px',
                height: '80px',
                zIndex: 1,
                pointerEvents: 'none',
            }}>
                {Array.from({ length: 20 }).map((_, i) => {
                    const angle = (i * 360) / 20 + (Math.random() - 0.5) * 30;
                    const distance = 100 + Math.random() * 40;
                    const endX = Math.cos((angle * Math.PI) / 180) * distance;
                    const endY = Math.sin((angle * Math.PI) / 180) * distance;
                    const size = 4.5 + Math.random() * 1.5;
                    const delay = 0.2 + Math.random() * 0.3;
                    
                    const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
                    const particleColor = badge.tier === 'new_years' 
                        ? rainbowColors[i % rainbowColors.length]
                        : colors.accent;
                    const particleGlow = badge.tier === 'new_years'
                        ? rainbowColors[i % rainbowColors.length]
                        : colors.primary;
                    
                    return (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{
                                left: '40px',
                                top: '40px',
                                width: `${size}px`,
                                height: `${size}px`,
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${particleColor}, ${particleGlow})`,
                                boxShadow: `0 0 ${size * 2}px ${particleColor}`,
                            }}
                            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                            animate={{
                                x: [0, endX * 0.6, endX],
                                y: [0, endY * 0.6, endY],
                                opacity: [0, 1, 0],
                                scale: [0, 1.2, 0],
                            }}
                            transition={{
                                duration: 1.4 + Math.random() * 0.4,
                                delay: delay,
                                times: [0, 0.3, 1],
                                ease: 'easeOut',
                            }}
                        />
                    );
                })}
            </div>
        );
    }, [isFlipping, badge.tier, colors.accent, colors.primary]);
    
    // Render custom face based on tier
    const renderCustomFace = () => {
        if (isAlexandrite) {
            return (
                <AlexandriteFace 
                    mouseX={mouseX}
                    mouseY={mouseY}
                    isFlipping={isFlipping}
                    glareIntensity={glareIntensity}
                    colors={colors}
                    rotateX={rotateX}
                    rotateY={rotateY}
                />
            );
        }
        
        if (isChristmasSnow) {
            return (
                <ChristmasSnowFace 
                    mouseX={mouseX}
                    mouseY={mouseY}
                    isHovering={isHovering}
                    rotateX={rotateX}
                    rotateY={rotateY}
                />
            );
        }
        
        if (isChristmasLights) {
            return (
                <ChristmasLightsFace 
                    mouseX={mouseX}
                    mouseY={mouseY}
                    isHovering={isHovering}
                    rotateX={rotateX}
                    rotateY={rotateY}
                />
            );
        }
        
        if (isNewYears) {
            return (
                <NewYearsFace 
                    mouseX={mouseX}
                    mouseY={mouseY}
                    isHovering={isHovering}
                    rotateX={rotateX}
                    rotateY={rotateY}
                />
            );
        }
        
        if (isJackOLantern) {
            return (
                <JackOLanternFace 
                    mouseX={mouseX}
                    mouseY={mouseY}
                    isHovering={isHovering}
                    rotateX={rotateX}
                    rotateY={rotateY}
                />
            );
        }
        
        if (isSpookyGhost) {
            return (
                <SpookyGhostFace 
                    mouseX={mouseX}
                    mouseY={mouseY}
                    isHovering={isHovering}
                    rotateX={rotateX}
                    rotateY={rotateY}
                />
            );
        }
        
        if (isAutumn) {
            return (
                <AutumnFace 
                    mouseX={mouseX}
                    mouseY={mouseY}
                    isHovering={isHovering}
                    rotateX={rotateX}
                    rotateY={rotateY}
                />
            );
        }
        
        return null;
    };
    
    return (
        <>
            <motion.div
                ref={containerRef}
                className="relative w-20 h-20"
                style={{
                    zIndex: highZIndex ? 9999 : 1,
                }}
                animate={{
                    x: enlargeTransform.x,
                    y: enlargeTransform.y,
                    scale: enlargeTransform.scale,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                }}
            >
                {/* "NEW!" indicator floating in top right */}
                {badge.isNew && !isFlipping && (
                    <motion.div
                        className="absolute pointer-events-none bg-theme-500 font-bold text-white shadow-theme-500/50"
                        style={{
                            top: '-8px',
                            right: '-8px',
                            zIndex: 10,
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            boxShadow: '0 0 8px rgb(var(--theme-500) / 0.6), 0 0 12px rgb(var(--theme-500) / 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        NEW!
                    </motion.div>
                )}
                
                {/* Particle burst effect during flip */}
                {particleBurst}
                
                {/* Dynamic shadow during flip */}
                {isFlipping && (
                    <motion.div
                        className="absolute rounded-3xl pointer-events-none bg-transparent"
                        style={{
                            top: '8px',
                            left: '8px',
                            width: '80px',
                            height: '80px',
                            zIndex: 0,
                        }}
                        animate={{
                            filter: [
                                'blur(6px)',
                                'blur(12px)',
                                'blur(15px)',
                                'blur(12px)',
                                'blur(6px)',
                            ],
                            opacity: [0.2, 0.4, 0.5, 0.4, 0.2],
                            top: ['8px', '20px', '30px', '20px', '8px'],
                            left: ['8px', '16px', '20px', '16px', '8px'],
                        }}
                        transition={{
                            duration: 1.8,
                            times: [0, 0.25, 0.5, 0.75, 1],
                            ease: 'linear',
                        }}
                    >
                        <div className="w-full h-full rounded-3xl bg-black"></div>
                    </motion.div>
                )}

                {/* Hover shadow */}
                <motion.div
                    className="absolute rounded-3xl pointer-events-none bg-transparent"
                    style={{
                        width: '80px',
                        height: '80px',
                        zIndex: 0,
                        x: useTransform(rotateY, [-35, 0, 35], ['15px', '10px', '5px']),
                        y: useTransform(rotateX, [-35, 0, 35], ['5px', '10px', '15px']),
                    }}
                    initial={{ opacity: 0, filter: 'blur(6px)' }}
                    animate={
                        (isHoveringBadge || isEnlarged) && !isFlipping
                            ? { opacity: 0.3, filter: 'blur(8px)' }
                            : { opacity: 0, filter: 'blur(6px)' }
                    }
                    transition={{
                        duration: 0.3,
                        ease: 'easeOut',
                    }}
                >
                    <div className="w-full h-full rounded-3xl bg-black"></div>
                </motion.div>
                
                <motion.div
                    ref={badgeRef}
                    className="relative w-20 h-20 rounded-3xl cursor-pointer"
                    animate={controls}
                    style={{
                        perspective: 1000,
                        transformStyle: 'preserve-3d',
                        rotateX,
                        rotateY,
                        filter: isFlipping ? undefined : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                        zIndex: 1,
                        WebkitFontSmoothing: 'subpixel-antialiased',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                        if (!isFlipping) {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsEnlarged(!isEnlarged);
                        }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    whileHover={!isFlipping && !isEnlarged ? { scale: 1.05 } : undefined}
                    whileTap={!isFlipping ? { scale: 0.95 } : undefined}
                >
                    {/* FRONT SIDE */}
                    <motion.div
                        className="w-full h-full rounded-3xl relative overflow-hidden shadow-lg"
                        style={{
                            transformStyle: 'preserve-3d',
                            backfaceVisibility: 'hidden',
                            borderColor: colors.accent,
                            background: isAlexandrite 
                                ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`
                                : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            backgroundSize: isAlexandrite ? '200% 200%' : '100% 100%',
                        }}
                        animate={isAlexandrite ? {
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        } : {}}
                        transition={isAlexandrite ? {
                            duration: 3,
                            repeat: Infinity,
                            ease: 'linear',
                        } : {}}
                    >
                        {/* Base badge content */}
                        <div className="absolute inset-0 flex items-center justify-center text-2xl text-white/90 z-10">
                            
                        </div>
                        
                        {/* SHINE LAYER - Diagonal gradient for metallic effect */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `linear-gradient(
                                    135deg,
                                    rgba(255, 255, 255, 0.1) 0%,
                                    rgba(255, 255, 255, 0.15) 25%,
                                    rgba(0, 0, 0, 0.1) 50%,
                                    rgba(128, 128, 128, 0.1) 75%,
                                    rgba(255, 255, 255, 0.05) 100%
                                )`,
                                mixBlendMode: 'overlay',
                                zIndex: 20,
                            }}
                        />
                        
                        {/* METALLIC EDGE EFFECT */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none rounded-3xl"
                            style={{
                                boxShadow: `
                                    inset 0 2px 4px rgba(255, 255, 255, 0.4),
                                    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                                    inset 2px 0 4px rgba(255, 255, 255, 0.3),
                                    inset -2px 0 4px rgba(0, 0, 0, 0.2)
                                `,
                                zIndex: 20,
                            }}
                        />
                        
                        {/* 3D EDGE/THICKNESS - Only visible when enlarged */}
                        {isEnlarged && (
                            <>
                                {/* Top edge - 3D side face */}
                                <motion.div
                                    className="absolute pointer-events-none rounded-t-3xl"
                                    style={{
                                        top: '-24px',
                                        left: 0,
                                        right: 0,
                                        height: '24px',
                                        background: `linear-gradient(180deg, ${colors.accent} 0%, ${colors.secondary} 100%)`,
                                        transformOrigin: 'bottom',
                                        transform: 'rotateX(90deg)',
                                        opacity: topEdgeOpacity,
                                        zIndex: 5,
                                    }}
                                />
                                
                                {/* Bottom edge - 3D side face */}
                                <motion.div
                                    className="absolute pointer-events-none rounded-b-3xl"
                                    style={{
                                        bottom: '-24px',
                                        left: 0,
                                        right: 0,
                                        height: '24px',
                                        background: `linear-gradient(0deg, ${colors.accent} 0%, ${colors.secondary} 100%)`,
                                        transformOrigin: 'top',
                                        transform: 'rotateX(-90deg)',
                                        opacity: bottomEdgeOpacity,
                                        zIndex: 5,
                                    }}
                                />
                                
                                {/* Left edge - 3D side face */}
                                <motion.div
                                    className="absolute pointer-events-none"
                                    style={{
                                        top: 0,
                                        bottom: 0,
                                        left: '-24px',
                                        width: '24px',
                                        background: `linear-gradient(90deg, ${colors.accent} 0%, ${colors.secondary} 100%)`,
                                        transformOrigin: 'right',
                                        transform: 'rotateY(-90deg)',
                                        opacity: leftEdgeOpacity,
                                        zIndex: 5,
                                        borderRadius: '0 0 0 24px',
                                    }}
                                />
                                
                                {/* Right edge - 3D side face */}
                                <motion.div
                                    className="absolute pointer-events-none"
                                    style={{
                                        top: 0,
                                        bottom: 0,
                                        right: '-24px',
                                        width: '24px',
                                        background: `linear-gradient(270deg, ${colors.accent} 0%, ${colors.secondary} 100%)`,
                                        transformOrigin: 'left',
                                        transform: 'rotateY(90deg)',
                                        opacity: rightEdgeOpacity,
                                        zIndex: 5,
                                        borderRadius: '0 0 24px 0',
                                    }}
                                />
                            </>
                        )}
                        
                        {/* GLARE LAYER */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: useTransform([glareX, glareY, isHovering], ([x, y, hovering]) => {
                                    if (!hovering) return 'transparent';
                                    return `radial-gradient(
                                        circle at ${x}% ${y}%,
                                        rgba(255, 255, 255, ${0.3 * glareIntensity}) 0%,
                                        rgba(255, 255, 255, ${0.15 * glareIntensity}) 25%,
                                        rgba(255, 255, 255, ${0.05 * glareIntensity}) 45%,
                                        transparent 70%
                                    )`;
                                }),
                                zIndex: 30,
                            }}
                        />

                        {/* FLIP ANIMATION GLARE */}
                        {isFlipping && (
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: `linear-gradient(
                                        90deg,
                                        transparent 0%,
                                        rgba(255, 255, 255, ${0.8 * glareIntensity}) 50%,
                                        transparent 100%
                                    )`,
                                    backgroundSize: '200% 100%',
                                    zIndex: 30,
                                }}
                                initial={{ opacity: 0 }}
                                animate={{
                                    backgroundPosition: ['0% 0%', '200% 0%'],
                                    opacity: [0, 1, 1, 1, 0],
                                }}
                                transition={{
                                    duration: 1.8,
                                    times: [0, 0.2, 0.5, 0.8, 1],
                                    ease: 'linear',
                                }}
                            />
                        )}
                        
                        {/* CUSTOM FACE LAYER */}
                        {renderCustomFace()}
                    </motion.div>

                    {/* BACK SIDE - Pin broach */}
                    <motion.div
                        className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-lg"
                        style={{
                            rotateY: 180,
                            transformStyle: 'preserve-3d',
                            backfaceVisibility: 'hidden',
                            borderColor: tierColors.silver.accent,
                            background: `linear-gradient(135deg, ${tierColors.silver.primary}, ${tierColors.silver.secondary})`,
                        }}
                    >   
                        {/* SHINE LAYER */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `linear-gradient(
                                    135deg,
                                    rgba(255, 255, 255, 0.1) 0%,
                                    rgba(255, 255, 255, 0.15) 25%,
                                    rgba(0, 0, 0, 0.1) 50%,
                                    rgba(128, 128, 128, 0.1) 75%,
                                    rgba(255, 255, 255, 0.05) 100%
                                )`,
                                mixBlendMode: 'overlay',
                            }}
                        />
                        
                        {/* METALLIC EDGE EFFECT */}
                        <div
                            className="absolute inset-0 pointer-events-none rounded-3xl"
                            style={{
                                boxShadow: `
                                    inset 0 2px 4px rgba(255, 255, 255, 0.4),
                                    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                                    inset 2px 0 4px rgba(255, 255, 255, 0.3),
                                    inset -2px 0 4px rgba(0, 0, 0, 0.2)
                                `,
                            }}
                        />

                        {/* FLIP ANIMATION GLARE */}
                        {isFlipping && (
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: `linear-gradient(
                                        90deg,
                                        transparent 0%,
                                        rgba(255, 255, 255, 0.80) 50%,
                                        transparent 100%
                                    )`,
                                    backgroundSize: '200% 100%',
                                }}
                                initial={{ opacity: 0 }}
                                animate={{
                                    backgroundPosition: ['0% 0%', '200% 0%'],
                                    opacity: [0, 1, 1, 1, 0],
                                }}
                                transition={{
                                    duration: 1.8,
                                    times: [0, 0.2, 0.5, 0.8, 1],
                                    ease: 'linear',
                                }}
                            />
                        )}

                        {/* PIN BROACH */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {/* Broach shadow */}
                            <div
                                className="absolute"
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    filter: 'blur(5px)',
                                    top: '52%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                            
                            {/* Circular broach */}
                            <div
                                className="absolute"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '37.5px',
                                    height: '37.5px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle at 30% 30%, #E5E4E2, #A8A8A8)',
                                    boxShadow: `
                                        inset 2.5px 2.5px 5px rgba(255, 255, 255, 0.6),
                                        inset -2.5px -2.5px 5px rgba(0, 0, 0, 0.5),
                                        0 5px 10px rgba(0, 0, 0, 0.4)
                                    `,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Broach glare during flip */}
                                {isFlipping && (
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: `linear-gradient(
                                                90deg,
                                                transparent 0%,
                                                rgba(255, 255, 255, 0.70) 50%,
                                                transparent 100%
                                            )`,
                                            backgroundSize: '200% 100%',
                                            borderRadius: '50%',
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            backgroundPosition: ['0% 0%', '200% 0%'],
                                            opacity: [0, 1, 1, 1, 0],
                                        }}
                                        transition={{
                                            duration: 1.8,
                                            times: [0, 0.2, 0.5, 0.8, 1],
                                            ease: 'linear',
                                        }}
                                    />
                                )}
                                
                                {/* Central opening */}
                                <div
                                    className="absolute"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '22.5px',
                                        height: '22.5px',
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #555, #777)',
                                        boxShadow: `
                                            inset 0 2.5px 3.75px rgba(0, 0, 0, 0.6),
                                            inset 0 -1.25px 2.5px rgba(255, 255, 255, 0.15)
                                        `,
                                    }}
                                />

                                {/* Left clip */}
                                <div
                                    className="absolute"
                                    style={{
                                        top: '50%',
                                        left: '25%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '10px',
                                        height: '14px',
                                        borderRadius: '3px 0 0 3px',
                                        background: 'linear-gradient(180deg, #C0C0C0, #808080, #999)',
                                        boxShadow: `
                                            inset 1px 0 1px rgba(255, 255, 255, 0.5),
                                            inset -1px 0 1px rgba(0, 0, 0, 0.6),
                                            1px 0 2px rgba(0, 0, 0, 0.4)
                                        `,
                                    }}
                                >
                                    <div
                                        className="absolute"
                                        style={{
                                            top: '50%',
                                            right: '0',
                                            transform: 'translateY(-50%)',
                                            width: '3px',
                                            height: '8px',
                                            borderRadius: '0 1px 1px 0',
                                            background: '#444',
                                            boxShadow: 'inset -1px 0 1px rgba(0, 0, 0, 0.9)',
                                        }}
                                    />
                                </div>

                                {/* Right clip */}
                                <div
                                    className="absolute"
                                    style={{
                                        top: '50%',
                                        right: '25%',
                                        transform: 'translate(50%, -50%)',
                                        width: '10px',
                                        height: '14px',
                                        borderRadius: '0 3px 3px 0',
                                        background: 'linear-gradient(180deg, #C0C0C0, #808080, #999)',
                                        boxShadow: `
                                            inset -1px 0 1px rgba(255, 255, 255, 0.5),
                                            inset 1px 0 1px rgba(0, 0, 0, 0.6),
                                            -1px 0 2px rgba(0, 0, 0, 0.4)
                                        `,
                                    }}
                                >
                                    <div
                                        className="absolute"
                                        style={{
                                            top: '50%',
                                            left: '0',
                                            transform: 'translateY(-50%)',
                                            width: '3px',
                                            height: '8px',
                                            borderRadius: '1px 0 0 1px',
                                            background: '#444',
                                            boxShadow: 'inset 1px 0 1px rgba(0, 0, 0, 0.9)',
                                        }}
                                    />
                                </div>

                                {/* Center ring */}
                                <div
                                    className="absolute"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '4px',
                                        height: '23px',
                                        borderRadius: '1px',
                                        background: 'linear-gradient(180deg, #A8A8A8, #C0C0C0, #A8A8A8)',
                                        boxShadow: `
                                            inset 1px 0 1px rgba(255, 255, 255, 0.4),
                                            inset -1px 0 1px rgba(0, 0, 0, 0.4)
                                        `,
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
            
            {/* Backdrop when enlarged - rendered early for blur compilation */}
            <div
                className="fixed inset-0 mt-[3.91rem] rounded-2xl rounded-t-none"
                style={{ 
                    zIndex: isEnlarged ? 9998 : -1,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    opacity: isEnlarged ? 1 : 0,
                    pointerEvents: isEnlarged ? 'auto' : 'none',
                    transition: 'opacity 0.2s ease-out',
                }}
                onClick={() => setIsEnlarged(false)}
            />
            
            {/* Badge name when enlarged */}
            {isEnlarged && (
                <motion.div
                    className="fixed pointer-events-none"
                    style={{
                        top: 'calc(50% + 220px)', // 50% center + half badge height (120px) + gap (20px)
                        left: '50%',
                        zIndex: 10000,
                        perspective: 1000,
                        transformStyle: 'preserve-3d',
                    }}
                    initial={{ 
                        x: '-50%',
                        y: 50,
                        opacity: 0,
                        rotateX: 45,
                        scale: 0.8,
                    }}
                    animate={{ 
                        x: '-50%',
                        y: 0,
                        opacity: 1,
                        rotateX: 0,
                        scale: 1,
                    }}
                    exit={{ 
                        y: 50,
                        opacity: 0,
                        rotateX: 45,
                        scale: 0.8,
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        delay: 0.1,
                    }}
                >
                    <div
                        className="text-center px-6 py-3 rounded-xl"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}50)`,
                            border: `2px solid ${colors.accent}40`,
                            boxShadow: `
                                0 8px 32px rgba(0, 0, 0, 0.3),
                                0 0 0 1px ${colors.primary}20,
                                inset 0 1px 0 rgba(255, 255, 255, 0.1)
                            `,
                        }}
                    >
                        <p className="text-2xl font-bold text-white mb-1" style={{
                            textShadow: `0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px ${colors.primary}60`,
                        }}>
                            {badge.name.charAt(0).toUpperCase() + badge.name.slice(1).replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-300" style={{
                            textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
                        }}>
                            Awarded {new Date(badge.awarded_at).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                </motion.div>
            )}
        </>
    );
};

export default Badge;
