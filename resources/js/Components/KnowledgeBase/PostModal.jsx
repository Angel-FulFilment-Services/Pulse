import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Modal from '../Modals/Modal';
import PromiseDialog from '../Dialogs/PromiseDialog';
import TextInput from '../Forms/TextInput';
import TextAreaInput from '../Forms/TextAreaInput';
import EditorInput from '../Forms/EditorInput';
import TagInput from '../Forms/TagInput';
import { stripHtmlTags, convertToMarkdown } from '../../Utils/Sanitisers';
import { toast } from 'react-toastify';
import axios from 'axios';
import { TagIcon } from '@heroicons/react/24/outline';
import CallRecordings from '../../Utils/CallRecordings.jsx';

export default function PostModal({ 
  isOpen, 
  onClose, 
  activeTab, 
  onPostCreated, 
  onPostUpdated,
  editPost = null, // Post object to edit, null for creating new post
  apexId = null // Apex ID to convert and load into content
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPromiseDialog, setShowPromiseDialog] = useState(false);
  const [conversionPromise, setConversionPromise] = useState(null);

  const isEditMode = !!editPost;

  // Utility function to format activeTab display
  const formatTabDisplay = (tab) => {
    if (!tab) return '';
    return tab
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Load post data when editing or handle Apex conversion when creating
  useEffect(() => {
    if (isEditMode && editPost) {
      setTitle(editPost.title || '');
      setDescription(editPost.description || '');
      setContent(editPost.content || '');
      setTags(editPost.tags || []);
    } else if (isOpen && !isEditMode && apexId) {
      // Convert Apex call and load into content
      handleApexConversion();
    } else if (isOpen && !isEditMode) {
      // Reset form for new post without Apex data
      resetForm();
    }
  }, [editPost, isEditMode, isOpen, apexId]);

  // Handle Apex call conversion
  const handleApexConversion = () => {
    const promise = CallRecordings.convertApexCallPromise(apexId);
    setConversionPromise(promise);
    setShowPromiseDialog(true);
  };

  // Handle successful conversion
  const handleConversionSuccess = (recordingData) => {
    // Insert audio directly into content like QuillAudioModule does
    let updatedContent = '';
    if (recordingData) {
      updatedContent = CallRecordings.insertAudioIntoContent(
        updatedContent, 
        recordingData
      );
    }
    
    setContent(updatedContent);
    setErrors({}); // Clear any existing errors
  };

  // Handle conversion error
  const handleConversionError = (error) => {
    console.error('Error converting Apex call:', error);
  };

  const resetForm = () => {
    // Clean up any audio blobs before resetting
    cleanupAudioBlobs();
    
    setTitle('');
    setDescription('');
    setContent('');
    setTags([]);
    setErrors({});
  };

  // Clean up audio blobs from content to prevent memory leaks
  const cleanupAudioBlobs = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const audioElements = doc.querySelectorAll('audio[src^="blob:"]');
      
      audioElements.forEach(audio => {
        CallRecordings.cleanupAudioBlob(audio);
      });
    } catch (error) {
      console.warn('Error cleaning up audio blobs:', error);
    }
  };

  const clearErrors = () => {
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!content.trim() || (stripHtmlTags(content).trim().length === 0 && !content.includes('<audio'))) {
      newErrors.content = 'Content is required';
    }
    
    if (!tags || tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to extract audio files from content
  const extractAudioFiles = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const audioElements = doc.querySelectorAll('audio[data-audio-name]');
    
    const audioFiles = [];
    audioElements.forEach(audio => {
      const src = audio.getAttribute('src');
      const filename = audio.getAttribute('data-audio-name');
      
      if (src && src.startsWith('blob:') && filename) {
        audioFiles.push({
          src: src,
          filename: filename
        });
      }
    });
    
    return audioFiles;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert HTML content to Markdown
      const markdownContent = convertToMarkdown(content);
      
      // Extract audio files from the content
      const audioFiles = extractAudioFiles(content);

      // Check if we have audio files to upload
      const hasAudioFiles = audioFiles && audioFiles.length > 0;
      
      let requestData;
      let requestConfig = {};
      
      if (hasAudioFiles) {
        // We need to fetch the blob URLs and convert them to File objects
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('content', markdownContent.trim());
        
        // Append tags as individual array items
        tags.forEach((tag, index) => {
          formData.append(`tags[${index}]`, tag);
        });
        
        formData.append('category', activeTab || 'general');
        
        // Fetch and add audio files
        for (let i = 0; i < audioFiles.length; i++) {
          const audioFile = audioFiles[i];
          try {
            const response = await fetch(audioFile.src);
            const blob = await response.blob();
            
            // Determine MIME type based on file extension if blob type is not set
            let mimeType = blob.type;
            if (!mimeType || mimeType === 'application/octet-stream') {
              const extension = audioFile.filename.split('.').pop().toLowerCase();
              switch (extension) {
                case 'wav':
                  mimeType = 'audio/wav';
                  break;
                case 'mp3':
                  mimeType = 'audio/mpeg';
                  break;
                case 'ogg':
                  mimeType = 'audio/ogg';
                  break;
                case 'gsm':
                  mimeType = 'audio/gsm';
                  break;
                default:
                  mimeType = 'audio/wav'; // Default fallback
              }
            }
            
            const file = new File([blob], audioFile.filename, { type: mimeType });
            
            // Check file size (2MB limit to match PHP settings)
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (file.size > maxSize) {
              toast.error(`Audio file "${audioFile.filename}" is too large. Maximum size is 2MB.`, {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
              });
              setIsSubmitting(false);
              return;
            }
            
            formData.append(`soundfiles[${i}]`, file);
          } catch (error) {
            console.error('Error fetching audio file:', error);
            toast.error(`Failed to process audio file: ${audioFile.filename}`, {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
            setIsSubmitting(false);
            return; // Stop submission if file processing fails
          }
        }
        
        requestData = formData;
        // Don't set Content-Type header - axios will set it automatically with boundary
        requestConfig = {};
    } else {
        // Use regular JSON for requests without files
        requestData = {
          title: title.trim(),
          description: description.trim(),
          content: markdownContent.trim(),
          tags: tags,
          category: activeTab || 'general'
        };
      }

      const endpoint = isEditMode 
        ? `/knowledge-base/${editPost.id}` 
        : '/knowledge-base/create';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const successMessage = isEditMode 
        ? 'Article updated successfully!' 
        : 'Article created successfully!';

      const pendingMessage = isEditMode 
        ? 'Updating article...' 
        : 'Creating article...';

      toast.promise(
        axios({
          method,
          url: endpoint,
          data: requestData,
          ...requestConfig
        }),
        {
          pending: pendingMessage,
          success: successMessage,
          error: isEditMode 
            ? 'Failed to update article' 
            : 'Failed to create article'
        }, {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light',
          }
      ).then((response) => {
        // Clean up blob URLs to prevent memory leaks
        if (hasAudioFiles) {
          audioFiles.forEach(audioFile => {
            if (audioFile.src.startsWith('blob:')) {
              URL.revokeObjectURL(audioFile.src);
            }
          });
        }
        
        onClose();
        
        // Delay form reset to allow modal closing animation to complete
        setTimeout(() => {
          resetForm();
        }, 300);
        
        if (isEditMode && onPostUpdated) {
          onPostUpdated(response.data.article);
        } else if (!isEditMode && onPostCreated) {
          onPostCreated(response.data.article);
        }
      }).catch((error) => {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} article:`, error);
        
        if (error.response?.data?.errors) {
          console.log('Validation errors:', error.response.data.errors);
          setErrors(error.response.data.errors);
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message, {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light',
          });
        } else {
          toast.error('An unexpected error occurred', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light',
          });
        }
      }).finally(() => {
        setIsSubmitting(false);
      });

    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} article:`, error);
      toast.error('An unexpected error occurred', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light',
          });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      
      // If we had an apexId, revert URL back to knowledge-base/call-hub
      if (apexId) {
        router.visit('/knowledge-base/call-hub', { 
          preserveState: true,
          preserveScroll: true,
          replace: true 
        });
      }
      
      // Delay form reset to allow modal closing animation to complete
      setTimeout(() => {
        resetForm();
      }, 300); // 300ms delay should be sufficient for most modal animations
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center">
          {isEditMode ? 'Edit Article' : 'Create New Article'}
          {activeTab && (
            <span
                className="text-xs ml-2 relative z-10 rounded-full bg-theme-50 px-3 py-1.5 font-medium text-theme-600 ring-1 ring-theme-500/10 dark:bg-theme-600 dark:text-theme-300 dark:ring-theme-700/20"
            >
              {formatTabDisplay(activeTab)}
            </span>
          )}
        </div>
      }
      description={
        isEditMode 
            ? "Edit the knowledge base article with rich content and tags." 
            : "Create a new knowledge base article with rich content and tags."
      }
      size="xl"
      fullHeight={true}
      closeOnClickOutside={false}
    >
      <div className="px-6 py-4 pb-6 h-full flex flex-col">
        {/* Form */}
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Title Input */}
          <div className="flex-shrink-0">
            <TextInput
              id="title"
              label="Title"
              placeholder="Enter article title..."
              currentState={title}
              onTextChange={(value) => setTitle(value)}
              returnRaw={true}
              error={errors.title}
              clearErrors={clearErrors}
              disabled={isSubmitting}
            />
          </div>

          {/* Description Input */}
          <div className="flex-shrink-0">
            <TextAreaInput
              id="description"
              label="Description"
              placeholder="Brief description of the article..."
              currentState={description}
              onTextChange={(data) => setDescription(data[0].value)}
              rows={3}
              height="h-16"
              maxLength={200}
              warnMaxLength={true}
              error={errors.description}
              clearErrors={clearErrors}
              isDisabled={isSubmitting}
            />
          </div>

          {/* Tags Input */}
          <div className="flex-shrink-0">
            <TagInput
              id="tags"
              tags={tags}
              label="Tags"
              annotation=""
              error={errors.tags}
              clearErrors={clearErrors}
              onTagsChange={setTags}
              placeholder="Add tags..."
              maxTags={10}
              Icon={TagIcon}
            />
          </div>

          {/* Rich Text Editor - Takes remaining space */}
          <div className="flex-1 min-h-0">
            <EditorInput
              value={content}
              onChange={setContent}
              label="Content"
              placeholder="Write your article content here..."
              error={errors.content}
              clearErrors={clearErrors}
              height="flex-1"
              className="h-full"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-dark-600">
          <button
            type="button"
            className="rounded-lg bg-white dark:bg-dark-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-dark-100 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-theme-600 border border-gray-300 dark:border-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-theme-500 px-4 py-2 text-sm font-medium text-white hover:bg-theme-600 focus:outline-none focus:ring-2 focus:ring-theme-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting 
              ? (isEditMode ? 'Updating...' : 'Creating...') 
              : (isEditMode ? 'Update Article' : 'Create Article')
            }
          </button>
        </div>
      </div>

      {/* Promise Dialog for Apex call conversion */}
      <PromiseDialog
        isOpen={showPromiseDialog}
        onClose={() => setShowPromiseDialog(false)}
        promise={conversionPromise}
        pendingTitle="Converting Call"
        pendingDescription="Converting call recording from GSM to WAV format..."
        successTitle="Conversion Complete"
        successDescription="Call recording has been successfully converted and added to the article content."
        errorTitle="Conversion Failed"
        errorDescription="Failed to convert call recording. Please try again."
        pendingTexts={[
          "Downloading GSM recording...",
          "Converting to WAV format...",
          "Processing audio data...",
          "Almost ready!"
        ]}
        onSuccess={handleConversionSuccess}
        onError={handleConversionError}
        autoCloseDelay={1000}
      />
    </Modal>
  );
}
