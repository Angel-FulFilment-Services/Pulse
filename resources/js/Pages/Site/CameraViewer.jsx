import React, { useRef, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { Zoomies } from 'ldrs/react'
import 'ldrs/react/Zoomies.css'
import Peer from 'peerjs';

export default function CameraViewer() {
    const videoRef = useRef(null);
    const [connecting, setConnecting] = useState(true);
    const [connected, setConnected] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const connectToStream = async () => {
            try {
                const peer = new Peer(undefined, {
                    config: {
                        iceServers: [], // No external STUN/TURN servers - local network only
                        iceTransportPolicy: 'all',
                        iceCandidatePoolSize: 0
                    },
                    debug: 0 // Disable debug to prevent data leakage
                });
                
                peer.on('open', async (id) => {
                    setTimeout(() => {
                        startPolling();
                    }, 1000);
                });
                
                const startPolling = () => {
                    // Poll for QR Scanner's peer ID
                    const pollForPeerId = async () => {
                        try {
                            // Check if our peer is still connected
                            if (peer.destroyed) {
                                return false;
                            }
                            
                            const response = await fetch('/api/camera/get-stream-offer?streamId=qr-scanner-stream');
                            const data = await response.json();
                            
                            if (data.offer && data.offer.peerId) {
                                if (!peer.open) {
                                    return false;
                                }
                                
                                let call;
                                
                                try {
                                    // Create a black video track for the call
                                    const canvas = document.createElement('canvas');
                                    canvas.width = 640;
                                    canvas.height = 480;
                                    const ctx = canvas.getContext('2d');
                                    ctx.fillStyle = 'black';
                                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                                    
                                    const stream = canvas.captureStream(1); // 1 FPS
                                    call = peer.call(data.offer.peerId, stream);
                                } catch (error) {
                                    call = peer.call(data.offer.peerId, new MediaStream());
                                }
                                
                                if (!call) {
                                    return false;
                                }

                                call.on('stream', (remoteStream) => {
                                    if (videoRef.current) {
                                        videoRef.current.srcObject = remoteStream;
                                        videoRef.current.play().catch(e => {});
                                        setConnecting(false);
                                        setConnected(true);
                                        toast.success('Connected to camera stream!', {
                                            position: 'top-center',
                                            autoClose: 3000,
                                        });
                                    }
                                });
                                
                                call.on('close', () => {
                                    setConnected(false);
                                });
                                
                                call.on('error', (error) => {
                                    // Silent error handling
                                });
                                
                                return true;
                            }
                            return false;
                        } catch (error) {
                            return false;
                        }
                    };
                    
                    // Retry every 10 seconds, max 20 attempts
                    let attempts = 0;
                    const maxAttempts = 20;
                    
                    const tryConnect = async () => {
                        attempts++;
                        const success = await pollForPeerId();
                        
                        if (success) {
                            return;
                        }
                        
                        if (attempts >= maxAttempts) {
                            setConnecting(false);
                            setFailed(true);
                            return;
                        }
                        
                        // Retry in 10 seconds
                        setTimeout(tryConnect, 10000);
                    };
                    
                    tryConnect();
                };
                
                peer.on('error', (err) => {
                    // Silent error handling
                });
                
                return true;
                
            } catch (error) {
                return false;
            }
        };
        
        connectToStream();
        
    }, []);

    return (
        <>
            <Head title="Camera Viewer" />
            
            <div className="min-h-dvh bg-black absolute z-50 w-full">
                <video
                    ref={videoRef}
                    className="w-full h-dvh object-cover"
                    autoPlay
                    muted
                    playsInline
                    disablePictureInPicture
                    controls={false}
                    style={{
                        width: '100dvw',
                        height: '100dvh',
                        objectFit: 'cover'
                    }}
                />
                
                {connecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center">
                            <Zoomies size={80} stroke={4} speed={1.4} color="white" />
                            <p className="text-white text-lg mt-4">Connecting to camera...</p>
                        </div>
                    </div>
                )}
                
                {failed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center">
                            <p className="text-red-500 text-xl">Failed to connect</p>
                            <p className="text-gray-400 text-sm mt-2">Unable to connect to camera stream</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}