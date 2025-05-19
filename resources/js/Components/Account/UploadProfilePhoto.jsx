import { useState, useRef, useEffect } from 'react';
import { PhotoIcon, CameraIcon } from '@heroicons/react/24/solid';

export default function UploadProfilePhoto({ onUpload }) {
  const [preview, setPreview] = useState(null); // Preview of the captured or uploaded image
  const [cameraError, setCameraError] = useState(false); // Track camera access errors
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Automatically start the camera when the component mounts
  useEffect(() => {
    startCamera();
    return () => stopCamera(); // Cleanup camera on unmount
  }, []);

  // Handle file upload
  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files);
    const file = files[0]; // Only handle the first file for profile photo
    if (file) {
      setPreview(URL.createObjectURL(file)); // Set preview
      onUpload(file); // Pass the file to the parent component
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the file input
    }
  };

  // Handle drag-and-drop file upload
  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const file = files[0]; // Only handle the first file for profile photo
    if (file) {
      setPreview(URL.createObjectURL(file)); // Set preview
      onUpload(file); // Pass the file to the parent component
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Start the camera
  const startCamera = async () => {
    setIsCameraActive(true);
    setCameraError(false); // Reset camera error
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(true);
      setIsCameraActive(false);
    }
  };

  // Capture photo from the camera
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/png');
      setPreview(imageDataUrl); // Set preview
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured-photo.png', { type: 'image/png' });
        onUpload(file); // Pass the captured photo to the parent component
      });
    }
    stopCamera();
  };

  // Stop the camera
  const stopCamera = () => {
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 h-full justify-center">
      {/* Preview Section */}
      <div className="size-96 rounded-full overflow-hidden bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt="Profile Preview" className="w-full h-full object-cover" />
        ) : cameraError ? (
          <p className="text-sm text-gray-500 dark:text-dark-400">Cannot access camera</p>
        ) : (
          <PhotoIcon className="w-16 h-16 text-gray-300 dark:text-dark-500" />
        )}
      </div>

      {/* Camera Section */}
      {isCameraActive && !cameraError ? (
        <div className="relative">
          <video ref={videoRef} className="size-96 rounded-full object-cover" />
          <button
            onClick={capturePhoto}
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-theme-600 text-white px-4 py-2 rounded-md"
          >
            Capture
          </button>
        </div>
      ) : (
        <button
          onClick={startCamera}
          className="flex items-center gap-2 bg-theme-600 text-white px-4 py-2 rounded-md"
        >
          <CameraIcon className="w-5 h-5" />
          Use Camera
        </button>
      )}

      {/* File Upload Section */}
      <div
        className="flex flex-col items-center border-2 border-dashed border-gray-300 dark:border-dark-500 rounded-md p-4 w-full max-w-md"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-center">
            <PhotoIcon aria-hidden="true" className="mx-auto h-12 w-12 text-gray-300 dark:text-dark-600" />
            <div className="mt-4 flex text-sm text-gray-600">
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
                multiple
                onChange={handleAttachmentUpload}
                ref={fileInputRef}
                />
            </label>
            <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-400">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
    </div>
  );
}