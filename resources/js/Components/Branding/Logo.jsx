import React, { useRef } from 'react';

export default function Logo() {
    const pathRef = useRef(null);

    return (
        <div className="flex flex-row shrink-0 justify-center items-center gap-3">
            <div className="flex flex-col shrink-0 justify-center items-center h-16 w-16">
                {/* Donut SVG */}
                <svg
                    viewBox="0 0 40 40"
                    width="65"
                    height="65"
                    className="z-10"
                >
                    <defs>
                        <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(253, 186, 116)" /> {/* Tailwind orange-300 */}
                            <stop offset="100%" stopColor="rgb(249, 115, 22)" /> {/* Tailwind orange-500 */}
                        </linearGradient>

                        {/* Define the clipping path */}
                        <clipPath id="donut-clip">
                            <circle cx="20" cy="20" r="23.4" /> {/* Inner radius of the donut */}
                        </clipPath>
                    </defs>
                    <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="url(#orange-gradient)" // Apply the gradient
                        strokeWidth="8"
                        className=""
                    />
                </svg>

                {/* Inner Line SVG */}
                <svg
                    viewBox="0 0 40 40" /* Adjusted viewBox to match the line's length */
                    width="35"
                    height="35"
                    className="overflow-visible absolute"
                >
                    <defs>
                        <linearGradient id="orange-gradient-line" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(253, 186, 116)" />
                            <stop offset="100%" stopColor="rgb(249, 115, 22)" />
                        </linearGradient>
                    </defs>
                    {/*  */}
                    <g clipPath="url(#donut-clip)"> {/* Group with clipping applied */}
                        <path
                            ref={pathRef} // Attach the ref to the path
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
                            stroke="url(#orange-gradient-line)" // Apply the gradient
                            strokeWidth={3.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ekg-path"
                        />
                    </g>
                </svg>
            </div>
            <h2 className="font-bold text-gray-600 leading-7 text-3xl">Pulse</h2>
        </div>
    );
}