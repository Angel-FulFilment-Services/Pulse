import React, { useState, useEffect } from 'react';
import '../../../css/Authentication/ui.css'

export default function Hero () {
  const [hideDiv, setHideDiv] = useState(false);

  useEffect(() => {
      function handleResize() {
        const { innerWidth, innerHeight } = window;
        const landscapeRatio = innerWidth / innerHeight;
        
        if (innerHeight < 600 || landscapeRatio < 1) { // Adjust the threshold and ratio as needed
            setHideDiv(true);
        } else {
            setHideDiv(false);
        }
      }

      window.addEventListener('resize', handleResize);

      return () => {
          window.removeEventListener('resize', handleResize);
      };
  }, []);

  return (
    <div className='absolute h-screen w-full hidden lg:flex lg:flex-row'>
      <div className="self-center w-full flex flex-col items-center justify-center h-full">
        <div className='flex-row flex w-full h-full overflow-hidden'>
          <div className="w-full flex flex-col">
            <div className={`h-1/4 opacity-5 self-end pt-10 pr-20 items-start flex z-20 ${hideDiv ? 'hidden' : ''}`}>
              <img src="/images/polka-dot2.png" className="h-[130%] select-none"></img>
            </div>
            <div className={`h-2/4 ${hideDiv ? 'hidden' : ''}`}>
            </div>
            <div className={`h-1/4 opacity-25 animate-float pl-20 pb-5 flex items-end z-20 ${hideDiv ? 'hidden' : ''}`}>
              <img src="/images/horizontal-bar1.png" className="h-[90%] select-none"></img>
            </div>
          </div>

          <div className="w-full flex flex-col">
            <div className={`h-2/6 opacity-25 animate-float animation-delay-75 self-end items-start flex pr-10 z-20  ${hideDiv ? 'hidden' : ''}`}>
              <img src="/images/horizontal-bar2.png" className="h-[70%] select-none pt-7"></img>
            </div>
            <div className={`h-4/6 opacity-5 -rotate-45 flex items-cetner self-end lg:pr-10 xl:pr-24 2xl:pr-32 z-20  ${hideDiv ? 'hidden' : ''}`}>
              <img src="/images/polka-dot1.png" className="h-[80%] select-none"></img>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
}