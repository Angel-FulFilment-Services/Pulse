import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const ChristmasSnowFace = ({ mouseX, mouseY, isHovering, embossingContent }) => {
    const [snowflakes, setSnowflakes] = useState([]);
    
    // Track cursor position even when not moving
    const cursorX = useMotionValue(40); // Start at center
    const cursorY = useMotionValue(40);
    
    // Update cursor position from parent's mouseX/mouseY - continuously while hovering
    useEffect(() => {
        const updateCursor = () => {
            cursorX.set(mouseX.get() * 80);
            cursorY.set(mouseY.get() * 80);
        };
        
        // Update immediately when hover state changes
        const unsubscribeHover = isHovering.on('change', (hovering) => {
            if (hovering) {
                updateCursor();
            }
        });
        
        const unsubscribeX = mouseX.on('change', (v) => cursorX.set(v * 80));
        const unsubscribeY = mouseY.on('change', (v) => cursorY.set(v * 80));
        
        return () => {
            unsubscribeHover();
            unsubscribeX();
            unsubscribeY();
        };
    }, [mouseX, mouseY, isHovering, cursorX, cursorY]);
    
    // Generate snowflakes
    useEffect(() => {
        const flakes = Array.from({ length: 25 }, (_, i) => ({
            id: i,
            startX: Math.random() * 80,
            startY: -20 - Math.random() * 30, // Start higher up (was -10 to -30, now -20 to -50)
            size: 3 + Math.random() * 2, // Increased min from 2 to 3, max from 5 to 5
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 3,
            drift: (Math.random() - 0.5) * 20,
        }));
        setSnowflakes(flakes);
    }, []);
    
    return (
        <>
            {/* Winter sky gradient background */}
            <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                    background: 'linear-gradient(180deg, #E8F5F7 0%, #D4E9F0 40%, #C5E3ED 60%, #B8D9E8 100%)',
                }}
            />
            
            {/* Mountains in background */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                {/* Far mountains */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '-10px',
                        width: 0,
                        height: 0,
                        borderLeft: '30px solid transparent',
                        borderRight: '30px solid transparent',
                        borderBottom: '25px solid rgba(140, 160, 180, 0.7)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '17px',
                        right: '-5px',
                        width: 0,
                        height: 0,
                        borderLeft: '25px solid transparent',
                        borderRight: '25px solid transparent',
                        borderBottom: '20px solid rgba(130, 150, 170, 0.6)',
                    }}
                />
                {/* Closer mountains */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '15px',
                        width: 0,
                        height: 0,
                        borderLeft: '20px solid transparent',
                        borderRight: '20px solid transparent',
                        borderBottom: '18px solid rgba(110, 130, 155, 0.8)',
                    }}
                />
            </div>
            
            {/* Snowflakes - render first so they appear behind trees and ground */}
            {snowflakes.map((flake) => (
                <Snowflake 
                    key={flake.id}
                    flake={flake}
                    cursorX={cursorX}
                    cursorY={cursorY}
                    isHovering={isHovering}
                />
            ))}

            {/* Embossed icon/image - behind snowflakes but in front of background */}
            {embossingContent}
            
            {/* Snowy ground with rolling hills */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                {/* Main snow ground */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '22px',
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F8FA 40%, #E8EEF4 100%)',
                    }}
                />
                {/* Snow hills/drifts */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '13px',
                        left: '0px',
                        width: '35px',
                        height: '14px',
                        background: '#FFFFFF',
                        borderRadius: '50% 50% 0 0',
                        opacity: 0.9,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '14px',
                        right: '5px',
                        width: '30px',
                        height: '11px',
                        background: '#FFFFFF',
                        borderRadius: '50% 50% 0 0',
                        opacity: 0.85,
                        
                    }}
                />
                {/* Snow sparkles */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '3px',
                        left: '10px',
                        width: '1px',
                        height: '1px',
                        background: '#FFFFFF',
                        boxShadow: '0 0 3px #FFFFFF, 8px 2px 2px #FFFFFF, 15px 1px 2px #FFFFFF, 25px 3px 2px #FFFFFF, 35px 1px 2px #FFFFFF, 50px 2px 2px #FFFFFF',
                    }}
                />
            </div>
            
            {/* Christmas trees at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end px-2 pointer-events-none">
                {/* Left tree */}
                <div className="relative" style={{ width: '18px', height: '22px', bottom: '11px', zIndex: 45 }}>
                    {/* Tree top */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderBottom: '8px solid #2D5016',
                        }}
                    />
                    {/* Tree middle */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '7px solid transparent',
                            borderRight: '7px solid transparent',
                            borderBottom: '8px solid #3A6B1F',
                        }}
                    />
                    {/* Tree bottom */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderBottom: '8px solid #4A7C2A',
                        }}
                    />
                    {/* Trunk */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '3px',
                            height: '3px',
                            background: '#4A2E19',
                        }}
                    />
                </div>
                
                {/* Middle tree (taller) */}
                <div className="relative" style={{ width: '22px', height: '26px', bottom: '4px', zIndex: 45 }}>
                    {/* Tree top */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '14px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '7px solid transparent',
                            borderRight: '7px solid transparent',
                            borderBottom: '10px solid #2D5016',
                        }}
                    />
                    {/* Tree middle */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderBottom: '10px solid #3A6B1F',
                        }}
                    />
                    {/* Tree bottom */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '10px solid transparent',
                            borderRight: '10px solid transparent',
                            borderBottom: '10px solid #4A7C2A',
                        }}
                    />
                    {/* Trunk */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '4px',
                            height: '4px',
                            background: '#4A2E19',
                        }}
                    />
                </div>
                
                {/* Right tree */}
                <div className="relative" style={{ width: '18px', height: '22px', bottom: '13px', zIndex: 45 }}>
                    {/* Tree top */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderBottom: '8px solid #2D5016',
                        }}
                    />
                    {/* Tree middle */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '7px solid transparent',
                            borderRight: '7px solid transparent',
                            borderBottom: '8px solid #3A6B1F',
                        }}
                    />
                    {/* Tree bottom */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderBottom: '8px solid #4A7C2A',
                        }}
                    />
                    {/* Trunk */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '3px',
                            height: '3px',
                            background: '#4A2E19',
                        }}
                    />
                </div>
            </div>
        </>
    );
};

