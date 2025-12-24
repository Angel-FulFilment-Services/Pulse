import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoIcon, CameraIcon } from '@heroicons/react/24/solid';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';

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

export default function UploadProfilePhoto({ handleSubmit, handleClose }) {
  const [preview, setPreview] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [containerSize, setContainerSize] = useState(384);

  const [isLoading, setIsLoading] = useState(false);
  const [lastSource, setLastSource] = useState(null); // "camera" or "upload"
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Spinner for image loading
  const [imgLoaded, setImgLoaded] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState(null);

  // Track container size for accurate canvas rendering
  useEffect(() => {
    const updateSize = () => {
      if (previewContainerRef.current) {
        setContainerSize(previewContainerRef.current.offsetWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [preview]);

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

  // Handle file upload
  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files);
    const file = files[0];
    if (file) {
      setIsLoading(true);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setLastSource("upload");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopCamera();
  };

  // Handle drag-and-drop file upload
  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const file = files[0];
    if (file) {
      setIsLoading(true);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setLastSource("upload");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

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
    e.preventDefault();
    if (!preview) return;

    const getCroppedImage = () => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          // Output size is always 384px for consistency
          const outputSize = 384;
          // Use the actual displayed container size for calculations
          const displaySize = containerSize;
          // Scale factor to convert from display coordinates to output coordinates
          const scaleFactor = outputSize / displaySize;
          
          const canvas = document.createElement('canvas');
          canvas.width = outputSize;
          canvas.height = outputSize;
          const ctx = canvas.getContext('2d');

          ctx.save();
          ctx.beginPath();
          ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();

          // Always use "cover" behavior so image fills the frame
          // For cover: scale so the image covers the entire area (use max)
          const baseScale = Math.max(displaySize / img.width, displaySize / img.height);

          // Apply zoom and scale up to output size
          const scale = baseScale * zoom * scaleFactor;
          const displayWidth = img.width * scale;
          const displayHeight = img.height * scale;

          // Center the image, then apply drag (scaled to output coordinates)
          const dx = (outputSize - displayWidth) / 2 + (drag.x * scaleFactor);
          const dy = (outputSize - displayHeight) / 2 + (drag.y * scaleFactor);

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
    await handleSubmit(cropped);
    // Let the parent component handle closing after successful submission
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col items-center gap-4 w-full">
      {/* Title and subtitle at the top */}
      <div className="mb-4 text-center w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Update Profile Photo</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
          Take a new photo or upload an image to use as your profile picture.
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-dark-500">
          Your photo should be a clear, front-facing image of just you (No pets, groups, or inappropriate content.)
        </p>
      </div>

      {/* Preview Section */}
      {!isCameraActive && (
        <div className="flex flex-col items-center justify-center gap-y-2">
          <div
            className="size-64 lg:size-96 rounded-full ring-4 ring-theme-500 dark:ring-theme-600 overflow-hidden bg-gray-100 dark:bg-dark-700 flex flex-col items-center justify-center relative"
          >
            {preview ? (
              <div
                ref={previewContainerRef}
                className="w-full h-full cursor-move"
                style={{
                  overflow: 'hidden',
                  borderRadius: '9999px',
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
                    objectFit: 'cover',
                    opacity: isLoading ? 0 : 1,
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
          <button
            onClick={preview && lastSource === "camera" ? startCamera : startCamera}
            className="flex items-center justify-center gap-2 bg-theme-600 text-white mt-1 px-4 py-2 rounded-md w-40 hover:bg-theme-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-700 disabled:bg-theme-600 dark:disabled:bg-theme-700 dark:disabled:hover:bg-theme-700 disabled:hover:bg-theme-600 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <CameraIcon className="w-5 h-5" />
            {preview && lastSource === "camera" ? "Retake" : "Use Camera"}
          </button>
        </div>
      )}

      {/* Camera Section */}
      {isCameraActive && !cameraError ? (
        <div className="flex flex-col justify-center items-center gap-y-4 w-full max-w-md">
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
          <button
            onClick={capturePhoto}
            className="bg-theme-600 text-white px-4 py-2 rounded-md w-40 hover:bg-theme-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-700 disabled:bg-theme-600 dark:disabled:bg-theme-700 dark:disabled:hover:bg-theme-700 disabled:hover:bg-theme-600 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Capture
          </button>
        </div>
      ) : null}

      {/* File Upload Section */}
      <div
        className="flex flex-col items-center border-2 border-dashed border-gray-300 dark:border-dark-500 rounded-md px-4 py-0.5 sm:py-3 w-full max-w-md"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-center flex items-center gap-x-2 sm:block">
          <PhotoIcon aria-hidden="true" className="mx-auto h-12 w-12 text-gray-300 dark:text-dark-600 sm:mb-1" />
          <div>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-white dark:bg-dark-900 font-semibold text-theme-600 dark:text-theme-700 focus-within:ring-2 focus-within:ring-theme-600 dark:focus-within:ring-theme-700 focus-within:ring-offset-2 hover:text-theme-500 dark:hover:text-theme-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/png, image/gif, image/jpeg, image/jpg"
                  onChange={handleAttachmentUpload}
                  ref={fileInputRef}
                  disabled={isLoading}
                />
              </label>
              <p className="pl-1 text-gray-700 dark:text-dark-300 hidden sm:block">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-400">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>

      {/* Save and Cancel buttons at the bottom */}
      <div className="flex justify-end gap-4 w-full mt-2">
        <button
          type="button"
          className="text-sm font-semibold text-gray-900 dark:text-dark-100 px-4 py-2 rounded-md"
          onClick={() => {
            if (preview) {
              setShowCancelConfirm(true);
            } else {
              handleClose();
            }
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-theme-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-theme-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 disabled:bg-theme-600 dark:disabled:bg-theme-700 dark:disabled:hover:bg-theme-700 disabled:hover:bg-theme-600 disabled:cursor-not-allowed"
          disabled={isLoading || !preview}
        >
          Save
        </button>
      </div>

      <ConfirmationDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Discard Changes?"
        description="You have an unsaved photo. Are you sure you want to discard it?"
        isYes={() => {
          setShowCancelConfirm(false);
          handleClose();
        }}
        type="question"
        yesText="Discard"
        cancelText="Keep Editing"
      />
    </form>
  );
}