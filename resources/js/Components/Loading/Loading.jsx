import React from 'react';
import { DNA } from 'react-loader-spinner'

function Loading() {
  return (
    <div className="loading flex flex-row h-screen" style={{background: "linear-gradient(-45deg, rgba(236,159,126,1) 10%, rgba(241,175,131,1) 55%, rgba(240,179,136,1) 100%)"}}>
        <div className="self-center w-1/2 h-screen flex flex-col items-center justify-center">
            <div>
                {/* <h1 className='font-bold text-4xl text-white font-mono'>Helix</h1> */}
            </div>
            <img src="/images/DNA.webp" className=" w-[35em] h-[35em]"></img>
        </div>
        <div className="w-1/2 h-screen flex flex-col items-center justify-center">
            <div className='flex flex-col items-center justify-center w-4/5 h-4/5 rounded-xl shadow-2xl' style={{background: "rgba(0,0,0,0.3)"}}>
                <DNA
                    visible={true}
                    height="120"
                    width="120"
                    ariaLabel="dna-loading"
                    wrapperStyle={{}}
                    wrapperClass="dna-wrapper"
                />
            </div>
        </div>
    </div>
  );
}

export default Loading;