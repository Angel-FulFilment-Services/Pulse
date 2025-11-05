import React, { useState, useEffect } from 'react';

export default function PrinterStatus() {
    const [printerData, setPrinterData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Use EventSource for Server-Sent Events (doesn't block browser connections)
        const eventSource = new EventSource('/proxy/3d-printer/status-stream');

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
                setError('Failed to parse printer status');
                setLoading(false);
            }
        };

        eventSource.onerror = (err) => {
            console.error('EventSource error:', err);
            setError('Connection to printer lost');
            setLoading(false);
        };

        // Cleanup on unmount
        return () => {
            eventSource.close();
        };
    }, []);

    if (loading) {
        return (
            <div className="relative w-full h-full">
                {/* Loading overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative w-full h-full">
                {/* Error overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 border-t-2 border-red-800 p-4">
                    <p className="text-white text-center text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!printerData) return null;

    const { general, temperature, progress } = printerData;
    const percentage = progress?.bytes?.percentage || 0;

    return (
        <div className="relative w-full h-full flex justify-center items-center">
            {/* Camera feed in background - Using img tag for MJPEG stream */}
            <img 
                src="/proxy/3d-printer/camera"
                className="w-full h-full object-cover border-0"
                alt="3D Printer Camera"
                onLoad={() => console.log('Camera stream started')}
                onError={(e) => console.error('Camera stream error:', e)}
            />
            
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
