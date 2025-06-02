import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Scanner from './Scanner';
import { Bouncy } from 'ldrs/react'
import 'ldrs/react/Bouncy.css'
import { ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function Find({ handleClose }) {

  const [isProcessing, setIsProcessing] = useState(false);
  const [asset, setAsset] = useState(null);
  const [assetFound, setAssetFound] = useState(null);

  const find = async (assetId) => {
    setAssetFound(null);
    setIsProcessing(true);

    try {
        const response = await axios.get('/asset-management/assets/find', {
            params: { afs_id: assetId },
        });

        setIsProcessing(false);
        setAsset(response.data.asset);
        setAssetFound(true);
    } catch (error) {
        console.log(error.status);

        if (error.response && error.response.status === 404) {
            setIsProcessing(false);
            setAssetFound(false);
            setAsset(null);
            return;
        }       

        console.error(error);
        toast.error('Something went wrong while searching for asset, please try again.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
        });
        setIsProcessing(false);
        setAsset(null);
        setAssetFound(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 h-full justify-center w-full">
        {isProcessing ? ( 
            <div className="flex flex-col items-center gap-4 h-full justify-center w-full">
                <div className="mb-4 text-center w-full">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-theme-600 dark:text-theme-600 bg-theme-100 dark:bg-theme-200/20 mb-3 pt-4">
                        <Bouncy size="50" color="rgb(var(--theme-600) / 1)"/>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Finding Asset
                        <span className="text-2xl font-bold ml-1">
                            <span className="inline-block animate-dot-squence">.</span>
                            <span className="inline-block animation-delay-200 animate-dot-squence">.</span>
                            <span className="inline-block animation-delay-500 animate-dot-squence">.</span>
                        </span>
                    </h1>
                    <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
                    Please wait while we search for this asset... 
                    </p>
                </div>
            </div> 
        ) : 
            assetFound ? (
                <div className="flex flex-col items-center gap-2 h-full justify-center w-full max-w-fit">
                    <div className="mb-2 text-center w-full">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-green-600 dark:text-green-600 bg-green-100 dark:bg-green-200/20 ring ring-green-600/20 mb-6">
                            <CheckIcon className="h-12 w-12" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Asset Found</h1>
                        <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
                            Asset ID: {asset.id}
                        </p>
                    </div>
                </div>
            ) : assetFound === false ? (
                <div className="flex flex-col items-center gap-2 h-full justify-center w-full max-w-fit">
                    <div className="mb-2 text-center w-full">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-red-600 dark:text-red-600 bg-red-100 dark:bg-red-200/20 ring ring-red-600/20 mb-6">
                            <ExclamationTriangleIcon className="h-12 w-12" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Asset Not Found</h1>
                        <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
                            We could not locate an asset with this ID.
                        </p>
                    </div>
                    <div className="flex justify-between gap-4 w-full mt-2">
                        <button
                            type="button"
                            className="text-sm font-semibold text-gray-900 dark:text-dark-100"
                            onClick={() => {
                                setAssetFound(null);
                                setIsProcessing(false);
                                setAsset(null);
                            }}
                        >
                            Scan Again
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md text-white flex items-center justify-center w-32 h-10 disabled:cursor-not-allowed bg-theme-500 hover:bg-theme-600 dark:bg-theme-600 dark:hover:bg-theme-500`}
                            onClick={() => {}}
                        >
                            Create Asset
                        </button>
                    </div>
                </div>
            ) : null
        }

        { (assetFound == null && !isProcessing) && (
            <>
                <Scanner handleScan={(assetId) => find(assetId)}/>    
        
                <div className="flex justify-end gap-4 w-full mt-4">
                    <button
                        type="button"
                        className="text-sm font-semibold text-gray-900 dark:text-dark-100 rounded-md"
                        onClick={handleClose}
                    >
                    Cancel
                    </button>
                </div>
            </>
            )
        }
    </div>
  );
}