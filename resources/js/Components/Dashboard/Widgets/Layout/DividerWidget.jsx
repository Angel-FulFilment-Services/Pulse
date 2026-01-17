import React from 'react';

const DividerWidget = ({ isPreview = false, isEditMode = false }) => {
    if (isPreview) {
        return (
            <div className="flex items-center justify-center h-full w-full py-2">
                <div className="w-full border-t-2 border-gray-300 dark:border-dark-600"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="w-full border-t-2 border-gray-200 dark:border-dark-700"></div>
        </div>
    );
};

export default DividerWidget;
