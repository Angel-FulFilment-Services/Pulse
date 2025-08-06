import { useState, useEffect } from 'react';
import axios from 'axios';
import Question from './Question';
import Resolution from './Resolution';
import ButtonControl from '../Controls/ButtonControl';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function VisualGuide({ article, questions, onClose }) {
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [currentResolution, setCurrentResolution] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingResolution, setLoadingResolution] = useState(false);

  useEffect(() => {
    // Find the first question for this article
    const firstQuestion = questions.find(q => q.article_id === article.id && q.parent_question_id === null);
    if (firstQuestion) {
      setCurrentQuestionId(firstQuestion.id);
    }
  }, [questions, article.id]);

  const handleAnswerSelect = async (answer) => {
    // Add current question to history for back navigation
    setHistory(prev => [...prev, currentQuestionId]);

    if (answer.resolution_id) {
      // Fetch and show resolution
      setLoadingResolution(true);
      try {
        const response = await axios.get(`/knowledge-base/resolution/${answer.resolution_id}`);
        setCurrentResolution(response.data.resolution);
        setCurrentQuestionId(null);
      } catch (error) {
        console.error('Error fetching resolution:', error);
        // Handle error - maybe show an error message
      } finally {
        setLoadingResolution(false);
      }
    } else if (answer.next_question_id) {
      // Go to next question
      setCurrentQuestionId(answer.next_question_id);
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const previousItem = history[history.length - 1];
      
      if (typeof previousItem === 'object' && previousItem.type === 'resolution') {
        // We were on a resolution, go back to it
        setCurrentQuestionId(null);
        const resolutionToLoad = previousItem.resolutionId;
        
        // Fetch the resolution again
        setLoadingResolution(true);
        axios.get(`/knowledge-base/resolution/${resolutionToLoad}`)
          .then(response => {
            setCurrentResolution(response.data.resolution);
          })
          .catch(error => {
            console.error('Error fetching resolution:', error);
          })
          .finally(() => {
            setLoadingResolution(false);
          });
          
        // Update history to remove this entry
        setHistory(prev => prev.slice(0, -1));
      } else {
        // Normal question navigation or going back from resolution
        if (currentResolution) {
          // Go back from resolution to last question
          setCurrentResolution(null);
          setCurrentQuestionId(previousItem);
          setHistory(prev => prev.slice(0, -1));
        } else {
          // Go back to previous question
          setCurrentQuestionId(previousItem);
          setHistory(prev => prev.slice(0, -1));
        }
      }
    }
  };

  const handleRestart = () => {
    const firstQuestion = questions.find(q => q.article_id === article.id && q.parent_question_id === null);
    setCurrentQuestionId(firstQuestion?.id || null);
    setCurrentResolution(null);
    setHistory([]);
  };

  const handleNavigateToQuestion = (questionId) => {
    // When navigating from a resolution to a question, we need to track that we were on a resolution
    if (currentResolution) {
      // Add a special marker to history to indicate we were on a resolution
      setHistory(prev => [...prev, { type: 'resolution', resolutionId: currentResolution.id, fromQuestionId: history[history.length - 1] || null }]);
    } else if (currentQuestionId) {
      // Normal question to question navigation
      setHistory(prev => [...prev, currentQuestionId]);
    }
    
    setCurrentResolution(null);
    setCurrentQuestionId(questionId);
  };

  const currentQuestion = questions.find(q => q.id === currentQuestionId);

  if (!currentQuestion && !currentResolution && !loadingResolution) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-dark-300">No visual guide available for this article.</p>
        <div className="mt-4 flex justify-center">
          <ButtonControl 
            id="close_button" 
            Icon={XMarkIcon}
            className="w-8 h-8 px-1" 
            iconClassName="w-6 h-6 text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400 transition-all ease-in-out" 
            onClick={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-700 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-100">
          Visual Guide: {article.title}
        </h2>
        <div className="flex items-center gap-3">
          {(history.length > 0 || currentResolution) && (
            <ButtonControl 
              id="back_button" 
              Icon={ArrowLeftIcon}
              className="w-8 h-8 px-1" 
              iconClassName="w-6 h-6 text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400 transition-all ease-in-out" 
              onClick={handleBack}
            />
          )}
          {currentResolution && (
            <ButtonControl 
              id="restart_button" 
              Icon={ArrowPathIcon}
              className="w-8 h-8 px-1" 
              iconClassName="w-6 h-6 text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400 transition-all ease-in-out" 
              onClick={handleRestart}
            />
          )}
          <ButtonControl 
            id="close_button" 
            Icon={XMarkIcon}
            className="w-8 h-8 px-1" 
            iconClassName="w-6 h-6 text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400 transition-all ease-in-out" 
            onClick={onClose}
          />
        </div>
      </div>

      {/* Content */}
      {loadingResolution && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-theme-600"></div>
          <p className="mt-2 text-gray-600 dark:text-dark-300">Loading resolution...</p>
        </div>
      )}

      {currentQuestion && !loadingResolution && (
        <Question 
          question={currentQuestion} 
          onAnswerSelect={handleAnswerSelect}
        />
      )}

      {currentResolution && !loadingResolution && (
        <Resolution 
          resolution={currentResolution}
          onRestart={handleRestart}
          onClose={onClose}
          onNavigateToQuestion={handleNavigateToQuestion}
        />
      )}
    </div>
  );
}
