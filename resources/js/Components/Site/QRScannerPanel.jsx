import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function QRScannerPanel({ onComplete, setStep, location }) {
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const isTimeout = useRef(false);
  const isStopped = useRef(false);

  const stopCamera = useCallback(() => {
    codeReader.current = null;
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

        const constraints = {
          video: {
            facingMode: 'user', // Request the front camera
          },
        };

        await codeReader.current.decodeFromVideoDevice(
          null,
          videoElement,
          (result, error) => {
            if (result && !isTimeout.current) {
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
        // Optionally handle camera errors here
      }
    }, [setStep, stopCamera, onComplete]);

  const findUser = async (query) => {
    try {
      const response = await axios.get(`/onsite/find-user`, {
        params: { guid: query },
      });
      const user = response.data;
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