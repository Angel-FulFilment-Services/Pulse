import React, { useId } from 'react';

export default function Logo({ includeTitle = true, error = false }) {
    const uniqueId = useId(); // Generate a unique ID for each instance of the Logo component

    return (
        <div className="flex flex-row shrink-0 justify-center items-center gap-x-2">
            <div className="flex flex-col justify-center items-center min-w-16 min-h-16">
                {/* Donut SVG */}
                <svg
                    viewBox="0 0 40 40"
                    className="z-10 w-14 h-14 block ring-4 ring-orange-50 rounded-full shadow-lg"
                >
                    <defs>
                        <linearGradient id={`orange-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(253, 186, 116)" /> {/* Tailwind orange-300 */}
                            <stop offset="100%" stopColor="rgb(249, 115, 22)" /> {/* Tailwind orange-500 */}
                        </linearGradient>

                        {/* Define the clipping path */}
                        <clipPath id={`donut-clip-${uniqueId}`}>
                            <circle cx="20" cy="20" r="24" /> {/* Inner radius of the donut */}
                        </clipPath>
                    </defs>
                    <circle
                        cx="20"
                        cy="20"
                        r="19"
                        fill="none"
                        stroke={`url(#orange-gradient-${uniqueId})`} // Use the unique gradient ID
                        strokeWidth="15"
                    />
                </svg>

                <div className="absolute w-10 h-10 rounded-full flex items-center justify-center bg-orange-50" />

                {/* Inner Line SVG */}
                <svg
                    viewBox="0 0 40 40" /* Adjusted viewBox to match the line's length */
                    className="overflow-visible block shrink-0 absolute w-7 h-7 mt-0.5"
                >
                    <defs>
                        <linearGradient id={`orange-gradient-line-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(253, 186, 116)" />
                            <stop offset="100%" stopColor="rgb(249, 115, 22)" />
                        </linearGradient>
                    </defs>
                    <g clipPath={`url(#donut-clip-${uniqueId})`}> {/* Use the unique clipPath ID */}
                        { error ? (
                            <path
                                d="
                                    M0,20 
                                    L58,20 
                                    L61,20 
                                    L65,15 
                                    L69,25  
                                    L74,10 
                                    L79,20 
                                    L82,20 
                                    L83,20
                                    L98,20
                                "
                                fill="none"
                                stroke={`url(#orange-gradient-line-${uniqueId})`} // Use the unique gradient ID
                                strokeWidth={3.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                shapeRendering="geometricPrecision"
                                className="ekg-path"
                            />
                        ) : (                            
                            <g clipPath={`url(#donut-clip-${uniqueId})`}> {/* Use the unique clipPath ID */}
                                <path
                                    d="
                                        M0,20 
                                        L58,20 
                                        L61,13 
                                        L64,25 
                                        L69,5  
                                        L74,33 
                                        L79,15 
                                        L81,20 
                                        L80,20
                                        L98,20
                                    "
                                    fill="none"
                                    stroke={`url(#orange-gradient-line-${uniqueId})`} // Use the unique gradient ID
                                    strokeWidth={3.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    shapeRendering="geometricPrecision"
                                    className="ekg-path"
                                />
                            </g>
                        )}
                    </g>
                </svg>
            </div>
            { includeTitle && ( 
                <h2 className="font-bold text-gray-600 leading-7 text-3xl">Pulse</h2>
                )
            }
        </div>
    );
}