import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../../css/quill-custom.css';
import { stripHtmlTags, convertToMarkdown } from '../../Utils/Sanitisers';
import { audioModule, initAudioIcon } from './QuillAudioModule';

export default function EditorInput({
  value,
  onChange,
  placeholder = "Start writing...",
  height = "h-80",
  error = null,
  clearErrors = null,
  label = null,
  annotation = null,
  disabled = false,
  outputFormat = "html", // "html" or "markdown"
  modules: customModules,
  formats: customFormats,
  className = "",
  ...props
}) {
  const quillRef = useRef();
  // Default modules configuration
  const defaultModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'audio'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  // Default formats configuration
  const defaultFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'blockquote', 'code-block',
    'link', 'image', 'audio', 'align', 'color', 'background'
  ];

  // Merge custom modules with defaults and include audio handlers
  const modules = customModules ? { 
    ...defaultModules, 
    ...customModules 
  } : {
    ...defaultModules,
    toolbar: {
      container: defaultModules.toolbar,
      handlers: audioModule.toolbar.handlers
    }
  };
  const formats = customFormats || defaultFormats;

  // Initialize audio icon after component mounts
  useEffect(() => {
    initAudioIcon();
  }, []);

  // Handle change with optional markdown conversion
  const handleChange = (content) => {
    if (outputFormat === "markdown") {
      const markdownContent = convertToMarkdown(content);
      onChange(markdownContent);
    } else {
      onChange(content);
    }
    if (clearErrors) clearErrors();
  };

  // Validate that there's meaningful content
  const hasContent = value && stripHtmlTags(value).length > 0;
  const isFlexHeight = height === 'flex-1';

  return (
    <div className={`w-full ${isFlexHeight ? 'h-full flex flex-col' : ''} ${className}`}>
      { (label || annotation) &&
        <label className={`block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2 ${isFlexHeight ? 'flex-shrink-0' : ''}`}>
          {label}
          { annotation && 
            <span className='text-neutral-500 dark:text-dark-400 font-normal'> {annotation} </span>
          }
        </label>
      }
      
      <div className={`quill-editor rounded-lg overflow-hidden ${isFlexHeight ? 'flex-1 min-h-0' : ''} ${
        error ? 'ring-1 ring-red-500' : ''
      }`}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          className={height}
          {...props}
        />
      </div>

      {error && (
        <p className={`mt-2 text-sm text-red-600 dark:text-red-400 ${isFlexHeight ? 'flex-shrink-0' : ''}`}>{error}</p>
      )}

      <p className={`mt-1 text-sm text-gray-500 dark:text-dark-400 ${isFlexHeight ? 'flex-shrink-0' : ''}`}>
        Use the toolbar above to format your content. Bold, italic, lists, links and more are supported.
      </p>
    </div>
  );
}
