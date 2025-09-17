// Audio utility functions for file conversion and processing
import { toast } from 'react-toastify';

// Convert GSM to WAV by trying different raw audio interpretations
export async function convertGsmToWav(file) {
  try {
    toast.info('Converting GSM to WAV...', { 
      toastId: 'gsm-conversion',
      autoClose: false 
    });
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check if it's actually already a WAV file
    const header = String.fromCharCode(...uint8Array.slice(0, 4));
    if (header === 'RIFF') {
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      
      toast.update('gsm-conversion', {
        render: 'File is already in WAV format!',
        type: 'success',
        autoClose: 3000
      });
      
      return new File([arrayBuffer], `${originalName}.wav`, { type: 'audio/wav' });
    }
    
    // Try Web Audio API first (for standard audio formats with wrong extension)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      
      // Success! Convert AudioBuffer to WAV
      const wavBuffer = audioBufferToWav(audioBuffer);
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      
      toast.update('gsm-conversion', {
        render: 'Audio file converted successfully!',
        type: 'success',
        autoClose: 3000
      });
      
      return new File([wavBuffer], `${originalName}.wav`, { type: 'audio/wav' });
      
    } catch (webAudioError) {
      console.log('Web Audio API failed, trying raw audio conversion');
      
      // Try treating as raw 16-bit signed PCM data
      const pcmSamples = rawToPcm(uint8Array);
      const wavBuffer = createWavFile(pcmSamples, 8000, 1);
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      
      toast.update('gsm-conversion', {
        render: 'GSM converted as raw audio data!',
        type: 'success',
        autoClose: 3000
      });
      
      return new File([wavBuffer], `${originalName}.wav`, { type: 'audio/wav' });
    }
    
  } catch (error) {
    console.error('GSM conversion failed:', error);
    
    toast.update('gsm-conversion', {
      render: 'GSM conversion failed. Please use WAV, MP3, or OGG format.',
      type: 'error',
      autoClose: 5000
    });
    
    throw new Error(`GSM conversion failed: ${error.message}`);
  }
}

// Convert raw bytes to PCM samples - handle 32-bit float format
function rawToPcm(rawData) {
  // GSM files are 32-bit float samples at 8000 Hz mono
  if (rawData.length % 4 === 0) {
    const sampleCount = rawData.length / 4;
    const samples = new Int16Array(sampleCount);
    const dataView = new DataView(rawData.buffer);
    
    for (let i = 0; i < sampleCount; i++) {
      // Read 32-bit float (little-endian)
      const floatSample = dataView.getFloat32(i * 4, true);
      
      // Convert float (-1.0 to 1.0) to 16-bit signed integer (-32768 to 32767)
      const intSample = Math.round(floatSample * 32767);
      
      // Clamp to valid range
      samples[i] = Math.max(-32768, Math.min(32767, intSample));
    }
    
    return samples;
  } else {
    // Fallback for other formats
    const samples = new Int16Array(rawData.length);
    
    for (let i = 0; i < rawData.length; i++) {
      const sample = (rawData[i] - 128) * 256;
      samples[i] = Math.max(-32768, Math.min(32767, sample));
    }
    
    return samples;
  }
}

// Create a proper WAV file from PCM samples
function createWavFile(samples, sampleRate, channels) {
  const length = samples.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // Write WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true); // File size
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, channels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * channels * 2, true); // ByteRate
  view.setUint16(32, channels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, length * 2, true); // Subchunk2Size
  
  // Write sample data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }
  
  return buffer;
}

// Convert AudioBuffer to WAV format
export function audioBufferToWav(buffer) {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Convert audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}

// Check if a file is a GSM audio file
export function isGsmFile(file) {
  return file.name.toLowerCase().endsWith('.gsm') || file.type === 'audio/gsm';
}

// Get supported audio file extensions
export function getSupportedAudioExtensions() {
  return ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
}
