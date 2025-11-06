import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoIcon, CameraIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import useFetchAssets from '../../Fetches/Assets/useFetchAssets';
import SearchControl from '../../Controls/SearchControl';
import Modal from '../../Modals/Modal';
import AssetImportPreview from '../Imports/AssetImportPreview';
import { handleAssetImportPreview, executeAssetImport } from '../Imports/AssetImportHandlers';

// Simple spinner component
function Spinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
      <svg
          className="inline w-12 h-12 animate-spin fill-theme-500 dark:fill-theme-600 text-gray-200 dark:text-dark-700"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
    </div>
  );
}

export default function Scanner({ handleScan, handleClose, goTo }) {
  const [cameraError, setCameraError] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [isExecutingImport, setIsExecutingImport] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const fileInputRef = useRef(null);
  const [availableAssets, setAvailableAssets] = useState([]);

  const { assets } = useFetchAssets();

  useEffect(() => {
    const availableAssets = (assets || []).filter(
          asset => asset.value > '0'
    );
    setAvailableAssets(availableAssets);
  }, [assets]);

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
    if (codeReader.current) {
      codeReader.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop()); // Stop all tracks in the stream
      videoRef.current.srcObject = null;
    }
    
  }, []);

  const startCamera = useCallback(async () => {
    setIsCameraActive(true);
    setCameraError(false);
    setIsLoading(true);

    try {
      codeReader.current = new BrowserMultiFormatReader();
      const videoElement = videoRef.current;

      // Start decoding from the video stream
      await codeReader.current.decodeFromVideoDevice(
        null, // Automatically select the camera
        videoElement,
        (result, error) => {
          if (result) {
            handleScan(null, null, result.getText());
            codeReader.current.stop(); // Stop continuous decoding
            stopCamera(); // Pass the scanned barcode to the parent // Stop the camera after a successful scan
          }
          if (error) {
            console.warn(error); // Log errors (e.g., no barcode detected)
          }
        }
      );
    } catch (error) {
      console.error('Error starting the camera:', error);
      setCameraError(true);
      setIsCameraActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [handleScan, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await handleAssetImportPreview(
        file,
        (preview, processed) => {
          setPreviewData(preview);
          setProcessedData(processed);
          setShowImportModal(true);
        }
      );
    } catch (error) {
      console.error('Import preview failed:', error);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!processedData) return;

    setIsExecutingImport(true);
    try {
      await executeAssetImport(processedData);
      setShowImportModal(false);
      setPreviewData(null);
      setProcessedData(null);
    } catch (error) {
      console.error('Import execution failed:', error);
    } finally {
      setIsExecutingImport(false);
    }
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setPreviewData(null);
    setProcessedData(null);
    setIsExecutingImport(false);
  };

  return (
    <div className={`flex flex-col items-center gap-4 h-full justify-center w-full ${!cameraError && 'items-center'}`}>
      <div className="mb-4 text-center w-full">
        {cameraError ? (
          <>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-red-600 dark:text-red-600 bg-red-100 dark:bg-red-200/20 ring ring-red-600/20 mb-6 mt-8">
              <ExclamationTriangleIcon className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Unable to initialise camera</h1>
            <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
              Please check your camera permissions and try again... 
            </p>
            <p className="text-base text-gray-600 dark:text-dark-400">
              Or you can search for an asset below.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-gray-500 dark:text-dark-500 bg-gray-100 dark:bg-dark-800/20 ring ring-gray-600/20 dark:ring-dark-400/20 mb-6">
              <MagnifyingGlassIcon className="h-12 w-12" />
            </div>  
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Scan Barcode</h1>
            <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
              Align the barcode within the frame to scan or search below.
            </p>
          </>
        )}
      </div>

      {isLoading && <Spinner />}

      {!cameraError && (
        <div className="relative w-96 h-48">
          <video
            ref={videoRef}
            className="w-96 h-48 object-cover border-4 border-theme-500 dark:border-theme-600 rounded-md"
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            controls={false}
          />
          <div className="absolute top-1/2 left-0 w-full h-1 bg-theme-500 dark:bg-theme-600 transform -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      {/* Search functionality - now always visible */}
      <div className="w-full mt-6 flex flex-col gap-y-4 items-center justify-center">
        <SearchControl
          items={availableAssets}
          placeholder="Start typing to search for an asset..."
          width='w-96'
          onSelectChange={(item) => {
            if (!item) return;
            handleScan(null, null, item);
          }}
        />  
        <div className="flex items-center space-x-3 ">
          <button
            className={`px-4 py-2 rounded-md text-white flex items-center justify-center shrink-0 h-10 disabled:cursor-not-allowed bg-theme-500 hover:bg-theme-600 dark:bg-theme-600 dark:hover:bg-theme-500`}
            onClick={() => goTo({ type: 'create', assetId: null })}
          >
            Create Asset
          </button>
          <button
            className={`px-2 py-2 rounded-md text-gray-700 dark:text-dark-300 bg-gray-100 shrink-0 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 flex items-center justify-center gap-x-2 h-10 w-10 disabled:cursor-not-allowed border border-gray-300 dark:border-dark-600`}
            onClick={handleImportClick}
            title="Import Assets from CSV"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Import Preview Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={handleCancelImport}
        size="3xl"
        fullHeight={true}
        closeOnClickOutside={!isExecutingImport}
        showCloseButton={false}
      >
        <AssetImportPreview
          previewData={previewData}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
          isExecuting={isExecutingImport}
        />
      </Modal>
    </div>
  );
}