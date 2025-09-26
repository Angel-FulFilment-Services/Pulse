import React, { useState, useMemo } from 'react';
import { ClockIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

// Cloud components defined outside to prevent re-creation
const CloudType1 = React.memo(({ x, y, scale, opacity, delay, lightingCx, lightingCy }) => {
    // Create unique ID by replacing % and . characters to ensure valid DOM IDs
    const uniqueId = `${x}-${y}-${delay}`.replace(/[%\.]/g, '-');
    return (
        <svg
            className="absolute"
            style={{ 
                left: x, 
                top: y, 
                opacity,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                animation: `cloudFloat1 8s ease-in-out infinite ${delay}s`,
                '--cloud-scale': scale,
                transform: `scale(${scale})`
            }}
            width="100"
            height="50"
            viewBox="0 0 100 50"
            fill="none"
        >
            <defs>
                <radialGradient id={`cloud1Lighting-${uniqueId}`} cx={lightingCx} cy={lightingCy} r="85%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="30%" stopColor="#f8fafc" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.88" />
                    <stop offset="85%" stopColor="#cbd5e1" stopOpacity="0.82" />
                    <stop offset="100%" stopColor="#b4bcc8" stopOpacity="0.85" />
                </radialGradient>
                <mask id={`cloud1Mask-${uniqueId}`}>
                    <g fill="white">
                        <ellipse cx="25" cy="30" rx="18" ry="12" />
                        <ellipse cx="45" cy="25" rx="22" ry="15" />
                        <ellipse cx="65" cy="28" rx="16" ry="11" />
                        <ellipse cx="80" cy="32" rx="12" ry="8" />
                        <ellipse cx="15" cy="35" rx="12" ry="8" />
                        <ellipse cx="35" cy="18" rx="15" ry="10" />
                        <ellipse cx="55" cy="20" rx="18" ry="12" />
                        <ellipse cx="45" cy="38" rx="35" ry="9" />
                    </g>
                </mask>
            </defs>
            {/* Cloud base shape */}
            <g fill="white">
                <ellipse cx="25" cy="30" rx="18" ry="12" />
                <ellipse cx="45" cy="25" rx="22" ry="15" />
                <ellipse cx="65" cy="28" rx="16" ry="11" />
                <ellipse cx="80" cy="32" rx="12" ry="8" />
                <ellipse cx="15" cy="35" rx="12" ry="8" />
                <ellipse cx="35" cy="18" rx="15" ry="10" />
                <ellipse cx="55" cy="20" rx="18" ry="12" />
                <ellipse cx="45" cy="38" rx="35" ry="9" />
            </g>
            {/* Lighting overlay */}
            <rect 
                width="100" 
                height="50" 
                fill={`url(#cloud1Lighting-${uniqueId})`} 
                mask={`url(#cloud1Mask-${uniqueId})`}
                style={{ mixBlendMode: 'multiply' }}
            />
        </svg>
    );
});

const CloudType2 = React.memo(({ x, y, scale, opacity, delay, lightingCx, lightingCy }) => {
    const uniqueId = `${x}-${y}-${delay}`.replace(/[%\.]/g, '-');
    return (
        <svg
            className="absolute"
            style={{ 
                left: x, 
                top: y, 
                opacity,
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.12))',
                animation: `cloudFloat2 10s ease-in-out infinite ${delay}s`,
                '--cloud-scale': scale,
                transform: `scale(${scale})`
            }}
            width="90"
            height="45"
            viewBox="0 0 90 45"
            fill="none"
        >
            <defs>
                <radialGradient id={`cloud2Lighting-${uniqueId}`} cx={lightingCx} cy={lightingCy} r="75%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="30%" stopColor="#f8fafc" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.88" />
                    <stop offset="85%" stopColor="#cbd5e1" stopOpacity="0.82" />
                    <stop offset="100%" stopColor="#b4bcc8" stopOpacity="0.85" />
                </radialGradient>
                <mask id={`cloud2Mask-${uniqueId}`}>
                    <g fill="white">
                        <ellipse cx="20" cy="28" rx="16" ry="10" />
                        <ellipse cx="35" cy="22" rx="18" ry="12" />
                        <ellipse cx="55" cy="25" rx="20" ry="14" />
                        <ellipse cx="70" cy="30" rx="14" ry="9" />
                        <ellipse cx="40" cy="15" rx="12" ry="8" />
                        <ellipse cx="45" cy="33" rx="32" ry="7" />
                    </g>
                </mask>
            </defs>
            {/* Cloud base shape */}
            <g fill="white">
                <ellipse cx="20" cy="28" rx="16" ry="10" />
                <ellipse cx="35" cy="22" rx="18" ry="12" />
                <ellipse cx="55" cy="25" rx="20" ry="14" />
                <ellipse cx="70" cy="30" rx="14" ry="9" />
                <ellipse cx="40" cy="15" rx="12" ry="8" />
                <ellipse cx="45" cy="33" rx="32" ry="7" />
            </g>
            {/* Lighting overlay */}
            <rect 
                width="90" 
                height="45" 
                fill={`url(#cloud2Lighting-${uniqueId})`} 
                mask={`url(#cloud2Mask-${uniqueId})`}
                style={{ mixBlendMode: 'multiply' }}
            />
        </svg>
    );
});

