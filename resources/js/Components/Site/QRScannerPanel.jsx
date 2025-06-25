import React, { useRef, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function QRScannerPanel({ handleScan }) {
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  const stopCamera = useCallback(() => {
    if (codeReader.current) {
      codeReader.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      codeReader.current = new BrowserMultiFormatReader();
      const videoElement = videoRef.current;
      await codeReader.current.decodeFromVideoDevice(
        null,
        videoElement,
        (result, error) => {
          if (result) {
            console.log('QR Code detected:', result.getText());
            handleScan(result.getText());
            // codeReader.current.stop();
            // stopCamera();
          }
        }
      );
    } catch (error) {
      // Optionally handle camera errors here
    }
  }, [handleScan, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      <video
        ref={videoRef}
        className="h-full w-full object-cover rounded-[3rem] shadow-2xl"
        autoPlay
        muted
        playsInline
        disablePictureInPicture
        controls={false}
      />
        <div className="absolute bottom-10 left pointer-events-none" >
            <p className="text-3xl font-medium text-white font-sans">
                Show your QR code here
            </p>
        </div>
    </div>
  );
}