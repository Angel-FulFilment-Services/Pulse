import React from 'react';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

const SpacerWidget = ({ isPreview = false, isEditMode = false, canResize = false }) => {
    if (isPreview) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="w-full h-full min-h-[40px] border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg flex items-center justify-center">
                    <ArrowsPointingOutIcon className="h-4 w-4 text-gray-400 dark:text-dark-500" />
                </div>
            </div>
        );
    }

    // In edit mode, show the spacer visually
    // In view mode, spacer is invisible
    if (isEditMode) {
        return (
            <div className="relative h-full w-full p-2">
                <div className="w-full h-full border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg bg-gray-50/50 dark:bg-dark-800/50 flex items-center justify-center">
                    <div className="text-center">
                        <ArrowsPointingOutIcon className="h-5 w-5 text-gray-400 dark:text-dark-500 mx-auto mb-1" />
                    </div>
                </div>
            </div>
        );
    }

    // View mode - completely invisible
    return <div className="w-full h-full" />;
};

export default SpacerWidget;
