import React from 'react';
import { motion, useTransform } from 'framer-motion';

const AlexandriteFace = ({ mouseX, mouseY, isFlipping, glareIntensity, colors }) => {
    return (
        <>
            {/* Color spectrum following mouse */}
            <motion.div
                className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
                style={{
                    background: useTransform([mouseX, mouseY], ([x, y]) => 
                        `radial-gradient(
                            circle at ${x * 100}% ${y * 100}%,
                            rgba(255, 0, 0, 0.4) 0%,        /* Red */
                            rgba(255, 165, 0, 0.35) 12%,    /* Orange */
                            rgba(255, 255, 0, 0.35) 24%,    /* Yellow */
                            rgba(0, 255, 0, 0.35) 36%,      /* Green */
                            rgba(0, 255, 255, 0.3) 48%,     /* Cyan */
                            rgba(0, 0, 255, 0.25) 60%,      /* Blue */
                            rgba(138, 43, 226, 0.2) 72%,    /* Purple */
                            transparent 85%
                        )`
                    ),
                    mixBlendMode: 'screen',
                }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                }}
            />
            
            {/* Sweeping shimmer */}
            <motion.div
                className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
                style={{
                    background: `linear-gradient(
                        135deg,
                        transparent 0%,
                        rgba(255, 255, 255, 0.3) 50%,
                        transparent 100%
                    )`,
                    backgroundSize: '200% 200%',
                }}
                animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
        </>
    );
};

export default AlexandriteFace;
