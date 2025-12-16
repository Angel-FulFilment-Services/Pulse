import React, { useState, useEffect } from 'react';
import Modal from '../Modals/Modal';
import TextInput from '../Forms/TextInput';
import SelectInput from '../Forms/SelectInput';
import ToggleInput from '../Forms/ToggleInput';
import { toast } from 'react-toastify';
import axios from 'axios';

const CATEGORY_ITEMS = [
  { id: 'profanity', value: 'Profanity' },
  { id: 'slur', value: 'Slur' },
  { id: 'offensive', value: 'Offensive' },
  { id: 'inappropriate', value: 'Inappropriate' },
  { id: 'sensitive', value: 'Sensitive' },
  { id: 'spam', value: 'Spam' },
  { id: 'custom', value: 'Custom' },
];

const LEVEL_ITEMS = [
  { id: 1, value: '1 - Low' },
  { id: 2, value: '2 - Medium' },
  { id: 3, value: '3 - High' },
];

export default function RestrictedWordModal({ 
  isOpen, 
  onClose, 
  onWordCreated,
  onWordUpdated,
  editWord = null
}) {
  const [word, setWord] = useState('');
  const [category, setCategory] = useState('profanity');
  const [level, setLevel] = useState(3);
  const [substitution, setSubstitution] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditMode = !!editWord;

  // Load word data when editing
  useEffect(() => {
    if (isEditMode && editWord) {
      setWord(editWord.word || '');
      setCategory(editWord.category || 'profanity');
      setLevel(editWord.level || 3);
      setSubstitution(editWord.substitution || '');
      setIsActive(editWord.is_active ?? true);
    } else if (isOpen && !isEditMode) {
      resetForm();
    }
  }, [editWord, isEditMode, isOpen]);

  const resetForm = () => {
    setWord('');
    setCategory('profanity');
    setLevel(3);
    setSubstitution('');
    setIsActive(true);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!word.trim()) {
      newErrors.word = 'Word is required';
    }
    
    if (!category) {
      newErrors.category = 'Category is required';
    }

    if (!level || level < 1 || level > 3) {
      newErrors.level = 'Level must be between 1 and 3';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      word: word.trim(),
      category,
      level: parseInt(level),
      substitution: substitution.trim() === '' ? null : substitution.trim(),
      is_active: isActive,
    };

    try {
      if (isEditMode) {
        await toast.promise(
          axios.put(`/api/administration/restricted-words/${editWord.id}`, payload),
          {
            pending: 'Updating restricted word...',
            success: 'Restricted word updated successfully!',
            error: {
              render({ data }) {
                console.error('Error updating restricted word:', data);
                return data?.response?.data?.message || 'Failed to update restricted word. Please try again.';
              }
            }
          },
          {
            position: 'top-center',
            autoClose: 3000,
          }
        );
        
        if (onWordUpdated) {
          onWordUpdated();
        }
      } else {
        await toast.promise(
          axios.post('/api/administration/restricted-words', payload),
          {
            pending: 'Creating restricted word...',
            success: 'Restricted word created successfully!',
            error: {
              render({ data }) {
                console.error('Error creating restricted word:', data);
                return data?.response?.data?.message || 'Failed to create restricted word. Please try again.';
              }
            }
          },
          {
            position: 'top-center',
            autoClose: 3000,
          }
        );
        
        if (onWordCreated) {
          onWordCreated();
        }
      }

      resetForm();
      onClose();
    } catch (error) {
      // Error is already handled by toast.promise
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Delay reset to allow modal fade-out animation
    setTimeout(() => {
      resetForm();
    }, 200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Restricted Word' : 'Add Restricted Word'}
      size="md"
    >
      <div className="space-y-4 p-6">
        {/* Word Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">
            Word <span className="text-red-500">*</span>
          </label>
          <TextInput
            id="word"
            placeholder="Enter restricted word..."
            currentState={word}
            onTextChange={setWord}
            returnRaw={true}
          />
          {errors.word && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.word}</p>
          )}
        </div>

        {/* Category Select */}
        <div>
          <SelectInput
            id="category"
            label="Category"
            annotation="*"
            items={CATEGORY_ITEMS}
            currentState={CATEGORY_ITEMS.find(c => c.id === category)?.value}
            placeholder="Select category..."
            onSelectChange={(changes) => {
              const change = changes.find(c => c.id === 'category');
              if (change) {
                const item = CATEGORY_ITEMS.find(c => c.value === change.value);
                if (item) setCategory(item.id);
              }
            }}
            error={errors.category}
          />
        </div>

        {/* Level Select */}
        <div>
          <SelectInput
            id="level"
            label="Severity Level"
            annotation="*"
            items={LEVEL_ITEMS}
            currentState={LEVEL_ITEMS.find(l => l.id === level)?.value}
            placeholder="Select severity level..."
            onSelectChange={(changes) => {
              const change = changes.find(c => c.id === 'level');
              if (change) {
                const item = LEVEL_ITEMS.find(l => l.value === change.value);
                if (item) setLevel(item.id);
              }
            }}
            error={errors.level}
          />
        </div>

        {/* Substitution Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">
            Substitution <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <TextInput
            id="substitution"
            placeholder="Enter substitution text (e.g., ***)"
            currentState={substitution}
            onTextChange={setSubstitution}
            returnRaw={true}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-dark-400">
            Text to replace the word with when detected
          </p>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between pt-2">
          <ToggleInput
            id="is_active"
            label="Active"
            annotation="Enable or disable this restricted word"
            checked={isActive}
            onChange={setIsActive}
            labelInline={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-500 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-theme-500 border border-transparent rounded-lg hover:bg-theme-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
