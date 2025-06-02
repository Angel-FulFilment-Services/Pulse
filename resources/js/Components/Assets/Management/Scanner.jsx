import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoIcon, CameraIcon } from '@heroicons/react/24/solid';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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

export default function Scanner({ handleScan, handleClose }) {
  const [cameraError, setCameraError] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
    if (codeReader.current) {
      // codeReader.current.reset();
      codeReader.current = null;
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
            stopCamera();
            handleScan(result.getText()); // Pass the scanned barcode to the parent // Stop the camera after a successful scan
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

  return (
    <div className="flex flex-col items-center gap-4 h-full justify-center w-full">
      <div className="mb-4 text-center w-full">
        {cameraError ? (
          <>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-red-600 dark:text-red-600 bg-red-100 dark:bg-red-200/20 ring ring-red-600/20 mb-6">
              <ExclamationTriangleIcon className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Unable to initialise camera</h1>
            <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
              Please check your camera permissions and try again... 
            </p>
            <button
              className="mt-4 px-4 py-2 rounded-md text-white bg-theme-500 hover:bg-theme-600 dark:bg-theme-600 dark:hover:bg-theme-500"  
              onClick={() => {
                handleScan(10)
              }}
            >
              Simulate Scan
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-gray-500 dark:text-dark-500 bg-gray-100 dark:bg-dark-800/20 ring ring-gray-600/20 dark:ring-dark-400/20 mb-6">
              <MagnifyingGlassIcon className="h-12 w-12" />
            </div>  
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Scan Barcode</h1>
            <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
              Align the barcode within the frame to scan.
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
          <div className="absolute top-1/2 left-0 w-full h-1 bg-theme-500 dark:bg-theme-600 transform -translate-y-1/2 pointer-events-none animate-pulse" />
        </div>
      )}
    </div>
  );
}