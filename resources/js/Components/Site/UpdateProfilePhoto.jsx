import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoIcon, CameraIcon } from '@heroicons/react/24/solid';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axios from 'axios';

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

export default function UploadProfilePhoto({ onComplete, userId }) {
  const [preview, setPreview] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [zoom, setZoom] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [lastSource, setLastSource] = useState(null); // "camera" or "upload"

  // Spinner for image loading
  const [imgLoaded, setImgLoaded] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState(null);

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (preview) setImgLoaded(false);
  }, [preview]);

  // Automatically start the camera when the component mounts
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [stopCamera]);

  // Start the camera
  const startCamera = async () => {
    setIsCameraActive(true);
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      setCameraError(true);
      setIsCameraActive(false);
    }
  };

  // Capture photo from the camera
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const previewSize = 384;

      // Get the displayed size of the video element
      const rect = video.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      // Get the natural size of the video stream
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Calculate the scale between displayed and natural size
      const scale = Math.max(displayWidth / videoWidth, displayHeight / videoHeight);

      // Calculate the size of the area from the video frame that is visible in the preview
      const cropWidth = previewSize / scale;
      const cropHeight = previewSize / scale;

      // Calculate the top-left corner of the crop area in the video frame
      const sx = (videoWidth - cropWidth) / 2;
      const sy = (videoHeight - cropHeight) / 2;

      // Draw to a square canvas
      const canvas = document.createElement('canvas');
      canvas.width = previewSize;
      canvas.height = previewSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, previewSize, previewSize);

      const imageDataUrl = canvas.toDataURL('image/png');
      setPreview(imageDataUrl);
      setLastSource("camera");
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured-photo.png', { type: 'image/png' });
        // You can use this file if needed
      });
    }
    stopCamera();
  };

  // Drag handlers for preview image
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      originX: drag.x,
      originY: drag.y,
    });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch handlers for preview image
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent pinch-zoom on page
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setLastPinchDistance(Math.sqrt(dx * dx + dy * dy));
    } else if (e.touches.length === 1) {
      e.preventDefault(); // Prevent scroll on page
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX,
        y: touch.clientY,
        originX: drag.x,
        originY: drag.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastPinchDistance !== null) {
      e.preventDefault(); // Prevent pinch-zoom on page
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      const delta = newDistance - lastPinchDistance;
      setLastPinchDistance(newDistance);
      setZoom((prevZoom) => Math.max(1, Math.min(2, prevZoom + delta / 200)));
    } else if (e.touches.length === 1 && dragStart) {
      e.preventDefault(); // Prevent scroll on page
      const touch = e.touches[0];
      const nextDrag = {
        x: dragStart.originX + (touch.clientX - dragStart.x),
        y: dragStart.originY + (touch.clientY - dragStart.y),
      };
      setDrag(clampDrag(nextDrag));
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent unwanted gestures
    setLastPinchDistance(null);
    setDragStart(null);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  };

  // Clamp drag so image edges can't leave the preview circle
  const clampDrag = useCallback(
    (nextDrag) => {
      const previewSize = 384;
      const imgSize = zoom * previewSize;
      const maxOffset = (imgSize - previewSize) / 2;
      return {
        x: Math.max(-maxOffset, Math.min(nextDrag.x, maxOffset)),
        y: Math.max(-maxOffset, Math.min(nextDrag.y, maxOffset)),
      };
    },
    [zoom]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragStart) return;
      const nextDrag = {
        x: dragStart.originX + (e.clientX - dragStart.x),
        y: dragStart.originY + (e.clientY - dragStart.y),
      };
      setDrag(clampDrag(nextDrag));
    },
    [dragStart, clampDrag]
  );

  const handleMouseUp = useCallback(() => {
    setDragStart(null);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    if (dragStart) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragStart, handleMouseMove, handleMouseUp]);

  // Reset drag/zoom when new preview is set
  useEffect(() => {
    setDrag({ x: 0, y: 0 });
    setZoom(1);
  }, [preview]);

  // When zoom changes, also clamp drag to prevent image from being out of bounds
  useEffect(() => {
    setDrag((prev) => clampDrag(prev));
  }, [zoom, clampDrag]);

  // Spinner: hide when image is loaded
  useEffect(() => {
    if (imgLoaded) setIsLoading(false);
  }, [imgLoaded]);

  // Call this to save (you can expand this as needed)
  const handleSave = async (e) => {
    if (!preview) return;

    const getCroppedImage = () => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const previewSize = 384;
          const canvas = document.createElement('canvas');
          canvas.width = previewSize;
          canvas.height = previewSize;
          const ctx = canvas.getContext('2d');

          ctx.save();
          ctx.beginPath();
          ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();

          // Use "contain" for uploads, "cover" for camera
          const baseScale = Math.max(previewSize / img.width, previewSize / img.height);

          const scale = baseScale * zoom;
          const displayWidth = img.width * scale;
          const displayHeight = img.height * scale;

          // Center the image, then apply drag
          const dx = (previewSize - displayWidth) / 2 + drag.x;
          const dy = (previewSize - displayHeight) / 2 + drag.y;

          ctx.drawImage(
            img,
            dx,
            dy,
            displayWidth,
            displayHeight
          );
          ctx.restore();

          resolve(canvas.toDataURL('image/png'));
        };
        img.src = preview;
      });
    };

    const cropped = await getCroppedImage();
    setProfilePhoto(cropped, userId);
  };

  const setProfilePhoto = async (image, userId) => {
    try {
      setIsLoading(true);
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const formData = new FormData();
      formData.append('profile_photo', image);
      formData.append('user_id', userId)

      const response = await fetch('/onsite/access-control/account/photo/set', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 422) {
          const errorData = await response.json();
          throw new Error(errorData.errors.profile_photo || 'Validation failed');
        }
        throw new Error('Failed to set profile photo');
      }

      toast.success('Profile photo updated successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } catch (error) {
      toast.error(error.message || 'Profile photo could not be updated.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } finally {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 h-screen w-full">
      <div className="flex items-center justify-end w-full h-10">
        <XMarkIcon
          className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer"
          onClick={onComplete}
        />
      </div>
      <form onSubmit={handleSave} className="flex flex-col items-center gap-4 h-full justify-center w-full">
        {/* Title and subtitle at the top */}
        <div className="mb-4 text-center w-full">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-100">Update Profile Photo</h1>
          <p className="mt-2 text-xl  text-gray-600 dark:text-dark-400">
            It looks like we don't have a profile photo for you yet. Please take a new photo using the camera.
          </p>
        </div>

        {/* Preview Section */}
        {!isCameraActive && (
          <div className="flex flex-col items-center justify-center gap-y-2 w-full">
            <div
              className="size-64 lg:size-96 rounded-full ring-4 ring-theme-500 dark:ring-theme-600 overflow-hidden bg-gray-100 dark:bg-dark-700 flex flex-col items-center justify-center relative"
            >
              {preview ? (
                <div
                  className="w-full h-full cursor-move"
                  style={{
                    overflow: 'hidden',
                    borderRadius: '9999px',
                    width: '24rem',
                    height: '24rem',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {isLoading && <Spinner />}
                  <div className="absolute inset-0 flex border-8 border-red-400/20 border-dashed rounded-full"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        rgba(239,68,68,0.08) 0px,
                        rgba(239,68,68,0.08) 8px,
                        transparent 8px,
                        transparent 16px
                      )`,
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    }}
                  >
                  </div>
                  <img
                    src={preview}
                    alt="Profile Preview"
                    draggable={false}
                    onLoad={() => setImgLoaded(true)}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${drag.x}px)`,
                      top: `calc(50% + ${drag.y}px)`,
                      width: `${zoom * 100}%`,
                      height: `${zoom * 100}%`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transform: 'translate(-50%, -50%)',
                      objectFit: lastSource === 'upload' ? 'contain' : 'cover',
                      opacity: 1,
                      transition: 'opacity 0.2s',
                      touchAction: 'none',
                    }}
                  />
                  {/* Face outline overlay */}
                  <svg
                    className="pointer-events-none absolute top-0 left-0 w-full h-full text-theme-500 dark:text-theme-600 opacity-50"
                    style={{ zIndex: 10 }}
                    viewBox="0 0 384 384"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <ellipse
                      cx="192"
                      cy="180"
                      rx="90"
                      ry="120"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                    />
                  </svg>
                </div>
              ) : cameraError ? (
                <p className="text-sm text-gray-500 dark:text-dark-400">Cannot access camera</p>
              ) : (
                <PhotoIcon className="w-20 text-gray-300 dark:text-dark-500" />
              )}
            </div>
            {/* Zoom slider outside the preview circle */}
            {preview && (
              <div className="flex flex-col items-center justify-center mt-4">
                <span className="text-sm text-gray-500 dark:text-dark-400">Zoom: {(zoom * 100).toFixed(0)}%</span>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-48 mt-4 accent-theme-600 dark:accent-theme-700"
                  aria-label="Zoom"
                />
              </div>
            )}
            {/* Camera/Retake button */}
            {!preview && lastSource === "upload" || cameraError ? (<div className="h-12" />) : null}
            <div className="flex flex-row w-full">
              <div className="w-full" />
              <div className="flex flex-row items-start justify-between gap-4 w-full">
                <button
                  onClick={preview && lastSource === "camera" ? startCamera : startCamera}
                  className="flex items-center justify-center -ml-24 gap-2 bg-theme-500 text-white rounded-2xl px-5 py-4 mt-4 text-3xl hover:bg-theme-600 focus-visible:outline-2 fade-in focus-visible:outline-offset-2 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-700 disabled:bg-theme-600 dark:disabled:bg-theme-700 dark:disabled:hover:bg-theme-700 disabled:hover:bg-theme-600 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <CameraIcon className="w-10 h-10 stroke-[7] mr-2" />
                  {preview && lastSource === "camera" ? "Retake" : "Use Camera"}
                </button>
                <button
                  className="mt-4 px-5 py-4 bg-theme-500 text-white rounded-2xl text-3xl shadow hover:bg-theme-600 mb-16 focus:outline-none flex items-center justify-center fade-in disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {if(preview && lastSource === "camera") { handleSave() } else { onComplete() } }}
                >
                  <ChevronRightIcon className="h-8 w-8 inline-block stroke-[7] flex-shrink-0 mr-2" />
                  <p className="mb-1">{preview && lastSource === "camera" ? "Continue" : "Skip"}</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Section */}
        {isCameraActive && !cameraError ? (
          <div className="flex flex-col justify-center items-center gap-y-4 w-full max-w-full">
            <div className="relative">
              <video ref={videoRef} className="size-64 lg:size-96 rounded-full object-cover ring-4 ring-theme-500 dark:ring-theme-600" playsInline autoPlay muted/>
              {/* Face outline overlay */}
              <svg
                className="pointer-events-none absolute top-0 left-0 w-full h-full text-theme-500 dark:text-theme-600 opacity-50"
                style={{ zIndex: 10 }}
                viewBox="0 0 384 384"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse
                  cx="192"
                  cy="180"
                  rx="90"
                  ry="120"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                />
              </svg>
            </div>
            <div className="h-14" />
            <div className="flex flex-row w-full">
              <div className="w-full" />
              <div className="flex flex-row items-start justify-between gap-4 w-full">
                <button
                  onClick={capturePhoto}
                  className="flex items-center justify-center -ml-24 gap-2 bg-theme-500 text-white rounded-2xl px-5 py-4 mt-4 text-3xl hover:bg-theme-600 focus-visible:outline-2 fade-in focus-visible:outline-offset-2 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-700 disabled:bg-theme-600 dark:disabled:bg-theme-700 dark:disabled:hover:bg-theme-700 disabled:hover:bg-theme-600 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <CameraIcon className="w-10 h-10 stroke-[7] mr-2" />
                  Capture
                </button>
                <button
                  className="mt-4 px-5 py-4 bg-theme-500 text-white rounded-2xl text-3xl shadow hover:bg-theme-600 mb-16 focus:outline-none flex items-center justify-center fade-in disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onComplete}
                >
                  <ChevronRightIcon className="h-8 w-8 inline-block stroke-[7] flex-shrink-0 mr-2" />
                  <p className="mb-1">Skip</p>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}