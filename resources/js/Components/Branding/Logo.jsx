import React from 'react';

export default function Logo () {
    return (
        <div className="flex flex-row justify-center items-center gap-2 pb-10">   
            <img src="/images/logo.webp" className="w-6 h-12"></img>
            <h2 className='font-bold text-gray-600 leading-7 text-2xl'>DNA</h2>
        </div>
      );
}