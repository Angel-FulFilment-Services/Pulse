import React, { useState, useEffect, useRef } from 'react';
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'

export default function PrinterStatus() {
    const [printerData, setPrinterData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cameraError, setCameraError] = useState(false);
    const [cameraKey, setCameraKey] = useState(0);
    
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const cameraRetryTimeoutRef = useRef(null);
    const isMountedRef = useRef(true);

    // EventSource connection with auto-reconnect
    useEffect(() => {
        isMountedRef.current = true;

        const connectEventSource = () => {
            if (!isMountedRef.current) return;

            console.log('Connecting to printer status stream...');
            const eventSource = new EventSource('/proxy/3d-printer/status-stream');
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('Printer status stream connected');
                setError(null);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.error) {
                        setError(data.error);
                    } else {
                        setPrinterData(data);
                        setError(null);
                    }
                    setLoading(false);
                } catch (err) {
                    console.error('Failed to parse printer status:', err);
                    setError('Failed to parse printer status');
                    setLoading(false);
                }
            };

            eventSource.onerror = (err) => {
                console.error('EventSource error:', err);
                setError('Connection to printer lost');
                setLoading(false);
                
                // Close the failed connection
                eventSource.close();
                
                // Attempt to reconnect after 5 seconds
                if (isMountedRef.current) {
                    console.log('Attempting to reconnect in 5 seconds...');
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectEventSource();
                    }, 5000);
                }
            };
        };

        connectEventSource();

        // Handle page refresh/navigation - close connections immediately
        const handleBeforeUnload = () => {
            isMountedRef.current = false;
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (cameraRetryTimeoutRef.current) {
                clearTimeout(cameraRetryTimeoutRef.current);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup on unmount
        return () => {
            isMountedRef.current = false;
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (cameraRetryTimeoutRef.current) {
                clearTimeout(cameraRetryTimeoutRef.current);
            }
        };
    }, []);

    // Handle camera stream errors with retry logic
    const handleCameraError = () => {
        console.error('Camera stream error - attempting to reload...');
        setCameraError(true);
        
        // Retry after 3 seconds by forcing a reload with a new key
        if (isMountedRef.current) {
            cameraRetryTimeoutRef.current = setTimeout(() => {
                console.log('Retrying camera connection...');
                setCameraKey(prev => prev + 1);
                setCameraError(false);
            }, 3000);
        }
    };

    const handleCameraLoad = () => {
        console.log('Camera stream started');
        setCameraError(false);
    };

    if (loading) {
        return (
            <div className="relative w-full h-full">
                {/* Loading overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Ring size="48" color="white" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative w-full h-full">
                {/* Keep showing camera even if printer status is lost */}
                <img 
                    key={cameraKey}
                    src={`/proxy/3d-printer/camera?t=${cameraKey}`}
                    className="w-full h-full object-cover border-0"
                    alt="3D Printer Camera"
                    onLoad={handleCameraLoad}
                    onError={handleCameraError}
                />
                
                {/* Camera error indicator */}
                {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <div className="text-center">
                            <div className="flex justify-center mb-3">
                                <Ring size="48" color="white" />
                            </div>
                            <p className="text-white text-sm">Reconnecting camera...</p>
                        </div>
                    </div>
                )}
                
                {/* Error overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 border-t-2 border-red-800 p-4">
                    <div className="flex items-center justify-center gap-2">
                        <Ring size="16" color="white" stroke="2" />
                        <p className="text-white text-center text-sm">{error} - Reconnecting...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!printerData) return null;

    const { general, temperature, progress, time } = printerData;
    const percentage = progress?.bytes?.percentage || 0;

    return (
        <div className="relative w-full h-full flex justify-center items-center">
            {/* Camera feed in background - Using img tag for MJPEG stream */}
            <img 
                key={cameraKey}
                src={`/proxy/3d-printer/camera?t=${cameraKey}`}
                className="w-full h-full object-cover border-0"
                alt="3D Printer Camera"
                onLoad={handleCameraLoad}
                onError={handleCameraError}
            />
            
            {/* Camera error indicator */}
            {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center">
                        <div className="flex justify-center mb-3">
                            <Ring size="48" color="white" />
                        </div>
                        <p className="text-white text-sm">Reconnecting camera...</p>
                    </div>
                </div>
            )}
            
            {/* Status overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-white backdrop-blur-sm text-gray-900 p-4 space-y-4">
                {/* Header Info */}
                <div className="flex flex-row justify-between gap-3 text-xs">
                    {/* Machine Status */}
                    <div className="space-y-1">
                        <p className="text-gray-500">Status</p>
                        <p className="font-semibold">
                            {general?.machine_status?.charAt(0).toUpperCase() + general?.machine_status?.slice(1).toLowerCase() || 'Unknown'}
                        </p>
                    </div>

                    {/* Layer Progress */}
                    <div className="space-y-1">
                        <p className="text-gray-500">Layer</p>
                        <p className="font-semibold">
                            {progress?.layers?.current || 0} / {progress?.layers?.total || 0}
                        </p>
                    </div>

                    {/* Bed Temperature */}
                    <div className="space-y-1">
                        <p className="text-gray-500">Bed</p>
                        <p className="font-semibold">
                            {temperature?.bed?.current?.toFixed(1) || 0}°C / {temperature?.bed?.target?.toFixed(1) || 0}°C
                        </p>
                    </div>

                    {/* Extruder Temperature */}
                    <div className="space-y-1">
                        <p className="text-gray-500">Extruder</p>
                        <p className="font-semibold">
                            {temperature?.extruder_0?.current?.toFixed(1) || 0}°C / {temperature?.extruder_0?.target?.toFixed(1) || 0}°C
                        </p>
                    </div>

                    {/* Current File */}
                    <div className="space-y-1">
                        <p className="text-gray-500">File</p>
                        <p className="font-semibold truncate" title={general?.current_file || 'No file'}>
                            {general?.current_file || 'No file'}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                        <p className="text-gray-600">Progress</p>
                        <p className="font-semibold">
                            {percentage.toFixed(0)}%
                        </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-theme-500 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
