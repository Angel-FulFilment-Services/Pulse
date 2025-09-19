import React, { useRef, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { Zoomies } from 'ldrs/react'
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid'
import 'ldrs/react/Zoomies.css'



export default function CameraViewer() {
    const videoRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const peerConnection = useRef(null);
    const clientId = useRef(Math.random().toString(36).substr(2, 9));
    const reconnectTimeout = useRef(null);

    // WebRTC configuration
    const rtcConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    };

    const connectToStream = async () => {
        if (isConnecting || isConnected) return;
        
        setIsConnecting(true);

        try {
            peerConnection.current = new RTCPeerConnection(rtcConfiguration);

            // Handle incoming stream
            peerConnection.current.ontrack = (event) => {
                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                    setIsConnected(true);
                    setIsConnecting(false);
                    toast.success('Connected to camera stream', {
                        position: 'top-center',
                        autoClose: 2000,
                        hideProgressBar: true,
                    });
                }
            };

            // Handle connection state changes
            peerConnection.current.onconnectionstatechange = () => {
                const state = peerConnection.current.connectionState;
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    handleDisconnection();
                }
            };

            // Handle ICE candidates - set up handler BEFORE creating offer
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    fetch('/api/camera/ice-candidate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        },
                        body: JSON.stringify({
                            candidate: event.candidate,
                            clientId: clientId.current
                        })
                    }).catch(error => {
                        console.error('Error sending ICE candidate:', error);
                    });
                }
            };

            // Create offer with specific constraints
            const offerOptions = {
                offerToReceiveAudio: false,
                offerToReceiveVideo: true
            };
            const offer = await peerConnection.current.createOffer(offerOptions);
            await peerConnection.current.setLocalDescription(offer);

            // Send offer to stream source
            const response = await fetch('/api/camera/offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    offer: offer,
                    clientId: clientId.current
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send offer');
            }

            // Listen for answer
            const eventSource = new EventSource(`/api/camera/answer-stream/${clientId.current}`);
            const pendingIceCandidates = [];
            
            eventSource.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'answer' && data.answer) {
                    try {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                        
                        // Process any pending ICE candidates
                        for (const candidate of pendingIceCandidates) {
                            try {
                                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                            } catch (error) {
                                console.error('Error adding pending ICE candidate:', error);
                            }
                        }
                        pendingIceCandidates.length = 0;
                        
                        eventSource.close();
                    } catch (error) {
                        console.error('Error setting remote description:', error);
                        eventSource.close();
                        throw new Error('Failed to process answer');
                    }
                } else if (data.type === 'ice-candidate' && data.candidate) {
                    // Only add ICE candidates after remote description is set
                    if (peerConnection.current.remoteDescription) {
                        try {
                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                        } catch (error) {
                            console.error('Error adding ICE candidate:', error);
                        }
                    } else {
                        // Queue ICE candidates until remote description is set
                        pendingIceCandidates.push(data.candidate);
                    }
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                throw new Error('Connection failed');
            };

        } catch (error) {
            handleConnectionError();
        }
    };

    const handleConnectionError = () => {
        setIsConnecting(false);
        setIsConnected(false);
        
        toast.error('Failed to connect to camera stream. Retrying in 10 seconds...', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: true,
        });

        // Schedule reconnection in 10 seconds
        reconnectTimeout.current = setTimeout(() => {
            connectToStream();
        }, 10000);
    };

    const handleDisconnection = () => {
        setIsConnected(false);
        setIsConnecting(false);
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        toast.warning('Connection lost. Retrying in 10 seconds...', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: true,
        });

        // Schedule reconnection in 10 seconds
        reconnectTimeout.current = setTimeout(() => {
            connectToStream();
        }, 10000);
    };

    const disconnect = () => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        setIsConnected(false);
        setIsConnecting(false);

        toast.info('Disconnected from camera stream', {
            position: 'top-center',
            autoClose: 2000,
            hideProgressBar: true,
        });
    };

    const reconnect = () => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }
        disconnect();
        setTimeout(() => connectToStream(), 500);
    };

    // Auto-connect on component mount
    useEffect(() => {
        connectToStream();

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            disconnect();
        };
    }, []);

    return (
        <>
            <Head title="Camera Viewer" />
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                {/* Full screen video */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ display: isConnected ? 'block' : 'none' }}
                />
                
                {/* Loading/connecting state */}
                {isConnecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center text-white">
                            <Zoomies
                                size="80"
                                stroke="5"
                                bgOpacity="0.1"
                                speed="1.4"
                                color="rgb(var(--theme-600) / 1)"
                            />
                            <p className="text-xl">Connecting to camera stream...</p>
                        </div>
                    </div>
                )}

                {/* No connection state */}
                {!isConnecting && !isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center text-white">
                            <div className="text-6xl mb-4">
                                <VideoCameraSlashIcon />
                            </div>
                            <p className="text-xl mb-4">No camera stream available</p>
                            <p className="text-gray-400">Waiting for connection...</p>
                        </div>
                    </div>
                )}

                {/* Control buttons */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                    {isConnected && (
                        <>
                            <button
                                onClick={disconnect}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                            >
                                Disconnect
                            </button>
                            <button
                                onClick={reconnect}
                                className="bg-theme-600 hover:bg-theme-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                            >
                                Reconnect
                            </button>
                        </>
                    )}
                    {!isConnected && !isConnecting && (
                        <button
                            onClick={connectToStream}
                            className="bg-theme-600 hover:bg-theme-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                        >
                            Connect
                        </button>
                    )}
                </div>

                {/* Connection status indicator */}
                {isConnected && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        LIVE
                    </div>
                )}
            </div>
        </>
    );
}