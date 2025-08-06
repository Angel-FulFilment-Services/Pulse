import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QuestionBuilder from './QuestionBuilder';
import ResolutionBuilder from './ResolutionBuilder';
import ButtonControl from '../Controls/ButtonControl';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';
import { 
  EyeIcon, 
  PencilSquareIcon, 
  ArrowLeftIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

export default function VisualGuideBuilder({ article, questions, resolutions = [], onClose, onSave }) {
  const [editingQuestions, setEditingQuestions] = useState([]);
  const [editingResolutions, setEditingResolutions] = useState([]);
  const [deletedQuestions, setDeletedQuestions] = useState([]);
  const [deletedResolutions, setDeletedResolutions] = useState([]);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [currentResolution, setCurrentResolution] = useState(null);
  const [history, setHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingQuestionNavigation, setPendingQuestionNavigation] = useState(null);
  const [pendingResolutionNavigation, setPendingResolutionNavigation] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, id: null });
  const [deleteDialogContent, setDeleteDialogContent] = useState({ title: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const originalQuestions = useRef([]);
  const originalResolutions = useRef([]);
  const isAddingItem = useRef(false);
  const isSwitchingModes = useRef(false);

  useEffect(() => {
    // Initialize with existing questions and resolutions only on mount
    if (!isInitialized) {
      console.log('VisualGuideBuilder initializing with:', {
        questionsCount: questions.length,
        resolutionsCount: resolutions.length,
        resolutions: resolutions
      });
      
      setEditingQuestions([...questions]);
      setEditingResolutions([...resolutions]);
      // Store original data for comparison
      originalQuestions.current = JSON.parse(JSON.stringify(questions));
      originalResolutions.current = JSON.parse(JSON.stringify(resolutions));
      
      // Find the first question for this article
      const firstQuestion = questions.find(q => q.article_id === article.id && q.parent_question_id === null);
      if (firstQuestion) {
        setCurrentQuestionId(firstQuestion.id);
      }
      // Reset hasChanges after initialization and mark as initialized
      setHasChanges(false);
      setIsInitialized(true);
    }
  }, [questions, resolutions, article.id, isInitialized]);

  // Handle pending question navigation after state updates
  useEffect(() => {
    if (pendingQuestionNavigation) {
      // Set flag to prevent hasChanges during pending navigation
      isSwitchingModes.current = true;
      
      setCurrentQuestionId(pendingQuestionNavigation);
      setCurrentResolution(null);
      // Don't clear history for pending navigation unless it's a manual add
      setHistory([]);
      setPendingQuestionNavigation(null);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isSwitchingModes.current = false;
      }, 100);
    }
  }, [pendingQuestionNavigation]); // Only depend on pendingQuestionNavigation

  // Handle pending resolution navigation after state updates
  useEffect(() => {
    if (pendingResolutionNavigation) {
      // Set flag to prevent hasChanges during pending navigation
      isSwitchingModes.current = true;
      
      setCurrentResolution(pendingResolutionNavigation);
      setCurrentQuestionId(null);
      // Don't clear history for pending navigation unless it's a manual add
      setHistory([]);
      setPendingResolutionNavigation(null);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isSwitchingModes.current = false;
      }, 100);
    }
  }, [pendingResolutionNavigation]); // Only depend on pendingResolutionNavigation

  const handleAnswerSelect = async (answer) => {
    // Set flag to prevent hasChanges during answer selection navigation
    isSwitchingModes.current = true;
    
    // Add current state to history for back navigation
    if (currentQuestionId) {
      setHistory(prev => [...prev, { type: 'question', id: currentQuestionId }]);
    } else if (currentResolution) {
      setHistory(prev => [...prev, { type: 'resolution', id: currentResolution.id }]);
    }

    if (answer.resolution_id) {
      // Check if resolution exists in local state first - handle type mismatches
      let resolution = editingResolutions.find(r => r.id == answer.resolution_id); // Use == for type coercion
      
      if (!resolution) {
        // Fetch resolution from server
        try {
          const response = await axios.get(`/knowledge-base/resolution/${answer.resolution_id}`);
          resolution = response.data.resolution;
          
          // Check again if it was added while we were fetching to prevent duplication
          const existingResolution = editingResolutions.find(r => r.id == resolution.id); // Use == for type coercion
          if (!existingResolution) {
            setEditingResolutions(prev => [...prev, resolution]);
          }
        } catch (error) {
          console.error('Error fetching resolution:', error);
          isSwitchingModes.current = false; // Reset flag on error
          return;
        }
      }
      
      setCurrentResolution(resolution);
      setCurrentQuestionId(null);
    } else if (answer.next_question_id) {
      // Go to next question - ensure ID consistency (convert to number if it's a numeric string)
      let questionId = answer.next_question_id;
      if (typeof questionId === 'string' && !isNaN(questionId)) {
        questionId = parseInt(questionId, 10);
      }
      setCurrentQuestionId(questionId);
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isSwitchingModes.current = false;
    }, 100);
  };

  const handleBack = () => {
    if (history.length > 0) {
      // Set flag to prevent hasChanges during back navigation
      isSwitchingModes.current = true;
      
      const previousItem = history[history.length - 1];
      
      if (previousItem.type === 'question') {
        setCurrentQuestionId(previousItem.id);
        setCurrentResolution(null);
      } else if (previousItem.type === 'resolution') {
        const resolution = editingResolutions.find(r => r.id == previousItem.id); // Use == for type coercion
        if (resolution) {
          setCurrentResolution(resolution);
          setCurrentQuestionId(null);
        }
      }
      
      setHistory(prev => prev.slice(0, -1));
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isSwitchingModes.current = false;
      }, 100);
    }
  };

  const handleRestart = () => {
    const firstQuestion = editingQuestions.find(q => q.article_id === article.id && q.parent_question_id === null);
    setCurrentQuestionId(firstQuestion?.id || null);
    setCurrentResolution(null);
    setHistory([]);
  };

  // Helper function to check if content has actually changed
  const hasContentChanged = () => {
    // Compare current editing state with original data
    const questionsChanged = JSON.stringify(editingQuestions) !== JSON.stringify(originalQuestions.current);
    const resolutionsChanged = JSON.stringify(editingResolutions) !== JSON.stringify(originalResolutions.current);
    
    // Also check for new images (which are objects with isNew: true)
    const hasNewImages = editingQuestions.some(q => q.image && typeof q.image === 'object' && q.image.isNew) ||
                        editingResolutions.some(r => r.image && typeof r.image === 'object' && r.image.isNew);
    
    // Check for removed images (original had image, current doesn't)
    const hasRemovedImages = originalQuestions.current.some(originalQ => {
      const currentQ = editingQuestions.find(q => q.id == originalQ.id);
      return originalQ.image && (!currentQ || !currentQ.image);
    }) || originalResolutions.current.some(originalR => {
      const currentR = editingResolutions.find(r => r.id == originalR.id);
      return originalR.image && (!currentR || !currentR.image);
    });
    
    return questionsChanged || resolutionsChanged || hasNewImages || hasRemovedImages;
  };  const handleQuestionUpdate = (updatedQuestion) => {
    setEditingQuestions(prev => {
      const updatedQuestions = prev.map(q => q.id == updatedQuestion.id ? updatedQuestion : q);
      
      // Only set hasChanges if initialized, editing mode, not adding an item, not switching modes
      if (isInitialized && isEditing && !isAddingItem.current && !isSwitchingModes.current) {
        // Use helper function to check for changes with updated questions
        const tempOriginalQuestions = originalQuestions.current;
        const tempOriginalResolutions = originalResolutions.current;
        
        // Temporarily update current arrays for comparison
        const questionsChanged = JSON.stringify(updatedQuestions) !== JSON.stringify(tempOriginalQuestions);
        const resolutionsChanged = JSON.stringify(editingResolutions) !== JSON.stringify(tempOriginalResolutions);
        const hasNewImages = updatedQuestions.some(q => q.image && typeof q.image === 'object' && q.image.isNew) ||
                            editingResolutions.some(r => r.image && typeof r.image === 'object' && r.image.isNew);
        const hasRemovedImages = tempOriginalQuestions.some(originalQ => {
          const currentQ = updatedQuestions.find(q => q.id == originalQ.id);
          return originalQ.image && (!currentQ || !currentQ.image);
        }) || tempOriginalResolutions.some(originalR => {
          const currentR = editingResolutions.find(r => r.id == originalR.id);
          return originalR.image && (!currentR || !currentR.image);
        });
        
        if (questionsChanged || resolutionsChanged || hasNewImages || hasRemovedImages) {
          setHasChanges(true);
        }
      }
      
      return updatedQuestions;
    });
  };

  const handleResolutionUpdate = (updatedResolution) => {
    setEditingResolutions(prev => {
      const updatedResolutions = prev.map(r => r.id == updatedResolution.id ? updatedResolution : r);
      
      // Only set hasChanges if initialized, editing mode, not adding an item, not switching modes
      if (isInitialized && isEditing && !isAddingItem.current && !isSwitchingModes.current) {
        // Use helper function to check for changes with updated resolutions
        const tempOriginalQuestions = originalQuestions.current;
        const tempOriginalResolutions = originalResolutions.current;
        
        // Temporarily update current arrays for comparison
        const questionsChanged = JSON.stringify(editingQuestions) !== JSON.stringify(tempOriginalQuestions);
        const resolutionsChanged = JSON.stringify(updatedResolutions) !== JSON.stringify(tempOriginalResolutions);
        const hasNewImages = editingQuestions.some(q => q.image && typeof q.image === 'object' && q.image.isNew) ||
                            updatedResolutions.some(r => r.image && typeof r.image === 'object' && r.image.isNew);
        const hasRemovedImages = tempOriginalQuestions.some(originalQ => {
          const currentQ = editingQuestions.find(q => q.id == originalQ.id);
          return originalQ.image && (!currentQ || !currentQ.image);
        }) || tempOriginalResolutions.some(originalR => {
          const currentR = updatedResolutions.find(r => r.id == originalR.id);
          return originalR.image && (!currentR || !currentR.image);
        });
        
        if (questionsChanged || resolutionsChanged || hasNewImages || hasRemovedImages) {
          setHasChanges(true);
        }
      }
      
      return updatedResolutions;
    });
  };

  const handleDeleteQuestion = (questionId) => {
    const title = 'Delete Question?';
    const description = 'Are you sure you want to delete this question? This will remove any references to it from other questions.';
    
    setDeleteDialogContent({ title, description });
    setDeleteConfirmation({
      isOpen: true,
      type: 'question',
      id: questionId
    });
  };

  const handleDeleteResolution = (resolutionId) => {
    const title = 'Delete Resolution?';
    const description = 'Are you sure you want to delete this resolution? This will remove any references to it from other questions.';
    
    setDeleteDialogContent({ title, description });
    setDeleteConfirmation({
      isOpen: true,
      type: 'resolution',
      id: resolutionId
    });
  };

  const confirmDelete = () => {
    const { type, id } = deleteConfirmation;
    
    if (type === 'question') {
      // Track deletion if it's an existing question (not a temp one)
      if (id && !id.toString().startsWith('temp_')) {
        setDeletedQuestions(prev => [...prev, id]);
      }
      
      // Remove the question from editing state
      setEditingQuestions(prev => prev.filter(q => q.id !== id));
      
      // If we're currently viewing the deleted question, navigate away
      if (currentQuestionId === id) {
        // Try to navigate to the first question, or if this was the first question, clear current
        const firstQuestion = editingQuestions.find(q => 
          q.article_id === article.id && 
          q.parent_question_id === null && 
          q.id !== id
        );
        setCurrentQuestionId(firstQuestion?.id || null);
        setCurrentResolution(null);
        setHistory([]);
      }
      
      // Clean up any answers that reference this deleted question
      setEditingQuestions(prev => 
        prev.map(q => {
          const answers = JSON.parse(q.answers || '[]');
          const updatedAnswers = answers.map(answer => ({
            ...answer,
            next_question_id: answer.next_question_id === id ? null : answer.next_question_id
          }));
          return {
            ...q,
            answers: JSON.stringify(updatedAnswers)
          };
        })
      );
    } else if (type === 'resolution') {
      // Track deletion if it's an existing resolution (not a temp one)
      if (id && !id.toString().startsWith('temp_')) {
        setDeletedResolutions(prev => [...prev, id]);
      }
      
      // Remove the resolution from editing state
      setEditingResolutions(prev => prev.filter(r => r.id !== id));
      
      // If we're currently viewing the deleted resolution, navigate back
      if (currentResolution && currentResolution.id == id) {
        setCurrentResolution(null);
        // Navigate back to the last question in history
        if (history.length > 0) {
          setCurrentQuestionId(history[history.length - 1]);
        }
      }
      
      // Clean up any answers that reference this deleted resolution
      setEditingQuestions(prev => 
        prev.map(q => {
          const answers = JSON.parse(q.answers || '[]');
          const updatedAnswers = answers.map(answer => ({
            ...answer,
            resolution_id: answer.resolution_id === id ? null : answer.resolution_id
          }));
          return {
            ...q,
            answers: JSON.stringify(updatedAnswers)
          };
        })
      );
    }
    
    // Mark as changed
    setHasChanges(true);
    
    // Close the confirmation dialog
    setDeleteConfirmation({ isOpen: false, type: null, id: null });
  };

  const handleAddQuestion = (linkToAnswerIndex = null, sourceQuestionId = null) => {
    isAddingItem.current = true; // Set flag to prevent hasChanges during auto-linking operations
    
    const newQuestionId = `temp_${Date.now()}`;
    const newQuestion = {
      id: newQuestionId,
      article_id: article.id,
      question: 'New Question',
      answers: JSON.stringify([{ label: 'Answer 1', next_question_id: null, resolution_id: null }]),
      image: null,
      parent_question_id: null,
      order: editingQuestions.length
    };
    
    setEditingQuestions(prev => {
      let updatedQuestions = [...prev, newQuestion];
      
      // If we need to link this new question to a specific answer
      if (linkToAnswerIndex !== null && sourceQuestionId) {
        updatedQuestions = updatedQuestions.map(q => {
          if (q.id == sourceQuestionId) {
            const answers = typeof q.answers === 'string' ? JSON.parse(q.answers) : q.answers;
            const updatedAnswers = answers.map((answer, index) => 
              index === linkToAnswerIndex 
                ? { ...answer, next_question_id: newQuestionId, resolution_id: null }
                : answer
            );
            return { ...q, answers: JSON.stringify(updatedAnswers) };
          }
          return q;
        });
      }
      
      return updatedQuestions;
    });
    
    // Set pending navigation - this will be handled by useEffect after state updates
    setPendingQuestionNavigation(newQuestionId);
    
    // Set hasChanges immediately since we've added a new question
    setHasChanges(true);
    
    // Reset the adding flag after a short delay to allow all updates to complete
    setTimeout(() => {
      isAddingItem.current = false;
    }, 200);
  };

  const handleAddResolution = (linkToAnswerIndex = null, sourceQuestionId = null) => {
    isAddingItem.current = true; // Set flag to prevent hasChanges during auto-linking operations
    
    const newResolutionId = `temp_${Date.now()}`;
    const newResolution = {
      id: newResolutionId,
      title: 'New Resolution',
      body: 'Resolution content...',
      image: null
    };
    
    setEditingResolutions(prev => [...prev, newResolution]);
    
    // If we need to link this new resolution to a specific answer
    if (linkToAnswerIndex !== null && sourceQuestionId) {
      setEditingQuestions(prev => 
        prev.map(q => {
          if (q.id == sourceQuestionId) {
            const answers = typeof q.answers === 'string' ? JSON.parse(q.answers) : q.answers;
            const updatedAnswers = answers.map((answer, index) => 
              index === linkToAnswerIndex 
                ? { ...answer, resolution_id: newResolutionId, next_question_id: null }
                : answer
            );
            return { ...q, answers: JSON.stringify(updatedAnswers) };
          }
          return q;
        })
      );
    }
    
    // Set pending navigation - this will be handled by useEffect after state updates
    setPendingResolutionNavigation(newResolution);
    
    // Set hasChanges immediately since we've added a new resolution
    setHasChanges(true);
    
    // Reset the adding flag after a short delay to allow all updates to complete
    setTimeout(() => {
      isAddingItem.current = false;
    }, 200);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editingQuestions, editingResolutions, deletedQuestions, deletedResolutions);
      
      // Update the original reference data to match the current saved state
      originalQuestions.current = JSON.parse(JSON.stringify(editingQuestions));
      originalResolutions.current = JSON.parse(JSON.stringify(editingResolutions));
      
      setHasChanges(false);
      setDeletedQuestions([]); // Clear deleted items after successful save
      setDeletedResolutions([]);
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionNavigation = (questionId) => {
    // Set flag to prevent hasChanges during navigation
    isSwitchingModes.current = true;
    
    setCurrentQuestionId(questionId);
    setCurrentResolution(null);
    // Only clear history when in editing mode or when manually navigating from the navigation panel
    if (isEditing) {
      setHistory([]);
    }
    
    // Reset the flag after a short delay to allow re-renders to complete
    setTimeout(() => {
      isSwitchingModes.current = false;
    }, 100);
  };

  const handleResolutionFeedbackNavigation = (questionId) => {
    // This is called when navigating from resolution feedback - should preserve history
    // Add current resolution to history before navigating
    if (currentResolution) {
      setHistory(prev => [...prev, { type: 'resolution', id: currentResolution.id }]);
    }
    setCurrentQuestionId(questionId);
    setCurrentResolution(null);
  };

  const handleResolutionNavigation = (resolutionId) => {
    // Set flag to prevent hasChanges during navigation
    isSwitchingModes.current = true;
    
    const resolution = editingResolutions.find(r => r.id == resolutionId); // Use == for type coercion
    if (resolution) {
      setCurrentResolution(resolution);
      setCurrentQuestionId(null);
      // Only clear history when in editing mode or when manually navigating from the navigation panel
      if (isEditing) {
        setHistory([]);
      }
    }
    
    // Reset the flag after a short delay to allow re-renders to complete
    setTimeout(() => {
      isSwitchingModes.current = false;
    }, 100);
  };

  const currentQuestion = editingQuestions.find(q => {
    // Handle both string and number ID comparisons
    return q.id == currentQuestionId; // Use == instead of === to allow type coercion
  });

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-700 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-100">
          Visual Guide Builder: {article.title}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ButtonControl 
              id="toggle_mode_button" 
              Icon={isEditing ? EyeIcon : PencilSquareIcon}
              className="w-8 h-8 px-1" 
              iconClassName={`w-6 h-6 transition-all ease-in-out ${
                isSaving 
                  ? 'text-gray-400 dark:text-dark-500 opacity-50 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400'
              }`}
              onClick={isSaving ? undefined : () => {
                isSwitchingModes.current = true;
                const wasEditing = isEditing;
                setIsEditing(!isEditing);
                
                // If switching to preview mode, go back to the first question
                if (wasEditing) {
                  handleRestart();
                }
                
                // Reset the flag after a short delay to allow re-renders to complete
                setTimeout(() => {
                  isSwitchingModes.current = false;
                }, 100);
              }}
            />
          </div>

          {!isEditing && history.length > 0 && (
            <ButtonControl 
              id="back_button" 
              Icon={ArrowLeftIcon}
              className="w-8 h-8 px-1" 
              iconClassName={`w-6 h-6 transition-all ease-in-out ${
                isSaving 
                  ? 'text-gray-400 dark:text-dark-500 opacity-50 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400'
              }`}
              onClick={isSaving ? undefined : handleBack}
            />
          )}
          
          {!isEditing && currentResolution && (
            <ButtonControl 
              id="restart_button" 
              Icon={ArrowPathIcon}
              className="w-8 h-8 px-1" 
              iconClassName={`w-6 h-6 transition-all ease-in-out ${
                isSaving 
                  ? 'text-gray-400 dark:text-dark-500 opacity-50 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400'
              }`}
              onClick={isSaving ? undefined : handleRestart}
            />
          )}
          
          {hasChanges && (
            <ButtonControl 
              id="save_button" 
              Icon={isSaving ? ArrowPathIcon : CheckCircleIcon}
              className="w-8 h-8 px-1" 
              iconClassName={`w-6 h-6 transition-all ease-in-out ${
                isSaving 
                  ? 'text-theme-400 dark:text-theme-500 opacity-60 animate-spin' 
                  : 'text-orange-500 hover:text-orange-600 dark:text-orange-600 dark:hover:text-orange-500'
              }`}
              onClick={isSaving ? undefined : handleSave}
            />
          )}
          
          <ButtonControl 
            id="close_button" 
            Icon={XMarkIcon}
            className="w-8 h-8 px-1" 
            iconClassName={`w-6 h-6 transition-all ease-in-out ${
              isSaving 
                ? 'text-gray-400 dark:text-dark-500 opacity-50 cursor-not-allowed' 
                : 'text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400'
            }`}
            onClick={isSaving ? undefined : onClose}
          />
        </div>
      </div>

      {/* Status indicator */}
      {isSaving && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Saving changes...
            </p>
          </div>
        </div>
      )}
      {hasChanges && !isSaving && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            You have unsaved changes. Don't forget to save your work!
          </p>
        </div>
      )}

      {/* Navigation Panel */}
      {isEditing && (editingQuestions.length > 0 || editingResolutions.length > 0) && (
        <div className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Questions Navigator */}
            {editingQuestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-300 mb-3">Questions ({editingQuestions.length})</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {editingQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`flex items-center gap-2 p-2 rounded text-sm transition-colors duration-200 ${
                        currentQuestionId === question.id
                          ? 'bg-theme-100 dark:bg-theme-900/30 text-theme-800 dark:text-theme-200 border border-theme-300 dark:border-theme-700'
                          : 'bg-white dark:bg-dark-900 text-gray-700 dark:text-dark-200 border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-800'
                      }`}
                    >
                      <button
                        onClick={isSaving ? undefined : () => handleQuestionNavigation(question.id)}
                        disabled={isSaving}
                        className={`flex-1 text-left transition-opacity ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="font-medium">Q{index + 1}:</span> {(question.question || 'Untitled Question').substring(0, 50)}{(question.question || '').length > 50 ? '...' : ''}
                      </button>
                      <button
                        onClick={isSaving ? undefined : () => handleDeleteQuestion(question.id)}
                        disabled={isSaving}
                        className={`p-1 rounded transition-all ${
                          isSaving 
                            ? 'text-red-400 dark:text-red-500 opacity-40 cursor-not-allowed' 
                            : 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                        }`}
                        title="Delete Question"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolutions Navigator */}
            {editingResolutions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-300 mb-3">Resolutions ({editingResolutions.length})</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {editingResolutions.map((resolution, index) => (
                    <div
                      key={resolution.id}
                      className={`flex items-center gap-2 p-2 rounded text-sm transition-colors duration-200 ${
                        currentResolution?.id == resolution.id
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                          : 'bg-white dark:bg-dark-900 text-gray-700 dark:text-dark-200 border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-800'
                      }`}
                    >
                      <button
                        onClick={isSaving ? undefined : () => handleResolutionNavigation(resolution.id)}
                        disabled={isSaving}
                        className={`flex-1 text-left transition-opacity ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="font-medium">R{index + 1}:</span> {(resolution.title || 'Untitled Resolution').substring(0, 50)}{(resolution.title || '').length > 50 ? '...' : ''}
                      </button>
                      <button
                        onClick={isSaving ? undefined : () => handleDeleteResolution(resolution.id)}
                        disabled={isSaving}
                        className={`p-1 rounded transition-all ${
                          isSaving 
                            ? 'text-red-400 dark:text-red-500 opacity-40 cursor-not-allowed' 
                            : 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                        }`}
                        title="Delete Resolution"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flow Diagram */}
            {editingQuestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-300 mb-3">Question Flow</h3>
                <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded p-3 max-h-32 overflow-auto">
                  <div className="space-y-2 text-xs">
                    {editingQuestions.map((question, qIndex) => {
                      const answers = typeof question.answers === 'string' ? JSON.parse(question.answers) : question.answers;
                      const questionNumber = qIndex + 1;
                      
                      return (
                        <div key={question.id} className="space-y-1">
                          <div 
                            className={`font-medium transition-opacity ${
                              isSaving 
                                ? 'opacity-50 cursor-not-allowed' 
                                : currentQuestionId === question.id 
                                  ? 'text-theme-600 dark:text-theme-400 cursor-pointer' 
                                  : 'text-gray-700 dark:text-dark-200 cursor-pointer'
                            }`}
                            onClick={isSaving ? undefined : () => handleQuestionNavigation(question.id)}
                          >
                            Q{questionNumber}: {(question.question || 'Untitled Question').substring(0, 30)}{(question.question || '').length > 30 ? '...' : ''}
                          </div>
                          <div className="ml-4 space-y-1">
                            {answers.map((answer, aIndex) => {
                              const targetQuestion = answer.next_question_id 
                                ? editingQuestions.find(q => q.id == answer.next_question_id)
                                : null;
                              const targetResolution = answer.resolution_id 
                                ? editingResolutions.find(r => r.id == answer.resolution_id)
                                : null;
                              const targetQuestionIndex = targetQuestion 
                                ? editingQuestions.findIndex(q => q.id == answer.next_question_id)
                                : -1;
                              const targetResolutionIndex = targetResolution 
                                ? editingResolutions.findIndex(r => r.id == answer.resolution_id)
                                : -1;
                              
                              return (
                                <div key={aIndex} className="flex items-center gap-2 text-gray-600 dark:text-dark-300">
                                  <span className="text-gray-400">└─</span>
                                  <span className="truncate">{(answer.label || 'Untitled Answer').substring(0, 20)}{(answer.label || '').length > 20 ? '...' : ''}</span>
                                  <span className="text-gray-400">→</span>
                                  {targetQuestion ? (
                                    <span 
                                      className={`cursor-pointer hover:underline transition-opacity ${
                                        isSaving 
                                          ? 'opacity-50 cursor-not-allowed' 
                                          : 'text-theme-600 dark:text-theme-400'
                                      }`}
                                      onClick={isSaving ? undefined : () => handleQuestionNavigation(targetQuestion.id)}
                                    >
                                      Q{targetQuestionIndex + 1}
                                    </span>
                                  ) : targetResolution ? (
                                    <span 
                                      className={`cursor-pointer hover:underline transition-opacity ${
                                        isSaving 
                                          ? 'opacity-50 cursor-not-allowed' 
                                          : 'text-green-600 dark:text-green-400'
                                      }`}
                                      onClick={isSaving ? undefined : () => handleResolutionNavigation(targetResolution.id)}
                                    >
                                      R{targetResolutionIndex + 1}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">None</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!currentQuestion && !currentResolution && editingQuestions.length === 0 && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-100 mb-2">
              No Visual Guide Created Yet
            </h3>
            <p className="text-gray-500 dark:text-dark-400 mb-6">
              Create your first question to start building an interactive visual guide for this article.
            </p>
            <button
              onClick={isSaving ? undefined : () => handleAddQuestion()}
              disabled={isSaving}
              className={`font-semibold px-6 py-3 rounded-lg transition-all duration-200 ${
                isSaving 
                  ? 'bg-theme-400 dark:bg-theme-500 text-white dark:text-dark-50 opacity-50 cursor-not-allowed' 
                  : 'bg-theme-500 dark:bg-theme-600 hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-500 text-white dark:text-dark-50'
              }`}
            >
              Create First Question
            </button>
          </div>
        </div>
      )}

      {currentQuestion && (
        <QuestionBuilder
          question={currentQuestion}
          onAnswerSelect={handleAnswerSelect}
          onQuestionUpdate={handleQuestionUpdate}
          isEditing={isEditing}
          allQuestions={editingQuestions}
          allResolutions={editingResolutions}
          onAddQuestion={handleAddQuestion}
          onAddResolution={handleAddResolution}
          isParentInitialized={isInitialized}
          isSaving={isSaving}
        />
      )}

      {currentResolution && (
        <ResolutionBuilder
          resolution={currentResolution}
          onResolutionUpdate={handleResolutionUpdate}
          onRestart={handleRestart}
          onClose={onClose}
          isEditing={isEditing}
          isParentInitialized={isInitialized}
          allQuestions={editingQuestions}
          onNavigateToQuestion={handleResolutionFeedbackNavigation}
          onAddQuestion={handleAddQuestion}
          isSaving={isSaving}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: null, id: null })}
        title={deleteDialogContent.title}
        description={deleteDialogContent.description}
        type="delete"
        yesText="Delete"
        cancelText="Cancel"
        isYes={confirmDelete}
      />
    </div>
  );
}
