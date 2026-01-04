import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useTransform } from 'framer-motion';

const JackOLanternFace = React.memo(({ mouseX, mouseY, isHovering, rotateX, rotateY, embossingContent, isUnearned }) => {
    // Flickering light effect - throttled to 150ms instead of 100ms
    const [flickerOffset, setFlickerOffset] = useState(0);
    
    useEffect(() => {
        if (isUnearned) return;
        
        const flickerInterval = setInterval(() => {
            setFlickerOffset(Math.random() * 0.8 - 0.4);
        }, 150); // Increased from 100ms
        
        return () => clearInterval(flickerInterval);
    }, [isUnearned]);
    
    // Mouse deformation effect - convert mouseX/mouseY (0-1) to web coordinates
    const mouseXPos = useTransform(mouseX, [0, 1], [0, 80]);
    const mouseYPos = useTransform(mouseY, [0, 1], [0, 80]);
    
    // Throttle mouse position updates for SVG
    const [currentMousePos, setCurrentMousePos] = useState({ x: 40, y: 40 });
    const lastUpdateRef = useRef(0);
    
    // Calculate pumpkin light intensity for parallax effects
    const pumpkinLightIntensity = 0.95 + flickerOffset * 0.3;
    
    // Throttled mouse position update (60fps max)
    useEffect(() => {
        const updatePosition = (axis, value) => {
            const now = performance.now();
            if (now - lastUpdateRef.current > 16) { // ~60fps
                setCurrentMousePos(prev => ({
                    ...prev,
                    [axis]: value
                }));
                lastUpdateRef.current = now;
            }
        };
        
        const unsubscribeX = mouseXPos.on('change', (x) => updatePosition('x', x));
        const unsubscribeY = mouseYPos.on('change', (y) => updatePosition('y', y));
        
        return () => {
            unsubscribeX();
            unsubscribeY();
        };
    }, [mouseXPos, mouseYPos]);
    
    return (
        <>
            {/* Dark Halloween night background */}
            <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                    background: 'linear-gradient(135deg, #1a0a2e 0%, #0f0514 50%, #1a0f2e 100%)',
                }}
            />
            
            {/* Pumpkin light overlay - affects everything */}
            <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                    background: `radial-gradient(ellipse 140% 130% at 23% 88%, rgba(245,177,9,${pumpkinLightIntensity * 0.25}) 0%, rgba(209,73,0,${pumpkinLightIntensity * 0.18}) 20%, rgba(209,73,0,${pumpkinLightIntensity * 0.13}) 35%, rgba(209,73,0,${pumpkinLightIntensity * 0.08}) 50%, rgba(209,73,0,${pumpkinLightIntensity * 0.04}) 70%, transparent 85%)`,
                    mixBlendMode: 'screen',
                    zIndex: 100,
                }}
            />
            
            {/* Embossed icon/image - behind lantern and glow but in front of background */}
            <div style={{ zIndex: 8 }}>
                {embossingContent}
            </div>
            
            {/* Stars in background */}
            <div
                style={{
                    position: 'absolute',
                    top: '8px',
                    left: '0px',
                    width: '1px',
                    height: '1px',
                    background: '#FFFFFF',
                    borderRadius: '50%',
                    boxShadow: '18px 4px 1px #FFFFFF, 38px 10px 1px #FFFFFF, 52px 6px 1px #FFFFFF, 25px 15px 1px #FFFFFF, 45px 20px 1px #FFFFFF',
                    opacity: 0.7,
                }}
            />
            
            {/* Spider web - complete design with curved strands */}
            <motion.svg
                className="absolute top-0 left-0 pointer-events-none"
                width="80"
                height="80"
                viewBox="0 0 80 80"
                style={{
                    opacity: 0.6,
                    filter: `drop-shadow(0 0 2px rgba(245,177,9,${pumpkinLightIntensity * 0.3}))`,
                    zIndex: 2,
                }}
                animate={!isUnearned ? {
                    skewX: [-3, 3, -3],
                    skewY: [-2, 2, -2],
                } : {}}
                transition={!isUnearned ? {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                } : {}}
            >
                {/* Center point */}
                <circle cx="40" cy="40" r="2" fill="#666" />
                
                {/* Radial strands - 8 spokes extending beyond rings */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                    const radians = (angle * Math.PI) / 180;
                    const baseX2 = 40 + Math.cos(radians) * 54;
                    const baseY2 = 40 + Math.sin(radians) * 40;
                    
                    // Calculate distance from mouse to endpoint
                    const dx = currentMousePos.x - baseX2;
                    const dy = currentMousePos.y - baseY2;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Pull effect - stronger when mouse is closer (disabled when unearned)
                    const pullStrength = isUnearned ? 0 : Math.max(0, 15 - distance) / 15; // 0 to 1
                    const pullX = dx * pullStrength * 0.5;
                    const pullY = dy * pullStrength * 0.5;
                    
                    return (
                        <motion.line
                            key={`spoke-${angle}`}
                            x1="40"
                            y1="40"
                            x2={baseX2 + pullX}
                            y2={baseY2 + pullY}
                            stroke="rgba(200,200,200,0.5)"
                            strokeWidth="1.75"
                        />
                    );
                })}
                
                {/* Curved connecting strands between spokes - 4 rings */}
                {[12, 20, 28, 36].map((radius, ringIdx) => {
                    const segments = [];
                    for (let i = 0; i < 8; i++) {
                        const angle1 = i * 45;
                        const angle2 = (i + 1) * 45;
                        const rad1 = (angle1 * Math.PI) / 180;
                        const rad2 = (angle2 * Math.PI) / 180;
                        
                        // Start and end points on the circle
                        let x1 = 40 + Math.cos(rad1) * radius;
                        let y1 = 40 + Math.sin(rad1) * radius;
                        let x2 = 40 + Math.cos(rad2) * radius;
                        let y2 = 40 + Math.sin(rad2) * radius;
                        
                        // Apply mouse deformation to endpoints (disabled when unearned)
                        if (!isUnearned) {
                            const dx1 = currentMousePos.x - x1;
                            const dy1 = currentMousePos.y - y1;
                            const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                            const pull1 = Math.max(0, 15 - dist1) / 15;
                            x1 += dx1 * pull1 * 0.4;
                            y1 += dy1 * pull1 * 0.4;
                            
                            const dx2 = currentMousePos.x - x2;
                            const dy2 = currentMousePos.y - y2;
                            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                            const pull2 = Math.max(0, 15 - dist2) / 15;
                            x2 += dx2 * pull2 * 0.4;
                            y2 += dy2 * pull2 * 0.4;
                        }
                        
                        // Control point - curved inward toward center
                        const midAngle = (angle1 + angle2) / 2;
                        const midRad = (midAngle * Math.PI) / 180;
                        const controlRadius = radius * 0.85;
                        let cx = 40 + Math.cos(midRad) * controlRadius;
                        let cy = 40 + Math.sin(midRad) * controlRadius;
                        
                        // Apply mouse deformation to control point (disabled when unearned)
                        if (!isUnearned) {
                            const dxc = currentMousePos.x - cx;
                            const dyc = currentMousePos.y - cy;
                            const distc = Math.sqrt(dxc * dxc + dyc * dyc);
                            const pullc = Math.max(0, 15 - distc) / 15;
                            cx += dxc * pullc * 0.4;
                            cy += dyc * pullc * 0.4;
                        }
                        
                        segments.push(
                            <path
                                key={`curve-${ringIdx}-${i}`}
                                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                                fill="none"
                                stroke="rgba(200,200,200,0.4)"
                                strokeWidth="1.75"
                            />
                        );
                    }
                    return segments;
                })}
                
                {/* Dew drops on web strands */}
                {[
                    { x: 48, y: 25, size: 1.5, angle: 45 },
                    { x: 66, y: 45, size: 1.4, angle: 90 },
                    { x: 32, y: 17, size: 1.8, angle: 315 },
                    { x: 43, y: 49, size: 1.3, angle: 135 },
                    { x: 20, y: 42, size: 1.6, angle: 180 },
                    { x: 35, y: 52, size: 1.4, angle: 225 },
                ].map((drop, idx) => {
                    // Calculate distance from pumpkin (bottom left at approximately 15, 70 in SVG coords)
                    const pumpkinX = 15;
                    const pumpkinY = 70;
                    const dx = pumpkinX - drop.x; // Direction TO pumpkin
                    const dy = pumpkinY - drop.y; // Direction TO pumpkin
                    const distFromPumpkin = Math.sqrt(dx * dx + dy * dy);
                    
                    // Light intensity based on distance - much stronger effect
                    const lightIntensity = Math.max(0, 1 - distFromPumpkin / 65) * pumpkinLightIntensity;

                    return (
                        <g key={`dew-${idx}`}>
                            {/* Glow halo from pumpkin light - BEHIND the drop */}
                            <circle
                                cx={drop.x }
                                cy={drop.y }
                                r={drop.size * 2}
                                fill={`rgba(245, 177, 9, ${lightIntensity * 0.5})`}
                                filter="blur(2px)"
                            />
                            {/* Direct light reflection from pumpkin - positioned on the side facing the pumpkin */}
                            <circle
                                cx={drop.x }
                                cy={drop.y }
                                r={drop.size * 0.8}
                                fill={`rgba(255, 200, 50, ${lightIntensity})`}
                                filter="blur(0.5px)"
                            />
                            {/* Dew drop sphere */}
                            <circle
                                cx={drop.x }
                                cy={drop.y }
                                r={drop.size}
                                fill="url(#dew-gradient)"
                                opacity={0.85}
                            />
                            {/* Highlight on top */}
                            <circle
                                cx={drop.x }
                                cy={drop.y }
                                r={drop.size * 0.4}
                                fill="rgba(255, 255, 255, 0.9)"
                            />
                        </g>
                    );
                })}
                
                {/* Gradient definitions for dew drops */}
                <defs>
                    <radialGradient id="dew-gradient">
                        <stop offset="0%" stopColor="rgba(220, 240, 255, 0.9)" />
                        <stop offset="50%" stopColor="rgba(180, 210, 235, 0.7)" />
                        <stop offset="100%" stopColor="rgba(140, 170, 200, 0.5)" />
                    </radialGradient>
                </defs>
            </motion.svg>
            
            {/* Tree branch hanging from top right */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '60px',
                    height: '50px',
                    pointerEvents: 'none',
                    zIndex: 3,
                }}
            >
                {/* Main branch */}
                <div style={{
                    position: 'absolute',
                    top: '0px',
                    right: '-5px',
                    width: '45px',
                    height: '6px',
                    background: 'linear-gradient(90deg, #3a2a1a 0%, #4a3a1a 50%, #2a1a0a 100%)',
                    borderRadius: '3px',
                    transform: 'rotate(-15deg)',
                    transformOrigin: 'right center',
                    boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
                }}>
                    {/* Branch texture lines */}
                    <div style={{
                        position: 'absolute',
                        left: '20%',
                        top: '50%',
                        width: '8px',
                        height: '1px',
                        background: 'rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%) rotate(-30deg)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '6px',
                        height: '1px',
                        background: 'rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%) rotate(25deg)',
                    }} />
                </div>
                
                {/* Small side branch 1 */}
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '25px',
                    width: '15px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #4a3a1a 0%, #2a1a0a 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(-45deg)',
                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.4)',
                }} />
                
                {/* Small side branch 2 */}
                <div style={{
                    position: 'absolute',
                    top: '3px',
                    right: '35px',
                    width: '12px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #4a3a1a 0%, #2a1a0a 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(30deg)',
                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.4)',
                }} />
                
                {/* Leaves */}
                {[
                    { top: '6px', right: '18px', rotate: '-20deg', delay: 0 },
                    { top: '10px', right: '22px', rotate: '15deg', delay: 0.5 },
                    { top: '2px', right: '30px', rotate: '45deg', delay: 1 },
                    { top: '6px', right: '32px', rotate: '-35deg', delay: 1.5 },
                ].map((leaf, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: leaf.top,
                            right: leaf.right,
                            width: '0px',
                            height: '0px',
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderBottom: '7px solid #2d5016',
                            transform: `rotate(${leaf.rotate})`,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                        }}
                        animate={!isUnearned ? {
                            rotate: [leaf.rotate, `calc(${leaf.rotate} + 5deg)`, leaf.rotate],
                        } : {}}
                        transition={!isUnearned ? {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: leaf.delay,
                        } : {}}
                    />
                ))}
            </div>
            
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    right: -20,
                    transform: 'rotate(10deg)',
                    width: '60px',
                    height: '50px',
                    pointerEvents: 'none',
                    zIndex: 5,
                }}
            >
                {/* Main branch */}
                <div style={{
                    position: 'absolute',
                    top: '0px',
                    right: '-5px',
                    width: '45px',
                    height: '6px',
                    background: 'linear-gradient(90deg, #3a2a1a 0%, #4a3a1a 50%, #2a1a0a 100%)',
                    borderRadius: '3px',
                    transform: 'rotate(-15deg)',
                    transformOrigin: 'right center',
                    boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 5,
                }}>
                    {/* Branch texture lines */}
                    <div style={{
                        position: 'absolute',
                        left: '20%',
                        top: '50%',
                        width: '8px',
                        height: '1px',
                        background: 'rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%) rotate(-30deg)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '6px',
                        height: '1px',
                        background: 'rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%) rotate(25deg)',
                    }} />
                </div>
                
                {/* Small side branch 1 */}
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '25px',
                    width: '15px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #4a3a1a 0%, #2a1a0a 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(-45deg)',
                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.4)',
                }} />
                
                {/* Small side branch 2 */}
                <div style={{
                    position: 'absolute',
                    top: '3px',
                    right: '35px',
                    width: '12px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #4a3a1a 0%, #2a1a0a 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(30deg)',
                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.4)',
                }} />
                
                {/* Leaves */}
                {[
                    { top: '6px', right: '18px', rotate: '-20deg', delay: 0 },
                    { top: '10px', right: '22px', rotate: '15deg', delay: 0.5 },
                    { top: '2px', right: '30px', rotate: '45deg', delay: 1 },
                    { top: '6px', right: '32px', rotate: '-35deg', delay: 1.5 },
                ].map((leaf, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: leaf.top,
                            right: leaf.right,
                            width: '0px',
                            height: '0px',
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderBottom: '7px solid #2d5016',
                            transform: `rotate(${leaf.rotate})`,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                        }}
                        animate={!isUnearned ? {
                            rotate: [leaf.rotate, `calc(${leaf.rotate} + 5deg)`, leaf.rotate],
                        } : {}}
                        transition={!isUnearned ? {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: leaf.delay,
                        } : {}}
                    />
                ))}
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: -12,
                    right: -2,
                    transform: 'rotate(-35deg) scaleY(-1)',
                    width: '60px',
                    height: '50px',
                    pointerEvents: 'none',
                    zIndex: 6,
                }}
            >
                {/* Main branch */}
                <div style={{
                    position: 'absolute',
                    top: '0px',
                    right: '-5px',
                    width: '45px',
                    height: '6px',
                    background: 'linear-gradient(90deg, #3a2a1a 0%, #4a3a1a 50%, #2a1a0a 100%)',
                    borderRadius: '3px',
                    transform: 'rotate(-15deg)',
                    transformOrigin: 'right center',
                    boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
                }}>
                    {/* Branch texture lines */}
                    <div style={{
                        position: 'absolute',
                        left: '20%',
                        top: '50%',
                        width: '8px',
                        height: '1px',
                        background: 'rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%) rotate(-30deg)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '6px',
                        height: '1px',
                        background: 'rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%) rotate(25deg)',
                    }} />
                </div>
                
                {/* Small side branch 1 */}
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '25px',
                    width: '15px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #4a3a1a 0%, #2a1a0a 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(-45deg)',
                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.4)',
                }} />
                
                {/* Small side branch 2 */}
                <div style={{
                    position: 'absolute',
                    top: '3px',
                    right: '35px',
                    width: '12px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #4a3a1a 0%, #2a1a0a 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(30deg)',
                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.4)',
                }} />
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: 3,
                    left: 62,
                    transform: 'rotate(92deg) scaleY(-1)',
                    width: '60px',
                    height: '50px',
                    pointerEvents: 'none',
                    zIndex: 5,
                }}
            >
                {/* Main branch */}
                <div style={{
                    position: 'absolute',
                    top: '0px',
                    right: '-5px',
                    width: '45px',
                    height: '6px',
                    background: 'linear-gradient(90deg, #3a2a1a 0%, #4a3a1a 50%, #2a1a0a 100%)',
                    borderRadius: '3px',
                    transform: 'rotate(-15deg)',
                    transformOrigin: 'right center',
                    boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 1,
                }}>
                    {/* Branch texture lines */}
                    <div style={{
                        position: 'absolute',
                        left: '20%',
                        top: '50%',
                        width: '8px',
                        height: '1px',
                        background: 'rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%) rotate(-30deg)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '6px',
                        height: '1px',
                        background: 'rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%) rotate(25deg)',
                    }} />
                </div>
                
                {/* Small side branch 1 */}
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '25px',
                    width: '15px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #4a3a1a 0%, #2a1a0a 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(-45deg)',
                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.4)',
                }} />
                

            </div>

            {/* Single pumpkin on the left */}
            <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{
                    height: '35px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    padding: '0 0 1px 12px',
                    zIndex: 30,
                }}
            >
                {/* Single pumpkin with layered glow effect */}
                <div
                    style={{
                        width: '30px',
                        height: '24px',
                        position: 'relative',
                    }}
                >
                    {/* Stem */}
                    <div style={{
                        position: 'absolute',
                        top: '-4px',
                        left: '52%',
                        transform: 'translateX(-50%) skew(-15deg)',
                        width: '5px',
                        height: '6.5px',
                        background: 'linear-gradient(135deg, #5a4a2a 0%, #4a3a1a 50%, #3a2a1a 100%)',
                        borderRadius: '3px 3px 0 0',
                        boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.4)',
                        zIndex: 3,
                    }} />
                    
                    {/* Inner glow layer (shows through carved areas) */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: `radial-gradient(ellipse at 50% 55%, rgba(245,177,9,${0.95 + flickerOffset * 0.3}) 0%, rgba(209,73,0,${0.7 + flickerOffset * 0.3}) 35%, rgba(20,10,0,${0.8 + flickerOffset * 0.2}) 65%, #000 100%)`,
                        borderRadius: '45% / 50%',
                        filter: `blur(1px)`,
                        zIndex: 0,
                    }} />
                    
                    {/* Pumpkin body */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(ellipse 60% 55% at 40% 35%, #ffb347 0%, #FA7614 30%, #e56b0f 60%, #c8550c 85%, #8b3f08 100%)',
                        borderRadius: '45% / 50%',
                        boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.5), inset 2.5px 2.5px 5px rgba(255,179,71,0.4), 0 3px 6px rgba(0,0,0,0.4)',
                        zIndex: 1,
                    }}>
                        {/* Vertical ridges */}
                        <div style={{
                            position: 'absolute',
                            left: '20%',
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.2) 80%, transparent 100%)',
                        }} />
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: 0,
                            bottom: 0,
                            width: '1.5px',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 20%, rgba(0,0,0,0.25) 80%, transparent 100%)',
                        }} />
                        <div style={{
                            position: 'absolute',
                            left: '80%',
                            top: 0,
                            bottom: 0,
                            width: '1.5px',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.2) 80%, transparent 100%)',
                        }} />
                    </div>
                    
                    {/* Carved face cutouts - rendered as glowing shapes */}
                    {/* Triangle eyes */}
                    <div style={{
                        position: 'absolute',
                        top: '5.5px',
                        left: '7px',
                        width: '0px',
                        height: '0px',
                        borderLeft: '2.8px solid transparent',
                        borderRight: '2.8px solid transparent',
                        borderBottom: `5px solid rgba(245,177,9,${0.95 + flickerOffset * 0.3})`,
                        filter: 'blur(0.5px) drop-shadow(0 2px 2px rgba(0,0,0,0.6)) drop-shadow(inset 0-1px 1px rgba(0,0,0,0.4))',
                        zIndex: 2,
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: '5.5px',
                        right: '7px',
                        width: '0px',
                        height: '0px',
                        borderLeft: '2.8px solid transparent',
                        borderRight: '2.8px solid transparent',
                        borderBottom: `5px solid rgba(245,177,9,${0.95 + flickerOffset * 0.3})`,
                        filter: 'blur(0.5px) drop-shadow(0 1px 2px rgba(0,0,0,0.6)) drop-shadow(inset 0 -1px 1px rgba(0,0,0,0.4))',
                        zIndex: 2,
                    }} />
                    {/* Triangle nose */}
                    <div style={{
                        position: 'absolute',
                        top: '11px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '0px',
                        height: '0px',
                        borderLeft: '1.6px solid transparent',
                        borderRight: '1.6px solid transparent',
                        borderTop: `3.2px solid rgba(245,177,9,${0.95 + flickerOffset * 0.3})`,
                        filter: '',
                        zIndex: 2,
                    }} />
                    {/* Wide curved smile */}
                    <div style={{
                        position: 'absolute',
                        bottom: '5.65px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '19px',
                        height: '5.5px',
                        borderBottom: `2.5px solid rgba(245,177,9,${0.95 + flickerOffset * 0.3})`,
                        borderRadius: '0 0 100% 100%',
                        filter: '',
                        zIndex: 2,
                    }} />
                    
                    {/* Teeth - glow color to blend with smile */}
                    <div style={{
                        position: 'absolute',
                        bottom: '5.5px',
                        left: '9px',
                        width: '1.6px',
                        height: '4px',
                        background: `rgba(245,177,9,${0.95 + flickerOffset * 0.3})`,
                        zIndex: 2,
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '2px',
                        height: '4px',
                        background: `rgba(245,177,9,${0.95 + flickerOffset * 0.3})`,
                        zIndex: 2,
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '5.5px',
                        right: '9px',
                        width: '2px',
                        height: '4px',
                        background: `rgba(245,177,9,${0.95 + flickerOffset * 0.3})`,
                        zIndex: 2,
                    }} />
                </div>
            </div>
        </>
    );
});

JackOLanternFace.displayName = 'JackOLanternFace';

export default JackOLanternFace;
