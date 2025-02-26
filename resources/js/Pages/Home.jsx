import React, { useState, useEffect } from 'react';
import Loading from '../Components/Loading/Loading.jsx';

const Test = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for 2 seconds
        setTimeout(() => {
          setIsLoading(false);
        }, 10000000);
      }, []);


      if(isLoading){
        return (
            <Loading />
        )
      }

      return (
        <div className="App" style={{opacity: 10}}>
            <div className="bg-white flex flex-col justify-center h-screen items-center">
                <a href="/holiday" className="border-gray-200 w-20 h-10 border rounded-md bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                  <p className="text-center align-middle">
                    Holiday 
                  </p>
                </a>
            </div>
        </div>
      );
}

export default Test