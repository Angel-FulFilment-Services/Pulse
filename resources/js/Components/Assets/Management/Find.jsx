import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Scanner from './Scanner';
import { Bouncy } from 'ldrs/react'
import 'ldrs/react/Bouncy.css'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Create from './Create';
import Asset from './Asset';
import Pat from './Pat';
import Kit from './Kit';

export default function Find({ handleClose }) {
  const [pages, setPages] = useState([{ type: 'scanner' }]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to go to a new page (push)
  const goTo = (page) => setPages(prev => [...prev, page]);
  // Helper to go back (pop)
  const goBack = () => setPages(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  // Add this function inside your component
  const updatePageAsset = (assetId, data) => {
      setPages(prevPages =>
          prevPages.map(page =>
          page.type === 'asset' && page.assetId === assetId
              ? { ...page, asset: data }
              : page
          )
      );
   };

  // Add this function inside your component
  const updatePageKit = (kitId, data) => {
      setPages(prevPages =>
          prevPages.map(page =>
          page.type === 'kit' && page.kitId === kitId
              ? { ...page, kit: data }
              : page
          )
      );
   };

  // Get the current page
  const currentPage = pages[pages.length - 1];

  const asset = async (id = null, refresh = false) => {
    if(!refresh)
        setIsProcessing(true);

    let assetId = id;

    if (!assetId) {
        const currentAssetPage = pages.find(p => p.type === 'asset');
        assetId = currentAssetPage?.assetId;
    }

    try {
      const response = await axios.get('/asset-management/assets/load', {
        params: { afs_id: assetId },
      });

      if(refresh){
        updatePageAsset(assetId, response.data);
      } else {
        goTo({ type: 'asset', asset: response.data, assetId });
        setIsProcessing(false);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        if(!refresh)
            setIsProcessing(false);
        
        goTo({ type: 'notfound', assetId });
        return;
      }
      toast.error('Something went wrong while loading asset, please try again.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    }
  };

  const kit = async (id = null, refresh) => {
    if(!refresh)
        setIsProcessing(true);
    
    let kitId = id;

    if (!kitId) {
        const currentKitPage = pages.find(p => p.type === 'kit');
        kitId = currentKitPage?.kitId;
    }

    try {
      const response = await axios.get('/asset-management/kits/load', {
        params: { kit_id: kitId },
      });

      if(refresh){
        updatePageKit(kitId, response.data);
      } else {
        goTo({ type: 'kit', kit: response.data, kitId });
        setIsProcessing(false);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        if(!refresh)
            setIsProcessing(false);

        goTo({ type: 'notfound', kitId });
        return;
      }
      toast.error('Something went wrong while loading kit, please try again.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    }
  };

  // Render logic for each page type
  function renderPage(page) {
    switch (page.type) {
      case 'scanner':
        return (
        <>
            {isProcessing ? (
                <div className="flex flex-col items-center gap-4 h-full justify-center w-full">
                    <div className="mb-4 text-center w-full -mt-14">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-theme-600 dark:text-theme-600 bg-theme-100 dark:bg-theme-200/20 ring ring-theme-600/20 mb-6 pt-4">
                            <Bouncy size="50" color="rgb(var(--theme-600) / 1)" />
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
            ) : (
                <>
                    <Scanner handleScan={asset} />
                </>
            )}
        </>
        );
      case 'asset':
        return (
          <Asset
            data={page.asset}
            assetId={page.assetId}
            changeAsset={(newId) => {
                asset(newId);
            }}
            changeKit={(kitId) => {
                kit(kitId);
            }}
            refreshAsset={() => {
                asset(page.assetId, true);
            }}
            refreshKit={() => {
                kit(page.kitId, true);
            }}
            goTo={goTo}
            goBack={goBack}
            onCancel={goBack}
          />
        );
    case 'notfound':
        return (
          <div className="flex flex-col items-center gap-2 h-full justify-center w-full max-w-fit -mt-2">
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
                onClick={goBack}
              >
                Scan Again
              </button>
              <button
                className={`px-4 py-2 rounded-md text-white flex items-center justify-center w-32 h-10 disabled:cursor-not-allowed bg-theme-500 hover:bg-theme-600 dark:bg-theme-600 dark:hover:bg-theme-500`}
                onClick={() => goTo({ type: 'create', assetId: page.assetId })}
              >
                Create Asset
              </button>
            </div>
          </div>
        );
      case 'kit':
        return (
            <Kit
                data={page.kit}
                kitId={page.kitId}
                changeAsset={(newId) => {
                    asset(newId);
                }}    
                refreshAsset={() => {
                    asset(page.assetId, true);
                }}
                refreshKit={() => {
                    kit(page.kitId, true);
                }}
                goTo={goTo}
                goBack={goBack}
                onCancel={goBack}
            />
        );
      case 'create':
        return (
          <Create
            onCancel={goBack}
            assetId={page.assetId}
          />
        );
      case 'pat':
        return (
            <Pat
                onCancel={goBack}
                assetId={page.assetId}
                refreshAsset={() => {
                    asset(page.assetId, true);
                }}
            />
        )
      default:
        return null;
    }
  }

  // Replace Scanner's handleScan with wrappedFind
  return (
    <div className="flex flex-col items-center gap-4 justify-center w-full px-6 py-6 h-full pt-8 lg:pt-0 pb-14 lg:pb-4">
        <div className="flex justify-start items-center w-full pt-4">
            { pages.length > 1 && (
            <button
                type="button"
                className="text-sm font-semibold text-gray-900 dark:text-dark-100"
                onClick={goBack}
            >
                <span className="pr-2" aria-hidden="true">&larr;</span>
                Back
            </button>
            )}
        </div>
      {renderPage(currentPage)}
    </div>
  );
}