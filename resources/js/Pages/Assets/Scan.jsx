import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Logo from '../../Components/Branding/Logo';
import Scanner from '../../Components/Assets/Management/Scanner';

export default function Scan() {
  const findAsset = (assetId) => {
    if (!assetId) {
      toast.error('No asset found with this ID.');
      return;
    }

    if (assetId){
      toast.success(`${assetId}`);
    }

    // window.location.href = `/assets/${assetId}`;
  };


  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-800 gap-y-8">
        <div className="flex flex-col items-center justify-center scale-150 mb-10">
            <Logo/>
        </div>

        <div className="w-full max-w-2xl p-6 bg-white dark:bg-dark-900 rounded-lg shadow-lg">
          <Scanner
            handleScan={(assetId) => findAsset(assetId)}
          />
        </div>
    </div>
  );
}