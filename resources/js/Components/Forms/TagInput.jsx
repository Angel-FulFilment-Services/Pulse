import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid';

export default function TagInput(props) {
  const { 
    id,
    label,
    annotation,
    Icon,
    tags, 
    onTagsChange, 
    placeholder = "Add tags...", 
    maxTags = 10, 
    error, 
    clearErrors, 
    disabled = false 
} = props;

  const [inputValue, setInputValue] = useState('');
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsActive(false);
        if (inputValue.trim()) {
          addTag(inputValue.trim());
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inputValue]);

  const addTag = (tagText) => {
    if (tagText && !tags.includes(tagText) && tags.length < maxTags) {
      onTagsChange([...tags, tagText]);
      if (clearErrors) clearErrors();
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (clearErrors) clearErrors();
  };

  const handleContainerClick = () => {
    if (!disabled) {
      setIsActive(true);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="w-full">
      { (label || annotation) &&
        <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">
          {label}
          { annotation && 
            <span className='text-neutral-500 dark:text-dark-400 font-normal'> {annotation} </span>
          }
        </label>
      }
      <div className="relative">
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          className={`min-h-[36px] w-full rounded-lg border px-3 py-0.5 transition-colors duration-200 flex ${
            disabled 
              ? 'cursor-not-allowed opacity-75 bg-gray-50 dark:bg-dark-900 border-gray-300 dark:border-dark-600' 
              : 'cursor-text'
          } ${
            error
              ? 'ring-1 ring-red-600 bg-white dark:bg-dark-800 dark:border-red-700 dark:ring-red-700'
              : isActive
                ? 'border-theme-500 ring-1 ring-theme-500 bg-white dark:bg-dark-800'
                : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 dark:hover:border-dark-500'
          }`}
        >
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 pl-3 py-1.5 rounded-full text-xs font-medium bg-theme-50 text-theme-600 dark:bg-theme-800 dark:text-theme-200 group transition-colors duration-150"
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) removeTag(index);
                  }}
                  disabled={disabled}
                  className="p-0.5 rounded-full hover:bg-theme-100 dark:hover:bg-theme-600 opacity-70 hover:opacity-100 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => !disabled && setIsActive(true)}
              placeholder={tags.length === 0 ? placeholder : ''}
              disabled={disabled || tags.length >= maxTags}
              className={`flex-1 min-w-0 border-0 bg-transparent p-0 placeholder:text-gray-400 dark:placeholder:text-dark-400 focus:ring-0 focus:outline-none text-sm ${
                error 
                  ? 'text-red-800 dark:text-red-900' 
                  : 'text-gray-900 dark:text-dark-100'
              } ${
                disabled 
                  ? 'text-gray-600 dark:text-dark-500 cursor-not-allowed' 
                  : ''
              }`}
            />
          </div>
        </div>
        {Icon && !error && <Icon className="absolute right-3 top-1/2 transform w-5 h-5 text-gray-400 dark:text-dark-500 -translate-y-1/2 pointer-events-none" />}
        {error && <ExclamationCircleIcon className="absolute right-3 top-1/2 transform w-5 h-5 text-red-600 dark:text-red-700 -translate-y-1/2 pointer-events-none" />}
      </div>
      {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message || error}</div>}
      {!error && tags.length >= maxTags && (
        <p className="mt-1 text-xs text-gray-500 dark:text-dark-400">
          Maximum {maxTags} tags allowed
        </p>
      )}
      {!error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-dark-400">
          Press space or enter to add a tag
        </p>
      )}
    </div>
  );
}
