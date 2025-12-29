import { useState } from 'react';
import { FireIcon } from '@heroicons/react/24/solid';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function FireEmergencyButton({ 
    isAccessControl = false, 
    onConfirmed = null,
    className = '',
    cameraStream = null
}) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleClick = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        
        try {
            let photoData = null;
            
            // If on access control screen, capture photo from camera
            if (isAccessControl) {
                photoData = await capturePhoto();
            }

            // Send the fire emergency alert
            await toast.promise(
                axios.post('/api/fire-emergency/trigger', {
                    source: isAccessControl ? 'access_control' : 'authenticated',
                    photo: photoData
                }),
                {
                    pending: 'Sending fire emergency alert...',
                    success: 'Fire emergency alert sent successfully!',
                    error: 'Failed to send fire emergency alert. Please try again.'
                },          
                {
                    position: 'top-center',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: 'light',
                }
            );

            // Execute callback if provided (for access control screen)
            if (onConfirmed && typeof onConfirmed === 'function') {
                onConfirmed();
            }
        } catch (error) {
            console.error('Error triggering fire emergency:', error);
        } finally {
            setIsProcessing(false);
            setIsConfirmOpen(false);
        }
    };

    const capturePhoto = async () => {
        return new Promise((resolve) => {
            try {
                // Create a video element temporarily to capture the frame from the stream
                if (!cameraStream) {
                    console.warn('No camera stream available');
                    resolve(null);
                    return;
                }

                const video = document.createElement('video');
                video.srcObject = cameraStream;
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                
                // Wait for video to start playing and render frames
                video.onloadedmetadata = () => {
                    // Play the video
                    video.play().then(() => {
                        // Wait a bit for the video to render frames
                        setTimeout(() => {
                            if (video.videoWidth === 0 || video.videoHeight === 0) {
                                console.warn('Video dimensions still zero');
                                resolve(null);
                                return;
                            }

                            // Create a canvas to capture the frame
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            
                            // Draw the current video frame
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                            // Convert to base64
                            const photoData = canvas.toDataURL('image/jpeg', 0.8);
                            
                            // Clean up
                            video.pause();
                            video.srcObject = null;
                            resolve(photoData);
                        }, 500); // Wait 500ms for video to render frames
                    }).catch(error => {
                        console.error('Error playing video:', error);
                        resolve(null);
                    });
                };

                video.onerror = (error) => {
                    console.error('Error loading video:', error);
                    resolve(null);
                };
            } catch (error) {
                console.error('Error capturing photo:', error);
                resolve(null);
            }
        });
    };

    return (
        <>
            { !isAccessControl ? (
                <button
                    onClick={handleClick}
                    disabled={isProcessing}
                    className={`
                        inline-flex items-center justify-center gap-2 
                        px-2 py-2
                        bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500
                        text-white font-semibold 
                        text-xs
                        rounded-lg 
                        transition-all duration-200 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        focus:outline-none
                        ${className}
                    `}
                >
                    <FireIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">Fire Emergency</span>
                </button>
            ) : (
                <button
                    onClick={handleClick}
                    disabled={isProcessing}
                    className={ `
                        inline-flex items-center justify-center
                        p-6
                        bg-orange-500 dark:bg-orange-600
                        text-white
                        text-xl
                        rounded-3xl 
                        transition-all duration-200 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-[0_0_35px_0_rgba(0,0,0,0.1)]
                        font-bold 
                        focus:outline-none
                        ring-1 ring-black ring-opacity-5 
                        ${className}
                    `}
                >
                    <FireIcon className="h-14 w-14" />
                </button>
            )}

            <ConfirmationDialog
                isOpen={isConfirmOpen}
                onClose={() => !isProcessing && setIsConfirmOpen(false)}
                title="Fire Emergency Alert"
                description="Are you sure you want to trigger a fire emergency alert? This will notify staff members immediately via SMS and email."
                isYes={handleConfirm}
                type="error"
                yesText={isProcessing ? 'Sending...' : 'Yes, Send Alert'}
                cancelText="Cancel"
            />
        </>
    );
}
