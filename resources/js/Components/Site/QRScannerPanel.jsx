import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import axios from 'axios';
import { toast } from 'react-toastify';
import { set } from 'lodash';

export default function QRScannerPanel({ setStep, location }) {
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
                codeReader.current.reset();
              }

              isTimeout.current = true;
              findUser(result.getText()).then(user => {
                  if (user) {
                      signInOrOut(user).then(action => {
                        if(action) { 
                            stopCamera();
                            if(action === 'sign-in') {
                                setStep('welcome');
                            } else {
                                setStep('goodbye');
                            }
                            isStopped.current = true;
                        }
                      });
                  }
              });

              setTimeout(() => {
                isTimeout.current = false;
              }, 3000);
            }
          },
          constraints
        );
      } catch (error) {
        // Optionally handle camera errors here
      }
    }, [stopCamera]);

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

    const signInOrOut = async (userId) => {
      try {
        const response = await axios.get(`/onsite/sign-in-out`, {
          params: { 
            user_id: userId, 
            location: location,
          },
        });

        if(!response.status === 500){
          throw new Error('Failed to sign in/out user');
        }

        return response.data.action;
      } catch (err) {
        const audio = new Audio('/sounds/access-error.mp3');
        audio.play();
          toast.error('Could not sign in/out, please try again.', {
              position: 'top-center',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: true,
              progress: undefined,
              theme: 'light',
          });
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