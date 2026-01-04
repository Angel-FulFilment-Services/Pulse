import React, { useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';

const AlexandriteFace = React.memo(({ mouseX, mouseY, isFlipping, glareIntensity, colors, embossingContent, isUnearned }) => {
    // Memoize the color spectrum gradient transform
    const spectrumBackground = useTransform([mouseX, mouseY], ([x, y]) => 
        `radial-gradient(
            circle at ${x * 100}% ${y * 100}%,
            rgba(255, 0, 0, 0.4) 0%,
            rgba(255, 165, 0, 0.35) 12%,
            rgba(255, 255, 0, 0.35) 24%,
            rgba(0, 255, 0, 0.35) 36%,
            rgba(0, 255, 255, 0.3) 48%,
            rgba(0, 0, 255, 0.25) 60%,
            rgba(138, 43, 226, 0.2) 72%,
            transparent 85%
        )`
    );
    
    return (
        <>
            {/* Embossed icon/image behind the color spectrum */}
            {embossingContent}
            
            {/* Color spectrum following mouse */}
            <motion.div
                className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
                style={{
                    background: spectrumBackground,
                    mixBlendMode: 'screen',
                    zIndex: 30,
                    willChange: 'background',
                }}
            />
            
            {/* Sweeping shimmer - use CSS animation for better performance */}
            {!isUnearned && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
                    style={{
                        background: `linear-gradient(
                            135deg,
                            transparent 0%,
                            rgba(255, 255, 255, 0.3) 50%,
                            transparent 100%
                        )`,
                        backgroundSize: '200% 200%',
                        zIndex: 35,
                        animation: 'alexandriteShimmer 3s linear infinite',
                    }}
                />
            )}
            
            {/* CSS animation keyframes */}
            <style>{`
                @keyframes alexandriteShimmer {
                    0% { background-position: 0% 0%; }
                    50% { background-position: 100% 100%; }
                    100% { background-position: 0% 0%; }
                }
            `}</style>
        </>
    );
});

AlexandriteFace.displayName = 'AlexandriteFace';

export default AlexandriteFace;
