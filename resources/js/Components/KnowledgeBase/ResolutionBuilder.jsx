import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import ImageUpload from './ImageUpload';

export default function ResolutionBuilder({ 
  resolution, 
  onResolutionUpdate, 
  onRestart, 
  onClose, 
  isEditing,
  isParentInitialized = false,
  allQuestions = [], // Add access to all questions for next question selection
  onNavigateToQuestion = null, // Add callback for navigating to next question
  onAddQuestion = null // Add callback for adding new questions
}) {
  const [editingTitle, setEditingTitle] = useState(resolution.title);
  const [editingBody, setEditingBody] = useState(resolution.body);
  const [editingImage, setEditingImage] = useState(
    resolution.image 
      ? (typeof resolution.image === 'string' ? resolution.image : resolution.image)
      : null
  );
  const [editingNextQuestionId, setEditingNextQuestionId] = useState(resolution.next_question_id || null);

  const handleNextQuestionChange = (value) => {
    if (value === 'ADD_NEW_QUESTION') {
      // Add a new question and link it
      if (onAddQuestion) {
        onAddQuestion(); // This will create a new question
      }
    } else {
      setEditingNextQuestionId(value || null);
    }
  };
  const isInitialMount = useRef(true);

  // Reset state when resolution changes
  useEffect(() => {
    setEditingTitle(resolution.title);
    setEditingBody(resolution.body);
    setEditingImage(
      resolution.image 
        ? (typeof resolution.image === 'string' ? resolution.image : resolution.image)
        : null
    );
    setEditingNextQuestionId(resolution.next_question_id || null);
    // Reset the initial mount flag when resolution changes
    isInitialMount.current = true;
  }, [resolution.id]);

  // Auto-save to memory when editing values change
  useEffect(() => {
    // Skip if parent hasn't finished initializing yet
    if (!isParentInitialized) {
      return;
    }
    
    // Skip the initial mount to prevent triggering changes on load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const updatedResolution = {
      ...resolution,
      title: editingTitle,
      body: editingBody,
      image: editingImage,
      next_question_id: editingNextQuestionId
    };
    onResolutionUpdate(updatedResolution);
  }, [editingTitle, editingBody, editingImage, editingNextQuestionId, isParentInitialized]);

  return (
    <div className="space-y-6">
      {/* Success/Resolution Header */}
      {!isEditing && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-100 mb-2">
            Recommended Solution
          </h3>
        </div>
      )}

      {/* Resolution Image */}
      {(resolution.image || isEditing) && (
        <div className="flex justify-center">
          {isEditing ? (
            <div className="w-full max-w-lg">
              <ImageUpload 
                currentImage={editingImage}
                onImageChange={setEditingImage}
                placeholder="Drop a resolution image here or click to upload"
              />
            </div>
          ) : resolution.image && (
            <img 
              src={
                typeof resolution.image === 'object' && resolution.image.isNew 
                  ? resolution.image.dataUrl 
                  : `https://pulse.cdn.angelfs.co.uk/articles/questions/${resolution.image}`
              } 
              alt={resolution.title}
              className="max-w-lg h-auto rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-4"
            />
          )}
        </div>
      )}

      {/* Resolution Content */}
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        {isEditing ? (
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300">
              Resolution Title
            </label>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 text-xl font-semibold text-center"
            />
          </div>
        ) : (
          <h4 className="text-xl font-semibold text-gray-900 dark:text-dark-100 mb-4 text-center">
            {resolution.title}
          </h4>
        )}

        {/* Body */}
        {isEditing ? (
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300">
              Resolution Content (Markdown supported)
            </label>
            <textarea
              value={editingBody}
              onChange={(e) => setEditingBody(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 font-mono text-sm"
              rows="10"
            />
            <div className="text-xs text-gray-500 dark:text-dark-400">
              Preview:
            </div>
            <div className="border border-gray-200 dark:border-dark-700 rounded-lg p-4 bg-gray-50 dark:bg-dark-900">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 mt-6" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-100 mb-3 mt-5" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-3 mt-4" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-base font-semibold text-gray-900 dark:text-dark-100 mb-2 mt-3" {...props} />,
                  p: ({node, ...props}) => <p className="text-gray-700 dark:text-dark-200 mb-4 leading-7" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-dark-200 pl-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-dark-200 pl-4" {...props} />,
                  li: ({node, ...props}) => <li className="leading-7" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-theme-500 pl-4 italic text-gray-600 dark:text-dark-300 my-4 bg-gray-50 dark:bg-dark-800 py-2" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? 
                      <code className="bg-gray-100 dark:bg-dark-800 px-2 py-1 rounded text-sm font-mono text-theme-600 dark:text-theme-400" {...props} /> :
                      <code className="block bg-gray-100 dark:bg-dark-800 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-gray-100 dark:bg-dark-800 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                  a: ({node, ...props}) => <a className="text-theme-600 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-300 underline" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-dark-100" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                }}
              >
                {editingBody}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 mt-6" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-100 mb-3 mt-5" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-3 mt-4" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-base font-semibold text-gray-900 dark:text-dark-100 mb-2 mt-3" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-700 dark:text-dark-200 mb-4 leading-7" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-dark-200 pl-4" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-dark-200 pl-4" {...props} />,
                li: ({node, ...props}) => <li className="leading-7" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-theme-500 pl-4 italic text-gray-600 dark:text-dark-300 my-4 bg-gray-50 dark:bg-dark-800 py-2" {...props} />,
                code: ({node, inline, ...props}) => 
                  inline ? 
                    <code className="bg-gray-100 dark:bg-dark-800 px-2 py-1 rounded text-sm font-mono text-theme-600 dark:text-theme-400" {...props} /> :
                    <code className="block bg-gray-100 dark:bg-dark-800 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props} />,
                pre: ({node, ...props}) => <pre className="bg-gray-100 dark:bg-dark-800 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                a: ({node, ...props}) => <a className="text-theme-600 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-300 underline" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-dark-100" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
              }}
            >
              {resolution.body}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Next Question Selection (Editing Mode) */}
      {isEditing && (
        <div className="max-w-3xl mx-auto mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
            If User Clicks "No" - Go to Question
          </label>
          <select
            value={editingNextQuestionId || ''}
            onChange={(e) => handleNextQuestionChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-theme-500 dark:focus:ring-theme-600"
          >
            <option value="">Do not show</option>
            {allQuestions.map((question, index) => (
              <option key={question.id} value={question.id}>
                Q{index + 1}: {(question.question || 'Untitled Question').substring(0, 50)}{(question.question || '').length > 50 ? '...' : ''}
              </option>
            ))}
            <option value="ADD_NEW_QUESTION" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
              + Add New Question
            </option>
          </select>
          <div className="mt-1 text-sm text-gray-500 dark:text-dark-400">
            Select which question users should go to if they click "No" to the feedback question.
          </div>
        </div>
      )}

      {/* Feedback Question (Preview Mode Only) - Only show if next_question_id is specified */}
      {!isEditing && resolution.next_question_id && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Did this resolution fix your issue?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 min-w-[100px]"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  if (resolution.next_question_id && onNavigateToQuestion) {
                    onNavigateToQuestion(resolution.next_question_id);
                  } else {
                    onClose();
                  }
                }}
                className="bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 min-w-[100px]"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