const CloudType3 = React.memo(({ x, y, scale, opacity, delay, lightingCx, lightingCy }) => (
    <svg
        className="absolute"
        style={{ 
            left: x, 
            top: y, 
            opacity,
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.1))',
            animation: `cloudFloat3 12s ease-in-out infinite ${delay}s`,
            '--cloud-scale': scale,
            transform: `scale(${scale})`
        }}
        width="80"
        height="40"
        viewBox="0 0 80 40"
        fill="none"
    >
        <defs>
            <radialGradient id={`cloud3Lighting-${x}-${y}`} cx={lightingCx} cy={lightingCy} r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="30%" stopColor="#f8fafc" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.88" />
                <stop offset="85%" stopColor="#cbd5e1" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#b4bcc8" stopOpacity="0.85" />
            </radialGradient>
            <mask id={`cloud3Mask-${x}-${y}`}>
                <g fill="white">
                    <ellipse cx="20" cy="25" rx="15" ry="10" />
                    <ellipse cx="35" cy="20" rx="18" ry="12" />
                    <ellipse cx="50" cy="24" rx="16" ry="11" />
                    <ellipse cx="65" cy="28" rx="12" ry="8" />
                    <ellipse cx="30" cy="12" rx="10" ry="7" />
                    <ellipse cx="40" cy="30" rx="27" ry="6" />
                </g>
            </mask>
        </defs>
        {/* Cloud base shape */}
        <g fill="white">
            <ellipse cx="20" cy="25" rx="15" ry="10" />
            <ellipse cx="35" cy="20" rx="18" ry="12" />
            <ellipse cx="50" cy="24" rx="16" ry="11" />
            <ellipse cx="65" cy="28" rx="12" ry="8" />
            <ellipse cx="30" cy="12" rx="10" ry="7" />
            <ellipse cx="40" cy="30" rx="27" ry="6" />
        </g>
        {/* Lighting overlay */}
        <rect 
            width="80" 
            height="40" 
            fill={`url(#cloud3Lighting-${x}-${y})`} 
            mask={`url(#cloud3Mask-${x}-${y})`}
            style={{ mixBlendMode: 'multiply' }}
        />
    </svg>
));

const CloudType4 = React.memo(({ x, y, scale, opacity, delay, lightingCx, lightingCy }) => (
    <svg
        className="absolute"
        style={{ 
            left: x, 
            top: y, 
            opacity,
            filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.18))',
            animation: `cloudFloat4 9s ease-in-out infinite ${delay}s`,
            '--cloud-scale': scale,
            transform: `scale(${scale})`
        }}
        width="110"
        height="55"
        viewBox="0 0 110 55"
        fill="none"
    >
        <defs>
            <radialGradient id={`cloud4Lighting-${x}-${y}`} cx={lightingCx} cy={lightingCy} r="80%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="30%" stopColor="#f8fafc" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.88" />
                <stop offset="85%" stopColor="#cbd5e1" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#b4bcc8" stopOpacity="0.85" />
            </radialGradient>
            <mask id={`cloud4Mask-${x}-${y}`}>
                <g fill="white">
                    <ellipse cx="30" cy="35" rx="22" ry="15" />
                    <ellipse cx="55" cy="28" rx="25" ry="18" />
                    <ellipse cx="80" cy="32" rx="18" ry="12" />
                    <ellipse cx="20" cy="40" rx="15" ry="10" />
                    <ellipse cx="45" cy="18" rx="16" ry="11" />
                    <ellipse cx="70" cy="20" rx="14" ry="9" />
                    <ellipse cx="55" cy="41" rx="37" ry="8" />
                </g>
            </mask>
        </defs>
        {/* Cloud base shape */}
        <g fill="white">
            <ellipse cx="30" cy="35" rx="22" ry="15" />
            <ellipse cx="55" cy="28" rx="25" ry="18" />
            <ellipse cx="80" cy="32" rx="18" ry="12" />
            <ellipse cx="20" cy="40" rx="15" ry="10" />
            <ellipse cx="45" cy="18" rx="16" ry="11" />
            <ellipse cx="70" cy="20" rx="14" ry="9" />
            <ellipse cx="55" cy="41" rx="37" ry="8" />
        </g>
        {/* Lighting overlay */}
        <rect 
            width="110" 
            height="55" 
            fill={`url(#cloud4Lighting-${x}-${y})`} 
            mask={`url(#cloud4Mask-${x}-${y})`}
            style={{ mixBlendMode: 'multiply' }}
        />
    </svg>
));

