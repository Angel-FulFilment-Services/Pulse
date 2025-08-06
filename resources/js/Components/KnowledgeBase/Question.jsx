import ImageWithLoading from './ImageWithLoading';

export default function Question({ question, onAnswerSelect }) {
  const answers = typeof question.answers === 'string' 
    ? JSON.parse(question.answers) 
    : question.answers;

  return (
    <div className="space-y-6">
      {/* Question Image */}
      {question.image && (
        <div className="flex justify-center">
          <ImageWithLoading
            src={
              typeof question.image === 'object' && question.image.isNew 
                ? question.image.dataUrl 
                : `https://pulse.cdn.angelfs.co.uk/articles/questions/${question.image}`
            }
            alt="Question illustration"
            className="max-w-md h-auto rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-4"
            loadingContainerClassName="max-w-md h-48 rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-4"
          />
        </div>
      )}

      {/* Question Text */}
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-100 mb-6">
          {question.question}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="grid gap-3 max-w-2xl mx-auto">
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(answer)}
            className="w-full text-left p-4 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg hover:ring-2 hover:ring-theme-500 dark:hover:ring-theme-600 hover:bg-gray-50 dark:hover:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-theme-500 dark:focus:ring-theme-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-900 transition-all duration-200"
          >
            <span className="text-gray-900 dark:text-dark-100 font-medium">
              {answer.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
