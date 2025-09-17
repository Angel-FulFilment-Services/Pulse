import { Quill } from 'react-quill';
import { convertGsmToWav, isGsmFile, getSupportedAudioExtensions } from '../../Utils/Audio';
import { toast } from 'react-toastify';

// Custom audio blot for Quill
const BlockEmbed = Quill.import('blots/block/embed');

class AudioBlot extends BlockEmbed {
  static create(value) {
    let node = super.create();
    node.setAttribute('controls', true);
    node.setAttribute('src', value.src);
    node.setAttribute('data-audio-name', value.name || '');
    node.style.width = '100%';
    node.style.maxWidth = '400px';
    return node;
  }

  static value(node) {
    return {
      src: node.getAttribute('src'),
      name: node.getAttribute('data-audio-name')
    };
  }

  static formats(node) {
    return {
      src: node.getAttribute('src'),
      name: node.getAttribute('data-audio-name')
    };
  }
}

AudioBlot.blotName = 'audio';
AudioBlot.tagName = 'audio';

// Register the audio blot
Quill.register(AudioBlot);

// Add SVG icon to audio button after Quill initializes
const addAudioIcon = () => {
  const audioButton = document.querySelector('.ql-toolbar .ql-audio');
  if (audioButton && !audioButton.querySelector('svg')) {
    audioButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
        <path fill-rule="evenodd" d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122Z" clip-rule="evenodd" />
      </svg>

    `;
  }
};

// Custom audio toolbar handler
async function audioHandler() {
  try {
    // Use modern File System Access API if available
    if ('showOpenFilePicker' in window) {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Audio files',
          accept: {
            'audio/*': getSupportedAudioExtensions()
          }
        }],
        multiple: false
      });
      
      let file = await fileHandle.getFile();
      
      // Check if it's a GSM file and process it
      if (isGsmFile(file)) {
        const conversionPromise = convertGsmToWav(file);
        
        file = await toast.promise(
          conversionPromise,
          {
            pending: 'Processing GSM audio file...',
            success: {
              render({data}) {
                if (data.name.endsWith('.wav')) {
                  return 'GSM converted to WAV successfully! 🎵';
                } else {
                  return 'GSM file processed successfully! 🎵';
                }
              }
            },
            error: 'Failed to process audio file'
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
      }
      
      const audioUrl = URL.createObjectURL(file);
      const selection = this.quill.getSelection(true);
      const index = selection ? selection.index : this.quill.getLength();
      
      // Insert the audio embed
      this.quill.insertEmbed(index, 'audio', {
        src: audioUrl,
        name: file.name
      });
      
      // Position cursor after the audio
      this.quill.setSelection(index + 1);
    }
  } catch (error) {
    // User cancelled or error occurred
    console.log('File selection cancelled or failed:', error);
  }
}

// Export the audio module configuration
export const audioModule = {
  toolbar: {
    handlers: {
      audio: audioHandler
    }
  }
};

// Call this after Quill is initialized
export const initAudioIcon = addAudioIcon;

// Export for manual registration if needed
export { AudioBlot };
