import React, { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';

const ChristmasLightsFace = ({ mouseX, mouseY, isHovering, embossingContent }) => {
    const [lights, setLights] = useState([]);
    const [hoveredLight, setHoveredLight] = useState(null);
    
    // Generate light bulbs along a curved wire
    useEffect(() => {
        const lightBulbs = [
            { id: 1, x: 10, y: 16, color: '#FF4444', delay: 0 },
            { id: 2, x: 20, y: 11, color: '#44FF44', delay: 0.1 },
            { id: 3, x: 30, y: 8, color: '#4444FF', delay: 0.2 },
            { id: 4, x: 40, y: 6, color: '#FFFF44', delay: 0.3 },
            { id: 5, x: 50, y: 7.5, color: '#FF44FF', delay: 0.4 },
            { id: 6, x: 60, y: 9, color: '#44FFFF', delay: 0.5 },
            { id: 7, x: 70, y: 12, color: '#FF8844', delay: 0.6 },
        ];
        setLights(lightBulbs);
    }, []);
    
    return (
        <>
            {/* Dark evening background */}
            <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                    background: 'linear-gradient(180deg, #1a2332 0%, #2d3e50 50%, #34495e 100%)',
                }}
            />
            
            {/* Stars in background */}
            <div
                style={{
                    position: 'absolute',
                    top: '8px',
                    left: '15px',
                    width: '2px',
                    height: '2px',
                    background: '#FFFFFF',
                    borderRadius: '50%',
                    boxShadow: '10px 5px 1px #FFFFFF, 25px 3px 1px #FFFFFF, 40px 8px 1px #FFFFFF, 55px 4px 1px #FFFFFF, 18px 15px 1px #FFFFFF, 45px 18px 1px #FFFFFF',
                    opacity: 0.7,
                }}
            />
            
            {/* More stars below the lights */}
            <div
                style={{
                    position: 'absolute',
                    top: '35px',
                    left: '10px',
                    width: '1.5px',
                    height: '1.5px',
                    background: '#FFFFFF',
                    borderRadius: '50%',
                    boxShadow: '12px 3px 1px #FFFFFF, 31px 0px 1px #FFFFFF, 50px 4px 1px #FFFFFF',
                    opacity: 0.6,
                }}
            />
            
            {/* Wire/string that holds the lights */}
            <svg
                className="absolute inset-0 pointer-events-none"
                width="80"
                height="80"
                viewBox="0 0 80 80"
            >
                <path
                    d="M 0 28 Q 20 10, 40 10 T 80 20"
                    stroke="#2c3e50"
                    strokeWidth="1.5"
                    fill="none"
                />
            </svg>
            
            {/* Light bulbs */}
            <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
                {lights.map((light) => (
                    <LightBulb
                        key={light.id}
                        light={light}
                        isHovering={isHovering}
                        isHovered={hoveredLight === light.id}
                        onHover={() => setHoveredLight(light.id)}
                        onLeave={() => setHoveredLight(null)}
                    />
                ))}
            </div>
            
            {/* Decorative presents at bottom */}
            {/* Rug/floor beneath the presents */}
            <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{
                    height: '12px',
                    background: 'linear-gradient(180deg, rgba(139,0,0,0.85) 0%, rgba(178,34,34,0.9) 50%, rgba(139,0,0,0.95) 100%)',
                    borderRadius: '0 0 24px 24px',
                    boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.15)',
                }}
            >
                {/* Rug pattern */}
                <div
                    style={{
                        position: 'absolute',
                        top: '2px',
                        left: '10px',
                        right: '10px',
                        height: '1px',
                        background: 'rgba(220,20,60,0.5)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '5px',
                        left: '10px',
                        right: '10px',
                        height: '1px',
                        background: 'rgba(220,20,60,0.4)',
                    }}
                />
            </div>
            
            <div className="absolute bottom-2 left-0 right-0 flex justify-center items-end gap-1.5 pointer-events-none" style={{ zIndex: 1 }}>
                {/* Red present with gold ribbon */}
                <div className="relative">
                    {/* Shadow */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '0',
                            width: '10px',
                            height: '2px',
                            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
                            filter: 'blur(1px)',
                        }}
                    />
                    <div
                        style={{
                            width: '10px',
                            height: '8px',
                            background: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%)',
                            borderRadius: '1px',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.3)',
                        }}
                    />
                    {/* Ribbon */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '0',
                            left: '4px',
                            width: '2px',
                            height: '8px',
                            background: 'linear-gradient(90deg, #f39c12 0%, #f1c40f 50%, #f39c12 100%)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '3px',
                            left: '0',
                            width: '10px',
                            height: '2px',
                            background: 'linear-gradient(180deg, #f39c12 0%, #f1c40f 50%, #f39c12 100%)',
                        }}
                    />
                    {/* Bow */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '3px',
                            width: '4px',
                            height: '3px',
                            background: '#f1c40f',
                            borderRadius: '50% 50% 0 0',
                        }}
                    />
                </div>
                
                {/* Green present with red ribbon */}
                <div className="relative -bottom-0.5">
                    {/* Shadow */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-2.5px',
                            left: '0',
                            width: '12px',
                            height: '2px',
                            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)',
                            filter: 'blur(1px)',
                        }}
                    />
                    <div
                        style={{
                            width: '12px',
                            height: '10px',
                            background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 50%, #27ae60 100%)',
                            borderRadius: '1px',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.3)',
                        }}
                    />
                    {/* Ribbon */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '0',
                            left: '5px',
                            width: '2px',
                            height: '10px',
                            background: 'linear-gradient(90deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '4px',
                            left: '0',
                            width: '12px',
                            height: '2px',
                            background: 'linear-gradient(180deg, #c0392b 0%, #e74c3c 50%, #c0392b 100%)',
                        }}
                    />
                    {/* Bow */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '4px',
                            width: '4px',
                            height: '3px',
                            background: '#e74c3c',
                            borderRadius: '50% 50% 0 0',
                        }}
                    />
                </div>
                
                {/* Blue present with silver ribbon */}
                <div className="relative">
                    {/* Shadow */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '0',
                            width: '9px',
                            height: '2px',
                            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
                            filter: 'blur(1px)',
                        }}
                    />
                    <div
                        style={{
                            width: '9px',
                            height: '7px',
                            background: 'linear-gradient(135deg, #2980b9 0%, #3498db 50%, #2980b9 100%)',
                            borderRadius: '1px',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.3)',
                        }}
                    />
                    {/* Ribbon */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '0',
                            left: '3.5px',
                            width: '2px',
                            height: '7px',
                            background: 'linear-gradient(90deg, #bdc3c7 0%, #ecf0f1 50%, #bdc3c7 100%)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '2.5px',
                            left: '0',
                            width: '9px',
                            height: '2px',
                            background: 'linear-gradient(180deg, #bdc3c7 0%, #ecf0f1 50%, #bdc3c7 100%)',
                        }}
                    />
                    {/* Bow */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '2.5px',
                            width: '4px',
                            height: '3px',
                            background: '#ecf0f1',
                            borderRadius: '50% 50% 0 0',
                        }}
                    />
                </div>
            </div>

            {/* Embossed icon/image - behind presents and lights */}
            <div>
                {embossingContent}
            </div>
        </>
    );
};