const WelcomeCard = ({ employee, testTime = null }) => {
    const [currentRealTime, setCurrentRealTime] = useState(new Date());

    // Update real time every second
    React.useEffect(() => {
        if (testTime === null) {
            const interval = setInterval(() => {
                setCurrentRealTime(new Date());
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [testTime]);

    const getCurrentTime = () => {
        if (testTime !== null) {
            const hours = Math.floor(testTime);
            const minutes = Math.floor((testTime - hours) * 60);
            const seconds = Math.round(((testTime - hours) * 60 - minutes) * 60);
            const date = new Date();
            date.setHours(hours, minutes, seconds, 0);
            return date;
        }
        return currentRealTime;
    };

    const getCurrentHour = () => {
        return testTime !== null ? testTime : currentRealTime.getHours() + (currentRealTime.getMinutes() / 60);
    };

    // Helper for random star positions with minimum distance (memoized for consistency)
    const [starPositions] = useState(() => {
        const stars = [];
        const minDistance = 8; // Minimum distance between stars in percentage units
        
        for (let i = 0; i < 80; i++) { // Reduced count for better spacing
            let attempts = 0;
            let newStar;
            
            do {
                const size = Math.random() * 0.3 + 0.2; // Smaller and more consistent: 0.2rem to 0.5rem
                newStar = {
                    top: Math.random() * 90 + 2, // 2% to 92% - almost full height
                    left: Math.random() * 96 + 2, // 2% to 98% - almost full width
                    size: size,
                    opacity: Math.random() * 0.3 + 0.4, // Dimmer: 0.4 to 0.7
                    delay: Math.random() * 4,
                };
                attempts++;
            } while (
                attempts < 100 && // More attempts for better distribution
                stars.some(star => {
                    const dx = newStar.left - star.left;
                    const dy = newStar.top - star.top;
                    return Math.sqrt(dx * dx + dy * dy) < minDistance;
                })
            );
            
            stars.push(newStar);
        }
        return stars;
    });

    // Helper function to get sun position for cloud lighting - memoized for performance
    const lightingPosition = useMemo(() => {
        const hour = testTime !== null ? testTime : currentRealTime.getHours() + (currentRealTime.getMinutes() / 60);
        
        // Calculate sun angle (same as in getSunMoonPositions)
        const sunAngle = (((hour - 6) * 15) + 180) * (Math.PI / 180);
        
        // Convert sun position to gradient center coordinates (0-100%)
        const sunX = 50 + Math.cos(sunAngle) * 60; // Sun X position
        const sunY = 90 + Math.sin(sunAngle) * 50;  // Sun Y position
        
        // Convert to gradient center (invert Y since gradient goes from light source)
        const gradientCx = Math.max(10, Math.min(90, sunX)); // Keep within 10-90%
        const gradientCy = Math.max(10, Math.min(90, 100 - sunY)); // Invert and clamp
        
        return { 
            cx: `${gradientCx}%`, 
            cy: `${gradientCy}%`,
            // Also return as separate values for easier prop passing
            cxValue: `${gradientCx}%`,
            cyValue: `${gradientCy}%`
        };
    }, [testTime, currentRealTime]);

    
    const currentTime = getCurrentTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentDate = getCurrentTime().toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const getGreeting = () => {
        const hour = getCurrentHour();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getTimeOfDayBackground = () => {
        const hour = getCurrentHour();
        
        // Helper function to interpolate between two RGB colors
        const interpolateColor = (color1, color2, factor) => {
            // Ensure factor is between 0 and 1
            factor = Math.max(0, Math.min(1, factor));
            
            return {
                r: Math.round(color1.r + (color2.r - color1.r) * factor),
                g: Math.round(color1.g + (color2.g - color1.g) * factor),
                b: Math.round(color1.b + (color2.b - color1.b) * factor)
            };
        };
        
        // Define time-based color stops for smooth transitions
        const timeStops = [
            // Night to dawn
            { time: 0, from: { r: 67, g: 56, b: 202 }, via: { r: 88, g: 28, b: 135 }, to: { r: 15, g: 23, b: 42 } },
            { time: 4, from: { r: 55, g: 48, b: 163 }, via: { r: 76, g: 29, b: 149 }, to: { r: 30, g: 41, b: 59 } },
            { time: 5.5, from: { r: 88, g: 28, b: 135 }, via: { r: 244, g: 114, b: 182 }, to: { r: 253, g: 186, b: 116 } },
            
            // Dawn to morning (faster transition)
            { time: 6.5, from: { r: 254, g: 205, b: 211 }, via: { r: 254, g: 215, b: 170 }, to: { r: 253, g: 224, b: 71 } },
            { time: 8.5, from: { r: 254, g: 215, b: 170 }, via: { r: 253, g: 224, b: 71 }, to: { r: 251, g: 146, b: 60 } },
            
            // Morning to midday
            { time: 9, from: { r: 147, g: 197, b: 253 }, via: { r: 56, g: 189, b: 248 }, to: { r: 103, g: 232, b: 249 } },
            
            // Hold midday blue longer
            { time: 15, from: { r: 147, g: 197, b: 253 }, via: { r: 56, g: 189, b: 248 }, to: { r: 103, g: 232, b: 249 } },

            // Midday to afternoon
            { time: 18.5, from: { r: 253, g: 224, b: 71 }, via: { r: 253, g: 186, b: 116 }, to: { r: 251, g: 191, b: 36 } },
            
            // Afternoon to evening (starts later)
            { time: 19, from: { r: 251, g: 146, b: 60 }, via: { r: 248, g: 113, b: 113 }, to: { r: 236, g: 72, b: 153 } },
            { time: 21.5, from: { r: 220, g: 38, b: 127 }, via: { r: 147, g: 51, b: 234 }, to: { r: 67, g: 56, b: 202 } },
            
            // Evening to night (faster transition)
            { time: 22, from: { r: 67, g: 56, b: 202 }, via: { r: 88, g: 28, b: 135 }, to: { r: 15, g: 23, b: 42 } },
            { time: 24, from: { r: 67, g: 56, b: 202 }, via: { r: 88, g: 28, b: 135 }, to: { r: 15, g: 23, b: 42 } }
        ];
        
        // Find the two time stops to interpolate between
        let beforeStop = timeStops[0];
        let afterStop = timeStops[timeStops.length - 1];
        
        for (let i = 0; i < timeStops.length - 1; i++) {
            if (hour >= timeStops[i].time && hour <= timeStops[i + 1].time) {
                beforeStop = timeStops[i];
                afterStop = timeStops[i + 1];
                break;
            }
        }
        
        // Calculate interpolation factor
        const timeRange = afterStop.time - beforeStop.time;
        const factor = timeRange === 0 ? 0 : (hour - beforeStop.time) / timeRange;
        
        // Interpolate each gradient stop
        const fromColor = interpolateColor(beforeStop.from, afterStop.from, factor);
        const viaColor = interpolateColor(beforeStop.via, afterStop.via, factor);
        const toColor = interpolateColor(beforeStop.to, afterStop.to, factor);
        
        // Return CSS gradient as an object for style prop
        return {
            backgroundImage: `linear-gradient(to bottom right, rgb(${fromColor.r}, ${fromColor.g}, ${fromColor.b}), rgb(${viaColor.r}, ${viaColor.g}, ${viaColor.b}), rgb(${toColor.r}, ${toColor.g}, ${toColor.b}))`
        };
    };

    const getOverlayGradient = () => {
        const hour = getCurrentHour();
        
        // Helper function to interpolate between two RGBA colors
        const interpolateRGBA = (color1, color2, factor) => {
            factor = Math.max(0, Math.min(1, factor));
            
            return {
                r: Math.round(color1.r + (color2.r - color1.r) * factor),
                g: Math.round(color1.g + (color2.g - color1.g) * factor),
                b: Math.round(color1.b + (color2.b - color1.b) * factor),
                a: color1.a + (color2.a - color1.a) * factor
            };
        };
        
        // Define time-based overlay color stops
        const overlayStops = [
            // Night overlay
            { time: 0, from: { r: 88, g: 28, b: 135, a: 0.9 }, via: { r: 55, g: 48, b: 163, a: 0.4 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            { time: 3, from: { r: 88, g: 28, b: 135, a: 0.85 }, via: { r: 55, g: 48, b: 163, a: 0.35 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            
            // Dawn overlay (faster transition)
            { time: 5.5, from: { r: 236, g: 72, b: 153, a: 0.7 }, via: { r: 251, g: 146, b: 60, a: 0.25 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            { time: 6.5, from: { r: 251, g: 146, b: 60, a: 0.7 }, via: { r: 253, g: 186, b: 116, a: 0.3 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            
            // Morning overlay
            { time: 7.5, from: { r: 245, g: 158, b: 11, a: 0.75 }, via: { r: 234, g: 179, b: 8, a: 0.3 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            
            // Midday overlay
            { time: 12, from: { r: 37, g: 99, b: 235, a: 0.8 }, via: { r: 14, g: 165, b: 233, a: 0.3 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            
            // Afternoon overlay
            { time: 16, from: { r: 202, g: 138, b: 4, a: 0.75 }, via: { r: 251, g: 146, b: 60, a: 0.35 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            
            // Evening overlay (starts later, faster transition)
            { time: 18.5, from: { r: 220, g: 38, b: 127, a: 0.8 }, via: { r: 251, g: 146, b: 60, a: 0.3 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            { time: 20, from: { r: 220, g: 38, b: 38, a: 0.8 }, via: { r: 251, g: 146, b: 60, a: 0.3 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            
            // Night overlay
            { time: 20.5, from: { r: 88, g: 28, b: 135, a: 0.85 }, via: { r: 55, g: 48, b: 163, a: 0.35 }, to: { r: 0, g: 0, b: 0, a: 0 } },
            { time: 24, from: { r: 88, g: 28, b: 135, a: 0.9 }, via: { r: 55, g: 48, b: 163, a: 0.4 }, to: { r: 0, g: 0, b: 0, a: 0 } }
        ];
        
        // Find the two overlay stops to interpolate between
        let beforeStop = overlayStops[0];
        let afterStop = overlayStops[overlayStops.length - 1];
        
        for (let i = 0; i < overlayStops.length - 1; i++) {
            if (hour >= overlayStops[i].time && hour <= overlayStops[i + 1].time) {
                beforeStop = overlayStops[i];
                afterStop = overlayStops[i + 1];
                break;
            }
        }
        
        // Calculate interpolation factor
        const timeRange = afterStop.time - beforeStop.time;
        const factor = timeRange === 0 ? 0 : (hour - beforeStop.time) / timeRange;
        
        // Interpolate each gradient stop
        const fromColor = interpolateRGBA(beforeStop.from, afterStop.from, factor);
        const viaColor = interpolateRGBA(beforeStop.via, afterStop.via, factor);
        const toColor = interpolateRGBA(beforeStop.to, afterStop.to, factor);
        
        // Calculate gradient angle based on sun position (smooth rotation)
        let gradientAngle;
        if (hour >= 5 && hour < 19) {
            // During actual daylight hours, rotate the gradient angle based on sun position
            const sunProgress = (hour - 6) / 12; // 0 at 6am, 0.5 at 12pm, 1 at 6pm
            
            // Rotate from 135deg (top-left to bottom-right) in early morning
            // to 45deg (top-right to bottom-left) in evening
            // This follows the sun's east-to-west arc more naturally
            gradientAngle = 135 - (sunProgress * 90); // 135deg to 45deg
        } else {
            // Night and twilight: use a consistent angle (top to bottom)
            gradientAngle = 90;
        }
        
        // Return CSS gradient as an object for style prop
        return {
            backgroundImage: `linear-gradient(${gradientAngle}deg, rgba(${fromColor.r}, ${fromColor.g}, ${fromColor.b}, ${fromColor.a}), rgba(${viaColor.r}, ${viaColor.g}, ${viaColor.b}, ${viaColor.a}), rgba(${toColor.r}, ${toColor.g}, ${toColor.b}, ${toColor.a}))`
        };
    };

    const getSunMoonPositions = () => {
        const hour = getCurrentHour();
        
        // Create a narrower sun/moon path that fits better within the div
        // Map hours to angle on a semicircle: 6am = 180°, 12pm = 90°, 6pm = 0°, midnight = 270°
        const sunAngle = (((hour - 6) * 15) + 180) * (Math.PI / 180); // Convert to radians, 6am starts at 180°
        const moonAngle = sunAngle + Math.PI; // Moon is opposite to sun
        
        // Ellipse parameters - very slight adjustment to fit better within div
        const centerX = 50; // Center horizontally
        const centerY = 90; // Keep center low for proper arc
        const radiusX = 55; // Very slight reduction in horizontal radius
        const radiusY = 40; // Keep vertical radius for proper height
        
        // Calculate positions
        const sunX = centerX + Math.cos(sunAngle) * radiusX;
        const sunY = centerY + Math.sin(sunAngle) * radiusY;
        
        const moonX = centerX + Math.cos(moonAngle) * radiusX;
        const moonY = centerY + Math.sin(moonAngle) * radiusY;
        
        // Calculate scale based on vertical position (higher = larger)
        // Only visible when above the horizon (Y < 100%)
        const getSunScale = () => {
            if (sunY > 100) return 0.4; // Below horizon, smaller scale
            const visibleHeight = Math.max(0, Math.min(100, sunY)); // Clamp to 0-100
            const normalizedY = visibleHeight / 100; // 0 to 1
            const heightFactor = 1 - normalizedY; // Invert so top = 1, bottom = 0
            return 0.4 + (heightFactor * 0.8); // Scale from 0.4 to 1.2 (more dramatic)
        };
        
        const getMoonScale = () => {
            if (moonY > 100) return 0.4; // Below horizon, smaller scale
            const visibleHeight = Math.max(0, Math.min(100, moonY)); // Clamp to 0-100 (fixed: was using sunY!)
            const normalizedY = visibleHeight / 100; // 0 to 1
            const heightFactor = 1 - normalizedY; // Invert so top = 1, bottom = 0
            return 0.4 + (heightFactor * 0.8); // Scale from 0.4 to 1.2 (more dramatic)
        };
        
        return {
            sun: {
                left: sunX + '%',
                top: sunY + '%',
                scale: getSunScale(),
                isVisible: true // Always visible
            },
            moon: {
                left: moonX + '%',
                top: moonY + '%',
                scale: getMoonScale(),
                isVisible: true // Always visible
            }
        };
    };

    const getSunOpacity = () => {
        const hour = getCurrentHour();
        const positions = getSunMoonPositions();
        const sunY = parseFloat(positions.sun.top);
        
        let baseOpacity;
        
        // Precise sun timing: fade in 6:30am-8:30am, full day, fade out 3:30pm-5:30pm
        if (hour >= 6.5 && hour <= 17.5) {
            if (hour >= 6.5 && hour <= 8.5) {
                // Sunrise transition: fade in from 6:30am to 8:30am
                baseOpacity = (hour - 6.5) / 2; // 0 to 1 over 2 hours
            } else if (hour >= 8.5 && hour <= 15.5) {
                // Full day: 8:30am to 3:30pm
                baseOpacity = 1;
            } else if (hour >= 15.5 && hour <= 17.5) {
                // Sunset transition: fade out from 3:30pm to 5:30pm
                baseOpacity = (17.5 - hour) / 2; // 1 to 0 over 2 hours
            }
        } else {
            baseOpacity = 0; // Invisible at night
        }
        
        // Position-based opacity modifier
        if (sunY > 100) {
            baseOpacity = Math.max(0, baseOpacity * 0.2); // Very dim when below horizon
        }
        
        return Math.max(0, Math.min(1, baseOpacity));
    };

    const getMoonOpacity = () => {
        const hour = getCurrentHour();
        const positions = getSunMoonPositions();
        const moonY = parseFloat(positions.moon.top);
        
        let baseOpacity;
        
        // Precise moon timing: fade in 5:30pm-7:30pm, full night, fade out 3:30am-5:30am
        if (hour >= 17.5 || hour <= 5.5) {
            if (hour >= 17.5 && hour <= 19.5) {
                // Moonrise transition: fade in from 5:30pm to 7:30pm
                baseOpacity = (hour - 17.5) / 2; // 0 to 1 over 2 hours
            } else if ((hour >= 19.5 && hour <= 24) || (hour >= 0 && hour <= 3.5)) {
                // Full night: 7:30pm to 3:30am
                baseOpacity = 1;
            } else if (hour >= 3.5 && hour <= 5.5) {
                // Moonset transition: fade out from 3:30am to 5:30am
                baseOpacity = (5.5 - hour) / 2; // 1 to 0 over 2 hours
            }
        } else {
            baseOpacity = 0; // Invisible during day
        }
        
        // Position-based opacity modifier
        if (moonY > 100) {
            baseOpacity = Math.max(0, baseOpacity * 0.2); // Very dim when below horizon
        }
        
        return Math.max(0, Math.min(1, baseOpacity));
    };

    const getStarOpacity = () => {
        const hour = getCurrentHour();
        if (hour >= 20 || hour <= 4) return 1; // Full stars
        if (hour >= 18 && hour < 20) return (hour - 18) / 2; // Fade in
        if (hour > 4 && hour <= 6) return Math.max(0, (6 - hour) / 2); // Fade out
        return 0; // No stars during day
    };

    const getCloudOpacity = () => {
        const hour = getCurrentHour();
        if (hour >= 6 && hour <= 19) return 1; // Full clouds during day
        if (hour > 19 && hour < 22) return Math.max(0.15, (22 - hour) / 3 * 0.85); // Fade out evening (to 15% minimum)
        if (hour >= 3 && hour < 6) return 0.15 + ((hour - 3) / 3) * 0.85; // Fade in morning (from 15%)
        return 0.15; // Very transparent clouds at night (15% instead of 30%)
    };

    const getTimeIcon = () => {
        const hour = getCurrentHour();
        if (hour >= 6 && hour < 18) {
            return <SunIcon className="h-6 w-6 text-white mr-2 -ml-1" />;
        } else {
            return <MoonIcon className="h-5 w-5 text-white mr-2" />;
        }
    };

    return (
        <div className="relative rounded-2xl shadow-lg h-40 overflow-hidden">
            {/* Orbital path debug - positioned outside the main container */}
            <div className="absolute inset-0 pointer-events-none">
                <svg 
                    width="400" 
                    height="300" 
                    className="absolute" 
                    style={{ 
                        left: '-100px', 
                        top: '-50px',
                        overflow: 'visible'
                    }}
                >
                    {/* Draw the orbital ellipse - red line showing full orbit */}
                    <ellipse
                        cx="200"
                        cy="200"
                        rx="100"
                        ry="80"
                        fill="none"
                        stroke="red"
                        strokeWidth="3"
                    />
                </svg>
            </div>
            {/* CSS animations for cloud floating and star twinkling */}
            <style>{`
                @keyframes cloudFloat1 {
                    0%, 100% { transform: translateY(0px) scale(var(--cloud-scale, 1)); }
                    50% { transform: translateY(-4px) scale(var(--cloud-scale, 1)); }
                }
                @keyframes cloudFloat2 {
                    0%, 100% { transform: translateY(0px) scale(var(--cloud-scale, 1)); }
                    50% { transform: translateY(-3px) scale(var(--cloud-scale, 1)); }
                }
                @keyframes cloudFloat3 {
                    0%, 100% { transform: translateY(0px) scale(var(--cloud-scale, 1)); }
                    50% { transform: translateY(-5px) scale(var(--cloud-scale, 1)); }
                }
                @keyframes cloudFloat4 {
                    0%, 100% { transform: translateY(0px) scale(var(--cloud-scale, 1)); }
                    50% { transform: translateY(-4px) scale(var(--cloud-scale, 1)); }
                }
                
                @keyframes starTwinkle {
                    0%, 100% { 
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    }
                    25% { 
                        opacity: 0.4;
                        transform: translate(-50%, -50%) scale(0.9) rotate(15deg);
                    }
                    50% { 
                        opacity: 0.7;
                        transform: translate(-50%, -50%) scale(1.2) rotate(30deg);
                    }
                    75% { 
                        opacity: 0.5;
                        transform: translate(-50%, -50%) scale(0.95) rotate(45deg);
                    }
                }
                
                /* Custom slider styling */
                .slider-time::-webkit-slider-thumb {
                    appearance: none;
                    height: 24px;
                    width: 24px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #fbbf24, #f59e0b);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    cursor: pointer;
                    border: 3px solid white;
                    position: relative;
                }
                
                .slider-time::-moz-range-thumb {
                    height: 24px;
                    width: 24px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #fbbf24, #f59e0b);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    cursor: pointer;
                    border: 3px solid white;
                    appearance: none;
                }
            `}</style>
            {/* Time of day background with smooth transitions */}
            <div 
                className="absolute inset-0"
                style={getTimeOfDayBackground()}
            >
                {/* Time-based overlay gradient - applied first */}
                <div 
                    className="absolute inset-0"
                    style={getOverlayGradient()}
                ></div>

                {/* Stars - fade in/out with night, behind everything */}
                <div 
                    className="transition-opacity duration-3000 ease-in-out absolute inset-0"
                    style={{ opacity: getStarOpacity() }}
                >
                    {starPositions.map((star, i) => (
                        <div
                            key={i}
                            className="absolute"
                            style={{
                                top: star.top + '%',
                                left: star.left + '%',
                                transform: 'translate(-50%, -50%)',
                                animation: `starTwinkle ${2 + star.delay}s ease-in-out infinite`,
                                animationDelay: `${star.delay}s`,
                            }}
                        >
                            {/* Star shape using CSS */}
                            <div
                                className="relative"
                                style={{
                                    width: `${star.size}rem`,
                                    height: `${star.size}rem`,
                                    opacity: star.opacity,
                                }}
                            >
                                {/* Main star body */}
                                <div 
                                    className="absolute bg-white"
                                    style={{
                                        width: '100%',
                                        height: '25%',
                                        top: '37.5%',
                                        left: '0',
                                        borderRadius: '50px',
                                        boxShadow: `0 0 ${star.size * 4}px rgba(255, 255, 255, ${star.opacity * 0.9})`
                                    }}
                                />
                                <div 
                                    className="absolute bg-white"
                                    style={{
                                        width: '25%',
                                        height: '100%',
                                        top: '0',
                                        left: '37.5%',
                                        borderRadius: '50px',
                                        boxShadow: `0 0 ${star.size * 4}px rgba(255, 255, 255, ${star.opacity * 0.9})`
                                    }}
                                />
                                {/* Diagonal rays for 4-pointed star effect */}
                                <div 
                                    className="absolute bg-white"
                                    style={{
                                        width: '75%',
                                        height: '15%',
                                        top: '42.5%',
                                        left: '12.5%',
                                        borderRadius: '50px',
                                        transform: 'rotate(45deg)',
                                        opacity: 0.8,
                                        boxShadow: `0 0 ${star.size * 3}px rgba(255, 255, 255, ${star.opacity * 0.7})`
                                    }}
                                />
                                <div 
                                    className="absolute bg-white"
                                    style={{
                                        width: '75%',
                                        height: '15%',
                                        top: '42.5%',
                                        left: '12.5%',
                                        borderRadius: '50px',
                                        transform: 'rotate(-45deg)',
                                        opacity: 0.8,
                                        boxShadow: `0 0 ${star.size * 3}px rgba(255, 255, 255, ${star.opacity * 0.7})`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Get orbital positions for both sun and moon */}
                {(() => {
                    const positions = getSunMoonPositions();
                    return (
                        <>
                            {/* Sun - always present, rotating in elliptical orbit, behind clouds */}
                            <div 
                                className="absolute" 
                                style={{
                                    left: positions.sun.left,
                                    top: positions.sun.top,
                                    opacity: getSunOpacity(),
                                    transform: `translate(-50%, -50%) scale(${positions.sun.scale})`
                                }}
                            >
                                <div className="relative flex items-center justify-center">
                                    {/* Outer glow */}
                                    <div className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-yellow-200 via-orange-200 to-yellow-300 opacity-30 blur-xl"></div>
                                    
                                    {/* Middle glow */}
                                    <div className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-400 opacity-50 blur-lg"></div>
                                    
                                    {/* Sun body with subtle gradient */}
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 shadow-xl relative overflow-hidden">
                                        {/* Inner highlight */}
                                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-100 to-transparent opacity-60"></div>
                                    </div>
                                    
                                    {/* Subtle rays - properly centered and extended further */}
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute bg-gradient-to-r from-yellow-200 to-transparent rounded-full"
                                            style={{
                                                width: '3rem',
                                                height: '0.25rem',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transformOrigin: '0 50%',
                                                transform: `translate(-0%, -50%) rotate(${i * 45}deg) translateX(2.6rem)`,
                                                opacity: 0.6,
                                                filter: 'blur(0.3px)',
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {/* Moon - always present, rotating in elliptical orbit, behind clouds */}
                            <div 
                                className="absolute" 
                                style={{
                                    left: positions.moon.left,
                                    top: positions.moon.top,
                                    opacity: getMoonOpacity(),
                                    transform: `translate(-50%, -50%) scale(${positions.moon.scale})`
                                }}
                            >
                                <div className="w-28 h-28 rounded-full relative shadow-2xl overflow-hidden"
                                    style={{
                                        background: 'radial-gradient(ellipse at 30% 25%, #f3f4f6 20%, #d1d5db 60%, #6b7280 85%, #4b5563 100%)'
                                    }}
                                >
                                    {/* Moon craters */}
                                    <div className="absolute top-4 left-5 w-4 h-4 rounded-full bg-gray-400 opacity-40"></div>
                                    <div className="absolute top-8 right-4 w-3 h-3 rounded-full bg-gray-400 opacity-60"></div>
                                    <div className="absolute bottom-6 left-8 w-2 h-2 rounded-full bg-gray-400 opacity-50"></div>
                                    <div className="absolute top-12 left-3 w-1.5 h-1.5 rounded-full bg-gray-400 opacity-70"></div>
                                    <div className="absolute bottom-8 right-6 w-3.5 h-3.5 rounded-full bg-gray-400 opacity-30"></div>
                                    <div className="absolute top-16 right-8 w-2 h-2 rounded-full bg-gray-400 opacity-45"></div>
                                    <div className="absolute bottom-12 left-4 w-1 h-1 rounded-full bg-gray-400 opacity-65"></div>
                                </div>
                            </div>
                        </>
                    );
                })()}
                        
                {/* Clouds - in front of sun and moon */}
                <div 
                    className="absolute inset-0 transition-opacity duration-3000 ease-in-out"
                    style={{ opacity: getCloudOpacity() }}
                >
                    {(() => {
                        return (
                            <>
                                <CloudType1 x="8%" y="40%" scale={1.125} opacity={0.8} delay={0} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType2 x="25%" y="45%" scale={1.375} opacity={0.9} delay={0.3} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType3 x="45%" y="47%" scale={0.875} opacity={0.7} delay={0.7} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType4 x="65%" y="43%" scale={1.25} opacity={0.85} delay={1.1} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType1 x="80%" y="50%" scale={1.0} opacity={0.75} delay={1.4} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType2 x="15%" y="55%" scale={0.75} opacity={0.6} delay={0.6} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType3 x="35%" y="53%" scale={1.125} opacity={0.8} delay={0.9} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType4 x="55%" y="57%" scale={1.0} opacity={0.7} delay={1.2} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType1 x="75%" y="60%" scale={0.875} opacity={0.65} delay={1.8} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType2 x="5%" y="65%" scale={0.625} opacity={0.5} delay={0.2} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                                <CloudType3 x="90%" y="63%" scale={0.75} opacity={0.6} delay={1.5} lightingCx={lightingPosition.cxValue} lightingCy={lightingPosition.cyValue} />
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 px-6 py-6 h-full">
                <div className="flex items-center justify-between h-full">
                    <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">
                            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                                <span className="text-lg font-bold text-white">
                                    {employee?.firstname?.[0]}{employee?.surname?.[0]}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white mb-1">
                                {getGreeting()}, {employee?.firstname || 'Employee'}!
                            </h1>
                            <p className="text-white/90 text-base mb-2">{currentDate}</p>
                            <div className="flex items-center">
                                {getTimeIcon()}
                                <span className="text-white/90 text-lg font-medium">{currentTime}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="hidden md:flex flex-col items-end space-y-2">
                        <div className="text-white/80 text-sm">Status</div>
                        <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm font-medium">On Shift</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Testing component with minute-accurate slider
const WelcomeCardTester = ({ employee }) => {
    const [testTime, setTestTime] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playInterval, setPlayInterval] = useState(null);
    
    const formatTime = (timeValue) => {
        if (timeValue === null) return 'Real Time';
        const hours = Math.floor(timeValue);
        const minutes = Math.round((timeValue - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const getCurrentTimeValue = () => {
        if (testTime !== null) return testTime;
        const now = new Date();
        return now.getHours() + (now.getMinutes() / 60);
    };

    const startTimeAnimation = () => {
        if (playInterval) {
            clearInterval(playInterval);
        }
        
        setIsPlaying(true);
        // Start from current time (either test time or real time)
        let currentTime = testTime !== null ? testTime : (new Date().getHours() + (new Date().getMinutes() / 60));
        
        const interval = setInterval(() => {
            currentTime += 1/60; // Increment by 1 minute each update (1/60 of an hour)
            if (currentTime >= 24) {
                currentTime = 0; // Reset to midnight after 24 hours
            }
            setTestTime(currentTime);
        }, 25); // Update every 25ms for smooth animation (24 seconds total = 24000ms / 960 updates)
        
        setPlayInterval(interval);
    };

    const stopTimeAnimation = () => {
        if (playInterval) {
            clearInterval(playInterval);
            setPlayInterval(null);
        }
        setIsPlaying(false);
    };

    // Cleanup interval on unmount
    React.useEffect(() => {
        return () => {
            if (playInterval) {
                clearInterval(playInterval);
            }
        };
    }, [playInterval]);

    return (
        <div className="space-y-4">
            <WelcomeCard employee={employee} testTime={testTime} />
            
            {/* Testing Controls */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <span>🌙 Night</span>
                    <span className="font-medium text-lg">
                        {formatTime(testTime)}
                    </span>
                    <span>☀️ Day</span>
                </div>
                
                <div className="relative mb-4">
                    <input
                        type="range"
                        min="0"
                        max="24"
                        step="0.25" // 15-minute increments
                        value={getCurrentTimeValue()}
                        onChange={(e) => setTestTime(parseFloat(e.target.value))}
                        className="w-full h-3 bg-gradient-to-r from-indigo-900 via-yellow-400 to-indigo-900 rounded-full appearance-none cursor-pointer slider-time"
                    />
                    
                    {/* Time markers */}
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>24:00</span>
                    </div>
                </div>
                
                <div className="flex gap-2 justify-center">
                    <button 
                        onClick={isPlaying ? stopTimeAnimation : startTimeAnimation}
                        className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                            isPlaying 
                                ? 'bg-red-200 hover:bg-red-300 text-red-800' 
                                : 'bg-green-200 hover:bg-green-300 text-green-800'
                        }`}
                        title={isPlaying ? "Stop Time-lapse" : "Play 24h Time-lapse"}
                    >
                        {isPlaying ? '⏸️ Stop' : '▶️ Play 24h'}
                    </button>
                    <button 
                        onClick={() => setTestTime(6)} 
                        className="px-3 py-1 text-xs bg-orange-200 hover:bg-orange-300 rounded text-orange-800 transition-colors"
                        title="Sunrise"
                    >
                        🌅 Sunrise
                    </button>
                    <button 
                        onClick={() => setTestTime(12)} 
                        className="px-3 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded text-blue-800 transition-colors"
                        title="Noon"
                    >
                        ☀️ Noon
                    </button>
                    <button 
                        onClick={() => setTestTime(18)} 
                        className="px-3 py-1 text-xs bg-orange-200 hover:bg-orange-300 rounded text-orange-800 transition-colors"
                        title="Sunset"
                    >
                        🌅 Sunset
                    </button>
                    <button 
                        onClick={() => setTestTime(0)} 
                        className="px-3 py-1 text-xs bg-indigo-200 hover:bg-indigo-300 rounded text-indigo-800 transition-colors"
                        title="Midnight"
                    >
                        🌙 Midnight
                    </button>
                    <button 
                        onClick={() => {
                            // Stop any playing animation and return to real time
                            if (playInterval) {
                                clearInterval(playInterval);
                                setPlayInterval(null);
                            }
                            setIsPlaying(false);
                            setTestTime(null);
                        }} 
                        className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-800 transition-colors"
                        title="Use Real Time (Stop Animation)"
                    >
                        🕐 Real Time
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeCardTester;
export { WelcomeCard };
