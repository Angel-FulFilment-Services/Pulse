import React, { useState, useEffect, useMemo } from 'react';
import { motion, useTransform, useSpring } from 'framer-motion';

const SpookyGhostFace = React.memo(({ mouseX, mouseY, isHovering, rotateX, rotateY, embossingContent, isUnearned }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    // Fog flows with mouse position and tilt
    const fogFlowX = useTransform(mouseX, [0, 1], [-10, 10]);
    const fogFlowY = useTransform(mouseY, [0, 1], [-5, 5]);
    const fogX = useTransform(rotateY, [-20, 20], [-12, 12]);
    
    // Ghost chases mouse - get raw mouse position for chasing
    const ghostTargetX = useTransform(mouseX, [0, 1], [-35, 35]);
    const ghostTargetY = useTransform(mouseY, [0, 1], [-35, 35]);
    
    // Spring animations for smooth constant-speed chasing
    const ghostChaseX = useSpring(15, { stiffness: 50, damping: 25, mass: 1 });
    const ghostChaseY = useSpring(10, { stiffness: 50, damping: 25, mass: 1 });
    
    const ghostTiltX = useTransform(rotateY, [-20, 20], [-10, 10]);
    const ghostTiltY = useTransform(rotateX, [-20, 20], [8, -8]);
    
    // Ghost deformation based on tilt direction
    const ghostSkewX = useTransform(rotateY, [-20, 20], [4, -4]);
    const ghostSkewY = useTransform(rotateX, [-20, 20], [-3, 3]);
    
    // Update spring targets when mouse moves and is hovered
    React.useEffect(() => {
        if (!isHovered || isUnearned) {
            // When not hovered or unearned, don't listen to mouse
            return;
        }
        
        const unsubscribeTargetX = ghostTargetX.on('change', (v) => {
            ghostChaseX.set(v);
        });
        const unsubscribeTargetY = ghostTargetY.on('change', (v) => {
            ghostChaseY.set(v);
        });
        return () => {
            unsubscribeTargetX();
            unsubscribeTargetY();
        };
    }, [isHovered, isUnearned, ghostTargetX, ghostTargetY, ghostChaseX, ghostChaseY]);
    
    // Listen to hover state
    React.useEffect(() => {
        const unsubscribe = isHovering.on('change', (v) => {
            setIsHovered(v);
        });
        return unsubscribe;
    }, [isHovering]);
    
    // Reset position when not hovered or unearned
    React.useEffect(() => {
        if (!isHovered || isUnearned) {
            ghostChaseX.set(15);
            ghostChaseY.set(10);
        }
    }, [isHovered, isUnearned, ghostChaseX, ghostChaseY]);
    
    return (
        <>
            {/* Dark night sky */}
            <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                    background: 'linear-gradient(180deg, #0a0e1a 0%, #1a1428 40%, #0f0820 100%)',
                }}
            />
            
            {/* Stars */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '5px',
                    left: '1px',
                    width: '2px',
                    height: '2px',
                    background: '#FFFFFF',
                    borderRadius: '50%',
                    boxShadow: '15px 3px 2px #FFFFFF, 35px 8px 1.5px #FFFFFF, 50px 6px 2px #FFFFFF, 20px 15px 1.5px #FFFFFF, 45px 18px 2px #FFFFFF, 10px 22px 1.5px #FFFFFF, 60px 12px 2px #FFFFFF, 5px 30px 1.5px #FFFFFF, 55px 25px 2px #FFFFFF, 25px 5px 1.5px #FFFFFF, 40px 28px 2px #FFFFFF, 65px 20px 1.5px #FFFFFF, 12px 35px 2px #FFFFFF, 48px 32px 1.5px #FFFFFF, 30px 10px 2px #FFFFFF',
                }}
                animate={!isUnearned ? {
                    opacity: [0.8, 0.3, 0.8],
                } : {
                    opacity: 0.8,
                }}
                transition={!isUnearned ? {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                } : {}}
            />
            
            {/* Moon - static */}
            <div
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #FFF8DC 0%, #F0E68C 40%, #DAA520 100%)',
                    boxShadow: '0 0 15px rgba(255,248,220,0.6), inset -2px -2px 4px rgba(0,0,0,0.2)',
                }}
            />
            
            {/* Ground */}
            <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{
                    height: '25px',
                    background: 'linear-gradient(180deg, #5d4332 0%, #4a3526 50%, #3a2a1f 100%)',
                    borderRadius: '0 0 24px 24px',
                    clipPath: 'polygon(0 8%, 5% 6%, 10% 9%, 15% 7%, 20% 10%, 25% 8%, 30% 6%, 35% 9%, 40% 7%, 45% 10%, 50% 8%, 55% 6%, 60% 9%, 65% 7%, 70% 10%, 75% 8%, 80% 6%, 85% 9%, 90% 7%, 95% 10%, 100% 8%, 100% 100%, 0 100%)',
                }}
            >
                {/* Grass patches */}

                
                {/* Grass blades around mounds */}
                {/* Left mound grass */}




                
                {/* Graves (dirt mounds) - inverted tombstone shapes */}
                <div style={{
                    position: 'absolute',
                    bottom: 5,
                    left: '9px',
                    width: '12px',
                    height: '16px',
                    background: 'linear-gradient(135deg, #6d5342 0%, #5d4332 50%, #4a3526 100%)',
                    borderRadius: '40% 40% 0 0',
                    transform: 'scaleY(-1) rotate(8deg)',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: 3,
                    left: 'calc(50% - 5px)',
                    width: '14px',
                    height: '20px',
                    background: 'linear-gradient(135deg, #6d5342 0%, #5d4332 50%, #4a3526 100%)',
                    borderRadius: '45% 45% 0 0',
                    transform: 'scaleY(-1) rotate(8deg)',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: 6,
                    right: '9px',
                    width: '11px',
                    height: '15px',
                    background: 'linear-gradient(135deg, #6d5342 0%, #5d4332 50%, #4a3526 100%)',
                    borderRadius: '35% 35% 0 0',
                    transform: 'scaleY(-1) rotate(8deg)',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)',
                }} />
            </div>
            
            {/* Tombstones - static */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '0',
                    right: '0',
                    height: '25px',
                }}
            >
                {/* Left tombstone */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '8px',
                        width: '12px',
                        height: '16px',
                        background: 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 50%, #2a2a2a 100%)',
                        borderRadius: '40% 40% 0 0',
                        boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.5)',
                    }}
                >
                    {/* RIP text */}
                    <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '5px',
                        color: '#666',
                        fontWeight: 'bold',
                    }}>RIP</div>
                </div>
                
                {/* Middle tombstone - larger */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '51%',
                        transform: 'translateX(-50%)',
                        width: '14px',
                        height: '20px',
                        background: 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 50%, #2a2a2a 100%)',
                        borderRadius: '45% 45% 0 0',
                        boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.5)',
                    }}
                >
                    {/* Cross */}
                    <div style={{
                        position: 'absolute',
                        top: '6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '1px',
                        height: '7px',
                        background: '#555',
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '5px',
                        height: '1px',
                        background: '#555',
                    }} />
                </div>
                
                {/* Right tombstone */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '10px',
                        width: '11px',
                        height: '15px',
                        background: 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 50%, #2a2a2a 100%)',
                        borderRadius: '35% 35% 0 0',
                        boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.5)',
                    }}
                />
            </div>
            
            {/* Embossed icon/image - behind ghost but in front of tombstones/fog */}
            <div style={{ zIndex: 28 }}>
                {embossingContent}
            </div>
            
            {/* Fog layers - visible floating mist */}
            {!isUnearned && (
                <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                        height: '40px',
                        zIndex: 27,
                    }}
                >
                    <motion.div
                        style={{
                            position: 'absolute',
                            bottom: '15px',
                            left: '5px',
                            width: '40px',
                            height: '20px',
                            backgroundColor: 'rgba(255,255,255,0.5)',
                            filter: 'blur(10px)',
                            borderRadius: '50%',
                        }}
                        animate={{
                            x: [-5, 5, -5],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        style={{
                            position: 'absolute',
                            bottom: '20px',
                            right: '10px',
                            width: '35px',
                            height: '18px',
                            backgroundColor: 'rgba(255,255,255,0.4)',
                            filter: 'blur(8px)',
                            borderRadius: '50%',
                        }}
                        animate={{
                            x: [3, -3, 3],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '25px',
                            width: '30px',
                            height: '15px',
                            backgroundColor: 'rgba(255,255,255,0.35)',
                            filter: 'blur(12px)',
                            borderRadius: '50%',
                        }}
                        animate={{
                            x: [-3, 4, -3],
                        }}
                        transition={{
                            duration: 9,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </div>
            )}
            
            {/* Single ghost - floats at bottom right, chases mouse when hovered */}
            <motion.div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '24px',
                    height: '29px',
                    x: ghostChaseX,
                    y: ghostChaseY,
                    skewX: isUnearned ? 0 : ghostSkewX,
                    skewY: isUnearned ? 0 : ghostSkewY,
                    zIndex: 30,
                }}
            >
                <div style={{ transform: 'translate(-50%, -50%)' }}>
                {/* SVG Ghost Silhouette */}
                <motion.svg 
                    width="30px" 
                    height="36px" 
                    viewBox="0 0 90 90" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))',
                    }}
                    animate={!isUnearned ? {
                        y: [0, -3, 0],
                        x: [0, 2, 0],
                    } : {}}
                    transition={!isUnearned ? {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    } : {}}
                >
                    <g transform="translate(0 0)">
                        {/* Ghost body - semi-transparent */}
                        <path 
                            d="M 45 89.396 c -6.305 0 -8.843 -3.564 -10.883 -6.429 c -1.718 -2.413 -3.075 -4.318 -6.274 -4.51 c -3.393 -0.204 -5.218 1.239 -7.333 2.907 c -2.083 1.645 -4.445 3.518 -8.3 3.276 C 3.89 83.757 -0.192 78.093 0.007 67.8 l 0.017 -0.876 l 0.772 -0.416 c 14.32 -7.707 20.989 -21.167 20.989 -42.357 c 0 -12.982 8.733 -23.544 19.469 -23.546 h 7.492 C 59.482 0.606 68.215 11.168 68.215 24.15 c 0 21.191 6.67 34.65 20.989 42.357 l 0.771 0.416 l 0.018 0.876 c 0.199 10.293 -3.884 15.957 -12.134 16.835 c -3.93 0.239 -6.285 -1.626 -8.369 -3.271 c -2.115 -1.669 -3.946 -3.108 -7.333 -2.907 c -3.199 0.191 -4.556 2.097 -6.273 4.509 C 53.844 85.831 51.305 89.396 45 89.396 z" 
                            fill="rgba(255,255,255,0.8)" 
                            strokeLinecap="round"
                        />
                        
                        {/* Single eye */}
                        <path 
                            d="M 45 52.561 c -4.417 0 -7.876 -5.283 -7.876 -12.027 S 40.583 28.507 45 28.507 c 4.416 0 7.876 5.283 7.876 12.026 S 49.416 52.561 45 52.561 z" 
                            fill="#000000" 
                            strokeLinecap="round"
                        />
                        
                        {/* Right eye */}
                        <path 
                            d="M 55.818 29.589 c -2.793 0 -5.638 -3.562 -7.206 -7.573 c -1.792 -4.582 -1.963 -9.862 1.179 -11.09 c 3.143 -1.228 6.598 2.768 8.39 7.349 c 1.791 4.581 1.962 9.861 -1.18 11.09 C 56.61 29.518 56.215 29.589 55.818 29.589 z" 
                            fill="#000000" 
                            strokeLinecap="round"
                        />
                        
                        {/* Left eye */}
                        <path 
                            d="M 34.159 29.579 c -0.478 0 -0.871 -0.101 -1.16 -0.214 c -0.867 -0.339 -2.337 -1.383 -2.452 -4.571 c -0.069 -1.928 0.383 -4.243 1.273 -6.519 l 0 0 c 1.791 -4.581 5.244 -8.576 8.389 -7.349 c 3.14 1.228 2.97 6.508 1.179 11.09 c -0.89 2.276 -2.128 4.284 -3.487 5.653 C 36.405 29.177 35.112 29.579 34.159 29.579 z" 
                            fill="#000000" 
                            strokeLinecap="round"
                        />
                    </g>
                </motion.svg>
                </div>
            </motion.div>
        </>
    );
});

SpookyGhostFace.displayName = 'SpookyGhostFace';

export default SpookyGhostFace;