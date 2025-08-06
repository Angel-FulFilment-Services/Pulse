import ReactMarkdown from 'react-markdown';

export default function Resolution({ resolution, onRestart, onClose, onNavigateToQuestion }) {
  return (
    <div className="space-y-6">
      {/* Success/Resolution Header */}
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

      {/* Resolution Image */}
      {resolution.image && (
        <div className="flex justify-center">
          <img 
            src={
              typeof resolution.image === 'object' && resolution.image.isNew 
                ? resolution.image.dataUrl 
                : `https://pulse.cdn.angelfs.co.uk/articles/questions/${resolution.image}`
            } 
            alt={resolution.title}
            className="max-w-lg h-auto rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-4"
          />
        </div>
      )}

      {/* Resolution Content */}
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <h4 className="text-xl font-semibold text-gray-900 dark:text-dark-100 mb-4 text-center">
          {resolution.title}
        </h4>

        {/* Body */}
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
      </div>

      {/* Feedback Question - Only show if next_question_id is specified */}
      {resolution.next_question_id && (
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
                onClick={() => onNavigateToQuestion(resolution.next_question_id)}
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
