import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import VisualGuide from './VisualGuide';
import VisualGuideBuilder from './VisualGuideBuilder';
import { SmartImage } from '../../Utils/imageUtils.jsx';
import { hasPermission } from '../../Utils/Permissions';

export default function Article({ article, questions = [], resolutions = [] }) {
  const [showVisualGuide, setShowVisualGuide] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  
  const handleCloseBuilder = () => {
    setIsReloading(true);
    // Use Inertia router to refresh the page data without a full page reload
    router.reload({ 
      only: ['questions', 'resolutions'],
      onFinish: () => setIsReloading(false)
    });
    setShowBuilder(false);
  };

  const handleSaveGuide = async (editedQuestions, editedResolutions, deletedQuestions = [], deletedResolutions = []) => {
    try {
      // First, upload any new images and update the questions/resolutions with the uploaded filenames
      const processedQuestions = await Promise.all(
        editedQuestions.map(async (question) => {
          let processedQuestion = { ...question };
          
          // Handle image upload
          if (question.image && typeof question.image === 'object' && question.image.isNew) {
            // Upload the new image
            const formData = new FormData();
            formData.append('image', question.image.file);
            
            const response = await fetch('/knowledge-base/upload-image', {
              method: 'POST',
              headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
              },
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Failed to upload question image');
            }
            
            const data = await response.json();
            processedQuestion.image = data.filename;
          }
          
          // Normalize ID fields in answers
          if (processedQuestion.answers) {
            const answers = typeof processedQuestion.answers === 'string' 
              ? JSON.parse(processedQuestion.answers) 
              : processedQuestion.answers;
            
            const normalizedAnswers = answers.map(answer => ({
              ...answer,
              next_question_id: answer.next_question_id 
                ? (answer.next_question_id.toString().startsWith('temp_') 
                   ? answer.next_question_id 
                   : Number(answer.next_question_id))
                : null,
              resolution_id: answer.resolution_id 
                ? (answer.resolution_id.toString().startsWith('temp_') 
                   ? answer.resolution_id 
                   : Number(answer.resolution_id))
                : null
            }));
            
            processedQuestion.answers = JSON.stringify(normalizedAnswers);
          }
          
          return processedQuestion;
        })
      );

      const processedResolutions = await Promise.all(
        editedResolutions.map(async (resolution) => {
          let processedResolution = { ...resolution };
          
          // Handle image upload
          if (resolution.image && typeof resolution.image === 'object' && resolution.image.isNew) {
            // Upload the new image
            const formData = new FormData();
            formData.append('image', resolution.image.file);
            
            const response = await fetch('/knowledge-base/upload-image', {
              method: 'POST',
              headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
              },
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Failed to upload resolution image');
            }
            
            const data = await response.json();
            processedResolution.image = data.filename;
          }
          
          // Normalize next_question_id
          if (processedResolution.next_question_id) {
            processedResolution.next_question_id = processedResolution.next_question_id.toString().startsWith('temp_')
              ? processedResolution.next_question_id
              : Number(processedResolution.next_question_id);
          }
          
          return processedResolution;
        })
      );

      // Now save the guide with the uploaded image filenames and deletion data
      const saveResponse = await axios.post(`/knowledge-base/article/${article.id}/save-guide`, {
        questions: processedQuestions,
        resolutions: processedResolutions,
        deletedQuestions: deletedQuestions,
        deletedResolutions: deletedResolutions
      });
      
      // Show success message but stay in the builder
      toast.success('Visual guide saved successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } catch (error) {
      toast.error('Failed to save visual guide. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    }
  };

  return (
    <>
      <header className="isolate bg-white dark:bg-dark-900 shadow-md z-20 sticky top-0">
        <div className="border-b border-gray-200 bg-white/40 dark:border-dark-700 dark:bg-dark-900/40 px-6 pt-4 pb-4">
          <div className="flex items-center justify-between gap-x-4"> 
            <div className="flex items-center justify-start gap-x-4"> 
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-dark-100">{ article.title }</h3>
              {article.tags && JSON.parse(article.tags).map((tag, idx) => (
                <span
                  key={idx}
                  className="relative z-10 rounded-full bg-theme-50 px-3 py-1.5 text-sm font-medium text-theme-600 ring-1 ring-theme-500/10 dark:bg-theme-600 dark:text-theme-300 dark:ring-theme-700/20"
                >
                  {tag}
                </span>
              ))}  
            </div>
            <Link href={`/knowledge-base`} className="text-sm font-medium text-gray-900 dark:text-dark-100 hover:text-gray-600 dark:hover:text-dark-200 flex items-center gap-x-2">
              <span className="pl-2 text-md font-semibold" aria-hidden="true">&larr;</span> Back to Knowledge Base
              <span className="sr-only">Back to Knowledge Base</span>
            </Link>
          </div>
          <h1 className="text-gray-400 dark:text-dark-100 mt-1 text-sm">
            { article.description }
          </h1>
        </div>
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute left-16 top-full -mt-16 transform-gpu opacity-50 blur-3xl xl:left-1/2 xl:-ml-80">
            <div
              className="aspect-[1154/678] w-[72.125rem] bg-gradient-to-br from-[rgb(var(--theme-300))] dark:from-[rgb(var(--theme-500))] to-[rgb(var(--theme-700))] dark:to-[rgb(var(--theme-900))]"
              style={{
                clipPath:
                  'polygon(100% 38.5%, 82.6% 100%, 60.2% 37.7%, 52.4% 32.1%, 47.5% 41.8%, 45.2% 65.6%, 27.5% 23.4%, 0.1% 35.3%, 17.9% 0%, 27.7% 23.4%, 76.2% 2.5%, 74.2% 56%, 100% 38.5%)',
              }}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gray-900/5 dark:bg-dark-100/5" />
        </div>
        <div className="mx-auto flex items-center justify-between max-w-full w-full px-6 py-5 pt-3">
          <h1 className="text-gray-400 dark:text-dark-100 mt-1 text-sm flex items-center gap-x-2">
            <span className="text-gray-400 dark:text-dark-100 mt-1 text-sm">
              { 
                new Date(article.published_at).toLocaleDateString('en-UK', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }) 
              }
            </span>
            <div className="w-1 h-1 shrink-0 mt-1 bg-gray-400 dark:bg-dark-500 rounded-full"></div>
            <span className="text-gray-400 dark:text-dark-100 mt-1 text-sm">{ article.category }</span>
            <div className="w-1 h-1 shrink-0 mt-1 bg-gray-400 dark:bg-dark-500 rounded-full"></div>
            <span className="text-gray-400 dark:text-dark-100 mt-1 text-sm">10 minute read</span>
          </h1>
        </div>
      </header>
      <main className="bg-gray-50 dark:bg-dark-800 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl py-8">
          <article className="bg-white dark:bg-dark-900 shadow-xl rounded-2xl mx-4 mb-8">
            <div className="px-8 py-8 lg:px-12 lg:py-12">
              {!showVisualGuide && !showBuilder && (
                <div className="flex flex-row items-start justify-between mb-8">
                  {article.article_image && (
                    <SmartImage 
                      filename={article.article_image}
                      alt={article.title}
                      className="max-w-64 h-auto mb-8 bg-gray-50 rounded-3xl p-2 ring-1 ring-gray-800/10"
                      path="articles"
                    />
                  )}
                  <div className="flex gap-3 items-center">
                    {questions.length > 0 ? (
                      <>
                        <button 
                          onClick={isReloading ? undefined : () => setShowVisualGuide(true)}
                          disabled={isReloading}
                          className={`font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                            isReloading 
                              ? 'bg-theme-400 dark:bg-theme-500 text-white dark:text-dark-50 opacity-60 cursor-not-allowed' 
                              : 'bg-theme-500 dark:bg-theme-600 hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-500 text-white dark:text-dark-50'
                          }`}
                        >
                          {isReloading ? 'Loading...' : 'Launch Visual Guide'}
                        </button>
                        { hasPermission('pulse_edit_articles') ? (
                          <button 
                            onClick={isReloading ? undefined : () => setShowBuilder(true)}
                            disabled={isReloading}
                            className={`w-8 h-8 px-1 rounded-lg ${
                              isReloading ? 'cursor-not-allowed' : ''
                            }`}
                            title="Edit Visual Guide"
                          >
                            <svg className={`w-6 h-6 transition-all ease-in-out ${
                              isReloading 
                                ? 'text-gray-400 dark:text-dark-500 opacity-50' 
                                : 'text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        ) : null}
                      </>
                    ) : hasPermission('pulse_edit_articles') ? (
                      <button 
                        onClick={isReloading ? undefined : () => setShowBuilder(true)}
                        disabled={isReloading}
                        className={`font-semibold px-4 py-2 rounded-lg transition-colors duration-200 ${
                          isReloading 
                            ? 'bg-gray-300 dark:bg-dark-600 text-gray-500 dark:text-dark-400 cursor-not-allowed' 
                            : 'bg-theme-500 dark:bg-theme-600 hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-500 text-white dark:text-dark-50'
                        }`}
                      >
                        {isReloading ? 'Loading...' : 'Create Visual Guide'}
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
              {!showVisualGuide && !showBuilder ? (
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-100 mb-6 mt-8" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-3xl font-semibold text-gray-900 dark:text-dark-100 mb-4 mt-6" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-100 mb-3 mt-5" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-xl font-semibold text-gray-900 dark:text-dark-100 mb-3 mt-4" {...props} />,
                    p: ({node, ...props}) => <p className="text-gray-700 dark:text-dark-200 mb-4 leading-7" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc mb-4 space-y-2 text-gray-700 dark:text-dark-200 ml-6" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal mb-4 space-y-2 text-gray-700 dark:text-dark-200 ml-6" {...props} />,
                    li: ({node, ...props}) => {
                      // Check if this li contains nested lists
                      const hasNestedList = node.children && node.children.some(child => 
                        child.type === 'element' && (child.tagName === 'ul' || child.tagName === 'ol')
                      );
                      return (
                        <li className={`leading-7 ${hasNestedList ? 'mb-2' : ''}`} {...props} />
                      );
                    },
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-theme-500 pl-4 italic text-gray-600 dark:text-dark-300 my-4" {...props} />,
                    code: ({node, inline, ...props}) => 
                      inline ? 
                        <code className="bg-gray-100 dark:bg-dark-800 px-1 py-0.5 rounded text-sm font-mono text-theme-600 dark:text-theme-400" {...props} /> :
                        <code className="block bg-gray-100 dark:bg-dark-800 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-gray-100 dark:bg-dark-800 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                    a: ({node, ...props}) => <a className="text-theme-600 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-300 underline" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-dark-100" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                  }}
                >
                  {article.body}
                </ReactMarkdown>
              ) : showVisualGuide ? (
                <VisualGuide 
                  article={article}
                  questions={questions}
                  onClose={() => setShowVisualGuide(false)}
                />
              ) : (
                <VisualGuideBuilder
                  article={article}
                  questions={questions}
                  resolutions={resolutions}
                  onClose={handleCloseBuilder}
                  onSave={handleSaveGuide}
                />
              )}
            </div>
          </article>
        </div>
      </main>
    </>
  )
}