const LightBulb = ({ light, isHovering, isHovered, onHover, onLeave }) => {
    const [badgeIsHovered, setBadgeIsHovered] = useState(false);
    
    useEffect(() => {
        const unsubscribe = isHovering.on('change', (value) => {
            setBadgeIsHovered(value);
        });
        
        // Set initial value
        setBadgeIsHovered(isHovering.get());
        
        return unsubscribe;
    }, [isHovering]);
    
    return (
        <div
            style={{
                position: 'absolute',
                left: `${light.x}px`,
                top: `${light.y}px`,
                transform: 'translateX(-50%)',
                pointerEvents: badgeIsHovered ? 'auto' : 'none',
                cursor: badgeIsHovered ? 'pointer' : 'default',
                padding: '4px',
                zIndex: 50, // Above glare/shine layers
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
        >
            {/* Wire connector */}
            <div
                style={{
                    width: '1px',
                    height: '4px',
                    background: '#34495e',
                    margin: '0 auto',
                }}
            />
            
            {/* Bulb cap/base */}
            <div
                style={{
                    width: '5px',
                    height: '2px',
                    background: '#95a5a6',
                    margin: '0 auto',
                    borderRadius: '1px 1px 0 0',
                }}
            />
            
            {/* Light bulb */}
            <motion.div
                key={badgeIsHovered ? 'hovered' : 'not-hovered'}
                style={{
                    left: 0,
                    width: '7px',
                    height: '10px',
                    background: light.color,
                    margin: '0 auto',
                    borderRadius: '40% 40% 50% 50%',
                    position: 'relative',
                }}
                initial={{
                    opacity: badgeIsHovered ? (isHovered ? 1 : 0.3) : 0.3,
                    boxShadow: badgeIsHovered 
                        ? (isHovered 
                            ? `0 0 10px ${light.color}, 0 0 16px ${light.color}, 0 0 20px ${light.color}`
                            : `0 0 2px ${light.color}`)
                        : `0 0 2px ${light.color}`,
                }}
                animate={badgeIsHovered ? {
                    // When badge IS hovered: static state based on individual bulb hover
                    opacity: isHovered ? 1 : 0.3,
                    boxShadow: isHovered 
                        ? `0 0 10px ${light.color}, 0 0 16px ${light.color}, 0 0 20px ${light.color}`
                        : `0 0 2px ${light.color}`,
                } : {
                    // When badge is NOT hovered: strobe all lights
                    opacity: [0.3, 1, 0.3],
                    boxShadow: [
                        `0 0 2px ${light.color}`,
                        `0 0 8px ${light.color}, 0 0 12px ${light.color}`,
                        `0 0 2px ${light.color}`,
                    ],
                }}
                transition={badgeIsHovered ? {
                    duration: 0.15,
                    ease: "easeOut",
                } : {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: light.delay,
                    ease: "easeInOut",
                }}
            >
                {/* Highlight/shine on bulb */}
                <div
                    style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        width: '3px',
                        height: '3px',
                        background: 'rgba(255, 255, 255, 0.6)',
                        borderRadius: '50%',
                    }}
                />
            </motion.div>
        </div>
    );
};

export default ChristmasLightsFace;
