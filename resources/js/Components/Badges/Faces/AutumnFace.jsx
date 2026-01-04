import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// Memoized leaf component to prevent unnecessary re-renders
const FallingLeaf = memo(({ leaf }) => (
    <div
        style={{
            position: 'absolute',
            left: `${leaf.x}px`,
            top: `${leaf.y}px`,
            width: `${leaf.size * 2}px`,
            height: `${leaf.size * 2.5}px`,
            background: `linear-gradient(135deg, ${leaf.color} 0%, ${leaf.color}dd 50%, ${leaf.color}aa 100%)`,
            borderRadius: '50% 0 50% 50%',
            transform: `rotate(${leaf.rotation}deg)`,
            opacity: leaf.opacity,
            pointerEvents: 'none',
            zIndex: 3,
        }}
    />
));

// Memoized ground leaf component
const GroundLeaf = memo(({ leaf }) => (
    <div
        style={{
            position: 'absolute',
            left: `${leaf.x}px`,
            top: `${leaf.y}px`,
            width: `${leaf.size * 2}px`,
            height: `${leaf.size * 2.5}px`,
            background: `linear-gradient(135deg, ${leaf.color} 0%, ${leaf.color}dd 50%, ${leaf.color}aa 100%)`,
            borderRadius: '50% 0 50% 50%',
            transform: `rotate(${leaf.rotation}deg)`,
            opacity: leaf.opacity,
            pointerEvents: 'none',
            zIndex: 35,
        }}
    />
));

