import { useState, useEffect, useRef } from 'react';
import ImageUpload from './ImageUpload';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function QuestionBuilder({ 
  question, 
  onAnswerSelect, 
  onQuestionUpdate, 
  isEditing, 
  allQuestions, 
  allResolutions,
  onAddQuestion,
  onAddResolution,
  isParentInitialized = false,
  isSaving = false
}) {
  const [editingQuestion, setEditingQuestion] = useState(question.question);
  const [editingImage, setEditingImage] = useState(
    question.image 
      ? (typeof question.image === 'string' ? question.image : question.image)
      : null
  );
  const [editingAnswers, setEditingAnswers] = useState(
    typeof question.answers === 'string' 
      ? JSON.parse(question.answers) 
      : question.answers
  );
  const isInitialMount = useRef(true);

  // Reset state when question changes
  useEffect(() => {
    setEditingQuestion(question.question);
    setEditingImage(
      question.image 
        ? (typeof question.image === 'string' ? question.image : question.image)
        : null
    );
    setEditingAnswers(
      typeof question.answers === 'string' 
        ? JSON.parse(question.answers) 
        : question.answers
    );
    // Reset the initial mount flag when question changes
    isInitialMount.current = true;
  }, [question.id, question.answers]);

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
    
    const updatedQuestion = {
      ...question,
      question: editingQuestion,
      image: editingImage,
      answers: JSON.stringify(editingAnswers)
    };
    onQuestionUpdate(updatedQuestion);
  }, [editingQuestion, editingImage, editingAnswers, isParentInitialized]);

  const handleAddAnswer = () => {
    setEditingAnswers(prev => [
      ...prev,
      { label: 'New Answer', next_question_id: null, resolution_id: null }
    ]);
  };

  const handleUpdateAnswer = (index, field, value) => {
    // Handle special add options
    if (field === 'next_question_id' && value === 'ADD_NEW_QUESTION') {
      // Clear resolution_id when adding a new question to maintain mutual exclusivity
      setEditingAnswers(prev => 
        prev.map((answer, i) => 
          i === index ? { ...answer, resolution_id: null } : answer
        )
      );
      onAddQuestion(index, question.id);
      return;
    }
    if (field === 'resolution_id' && value === 'ADD_NEW_RESOLUTION') {
      // Clear next_question_id when adding a new resolution to maintain mutual exclusivity
      setEditingAnswers(prev => 
        prev.map((answer, i) => 
          i === index ? { ...answer, next_question_id: null } : answer
        )
      );
      onAddResolution(index, question.id);
      return;
    }
    
    setEditingAnswers(prev => 
      prev.map((answer, i) => {
        if (i === index) {
          const updatedAnswer = { ...answer, [field]: value || null };
          
          // Business rule: An answer can only have either a next_question_id OR a resolution_id, not both
          if (field === 'next_question_id' && value) {
            updatedAnswer.resolution_id = null;
          } else if (field === 'resolution_id' && value) {
            updatedAnswer.next_question_id = null;
          }
          
          return updatedAnswer;
        }
        return answer;
      })
    );
  };

  const handleRemoveAnswer = (index) => {
    setEditingAnswers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Question Image */}
      {(question.image || isEditing) && (
        <div className="flex justify-center">
          {isEditing ? (
            <ImageUpload 
              currentImage={editingImage}
              onImageChange={isSaving ? undefined : setEditingImage}
              disabled={isSaving}
              placeholder="Drop a question image here or click to upload"
            />
          ) : question.image && (
            <img 
              src={
                typeof question.image === 'object' && question.image.isNew 
                  ? question.image.dataUrl 
                  : `https://pulse.cdn.angelfs.co.uk/articles/questions/${question.image}`
              } 
              alt="Question illustration"
              className="max-w-md h-auto rounded-xl shadow-lg bg-gray-50 dark:bg-dark-800 p-4"
            />
          )}
        </div>
      )}

      {/* Question Text */}
      <div className="text-center">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editingQuestion}
              onChange={isSaving ? undefined : (e) => setEditingQuestion(e.target.value)}
              disabled={isSaving}
              className={`w-full p-3 border rounded-lg text-xl font-semibold text-center resize-none transition-all ${
                isSaving 
                  ? 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                  : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100'
              }`}
              rows="2"
              placeholder="Enter your question..."
            />
          </div>
        ) : (
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-100 mb-6">
            {question.question}
          </h3>
        )}
      </div>

      {/* Answer Options */}
      <div className="grid gap-3 max-w-2xl mx-auto">
        {editingAnswers.map((answer, index) => (
          <div key={index} className="space-y-2">
            {isEditing ? (
              <div className="border border-gray-300 dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-800 relative">
                {/* Remove Button - Top Right */}
                <button
                  onClick={isSaving ? undefined : () => handleRemoveAnswer(index)}
                  disabled={isSaving}
                  className={`absolute top-2 right-2 p-1 rounded transition-all ${
                    isSaving 
                      ? 'text-red-400 dark:text-red-500 opacity-40 cursor-not-allowed' 
                      : 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                  }`}
                  title="Remove Answer"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>

                <div className="space-y-3 pr-8">
                  {/* Answer Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={answer.label}
                      onChange={isSaving ? undefined : (e) => handleUpdateAnswer(index, 'label', e.target.value)}
                      disabled={isSaving}
                      placeholder="Answer text"
                      className={`w-full p-2 border rounded transition-all ${
                        isSaving 
                          ? 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                          : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100'
                      }`}
                    />
                  </div>
                  
                  {/* Action Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                        Next Question
                      </label>
                      <select
                        value={answer.next_question_id || ''}
                        onChange={isSaving ? undefined : (e) => handleUpdateAnswer(index, 'next_question_id', e.target.value || null)}
                        disabled={isSaving}
                        className={`w-full p-2 border rounded transition-all ${
                          isSaving 
                            ? 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                            : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100'
                        }`}
                      >
                        <option value="">None</option>
                        {allQuestions.filter(q => q.id !== question.id).map(q => (
                          <option key={q.id} value={q.id}>
                            {q.question.substring(0, 50)}...
                          </option>
                        ))}
                        <option value="ADD_NEW_QUESTION" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                          + Add New Question
                        </option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">
                        Resolution
                      </label>
                      <select
                        value={answer.resolution_id || ''}
                        onChange={isSaving ? undefined : (e) => handleUpdateAnswer(index, 'resolution_id', e.target.value || null)}
                        disabled={isSaving}
                        className={`w-full p-2 border rounded transition-all ${
                          isSaving 
                            ? 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100 opacity-50 cursor-not-allowed' 
                            : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-900 text-gray-900 dark:text-dark-100'
                        }`}
                      >
                        <option value="">None</option>
                        {allResolutions.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                        <option value="ADD_NEW_RESOLUTION" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                          + Add New Resolution
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onAnswerSelect(answer)}
                className="w-full text-left p-4 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg hover:ring-2 hover:ring-theme-500 dark:hover:ring-theme-600 hover:bg-gray-50 dark:hover:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-theme-500 dark:focus:ring-theme-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-900 transition-all duration-200"
              >
                <span className="text-gray-900 dark:text-dark-100 font-medium">
                  {answer.label}
                </span>
              </button>
            )}
          </div>
        ))}
        
        {isEditing && (
          <button
            onClick={isSaving ? undefined : handleAddAnswer}
            disabled={isSaving}
            className={`w-full p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
              isSaving 
                ? 'border-gray-300 dark:border-dark-600 text-gray-500 dark:text-dark-400 opacity-50 cursor-not-allowed' 
                : 'border-gray-300 dark:border-dark-600 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:border-gray-400 dark:hover:border-dark-500'
            }`}
          >
            + Add Answer
          </button>
        )}
      </div>
    </div>
  );
}
