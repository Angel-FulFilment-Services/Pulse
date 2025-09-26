import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * CallRecordings Utility
 * Handles Apex call conversion and audio processing
 */
export class CallRecordings {
    
    /**
     * Convert an Apex call to knowledge base format
     * @param {string} apexId - The Apex call ID
     * @returns {Promise<Object>} - Converted call data
     */
    static async convertApexCall(apexId) {
        if (!apexId) {
            throw new Error('Apex ID is required');
        }

        try {
            const response = await axios.post('/api/call/convert', {
                apexId: apexId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Conversion failed');
            }
        } catch (error) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Network error during conversion');
        }
    }

     /**
     * Convert Apex call (direct promise for use with Toast)
     * @param {string} apexId - The Apex call ID
     * @returns {Promise<Object>} - Converted call data
     */
    static async convertApexCallWithToast(apexId) {
        const conversionPromise = this.convertApexCall(apexId);

        return toast.promise(
            conversionPromise,
            {
                pending: {
                    render() {
                        return "Converting call from .gsm to .wav";
                    },
                    icon: true,
                },
                success: {
                    render({ data }) {
                        return `Call converted successfully!`;
                    },
                    icon: true,
                },
                error: {
                    render({ data }) {
                        return `Conversion failed: ${data?.message || 'Unknown error'}`;
                    },
                    icon: true,
                }
            },
            {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            }
        );
    }

    /**
     * Convert Apex call (direct promise for use with PromiseDialog)
     * @param {string} apexId - The Apex call ID
     * @returns {Promise<Object>} - Converted call data
     */
    static convertApexCallPromise(apexId) {
        return this.convertApexCall(apexId);
    }

    /**
     * Convert base64 audio data to blob for playback
     * @param {string} base64Data - Base64 encoded audio data
     * @param {string} mimeType - MIME type of the audio
     * @returns {string} - Blob URL for audio playback
     */
    static convertAudioDataToBlob(base64Data, mimeType = 'audio/wav') {
        try {
            const audioBlob = new Blob([
                Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
            ], { type: mimeType });

            return URL.createObjectURL(audioBlob);
        } catch (error) {
            console.error('Error converting audio data to blob:', error);
            throw new Error('Failed to process audio data');
        }
    }

    /**
     * Create an audio element from converted call recording
     * @param {Object} recordingData - Recording data from conversion
     * @returns {HTMLAudioElement} - Audio element ready for playback
     */
    static createAudioElement(recordingData) {
        if (!recordingData?.content) {
            throw new Error('No audio content provided');
        }

        const audioUrl = this.convertAudioDataToBlob(
            recordingData.content, 
            recordingData.mime_type || 'audio/wav'
        );

        const audio = new Audio(audioUrl);
        audio.controls = true;
        audio.preload = 'metadata';
        
        // Set data attributes for cleanup
        audio.setAttribute('data-apex-id', recordingData.apex_id || '');
        audio.setAttribute('data-blob-url', audioUrl);

        return audio;
    }

    /**
     * Clean up blob URLs to prevent memory leaks
     * @param {string|HTMLAudioElement} audioOrUrl - Audio element or blob URL
     */
    static cleanupAudioBlob(audioOrUrl) {
        try {
            let blobUrl;
            
            if (typeof audioOrUrl === 'string') {
                blobUrl = audioOrUrl;
            } else if (audioOrUrl instanceof HTMLAudioElement) {
                blobUrl = audioOrUrl.getAttribute('data-blob-url') || audioOrUrl.src;
            }

            if (blobUrl && blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.warn('Error cleaning up audio blob:', error);
        }
    }

    /**
     * Format audio recording data for use in rich text editor
     * @param {Object} recordingData - Recording data from conversion
     * @returns {Object} - Formatted data for editor
     */
    static formatRecordingForEditor(recordingData) {
        if (!recordingData?.content) {
            return null;
        }

        const audioUrl = this.convertAudioDataToBlob(
            recordingData.content, 
            recordingData.mime_type || 'audio/wav'
        );

        return {
            url: audioUrl,
            filename: recordingData.filename || `${recordingData.apex_id}.wav`,
            size: recordingData.size || 0,
            type: recordingData.mime_type || 'audio/wav',
            apexId: recordingData.apex_id
        };
    }

    /**
     * Insert audio recording into rich text editor content
     * @param {string} content - Current editor content
     * @param {Object} recordingData - Recording data from conversion
     * @returns {string} - Updated content with audio
     */
    static insertAudioIntoContent(content, recordingData) {
        if (!recordingData?.content) {
            return content;
        }

        const audioData = this.formatRecordingForEditor(recordingData);
        
        // Extract just the filename part, handling both [AUDIO:path] format and direct filename
        let cleanFilename = audioData.filename;
        if (cleanFilename.startsWith('[AUDIO:') && cleanFilename.endsWith(']')) {
            // Extract from [AUDIO:knowledge-base/audio/filename.ext] format
            const match = cleanFilename.match(/\[AUDIO:.*\/([^\/\]]+)\]/);
            if (match) {
                cleanFilename = match[1];
            }
        } else if (cleanFilename.includes('/')) {
            // Extract from path/to/filename.ext format
            cleanFilename = cleanFilename.split('/').pop();
        }
        
        // Create audio HTML element for the editor
        const audioHtml = `
            <audio 
                controls 
                src="${audioData.url}" 
                data-audio-name="${cleanFilename}"
                data-apex-id="${audioData.apexId}"
                style="width: 100%;">
                Your browser does not support the audio element.
            </audio>
        `;

        // Insert at the beginning of content
        return audioHtml + '\n\n' + content;
    }
}

export default CallRecordings;