// Separate component for each snowflake to use hooks properly
const Snowflake = ({ flake, cursorX, cursorY, isHovering }) => {
    const currentY = useMotionValue(flake.startY);
    
    // Calculate repulsion offset from cursor using 2D distance
    const offsetX = useTransform(
        [cursorX, cursorY, currentY, isHovering],
        ([cx, cy, snowY, hovering]) => {
            if (!hovering) return 0;
            
            const dx = cx - flake.startX;
            const dy = cy - snowY;
            const distance = Math.sqrt(dx * dx + dy * dy); // 2D distance
            
            // Repel if within 20px radius (circular area)
            if (distance < 20) {
                const force = (20 - distance) / 20;
                return dx > 0 ? -force * 18 : force * 18; // Stronger push
            }
            return 0;
        }
    );
    
    // Apply smooth spring to the offset
    const smoothX = useSpring(offsetX, { stiffness: 150, damping: 20 });
    
    return (
        <motion.div
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
                width: flake.size,
                height: flake.size,
                left: `${flake.startX}px`,
                filter: 'blur(0.5px)',
                boxShadow: '0 0 2px rgba(255, 255, 255, 0.8)',
                x: smoothX, // Smoothly animated cursor repulsion
                y: currentY, // Track Y position for distance calculation
            }}
            initial={{ 
                y: flake.startY,
                opacity: 0,
            }}
            animate={{
                y: [flake.startY, 90],
                opacity: [0, 1, 1, 0],
            }}
            onUpdate={(latest) => {
                if (latest.y !== undefined) {
                    currentY.set(latest.y);
                }
            }}
            transition={{
                y: {
                    duration: flake.duration,
                    delay: flake.delay,
                    repeat: Infinity,
                    ease: 'linear',
                },
                opacity: {
                    duration: flake.duration,
                    delay: flake.delay,
                    repeat: Infinity,
                    ease: 'linear',
                    times: [0, 0.05, 0.9, 1], // Fade in faster (by 5% instead of 10%)
                },
            }}
        />
    );
};

export default ChristmasSnowFace;
