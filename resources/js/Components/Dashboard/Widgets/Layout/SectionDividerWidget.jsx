import React, { useState, useRef, useEffect } from 'react';

const SectionDividerWidget = ({ 
    isPreview = false, 
    isEditMode = false,
    widgetId,
    title: savedTitle,
    onTitleChange
}) => {
    const [title, setTitle] = useState(savedTitle || 'Section');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null);

    // Sync state with saved title when it changes (e.g., on reload)
    useEffect(() => {
        if (savedTitle !== undefined && savedTitle !== title && !isEditing) {
            setTitle(savedTitle);
        }
    }, [savedTitle]);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleTitleClick = (e) => {
        if (isEditMode) {
            e.stopPropagation();
            setIsEditing(true);
        }
    };

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    const handleTitleBlur = () => {
        setIsEditing(false);
        if (onTitleChange && widgetId) {
            onTitleChange(widgetId, title);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleBlur();
        } else if (e.key === 'Escape') {
            setTitle(savedTitle || 'Section');
            setIsEditing(false);
        }
    };

    if (isPreview) {
        return (
            <div className="flex items-center justify-center h-full w-full py-2">
                <div className="flex-1 border-t-2 border-gray-300 dark:border-dark-600"></div>
                <span className="px-4 text-xs font-medium text-gray-500 dark:text-dark-400">
                    Section
                </span>
                <div className="flex-1 border-t-2 border-gray-300 dark:border-dark-600"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full w-full">
            {/* Left line */}
            <div className="flex-1 border-t-2 border-gray-200 dark:border-dark-700"></div>
            
            {/* Title in the middle */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="px-3 py-0.5 text-sm font-medium text-center bg-transparent text-gray-600 dark:text-dark-300 outline-none min-w-[60px] max-w-[200px]"
                    style={{ width: `${Math.max(60, title.length * 8 + 24)}px` }}
                />
            ) : (
                <span 
                    onClick={handleTitleClick}
                    className={`px-4 text-sm font-medium text-gray-500 dark:text-dark-400 ${
                        isEditMode ? 'cursor-text hover:text-gray-700 dark:hover:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded px-3 py-0.5 transition-colors' : ''
                    }`}
                    title={isEditMode ? 'Click to edit title' : undefined}
                >
                    {title || 'Section'}
                </span>
            )}
            
            {/* Right line */}
            <div className="flex-1 border-t-2 border-gray-200 dark:border-dark-700"></div>
        </div>
    );
};

export default SectionDividerWidget;
