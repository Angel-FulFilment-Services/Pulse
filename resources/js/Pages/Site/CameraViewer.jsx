import React, { useRef, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { Zoomies } from 'ldrs/react'
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid'
import 'ldrs/react/Zoomies.css'
import Peer from 'peerjs';

export default function CameraViewer() {
    const videoRef = useRef(null);
    const [connecting, setConnecting] = useState(true);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        console.log('� CAMERA VIEWER STARTING - RECEIVE ONLY MODE');
        
        const connectToStream = async () => {
            try {
                console.log('📺 VIEWER: Connecting with PeerJS');
                
                // Create peer for viewer
                const peer = new Peer();
                
                peer.on('open', async (id) => {
                    console.log('📡 VIEWER: Peer opened with ID:', id);
                    
                    // Wait a moment for peer to be fully ready
                    setTimeout(() => {
                        console.log('📡 VIEWER: Starting to poll for QR Scanner...');
                        startPolling();
                    }, 1000);
                });
                
                const startPolling = () => {
                    // Poll for QR Scanner's peer ID
                    const pollForPeerId = async () => {
                        try {
                            // Check if our peer is still connected
                            if (peer.destroyed) {
                                console.log('❌ VIEWER: Peer destroyed, stopping poll');
                                return false;
                            }
                            
                            const response = await fetch('/api/camera/get-stream-offer?streamId=qr-scanner-stream');
                            const data = await response.json();
                            
                            if (data.offer && data.offer.peerId) {
                                console.log('🎯 VIEWER: Found QR Scanner peer ID:', data.offer.peerId);
                                console.log('📡 VIEWER: Peer state:', {
                                    id: peer.id,
                                    destroyed: peer.destroyed,
                                    disconnected: peer.disconnected,
                                    open: peer.open
                                });
                                
                                // Ensure our peer is fully connected before calling
                                if (!peer.open) {
                                    console.log('❌ VIEWER: Peer not open yet, waiting...');
                                    return false;
                                }
                                
                                // Call the QR Scanner - try with empty stream first
                                let call;
                                console.log('📞 VIEWER: Creating call to peer:', data.offer.peerId);
                                
                                // Try with empty stream first (simpler approach)
                                call = peer.call(data.offer.peerId, new MediaStream());
                                
                                if (!call) {
                                    console.error('❌ VIEWER: Failed to create call - peer.call returned undefined');
                                    return false;
                                }
                                
                                console.log('📞 VIEWER: Call created successfully');
                                
                                call.on('stream', (remoteStream) => {
                                    console.log('🎬 VIEWER: Received stream!');
                                    
                                    if (videoRef.current) {
                                        videoRef.current.srcObject = remoteStream;
                                        videoRef.current.play().catch(e => console.log('Video play error:', e));
                                        setConnecting(false);
                                        setConnected(true);
                                        toast.success('🎥 Connected to QR Scanner!', {
                                            position: 'top-center',
                                            autoClose: 3000,
                                        });
                                    }
                                });
                                
                                call.on('close', () => {
                                    console.log('📞 VIEWER: Call closed');
                                    setConnected(false);
                                });
                                
                                call.on('error', (error) => {
                                    console.error('❌ VIEWER: Call error:', error);
                                });
                                
                                return true;
                            }
                            return false;
                        } catch (error) {
                            console.error('VIEWER polling error:', error);
                            return false;
                        }
                    };
                    
                    // Poll every 3 seconds
                    let pollCount = 0;
                    const poller = setInterval(async () => {
                        if (pollCount++ > 10) {
                            clearInterval(poller);
                            return;
                        }
                        
                        const done = await pollForPeerId();
                        if (done) clearInterval(poller);
                    }, 3000);
                };
                
                peer.on('error', (err) => {
                    console.error('❌ VIEWER Peer error:', err);
                });
                
                return true;
                
            } catch (error) {
                console.error('❌ VIEWER ERROR:', error);
                return false;
            }
        };
        
        // Try connecting with exponential backoff
        let retryCount = 0;
        const maxRetries = 15;
        
        const tryConnect = async () => {
            if (retryCount >= maxRetries) {
                console.log('❌ Max retries reached, giving up');
                setConnecting(false);
                toast.error('Could not connect to QR Scanner camera', {
                    position: 'top-center',
                    autoClose: 5000,
                });
                return;
            }
            
            const success = await connectToStream();
            if (!success) {
                retryCount++;
                const delay = Math.min(2000 * Math.pow(1.5, retryCount), 10000);
                console.log(`🔄 Retry ${retryCount}/${maxRetries} in ${delay}ms...`);
                setTimeout(tryConnect, delay);
            }
        };
        
        tryConnect();
        
    }, []);

    return (
        <>
            <Head title="Camera Viewer" />
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col absolute w-full z-50">
                <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        📱 Camera Viewer
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {connecting && '⏳ Connecting to QR Scanner camera...'}
                        {connected && '✅ Connected to camera stream'}
                        {!connecting && !connected && '❌ Connection failed'}
                    </p>
                </div>

                <div className="flex-1 flex items-center justify-center p-4">
                    {connecting && (
                        <div className="text-center">
                            <Zoomies 
                                size="80" 
                                stroke="5" 
                                speed="1.4" 
                                color="rgb(59, 130, 246)" 
                            />
                            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                                Looking for QR Scanner camera stream...
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Make sure the QR Scanner page is open and camera is active
                            </p>
                        </div>
                    )}

                    {!connecting && !connected && (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <VideoCameraSlashIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-lg">No camera stream available</p>
                            <p className="text-sm mt-2">
                                Make sure the QR Scanner is running on another device
                            </p>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`max-w-full max-h-full bg-black rounded-lg shadow-lg ${
                            !connected ? 'hidden' : ''
                        }`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: 'calc(100vh - 200px)',
                            objectFit: 'contain'
                        }}
                    />
                </div>
            </div>
        </>
    );
}