const AutumnFace = React.memo(({ mouseX, mouseY, isHovering, embossingContent, isUnearned }) => {
    const [leaves, setLeaves] = useState([]);
    const [groundLeaves, setGroundLeaves] = useState([]);
    const [birds, setBirds] = useState([]);
    const [treeShaken, setTreeShaken] = useState({ tree1: false, tree2: false, tree3: false, tree4: false, tree5: false });
    const [lastHoveredTree, setLastHoveredTree] = useState(null);
    const lastShakeTime = useRef({});
    const wasHovering = useRef(false);
    const leaveIdRef = useRef(0);
    const birdIdRef = useRef(0);
    const lastMousePos = useRef({ x: 0.5, y: 0.5 });
    const prevMouseX = useRef(0.5); // Track previous X position for direction
    
    // Tree positions along the path with variations
    const trees = [
        { id: 'tree1', x: 5, y: 60, size: 0.9, variant: 1 },
        { id: 'tree2', x: 22, y: 60, size: 1.1, variant: 2 },
        { id: 'tree3', x: 37, y: 62, size: 0.9, variant: 1 },
        { id: 'tree4', x: 52, y: 64, size: 0.8, variant: 3 },
        { id: 'tree5', x: 69, y: 66, size: 1.2, variant: 2 },
    ];
    
    // Generate falling leaves periodically from trees
    useEffect(() => {
        if (isUnearned) return;
        
        const interval = setInterval(() => {
            setLeaves(prev => {
                // Limit number of falling leaves to prevent performance issues
                if (prev.length > 30) return prev;
                
                // Pick a random tree
                const tree = trees[Math.floor(Math.random() * trees.length)];
                
                const newLeaf = {
                    id: leaveIdRef.current++,
                    x: tree.x + (Math.random() - 0.5) * 15, // Spread around tree
                    y: tree.y - 10, // Start above tree
                    rotation: Math.random() * 360,
                    size: 2 + Math.random() * 1,
                    color: ['#D2691E', '#FF8C00', '#CD853F', '#DAA520', '#B8860B'][Math.floor(Math.random() * 5)],
                    drift: (Math.random() - 0.5) * 30,
                    fallSpeed: 0.05 + Math.random() * 0.5,
                    opacity: 0.75,
                    targetY: 62 + Math.random() * 15, // Pre-calculate where leaf will land
                };
                return [...prev, newLeaf];
            });
        }, 400);
        
        return () => clearInterval(interval);
    }, [isUnearned]);
    
    // Update falling leaves
    useEffect(() => {
        if (isUnearned) return;
        
        const interval = setInterval(() => {
            setLeaves(prev => {
                const updated = prev.map(leaf => {
                    let newFallSpeed = leaf.fallSpeed;
                    
                    // If kicked up (negative velocity), apply gravity to slow and reverse
                    if (leaf.kickedUp) {
                        newFallSpeed = leaf.fallSpeed + 0.15; // Gravity acceleration
                    }
                    
                    const newY = leaf.y + newFallSpeed;
                    
                    // Check if leaf hit its target position (only when falling down)
                    if (newFallSpeed > 0 && newY >= leaf.targetY) {
                        // Add to ground leaves
                        setGroundLeaves(ground => [...ground, { 
                            ...leaf, 
                            y: leaf.targetY,
                            grounded: true,
                            kickedUp: false,
                        }]);
                        return null; // Remove from falling leaves
                    }
                    
                    return {
                        ...leaf,
                        y: newY,
                        fallSpeed: newFallSpeed,
                        rotation: leaf.rotation + 3,
                        x: leaf.x + Math.sin(newY / 8) * 0.2, // Smoother, wider sway
                    };
                }).filter(Boolean);
                
                return updated;
            });
        }, 20); // Faster update for smoother animation
        
        return () => clearInterval(interval);
    }, [isUnearned]);
    
    // Fade out and remove old ground leaves
    useEffect(() => {
        if (isUnearned) return;
        
        const interval = setInterval(() => {
            setGroundLeaves(prev => {
                const updated = prev.map(leaf => ({
                    ...leaf,
                    opacity: leaf.kickedUp ? leaf.opacity : Math.max(0, leaf.opacity - 0.003),
                })).filter(leaf => leaf.opacity > 0 || leaf.kickedUp);
                
                // Limit ground leaves to prevent too many
                if (updated.length > 50) {
                    return updated.slice(-50);
                }
                return updated;
            });
        }, 100);
        
        return () => clearInterval(interval);
    }, [isUnearned]);
    
    // Track mouse position for path interaction
    useEffect(() => {
        const unsubscribeX = mouseX.on('change', (x) => {
            prevMouseX.current = lastMousePos.current.x; // Store previous X
            lastMousePos.current.x = x;
            checkPathInteraction(x, lastMousePos.current.y);
            checkTreeHover(x, lastMousePos.current.y);
        });
        
        const unsubscribeY = mouseY.on('change', (y) => {
            lastMousePos.current.y = y;
            checkPathInteraction(lastMousePos.current.x, y);
            checkTreeHover(lastMousePos.current.x, y);
        });
        
        return () => {
            unsubscribeX();
            unsubscribeY();
        };
    }, [mouseX, mouseY, groundLeaves]);
    
    const checkTreeHover = (x, y) => {
        if (isUnearned) return; // Don't check tree hover for unearned badges
        
        const currentlyHovering = isHovering.get();
        
        if (!currentlyHovering) {
            setLastHoveredTree(null);
            // Reset all tree shake states when not hovering badge
            setTreeShaken({ tree1: false, tree2: false, tree3: false, tree4: false, tree5: false });
            wasHovering.current = false;
            return;
        }
        
        // If we just started hovering OR if position is at extremes (likely a reset), skip detection
        // This prevents triggering when mouse leaves and position snaps to 1,1
        if (!wasHovering.current || x > 0.95 || x < 0.05 || y > 0.95 || y < 0.05) {
            wasHovering.current = true;
            return;
        }
        
        // Convert normalized coordinates to pixels (80x80 badge)
        const pixelX = x * 80;
        const pixelY = y * 80;
        
        // Check if mouse is over any tree
        let hoveredTree = null;
        for (const tree of trees) {
            const treeLeft = tree.x - 12.5 * tree.size;
            const treeTop = tree.y - 40 * tree.size;
            const treeWidth = 25 * tree.size;
            const treeHeight = 40 * tree.size;
            
            if (pixelX >= treeLeft && pixelX <= treeLeft + treeWidth &&
                pixelY >= treeTop && pixelY <= treeTop + treeHeight) {
                hoveredTree = tree.id;
                break;
            }
        }
        
        // If we're hovering a new tree, shake it
        if (hoveredTree && hoveredTree !== lastHoveredTree && !treeShaken[hoveredTree]) {
            shakeTree(hoveredTree);
        }
        
        // If we left a tree, reset its shake state after a delay
        if (lastHoveredTree && lastHoveredTree !== hoveredTree) {
            setTimeout(() => {
                setTreeShaken(prev => ({ ...prev, [lastHoveredTree]: false }));
            }, 1000);
        }
        
        setLastHoveredTree(hoveredTree);
    };
    
    const checkPathInteraction = (x, y) => {
        // Path is in bottom 35% of badge (y > 0.65) and must be hovering
        // Also check that we're actually in the path area (not leaving the badge)
        // Ignore extreme positions which indicate mouse is leaving
        if (y > 0.75 && y < 0.95 && x >= 0.05 && x <= 0.95 && isHovering.get()) {
            kickUpLeaves(x * 80);
        }
    };
    
    const kickUpLeaves = (mouseXPos) => {
        setGroundLeaves(prev => {
            const toKick = [];
            const remaining = prev.filter(leaf => {
                const distance = Math.abs(leaf.x - mouseXPos);
                
                if (distance < 15 && !leaf.kickedUp) {
                    toKick.push(leaf);
                    return false; // Remove from ground leaves
                }
                return true;
            });
            
            // Add kicked leaves back to falling leaves with upward velocity
            if (toKick.length > 0) {
                // Determine mouse direction based on movement
                const mouseDirection = (lastMousePos.current.x - prevMouseX.current) * 80; // Scale to pixel space
                const kickDirection = mouseDirection > 0 ? 1 : mouseDirection < 0 ? -1 : 0;
                
                setLeaves(falling => [
                    ...falling,
                    ...toKick.map(leaf => {
                        const xOffset = kickDirection * (3 + Math.random() * 5); // 3-8px in mouse direction
                        
                        return {
                            ...leaf,
                            y: leaf.y - 5, // Start slightly higher
                            x: leaf.x + xOffset * 0.3, // Add some horizontal kick
                            kickedUp: true,
                            grounded: false,
                            fallSpeed: -2, // Negative = upward velocity
                            drift: kickDirection * (Math.random() * 8), // Drift in mouse direction
                            targetY: leaf.y, // Land back at same Y
                        };
                    })
                ]);
            }
            
            return remaining;
        });
    };
    
    const shakeTree = (side) => {
        if (isUnearned) return; // Don't shake trees or spawn birds for unearned badges
        
        // Random cooldown between 5-12 seconds
        const cooldownTime = 5000 + Math.random() * 7000; // 5000-12000ms
        const now = Date.now();
        if (lastShakeTime.current[side] && now - lastShakeTime.current[side] < cooldownTime) {
            return;
        }
        
        if (treeShaken[side]) {
            return;
        }
        
        lastShakeTime.current[side] = now;
        setTreeShaken(prev => ({ ...prev, [side]: true }));
        
        // 40% chance of no birds
        if (Math.random() < 0.55) {
            return;
        }
        
        // Release birds (reduced count)
        const birdCount = Math.random() < 0.80 ? 1 : 2; // 80% chance of 1 bird, 20% chance of 2 birds
        const newBirds = [];
        
        const tree = trees.find(t => t.id === side);
        if (!tree) return;
        
        for (let i = 0; i < birdCount; i++) {
            newBirds.push({
                id: birdIdRef.current++,
                x: tree.x,
                y: tree.y - 30, // Start higher up
                angle: -90 + (Math.random() - 0.5) * 60, // Fly upward with variation
                speed: 1.5 + Math.random() * 1,
                opacity: 1, // Start fully visible
                wingPhase: Math.random() * Math.PI * 2, // Random wing start position
            });
        }
        
        setBirds(prev => [...prev, ...newBirds]);
        // Reset after leaving tree area (handled by checkTreeHover)
    };
    
    // Animate birds
    useEffect(() => {
        if (isUnearned) return;
        
        const interval = setInterval(() => {
            setBirds(prev => 
                prev.map(bird => {
                    // Fade out as bird flies away
                    const newOpacity = bird.opacity - 0.02;
                    
                    return {
                        ...bird,
                        x: bird.x + Math.cos(bird.angle * Math.PI / 180) * bird.speed,
                        y: bird.y + Math.sin(bird.angle * Math.PI / 180) * bird.speed,
                        opacity: newOpacity,
                        wingPhase: bird.wingPhase + 0.6, // Faster wing flapping (increased from 0.3)
                    };
                }).filter(bird => bird.x > -10 && bird.x < 90 && bird.y > -10 && bird.opacity > 0)
            );
        }, 50);
        
        return () => clearInterval(interval);
    }, [isUnearned]);
    
    return (
        <>
            {/* Autumn sky background */}
            <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                    background: 'linear-gradient(180deg, #87CEEB 0%, #F4A460 70%, #DEB887 100%)',
                }}
            />
            
            {/* Background trees - far layer (most blurred) - detailed trees */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    filter: 'blur(2px)',
                    opacity: 0.5,
                    zIndex: 0,
                }}
            >
                {[
                    { id: 'far1', x: 8, y: 56, size: 1, variant: 3 },
                    { id: 'far2', x: 26, y: 58, size: 0.8, variant: 1 },
                    { id: 'far3', x: 44, y: 57, size: 0.9, variant: 2 },
                    { id: 'far4', x: 61, y: 59, size: 0.9, variant: 3 },
                ].map((tree) => (
                    <div
                        key={tree.id}
                        style={{
                            position: 'absolute',
                            left: `${tree.x - 12.5 * tree.size}px`,
                            top: `${tree.y - 40 * tree.size}px`,
                            width: `${25 * tree.size}px`,
                            height: `${40 * tree.size}px`,
                        }}
                    >
                        {/* Tree trunk */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '0',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: `${4 * tree.size}px`,
                                height: `${20 * tree.size}px`,
                                background: 'linear-gradient(90deg, #654321 0%, #8B4513 50%, #654321 100%)',
                                borderRadius: '1px',
                            }}
                        />
                        
                        {/* Branches - variation 1 */}
                        {tree.variant === 1 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${14 * tree.size}px`,
                                        left: `${7 * tree.size}px`,
                                        width: `${6 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(-30deg)',
                                        transformOrigin: 'right center',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${14 * tree.size}px`,
                                        right: `${7 * tree.size}px`,
                                        width: `${6 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(30deg)',
                                        transformOrigin: 'left center',
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Branches - variation 2 */}
                        {tree.variant === 2 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${16 * tree.size}px`,
                                        left: `${7 * tree.size}px`,
                                        width: `${7 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(-25deg)',
                                        transformOrigin: 'right center',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${12 * tree.size}px`,
                                        right: `${7 * tree.size}px`,
                                        width: `${6 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(35deg)',
                                        transformOrigin: 'left center',
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Branches - variation 3 */}
                        {tree.variant === 3 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        left: `${6 * tree.size}px`,
                                        width: `${6 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(-35deg)',
                                        transformOrigin: 'right center',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        right: `${6 * tree.size}px`,
                                        width: `${5 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(25deg)',
                                        transformOrigin: 'left center',
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Tree foliage - variation 1 */}
                        {tree.variant === 1 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: `${20 * tree.size}px`,
                                        height: `${20 * tree.size}px`,
                                        background: 'radial-gradient(circle, #D2691E 0%, #CD853F 50%, #8B4513 100%)',
                                        borderRadius: '50%',
                                        opacity: 0.9,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        left: `${2 * tree.size}px`,
                                        width: `${15 * tree.size}px`,
                                        height: `${15 * tree.size}px`,
                                        background: 'radial-gradient(circle, #DAA520 0%, #B8860B 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        right: `${2 * tree.size}px`,
                                        width: `${13 * tree.size}px`,
                                        height: `${13 * tree.size}px`,
                                        background: 'radial-gradient(circle, #FF8C00 0%, #D2691E 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Tree foliage - variation 2 */}
                        {tree.variant === 2 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: `${20 * tree.size}px`,
                                        height: `${20 * tree.size}px`,
                                        background: 'radial-gradient(circle, #FF8C00 0%, #DAA520 50%, #CD853F 100%)',
                                        borderRadius: '50%',
                                        opacity: 0.9,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        left: `${2 * tree.size}px`,
                                        width: `${15 * tree.size}px`,
                                        height: `${15 * tree.size}px`,
                                        background: 'radial-gradient(circle, #CD853F 0%, #D2691E 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        right: `${2 * tree.size}px`,
                                        width: `${13 * tree.size}px`,
                                        height: `${13 * tree.size}px`,
                                        background: 'radial-gradient(circle, #B8860B 0%, #8B4513 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Tree foliage - variation 3 */}
                        {tree.variant === 3 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: `${20 * tree.size}px`,
                                        height: `${20 * tree.size}px`,
                                        background: 'radial-gradient(circle, #DAA520 0%, #B8860B 50%, #8B4513 100%)',
                                        borderRadius: '50%',
                                        opacity: 0.9,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        left: `${2 * tree.size}px`,
                                        width: `${15 * tree.size}px`,
                                        height: `${15 * tree.size}px`,
                                        background: 'radial-gradient(circle, #FF8C00 0%, #CD853F 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        right: `${2 * tree.size}px`,
                                        width: `${13 * tree.size}px`,
                                        height: `${13 * tree.size}px`,
                                        background: 'radial-gradient(circle, #D2691E 0%, #B8860B 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                            </>
                        )}
                    </div>
                ))}
                
                {/* Roots and bushes for transition */}
                {[
                    { x: 10, width: 8, roots: 3 },
                    { x: 28, width: 10, roots: 4 },
                    { x: 48, width: 9, roots: 3 },
                    { x: 65, width: 7, roots: 2 },
                ].map((bush, idx) => (
                    <div key={`bush-${idx}`}>
                        {/* Roots spreading from tree base */}
                        {Array.from({ length: bush.roots }).map((_, i) => (
                            <div
                                key={`root-${idx}-${i}`}
                                style={{
                                    position: 'absolute',
                                    left: `${bush.x + (i - bush.roots / 2) * 3}px`,
                                    bottom: '18px',
                                    width: '2px',
                                    height: '6px',
                                    background: '#4a3a2a',
                                    transform: `rotate(${(i - bush.roots / 2) * 15}deg)`,
                                    transformOrigin: 'top center',
                                    borderRadius: '1px',
                                }}
                            />
                        ))}
                        
                        {/* Small bushes */}
                        <div
                            style={{
                                position: 'absolute',
                                left: `${bush.x - bush.width / 2}px`,
                                bottom: '18px',
                                width: `${bush.width}px`,
                                height: `${bush.width * 0.7}px`,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, #5a4a3a 0%, #4a3a2a 80%)',
                                opacity: 0.6,
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                left: `${bush.x - bush.width / 3}px`,
                                bottom: '18px',
                                width: `${bush.width * 0.6}px`,
                                height: `${bush.width * 0.5}px`,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, #6a5a4a 0%, #5a4a3a 80%)',
                                opacity: 0.5,
                            }}
                        />
                    </div>
                ))}
            </div>
            
            {/* Small bushes between far and middle layers */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    zIndex: 0.5,
                }}
            >
                {[
                    { x: 0, y: 19, size: 0.8, rotation: -5, opacity: 0.85, colorVariant: 1, blur: 0.25 },
                    { x: 7, y: 18, size: 1.0, rotation: 3, opacity: 0.75, colorVariant: 2, blur: 0.4 },
                    { x: 15, y: 19, size: 0.8, rotation: -5, opacity: 0.85, colorVariant: 1, blur: 0.1 },
                    { x: 25, y: 17, size: 1.0, rotation: 3, opacity: 0.75, colorVariant: 2, blur: 0.3 },
                    { x: 35, y: 18, size: 1.0, rotation: 3, opacity: 0.8, colorVariant: 2, blur: 0.4 },
                    { x: 45, y: 15, size: 0.9, rotation: -2, opacity: 0.7, colorVariant: 1, blur: 0.25 },
                    { x: 52, y: 14, size: 0.9, rotation: -2, opacity: 0.85, colorVariant: 1, blur: 0.25 },
                    { x: 64, y: 15, size: 1.0, rotation: 3, opacity: 0.85, colorVariant: 2, blur: 0.3 },
                    { x: 70, y: 14, size: 0.9, rotation: -2, opacity: 0.85, colorVariant: 1, blur: 0.1 },
                ].map((bush, idx) => (
                    <div 
                        key={`bush-mid-${idx}`}
                        style={{
                            position: 'absolute',
                            left: `${bush.x}px`,
                            bottom: `${bush.y}px`,
                            transform: `rotate(${bush.rotation}deg)`,
                            transformOrigin: 'bottom center',
                            filter: `blur(${bush.blur}px)`,
                        }}
                    >
                        {/* Base colors for variant 1 (darker browns) */}
                        {bush.colorVariant === 1 && (
                            <>
                                {/* Largest back circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${-6 * bush.size}px`,
                                        bottom: '0',
                                        width: `${12 * bush.size}px`,
                                        height: `${9 * bush.size}px`,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #5a4a3a 0%, #4a3a2a 80%)',
                                        opacity: bush.opacity,
                                    }}
                                />
                                {/* Left side circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${-10 * bush.size}px`,
                                        bottom: `${1 * bush.size}px`,
                                        width: `${10 * bush.size}px`,
                                        height: `${7 * bush.size}px`,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #6a5a4a 0%, #5a4a3a 80%)',
                                        opacity: bush.opacity * 0.9,
                                    }}
                                />
                                {/* Right side circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${0.5 * bush.size}px`,
                                        bottom: `${-0.5 * bush.size}px`,
                                        width: `${10 * bush.size}px`,
                                        height: `${7 * bush.size}px`,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #6a5a4a 0%, #5a4a3a 80%)',
                                        opacity: bush.opacity * 0.85,
                                    }}
                                />
                                {/* Center top circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${-5 * bush.size}px`,
                                        bottom: `${5 * bush.size}px`,
                                        width: `${9 * bush.size}px`,
                                        height: `${6 * bush.size}px`,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #7a6a5a 0%, #6a5a4a 80%)',
                                        opacity: bush.opacity * 0.95,
                                    }}
                                />
                                {/* Small highlight circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${1 * bush.size}px`,
                                        bottom: `${4.35 * bush.size}px`,
                                        width: `${6 * bush.size}px`,
                                        height: `${5 * bush.size}px`,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #8a7a6a 0%, #7a6a5a 80%)',
                                        opacity: bush.opacity * 0.8,
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Base colors for variant 2 (lighter browns) */}
                        {bush.colorVariant === 2 && (
                            <>
                                {/* Largest back circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${-6 * bush.size}px`,
                                        bottom: '0',
                                        width: `${12 * bush.size}px`,
                                        height: `${9 * bush.size}px`,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #8B4513 0%, #A0522D 80%)',
                                        opacity: bush.opacity,
                                    }}
                                />
                                {/* Left side circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${-10 * bush.size}px`,
                                        bottom: `${1 * bush.size}px`,
                                        width: `${9 * bush.size}px`,
                                        height: `${6 * bush.size}px`,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #A0522D 0%, #8B4513 80%)',
                                        opacity: bush.opacity * 0.95,
                                    }}
                                />

                                {/* Right side circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${0.5 * bush.size}px`,
                                        bottom: `${-0.5 * bush.size}px`,
                                        width: `${9 * bush.size}px`,
                                        height: `${6 * bush.size}px`,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #A0522D 0%, #8B4513 80%)',
                                        opacity: bush.opacity * 0.9,
                                    }}
                                />
                            </>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Background trees - middle layer (less blurred) - detailed trees */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    filter: 'blur(1px)',
                    opacity: 0.8,
                    zIndex: 1,
                }}
            >
                {[
                    { id: 'bg1', x: 12, y: 59, size: 0.9, variant: 2 },
                    { id: 'bg2', x: 30, y: 59, size: 0.85, variant: 1 },
                    { id: 'bg3', x: 45, y: 62, size: 0.95, variant: 3 },
                    { id: 'bg4', x: 63, y: 65, size: 0.8, variant: 2 },
                ].map((tree) => (
                    <div
                        key={tree.id}
                        style={{
                            position: 'absolute',
                            left: `${tree.x - 12.5 * tree.size}px`,
                            top: `${tree.y - 40 * tree.size}px`,
                            width: `${25 * tree.size}px`,
                            height: `${40 * tree.size}px`,
                        }}
                    >
                        {/* Tree trunk */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '0',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: `${4 * tree.size}px`,
                                height: `${20 * tree.size}px`,
                                background: 'linear-gradient(90deg, #654321 0%, #8B4513 50%, #654321 100%)',
                                borderRadius: '1px',
                            }}
                        />
                        
                        {/* Branches - variation 1 */}
                        {tree.variant === 1 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${14 * tree.size}px`,
                                        left: `${7 * tree.size}px`,
                                        width: `${6 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(-30deg)',
                                        transformOrigin: 'right center',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${14 * tree.size}px`,
                                        right: `${7 * tree.size}px`,
                                        width: `${6 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(30deg)',
                                        transformOrigin: 'left center',
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Branches - variation 2 */}
                        {tree.variant === 2 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${16 * tree.size}px`,
                                        left: `${7 * tree.size}px`,
                                        width: `${7 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(-25deg)',
                                        transformOrigin: 'right center',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${12 * tree.size}px`,
                                        right: `${7 * tree.size}px`,
                                        width: `${6 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(35deg)',
                                        transformOrigin: 'left center',
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Branches - variation 3 */}
                        {tree.variant === 3 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        left: `${6 * tree.size}px`,
                                        width: `${6 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(-35deg)',
                                        transformOrigin: 'right center',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        right: `${6 * tree.size}px`,
                                        width: `${5 * tree.size}px`,
                                        height: `${2 * tree.size}px`,
                                        background: '#654321',
                                        borderRadius: '1px',
                                        transform: 'rotate(25deg)',
                                        transformOrigin: 'left center',
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Tree foliage - variation 1 */}
                        {tree.variant === 1 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: `${20 * tree.size}px`,
                                        height: `${20 * tree.size}px`,
                                        background: 'radial-gradient(circle, #D2691E 0%, #CD853F 50%, #8B4513 100%)',
                                        borderRadius: '50%',
                                        opacity: 0.9,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        left: `${2 * tree.size}px`,
                                        width: `${15 * tree.size}px`,
                                        height: `${15 * tree.size}px`,
                                        background: 'radial-gradient(circle, #DAA520 0%, #B8860B 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        right: `${2 * tree.size}px`,
                                        width: `${13 * tree.size}px`,
                                        height: `${13 * tree.size}px`,
                                        background: 'radial-gradient(circle, #FF8C00 0%, #D2691E 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Tree foliage - variation 2 */}
                        {tree.variant === 2 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: `${20 * tree.size}px`,
                                        height: `${20 * tree.size}px`,
                                        background: 'radial-gradient(circle, #FF8C00 0%, #DAA520 50%, #CD853F 100%)',
                                        borderRadius: '50%',
                                        opacity: 0.9,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        left: `${2 * tree.size}px`,
                                        width: `${15 * tree.size}px`,
                                        height: `${15 * tree.size}px`,
                                        background: 'radial-gradient(circle, #CD853F 0%, #D2691E 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        right: `${2 * tree.size}px`,
                                        width: `${13 * tree.size}px`,
                                        height: `${13 * tree.size}px`,
                                        background: 'radial-gradient(circle, #B8860B 0%, #8B4513 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Tree foliage - variation 3 */}
                        {tree.variant === 3 && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${15 * tree.size}px`,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: `${20 * tree.size}px`,
                                        height: `${20 * tree.size}px`,
                                        background: 'radial-gradient(circle, #DAA520 0%, #B8860B 50%, #8B4513 100%)',
                                        borderRadius: '50%',
                                        opacity: 0.9,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        left: `${2 * tree.size}px`,
                                        width: `${15 * tree.size}px`,
                                        height: `${15 * tree.size}px`,
                                        background: 'radial-gradient(circle, #FF8C00 0%, #CD853F 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: `${10 * tree.size}px`,
                                        right: `${2 * tree.size}px`,
                                        width: `${13 * tree.size}px`,
                                        height: `${13 * tree.size}px`,
                                        background: 'radial-gradient(circle, #D2691E 0%, #B8860B 60%)',
                                        borderRadius: '50%',
                                        opacity: 0.8,
                                    }}
                                />
                            </>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Trees along the path */}
            {trees.map((tree, index) => (
                <div key={`wrapper-${tree.id}`} style={{ position: 'relative', zIndex: 2 }}>
                    <motion.div
                        key={tree.id}
                        style={{
                            position: 'absolute',
                            left: `${tree.x - 12.5 * tree.size}px`,
                            top: `${tree.y - 40 * tree.size}px`,
                            width: `${25 * tree.size}px`,
                            height: `${40 * tree.size}px`,
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            zIndex: 2,
                            transformOrigin: 'bottom center',
                        }}
                        animate={treeShaken[tree.id] ? {
                            rotateZ: [0, -5, 5, -3, 3, 0],
                        } : {
                            rotateZ: [-1.5, 1.5, -1.5], // Gentle sway
                        }}
                        transition={treeShaken[tree.id] ? {
                            duration: 0.5,
                            ease: 'easeInOut',
                        } : {
                            duration: 2.5 + index * 0.4, // Vary duration per tree
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        onMouseOver={(e) => {
                            e.stopPropagation();
                            if (!treeShaken[tree.id]) {
                                shakeTree(tree.id);
                            }
                        }}
                        onMouseOut={(e) => {
                            e.stopPropagation();
                            // Reset shake state when mouse leaves so it can be triggered again
                            setTimeout(() => {
                                setTreeShaken(prev => ({ ...prev, [tree.id]: false }));
                            }, 500);
                        }}
                    >
                    {/* Tree trunk */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: `${4 * tree.size}px`,
                            height: `${20 * tree.size}px`,
                            background: 'linear-gradient(90deg, #654321 0%, #8B4513 50%, #654321 100%)',
                            borderRadius: '1px',
                        }}
                    />
                    
                    {/* Roots at base - left side */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            left: `${7 * tree.size}px`,
                            width: `${5 * tree.size}px`,
                            height: `${1.5 * tree.size}px`,
                            background: '#654321',
                            borderRadius: '1px',
                            transform: 'rotate(-10deg)',
                            transformOrigin: 'right center',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            left: `${8 * tree.size}px`,
                            width: `${4 * tree.size}px`,
                            height: `${1.5 * tree.size}px`,
                            background: '#654321',
                            borderRadius: '1px',
                            transform: 'rotate(0deg)',
                            transformOrigin: 'right center',
                        }}
                    />
                    
                    {/* Roots at base - right side */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            right: `${7 * tree.size}px`,
                            width: `${5 * tree.size}px`,
                            height: `${1.5 * tree.size}px`,
                            background: '#654321',
                            borderRadius: '1px',
                            transform: 'rotate(5deg)',
                            transformOrigin: 'left center',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            right: `${8 * tree.size}px`,
                            width: `${4 * tree.size}px`,
                            height: `${1.5 * tree.size}px`,
                            background: '#654321',
                            borderRadius: '1px',
                            transform: 'rotate(-5deg)',
                            transformOrigin: 'left center',
                        }}
                    />
                    
                    {/* Branches - variation 1 */}
                    {tree.variant === 1 && (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${14 * tree.size}px`,
                                    left: `${7 * tree.size}px`,
                                    width: `${6 * tree.size}px`,
                                    height: `${2 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(-30deg)',
                                    transformOrigin: 'right center',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${14 * tree.size}px`,
                                    right: `${7 * tree.size}px`,
                                    width: `${6 * tree.size}px`,
                                    height: `${2 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(30deg)',
                                    transformOrigin: 'left center',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${10 * tree.size}px`,
                                    left: `${8 * tree.size}px`,
                                    width: `${5 * tree.size}px`,
                                    height: `${1.5 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(-40deg)',
                                    transformOrigin: 'right center',
                                }}
                            />
                        </>
                    )}
                    
                    {/* Branches - variation 2 */}
                    {tree.variant === 2 && (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${16 * tree.size}px`,
                                    left: `${7 * tree.size}px`,
                                    width: `${7 * tree.size}px`,
                                    height: `${2 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(-25deg)',
                                    transformOrigin: 'right center',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${12 * tree.size}px`,
                                    right: `${7 * tree.size}px`,
                                    width: `${6 * tree.size}px`,
                                    height: `${2 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(35deg)',
                                    transformOrigin: 'left center',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${8 * tree.size}px`,
                                    left: `${8 * tree.size}px`,
                                    width: `${4 * tree.size}px`,
                                    height: `${1.5 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(-45deg)',
                                    transformOrigin: 'right center',
                                }}
                            />
                        </>
                    )}
                    
                    {/* Branches - variation 3 */}
                    {tree.variant === 3 && (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${15 * tree.size}px`,
                                    left: `${6 * tree.size}px`,
                                    width: `${6 * tree.size}px`,
                                    height: `${2 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(-35deg)',
                                    transformOrigin: 'right center',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${15 * tree.size}px`,
                                    right: `${6 * tree.size}px`,
                                    width: `${5 * tree.size}px`,
                                    height: `${2 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(25deg)',
                                    transformOrigin: 'left center',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${11 * tree.size}px`,
                                    right: `${8 * tree.size}px`,
                                    width: `${5 * tree.size}px`,
                                    height: `${1.5 * tree.size}px`,
                                    background: '#654321',
                                    borderRadius: '1px',
                                    transform: 'rotate(40deg)',
                                    transformOrigin: 'left center',
                                }}
                            />
                        </>
                    )}
                    
                    {/* Tree foliage - variation 1 (chocolate, sandy, orange) */}
                    {tree.variant === 1 && (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${15 * tree.size}px`,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: `${20 * tree.size}px`,
                                    height: `${20 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #FFB347 0%, #D2691E 30%, #CD853F 60%, #8B4513 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.9,
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${10 * tree.size}px`,
                                    left: `${2 * tree.size}px`,
                                    width: `${15 * tree.size}px`,
                                    height: `${15 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #F4C430 0%, #DAA520 40%, #B8860B 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${10 * tree.size}px`,
                                    right: `${2 * tree.size}px`,
                                    width: `${13 * tree.size}px`,
                                    height: `${13 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 40%, #D2691E 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                }}
                            />
                        </>
                    )}
                    
                    {/* Tree foliage - variation 2 (orange, gold, red-orange) */}
                    {tree.variant === 2 && (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${15 * tree.size}px`,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: `${20 * tree.size}px`,
                                    height: `${20 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #FFB84D 0%, #FF8C00 30%, #DAA520 60%, #CD853F 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.9,
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${10 * tree.size}px`,
                                    left: `${2 * tree.size}px`,
                                    width: `${15 * tree.size}px`,
                                    height: `${15 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #E6A642 0%, #CD853F 40%, #D2691E 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${10 * tree.size}px`,
                                    right: `${2 * tree.size}px`,
                                    width: `${13 * tree.size}px`,
                                    height: `${13 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #D4A96A 0%, #B8860B 40%, #8B4513 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                }}
                            />
                        </>
                    )}
                    
                    {/* Tree foliage - variation 3 (gold, brown, rust) */}
                    {tree.variant === 3 && (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${15 * tree.size}px`,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: `${20 * tree.size}px`,
                                    height: `${20 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #F4C430 0%, #DAA520 30%, #B8860B 60%, #8B4513 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.9,
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${10 * tree.size}px`,
                                    left: `${2 * tree.size}px`,
                                    width: `${15 * tree.size}px`,
                                    height: `${15 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #FFA54F 0%, #FF8C00 40%, #CD853F 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${10 * tree.size}px`,
                                    right: `${2 * tree.size}px`,
                                    width: `${13 * tree.size}px`,
                                    height: `${13 * tree.size}px`,
                                    background: 'linear-gradient(135deg, #E6986A 0%, #D2691E 40%, #B8860B 100%)',
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                }}
                            />
                        </>
                    )}
                </motion.div>
                </div>
            ))}
            
            {/* Static roots at tree bases (don't sway) */}
            {trees.map((tree, index) => (
                <div key={`roots-${tree.id}`} style={{ position: 'absolute', left: `${tree.x}px`, top: `${tree.y}px`, zIndex: 1, pointerEvents: 'none' }}>
                    {/* Roots at base - left side */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `-${5 * tree.size}px`,
                            top: '0',
                            width: `${5 * tree.size}px`,
                            height: `${1.5 * tree.size}px`,
                            background: '#654321',
                            borderRadius: '1px',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: `-${4 * tree.size}px`,
                            top: '0',
                            width: `${4 * tree.size}px`,
                            height: `${1.5 * tree.size}px`,
                            background: '#654321',
                            borderRadius: '1px',
                        }}
                    />
                    
                    {/* Roots at base - right side */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            width: `${5 * tree.size}px`,
                            height: `${1.5 * tree.size}px`,
                            background: '#654321',
                            borderRadius: '1px',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            width: `${4 * tree.size}px`,
                            height: `${1.5 * tree.size}px`,
                            background: '#654321',
                            borderRadius: '1px',
                        }}
                    />
                </div>
            ))}

            
            {/* Winding path */}
            <svg
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                width="80"
                height="40"
                viewBox="0 0 80 30"
                style={{ zIndex: 1 }}
            >
                <path
                    d="M 0 15 Q 20 10, 40 15 T 80 20 L 80 40 L 0 40 Z"
                    fill="#8B7355"
                    opacity="0.9"
                />
                <path
                    d="M 0 15 Q 20 10, 40 15 T 80 20"
                    stroke="#6B5345"
                    strokeWidth="1"
                    fill="none"
                />
            </svg>
            
            {/* Falling leaves */}
            {leaves.map(leaf => (
                <FallingLeaf key={leaf.id} leaf={leaf} />
            ))}
            
            {/* Ground leaves */}
            {groundLeaves.map(leaf => (
                <GroundLeaf key={`ground-${leaf.id}`} leaf={leaf} />
            ))}

            {/* Embossed icon/image - behind leaves but in front of background */}
            <div>
                {embossingContent}
            </div>
            
            {/* Birds */}
            {birds.map(bird => {
                // Calculate wing angle based on phase for flapping animation
                const wingAngle = Math.sin(bird.wingPhase) * 15; // Flap between -15 and +15 degrees
                
                return (
                    <div
                        key={bird.id}
                        style={{
                            position: 'absolute',
                            left: `${bird.x}px`,
                            top: `${bird.y}px`,
                            pointerEvents: 'none',
                            zIndex: 4,
                            opacity: bird.opacity,
                        }}
                    >
                        {/* Flapping bird with animated wings */}
                        <svg width="10" height="8" viewBox="0 0 10 8">
                            {/* Left wing */}
                            <path
                                d="M 5 4 L 1 2"
                                stroke="#2C1810"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                transform={`rotate(${-wingAngle} 5 4)`}
                            />
                            {/* Right wing */}
                            <path
                                d="M 5 4 L 9 2"
                                stroke="#2C1810"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                transform={`rotate(${wingAngle} 5 4)`}
                            />
                            {/* Body */}
                            <circle cx="5" cy="4" r="1" fill="#2C1810" />
                        </svg>
                    </div>
                );
            })}
        </>
    );
});

AutumnFace.displayName = 'AutumnFace';

export default AutumnFace;
