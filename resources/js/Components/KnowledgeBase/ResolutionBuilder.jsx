import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import ImageUpload from './ImageUpload';
import ImageWithLoading from './ImageWithLoading';

export default function ResolutionBuilder({ 
  resolution, 
  onResolutionUpdate, 
  onRestart, 
  onClose, 
  isEditing,
  isParentInitialized = false,
  allQuestions = [], // Add access to all questions for next question selection
  allResolutions = [], // Add access to all resolutions for next resolution selection
  onNavigateToQuestion = null, // Add callback for navigating to next question
  onNavigateToResolution = null, // Add callback for navigating to next resolution
  onAddQuestion = null, // Add callback for adding new questions
  onAddResolution = null, // Add callback for adding new resolutions
  isSaving = false
}) {
  const [editingTitle, setEditingTitle] = useState(resolution.title);
  const [editingBody, setEditingBody] = useState(resolution.body);
  const [editingImage, setEditingImage] = useState(
    resolution.image 
      ? (typeof resolution.image === 'string' ? resolution.image : resolution.image)
      : null
  );
  const [editingNextQuestionId, setEditingNextQuestionId] = useState(resolution.next_question_id || null);
  const [editingNextResolutionId, setEditingNextResolutionId] = useState(resolution.next_resolution_id || null);
  const [editingNextArticleId, setEditingNextArticleId] = useState(resolution.next_article_id || null);
  const [availableArticles, setAvailableArticles] = useState([]);
  const isInitialMount = useRef(true);

  // Fetch available articles for selection
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/knowledge-base/articles');
        const data = await response.json();
        setAvailableArticles(data.articles || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setAvailableArticles([]);
      }
    };
    
    if (isEditing) {
      fetchArticles();
    }
  }, [isEditing]);

  const handleNextQuestionChange = (value) => {
    if (value === 'ADD_NEW_QUESTION') {
      // Add a new question and link it
      if (onAddQuestion) {
        onAddQuestion(); // This will create a new question
      }
    } else {
      const processedValue = value === '' ? null : value;
      setEditingNextQuestionId(processedValue);
      // Clear resolution selection when question is selected
      if (processedValue) {
        setEditingNextResolutionId(null);
      }
    }
  };

  const handleNextResolutionChange = (value) => {
    if (value === 'ADD_NEW_RESOLUTION') {
      // Add a new resolution and link it
      if (onAddResolution) {
        onAddResolution(); // This will create a new resolution
      }
    } else {
      const processedValue = value === '' ? null : value;
      setEditingNextResolutionId(processedValue);
      // Clear question selection when resolution is selected
      if (processedValue) {
        setEditingNextQuestionId(null);
      }
    }
  };

  const handleNextArticleChange = (value) => {
    const processedValue = value === '' ? null : value;
    setEditingNextArticleId(processedValue);
    // Article selection is independent of feedback navigation
  };

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
    setEditingNextResolutionId(resolution.next_resolution_id || null);
    setEditingNextArticleId(resolution.next_article_id || null);
    // Reset the initial mount flag when resolution changes
    isInitialMount.current = true;
  }, [resolution.id]);

  // Auto-save to memory when editing values change
  useEffect(() => {
    // Skip if parent hasn't finished initializing yet
    if (!isParentInitialized) {
      return;
    }
    
    // Skip if not in editing mode
    if (!isEditing) {
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
      next_question_id: editingNextQuestionId && editingNextQuestionId !== '' && editingNextQuestionId !== 'null' 
        ? (editingNextQuestionId.toString().startsWith('temp_') ? editingNextQuestionId : Number(editingNextQuestionId))
        : null,
      next_resolution_id: editingNextResolutionId && editingNextResolutionId !== '' && editingNextResolutionId !== 'null' 
        ? (editingNextResolutionId.toString().startsWith('temp_') ? editingNextResolutionId : Number(editingNextResolutionId))
        : null,
      next_article_id: editingNextArticleId && editingNextArticleId !== '' && editingNextArticleId !== 'null' 
        ? Number(editingNextArticleId)
        : null
    };
    onResolutionUpdate(updatedResolution);
  }, [editingTitle, editingBody, editingImage, editingNextQuestionId, editingNextResolutionId, editingNextArticleId, isParentInitialized, isEditing]);

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
                onImageChange={isSaving ? undefined : setEditingImage}
                disabled={isSaving}
                placeholder="Drop a resolution image here or click to upload"
              />
            </div>
          ) : resolution.image && (
            <ImageWithLoading
              filename={resolution.image}
              alt={resolution.title}
              className="max-w-lg h-auto rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-4"
              loadingContainerClassName="max-w-lg h-48 rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-4"
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
              onChange={isSaving ? undefined : (e) => setEditingTitle(e.target.value)}
              disabled={isSaving}
              className={`w-full p-3 border rounded-lg text-xl font-semibold text-center transition-all ${
                isSaving 
                  ? 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                  : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100'
              }`}
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
              onChange={isSaving ? undefined : (e) => setEditingBody(e.target.value)}
              disabled={isSaving}
              className={`w-full p-3 border rounded-lg font-mono text-sm transition-all ${
                isSaving 
                  ? 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                  : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100'
              }`}
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

      {/* Next Question/Resolution Selection (Editing Mode) */}
      {isEditing && (
        <div className="max-w-3xl mx-auto mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-4">
            Navigation Options
          </label>
          
          {/* Feedback Navigation */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-600 dark:text-dark-400 mb-2">
              If User Clicks "No" to Feedback Question - Go to:
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Question Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-dark-400 mb-1">
                  Question
                </label>
                <select
                  value={editingNextQuestionId || ''}
                  onChange={isSaving ? undefined : (e) => handleNextQuestionChange(e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                    isSaving 
                      ? 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                      : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 focus:ring-theme-500 dark:focus:ring-theme-600'
                  }`}
                >
                  <option value="">None</option>
                  {allQuestions.map((question, index) => (
                    <option key={question.id} value={question.id}>
                      Q{index + 1}: {(question.question || 'Untitled Question').substring(0, 30)}{(question.question || '').length > 30 ? '...' : ''}
                    </option>
                  ))}
                  <option value="ADD_NEW_QUESTION" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                    + Add New Question
                  </option>
                </select>
              </div>

              {/* Resolution Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-dark-400 mb-1">
                  Resolution
                </label>
                <select
                  value={editingNextResolutionId || ''}
                  onChange={isSaving ? undefined : (e) => handleNextResolutionChange(e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                    isSaving 
                      ? 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                      : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 focus:ring-theme-500 dark:focus:ring-theme-600'
                  }`}
                >
                  <option value="">None</option>
                  {allResolutions.filter(r => r.id !== resolution.id).map((res, index) => (
                    <option key={res.id} value={res.id}>
                      R{index + 1}: {(res.title || 'Untitled Resolution').substring(0, 30)}{(res.title || '').length > 30 ? '...' : ''}
                    </option>
                  ))}
                  <option value="ADD_NEW_RESOLUTION" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                    + Add New Resolution
                  </option>
                </select>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-dark-400">
              Select which question or resolution users should go to if they click "No" to the feedback question. Only one can be selected.
            </div>
          </div>

          {/* Related Article Link */}
          <div className="bg-theme-50 dark:bg-theme-900/20 border border-theme-200 dark:border-theme-800 rounded-lg p-4">
            <label className="block text-xs font-medium text-theme-800 dark:text-theme-200 mb-2">
              Related Article (Separate Button)
            </label>
            <div>
              <select
                value={editingNextArticleId || ''}
                onChange={isSaving ? undefined : (e) => handleNextArticleChange(e.target.value)}
                disabled={isSaving}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                  isSaving 
                    ? 'border-theme-300 dark:border-theme-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                    : 'border-theme-300 dark:border-theme-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 focus:ring-theme-500 dark:focus:ring-theme-600'
                }`}
              >
                <option value="">None</option>
                {availableArticles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {(article.title || 'Untitled Article').substring(0, 50)}{(article.title || '').length > 50 ? '...' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 text-sm text-theme-700 dark:text-theme-300">
              Select an article to show as a "View Detailed Guide" button. This appears separately from the feedback question.
            </div>
          </div>
        </div>
      )}

      {/* Article Link Section (Preview Mode Only) - Show if next_article_id is specified */}
      {!isEditing && resolution.next_article_id && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Related Article
            </h4>
            <button
              onClick={() => window.location.href = `/knowledge-base/article/${resolution.next_article_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-theme-500 dark:bg-theme-600 hover:bg-theme-600 dark:hover:bg-theme-500 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Detailed Guide
            </button>
          </div>
        </div>
      )}

      {/* Feedback Question (Preview Mode Only) - Only show if next_question_id or next_resolution_id is specified */}
      {!isEditing && (resolution.next_question_id || resolution.next_resolution_id) && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Did this resolution fix your issue?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="p-4 px-8 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg hover:ring-2 dark:text-dark-100 hover:ring-theme-500 dark:hover:ring-theme-600 hover:bg-gray-50 dark:hover:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-theme-500 dark:focus:ring-theme-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-900 transition-all duration-200 min-w-[100px]"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  if (resolution.next_question_id && onNavigateToQuestion) {
                    onNavigateToQuestion(resolution.next_question_id);
                  } else if (resolution.next_resolution_id && onNavigateToResolution) {
                    onNavigateToResolution(resolution.next_resolution_id);
                  } else {
                    onClose();
                  }
                }}
                className="bg-theme-500 dark:bg-theme-600 hover:bg-theme-600 dark:hover:bg-theme-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 min-w-[100px]"
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
