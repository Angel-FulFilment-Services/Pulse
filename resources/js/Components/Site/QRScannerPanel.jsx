import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import axios from 'axios';
import { toast } from 'react-toastify';
import Peer from 'peerjs';

export default function QRScannerPanel({ onComplete, setStep, location }) {
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const isTimeout = useRef(false);
  const isStopped = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // WebRTC streaming states
  const localStream = useRef(null);
  const peerConnections = useRef(new Map());
  const [viewerCount, setViewerCount] = useState(0);
  const [streamingActive, setStreamingActive] = useState(false);

  // WebRTC configuration
  const PC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    sdpSemantics: 'unified-plan' // Ensure unified-plan semantics
  };

  const stopCamera = useCallback(() => {
    codeReader.current = null;
    
    // Stop WebRTC streaming
    stopStreaming();
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // WebRTC streaming functions
  const stopStreaming = useCallback(() => {
    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    
    setStreamingActive(false);
    setViewerCount(0);
  }, []);

  const initializeStreaming = useCallback(async (stream) => {
    localStream.current = stream;
    setStreamingActive(true);
    
    // Clear any existing offers
    try {
      await fetch('/api/camera/clear-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
      });
    } catch (error) {
      console.log('Could not clear existing offers:', error);
    }
    
    // PeerJS WebRTC streaming - Even cleaner!
    const createStreamOffer = async () => {
      try {
        console.log('📱 QR SCANNER: Starting PeerJS stream');
        
        // Create peer with random ID
        const peer = new Peer();
        
        peer.on('open', async (id) => {
          console.log('📡 QR SCANNER: Peer opened with ID:', id);
          
          // Store our peer ID for viewers to find us
          await fetch('/api/camera/stream-offer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
              offer: { peerId: id },
              streamId: 'qr-scanner-stream'
            })
          });
          
          console.log('✅ QR SCANNER: Peer ID stored');
        });
        
        // Handle incoming calls from viewers
        peer.on('call', (call) => {
          console.log('📞 QR SCANNER: Incoming call, answering with video stream');
          
          call.answer(localStream.current);
          
          call.on('stream', (remoteStream) => {
            console.log('🎬 QR SCANNER: Connected to viewer');
          });
          
          call.on('close', () => {
            console.log('📞 QR SCANNER: Call closed');
          });
        });
        
        peer.on('error', (err) => {
          console.error('❌ QR SCANNER Peer error:', err);
        });
        
      } catch (error) {
        console.error('Error in createStreamOffer:', error);
      }
    };
    
    // Create the offer immediately
    createStreamOffer();
    
    return () => {
      // Cleanup function
    };
  }, []);  

  const startCamera = useCallback(async () => {
      try {
        codeReader.current = new BrowserMultiFormatReader();
        const videoElement = videoRef.current;

        const constraints = {
          video: {
            facingMode: 'user', // Request the front camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        };

        // Get the camera stream
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Ensure video element gets the stream first
        if (videoElement) {
          videoElement.srcObject = stream;
        }
        
        // Initialize streaming silently
        await initializeStreaming(stream);

        await codeReader.current.decodeFromVideoDevice(
          null,
          videoElement,
          (result, error) => {
            if (result && !isTimeout.current && !isProcessing && scanResult !== result.getText()) {
              setScanResult(result.getText());

              if(isStopped.current){
                stopCamera();
                codeReader.current.reset();
              }
              isTimeout.current = true;
              findUser(result.getText()).then(user => {
                  if (user) {
                      isSignedIn(user).then(signedIn => { 
                        isStopped.current = true;
                        if(signedIn) { 
                          signOut(user);
                        } else {
                          onComplete({ user_id: user, location, category: 'employee' });
                          setStep('terms-and-conditions');
                        }
                      });
                  }
              });

              setTimeout(() => {
                isTimeout.current = false;
              }, 3000);
            }
          }, constraints
        );
      } catch (error) {
        console.error('Camera or streaming error:', error);
      }
    }, [setStep, stopCamera, onComplete, initializeStreaming]);

  const findUser = async (query) => {
    setIsProcessing(true); // Set processing state to true to prevent multiple submissions
    try {
      const response = await axios.get(`/onsite/find-user`, {
        params: { guid: query },
      });
      const user = response.data;
      setIsProcessing(false); // Reset processing state
      return user;
    } catch (err) {
      console.error('Error fetching employees:', err);
      const audio = new Audio('/sounds/access-error.mp3');
      audio.play();
        toast.error('This access token is not recognised, please try again.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
        }); // 3 seconds
      setIsProcessing(false); // Reset processing state
      return null;
    }
  };

  const isSignedIn = async (userId) => {
    try {
      const response = await axios.get(`/onsite/status`, {
        params: { 
          user_id: userId, 
        },
      });

      return false;
    } catch (err) {
      return true;
    }
  };

  const signOut = async (userId) => {
    try {
      const response = await axios.get(`/onsite/sign-out`, {
        params: { 
          user_id: userId,
        },
      });

      if (response.status === 400) {
        throw new Error('This user is already signed out.');
      }

      if (!response.status === 200) {
        throw new Error('Failed to sign out user');
      }

      if (response.status === 200) {
        setStep('goodbye');
      }
    } catch (err) {
      setSigningOutId(null); // Reset signing out ID on error
      const audio = new Audio('/sounds/access-error.mp3');
      audio.play();
      if(err.response && err.response.status === 400) {
        toast.error("You're already signed out.", {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });

        setTimeout(() => {
          setStep('splash'); // Navigate to splash screen after error
        }, 3000);
      } else {
        toast.error('Could not sign out, please try again.', {
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
      return false;
    }
  };

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
      
      <div className="absolute bottom-10 left pointer-events-none">
        <p className="text-3xl font-medium text-white font-sans">
          Show your QR code here
        </p>
      </div>
    </div>
  );
}