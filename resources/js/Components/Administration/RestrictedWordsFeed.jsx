import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { TrashIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import useFetchRestrictedWords from '../Fetches/Administration/useFetchRestrictedWords.jsx';
import FilterControl from '../Controls/FilterControl.jsx';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';
import RestrictedWordModal from './RestrictedWordModal.jsx';

const LEVEL_LABELS = {
  1: { label: 'Low', color: 'text-green-600 dark:text-green-400' },
  2: { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' },
  3: { label: 'High', color: 'text-red-600 dark:text-red-400' },
};

const CATEGORY_LABELS = {
  profanity: { label: 'Profanity', color: 'text-red-600 dark:text-red-400' },
  slur: { label: 'Slur', color: 'text-rose-600 dark:text-rose-400' },
  offensive: { label: 'Offensive', color: 'text-amber-600 dark:text-amber-400' },
  inappropriate: { label: 'Inappropriate', color: 'text-orange-600 dark:text-orange-400' },
  sensitive: { label: 'Sensitive', color: 'text-purple-600 dark:text-purple-400' },
  spam: { label: 'Spam', color: 'text-blue-600 dark:text-blue-400' },
  custom: { label: 'Custom', color: 'text-gray-600 dark:text-gray-400' },
};

function applyFilters(data, filters = []) {
  if (!filters || filters.length === 0) {
    return data;
  }

  return data.filter((item) => {
    return filters.every((filter) => {
      const filterExpression = filter.expression(item);
      const activeOptions = filter.options.filter((option) => option.checked);

      if (activeOptions.length === 0) {
        return true;
      }

      return activeOptions.some((option) => filterExpression(option.value));
    });
  });
}

// Word Row Component
const WordRow = ({ word, onEdit, onDelete }) => {
  const levelInfo = LEVEL_LABELS[word.level] || LEVEL_LABELS[3];
  const categoryInfo = CATEGORY_LABELS[word.category] || CATEGORY_LABELS.custom;

  return (
    <article className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 group relative">
        <div className="flex items-center gap-x-4">
          {/* Word */}
          <div className="min-w-[150px]">
            <h3 className="font-semibold text-gray-900 dark:text-dark-100 truncate">
              {word.word}
            </h3>
          </div>
          
          {/* Category Badge */}
          <span className={`text-sm font-medium ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          
          <div className="border-l border-gray-300 dark:border-dark-600 h-4" />
          
          {/* Level Badge */}
          <span className={`text-sm font-medium ${levelInfo.color}`}>
            Level {word.level} - {levelInfo.label}
          </span>
          
          {/* Substitution */}
          {word.substitution && (
            <span className="text-sm text-gray-500 dark:text-dark-400">
              → <span className="font-mono bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded">{word.substitution}</span>
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-x-4 text-xs text-gray-500 dark:text-dark-400 ml-4 flex-shrink-0">
        {/* Active Status */}
        <div className="flex items-center gap-x-1">
          {word.is_active ? (
            <>
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Active</span>
            </>
          ) : (
            <>
              <XCircleIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400">Inactive</span>
            </>
          )}
        </div>
        
        <div className="border-l border-gray-200 dark:border-dark-700 h-4" />
        
        {/* Actions */}
        <div className="flex items-center gap-x-2">
          <button
            onClick={() => onEdit(word)}
            className="relative p-1 text-gray-500 hover:text-gray-600 dark:text-dark-400 dark:hover:text-dark-300 transition-colors duration-200"
            title={`Edit "${word.word}"`}
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(word)}
            className="relative p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
            title={`Delete "${word.word}"`}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default function RestrictedWordsFeed({ searchTerm, refreshTrigger, setRefreshTrigger }) {
  const { restrictedWords, isLoading, isLoaded, refetch } = useFetchRestrictedWords(refreshTrigger);
  const [filters, setFilters] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [wordToDelete, setWordToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [wordToEdit, setWordToEdit] = useState(null);

  const formattedWords = useMemo(() => (restrictedWords || []).map((word) => ({
    id: word.id,
    word: word.word,
    category: word.category,
    level: word.level,
    substitution: word.substitution,
    is_active: word.is_active,
    created_at: word.created_at ? new Date(word.created_at).toISOString() : null,
    updated_at: word.updated_at ? new Date(word.updated_at).toISOString() : null,
  })), [restrictedWords]);

  // Initialize filters when words are loaded
  useEffect(() => {
    if (formattedWords.length > 0) {
      const uniqueCategories = [...new Set(formattedWords.map(w => w.category))].sort();
      const uniqueLevels = [...new Set(formattedWords.map(w => w.level))].sort((a, b) => a - b);

      const initialFilters = [
        {
          id: 'category',
          name: 'Category',
          label: 'Category',
          expression: (item) => (value) => item.category === value,
          options: uniqueCategories.map(cat => ({
            label: CATEGORY_LABELS[cat]?.label || cat,
            value: cat,
            checked: false
          }))
        },
        {
          id: 'level',
          name: 'Severity Level',
          label: 'Severity Level',
          expression: (item) => (value) => item.level === value,
          options: uniqueLevels.map(lvl => ({
            label: `Level ${lvl} - ${LEVEL_LABELS[lvl]?.label || 'Unknown'}`,
            value: lvl,
            checked: false
          }))
        },
        {
          id: 'is_active',
          name: 'Status',
          label: 'Status',
          expression: (item) => (value) => item.is_active === value,
          options: [
            { label: 'Active', value: true, checked: false },
            { label: 'Inactive', value: false, checked: false }
          ]
        }
      ];
      
      setFilters(initialFilters);
    }
  }, [formattedWords]);

  // Filter by search term
  const searchFilteredWords = formattedWords.filter((word) => {
    const searchLower = searchTerm?.toLowerCase() || '';
    return (
      word.word.toLowerCase().includes(searchLower) ||
      word.category.toLowerCase().includes(searchLower) ||
      (word.substitution && word.substitution.toLowerCase().includes(searchLower))
    );
  });

  // Apply filters
  const filteredWords = applyFilters(searchFilteredWords, filters);

  const handleFilterChange = (filterUpdate) => {
    const updatedFilters = filters.map(filter => {
      if (filter.id === filterUpdate.id) {
        return {
          ...filter,
          options: filter.options.map(option => {
            if (option.value === filterUpdate.value) {
              return { ...option, checked: filterUpdate.checked };
            }
            return option;
          })
        };
      }
      return filter;
    });
    setFilters(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = filters.map(filter => ({
      ...filter,
      options: filter.options.map(option => ({ ...option, checked: false }))
    }));
    setFilters(clearedFilters);
  };

  const handleEdit = (word) => {
    setWordToEdit(word);
    setShowEditModal(true);
  };

  const handleDeleteClick = (word) => {
    setWordToDelete(word);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!wordToDelete) return;

    setShowDeleteDialog(false);

    try {
      await toast.promise(
        axios.delete(`/api/administration/restricted-words/${wordToDelete.id}`),
        {
          pending: 'Deleting restricted word...',
          success: 'Restricted word deleted successfully!',
          error: {
            render({ data }) {
              console.error('Error deleting word:', data);
              return 'Failed to delete restricted word. Please try again.';
            }
          }
        },
        {
          position: 'top-center',
          autoClose: 3000,
        }
      );
      refetch();
    } catch (error) {
      // Error handled by toast
    } finally {
      setWordToDelete(null);
    }
  };

  const handleWordUpdated = () => {
    refetch();
    setShowEditModal(false);
    setWordToEdit(null);
  };

  return (
    <div className="bg-white dark:bg-dark-900">
      {isLoaded && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 shadow-sm slide-down z-20">
          <FilterControl 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            clearFilters={clearFilters} 
          />
        </div>
      )}
      
      {isLoading && !isLoaded && (
        <div className="flex flex-col items-center min-h-svh justify-center w-full pb-72">
          <div className="flex gap-3 justify-center">
            <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader"></div>
            <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader animation-delay-200"></div>
            <div className="w-5 h-5 bg-gray-300 dark:bg-dark-500 rounded-full animate-loader animation-delay-[400ms]"></div>
          </div>
        </div>
      )}
      
      {isLoaded && (
        <div className="mx-auto max-w-full w-full px-6 lg:px-8">
          <div className="mx-auto max-w-full w-full">
            <div className="mt-2 w-full space-y-4">
              <motion.div
                className="overflow-y-auto h-dvh pb-96 no-scrollbar divide-y divide-gray-200 dark:divide-dark-700"
                layout
              >
                <AnimatePresence>
                  {filteredWords.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center text-gray-500 dark:text-dark-400"
                    >
                      <p className="text-lg">No restricted words found</p>
                      <p className="text-sm mt-1">Add a word to get started</p>
                    </motion.div>
                  ) : (
                    filteredWords.map((word) => (
                      <motion.div
                        key={word.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="bg-white dark:bg-dark-900"
                      >
                        <WordRow 
                          word={word} 
                          onEdit={handleEdit} 
                          onDelete={handleDeleteClick} 
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Restricted Word"
        description={`Are you sure you want to delete "${wordToDelete?.word}"? This action cannot be undone.`}
        isYes={handleDeleteConfirm}
        type="delete"
        yesText="Delete"
        cancelText="Cancel"
      />

      {/* Edit Modal */}
      <RestrictedWordModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setWordToEdit(null); }}
        editWord={wordToEdit}
        onWordUpdated={handleWordUpdated}
      />
    </div>
  );
}
