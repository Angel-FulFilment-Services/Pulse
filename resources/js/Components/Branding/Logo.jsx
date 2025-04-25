import React from 'react';

export default function Logo () {
    return (
        <div className="flex flex-row justify-center items-center gap-2 pb-10">   
            <img src="/images/logo3.webp" className="w-12 h-12"></img>
            <svg
                viewBox="0 0 200 40"
                width="200"
                height="40"
                className="overflow-visible"
            >
                <path
                    d="
                        M0,20 
                        L10,20 
                        L15,10 
                        L18,30 
                        L23,2  
                        L28,38 
                        L33,15 
                        L39,20 
                        L50,20
                    "
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2.5"
                    className="ekg-path"
                />
            </svg>
            <h2 className='font-bold text-gray-600 leading-7 text-2xl'>Pulse</h2>
        </div>
      );
}