import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const ChristmasSnowFace = React.memo(({ mouseX, mouseY, isHovering, embossingContent, isUnearned }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Track cursor position only when needed
    const cursorX = useMotionValue(40);
    const cursorY = useMotionValue(40);
    
    // Subscribe to hover state changes
    useEffect(() => {
        const unsubscribe = isHovering.on('change', (hovering) => {
            setIsHovered(hovering);
        });
        setIsHovered(isHovering.get());
        return unsubscribe;
    }, [isHovering]);
    
    // Only subscribe to mouse position when hovered
    useEffect(() => {
        if (!isHovered) return;
        
        const unsubscribeX = mouseX.on('change', (v) => cursorX.set(v * 80));
        const unsubscribeY = mouseY.on('change', (v) => cursorY.set(v * 80));
        
        // Set initial position
        cursorX.set(mouseX.get() * 80);
        cursorY.set(mouseY.get() * 80);
        
        return () => {
            unsubscribeX();
            unsubscribeY();
        };
    }, [isHovered, mouseX, mouseY, cursorX, cursorY]);
    
    // Generate snowflakes - reduced from 25 to 15 for better performance
    const snowflakes = useMemo(() => {
        if (isUnearned) return [];
        return Array.from({ length: 15 }, (_, i) => ({
            id: i,
            startX: Math.random() * 80,
            startY: -20 - Math.random() * 30,
            size: 3 + Math.random() * 2,
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 3,
        }));
    }, [isUnearned]);
    
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
});

ChristmasSnowFace.displayName = 'ChristmasSnowFace';

// Optimized snowflake component - uses simpler animation when not hovered
const Snowflake = React.memo(({ flake, cursorX, cursorY, isHovering }) => {
    const [isHovered, setIsHovered] = useState(false);
    const currentY = useMotionValue(flake.startY);
    
    // Subscribe to hover state
    useEffect(() => {
        const unsubscribe = isHovering.on('change', setIsHovered);
        setIsHovered(isHovering.get());
        return unsubscribe;
    }, [isHovering]);
    
    // Calculate repulsion offset only when hovered
    const offsetX = useTransform(
        [cursorX, cursorY, currentY],
        ([cx, cy, snowY]) => {
            if (!isHovered) return 0;
            
            const dx = cx - flake.startX;
            const dy = cy - snowY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                const force = (20 - distance) / 20;
                return dx > 0 ? -force * 18 : force * 18;
            }
            return 0;
        }
    );
    
    // Apply smooth spring to the offset with lower stiffness for performance
    const smoothX = useSpring(offsetX, { stiffness: 100, damping: 15 });
    
    return (
        <motion.div
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
                width: flake.size,
                height: flake.size,
                left: `${flake.startX}px`,
                filter: 'blur(0.5px)',
                boxShadow: '0 0 2px rgba(255, 255, 255, 0.8)',
                x: smoothX,
                y: currentY,
                willChange: 'transform',
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
                    times: [0, 0.05, 0.9, 1],
                },
            }}
        />
    );
});

Snowflake.displayName = 'Snowflake';

export default ChristmasSnowFace;
