import React, { useRef, useState, useEffect } from 'react';
import { CheckCircleIcon, ChevronDownIcon, ExclamationCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import UserItem from '../User/UserItem.jsx';
import PopoverFlyout from '../Flyouts/PopoverFlyout.jsx';

export default function StackedList({
  data,
  allowManagement = false,
  actions = [],
  onRemove,
  onEdit,
  renderTitle,
  renderDescription,
  renderExpandableContent,
  allowExpand = true,
  placeholderCount = 0, // <-- Add this prop
}) {
  const [expandedRow, setExpandedRow] = useState(null);
  const contentRefs = useRef([]);
  const [heights, setHeights] = useState([]);

  const handleToggleExpand = (rowIndex) => {
    setExpandedRow((prev) => (prev === rowIndex ? null : rowIndex));
  };

  useEffect(() => {
    if (expandedRow !== null && contentRefs.current[expandedRow]) {
      const newHeights = [...heights];
      newHeights[expandedRow] = contentRefs.current[expandedRow].scrollHeight;
      setHeights(newHeights);
    }
  }, [expandedRow]);

  // Calculate how many placeholders to show
  const placeholdersToShow = Math.max(0, placeholderCount - data.length);

  return (
    <ul className="w-full">
      {data.map((row, rowIndex) => {
        const isExpanded = expandedRow === rowIndex;

        return (
          <li key={rowIndex} className="w-full border-b border-gray-200 dark:border-dark-700">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-2 sm:flex-nowrap">
              <div
                className={`w-full${allowExpand ? ' cursor-pointer' : ''}`}
                onClick={allowExpand ? () => handleToggleExpand(rowIndex) : undefined}
              >
                {/* Title section */}
                {renderTitle ? (
                  renderTitle(row, rowIndex)
                ) : (
                  <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-dark-100">
                    {row.title || row.category || row.type}
                  </p>
                )}
                {/* Description section */}
                <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500 dark:text-dark-400">
                  {renderDescription ? (
                    renderDescription(row, rowIndex)
                  ) : (
                    <p>{row.description}</p>
                  )}
                </div>
              </div>
              <div>
                <dl className="flex w-full flex-none justify-between gap-x-4 sm:w-auto px-4">
                  <div className="flex -space-x-0.5">
                    {row.users.map((user, userIndex) => (
                      <div key={userIndex}>
                        <PopoverFlyout
                          placement='top'
                          className=""
                          placementOffset={7.5}
                          content={
                            <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300 mr-1 cursor-default">  
                              <p className="text-sm text-gray-900 dark:text-dark-100">{user.name}</p>
                            </div>
                          }>
                          <UserItem
                            userId={user.userId}
                            searchState={'userId'}
                            showState={false}
                            customClass={'ring-2 ring-white dark:ring-dark-900'}
                            size="extra-small"
                          />
                        </PopoverFlyout>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center items-center w-full divide-x divide-gray-200 dark:divide-dark-700">
                    {row.resolved !== undefined ? (
                      <dt className="flex items-center pr-3">
                        {row.resolved ? (
                          <PopoverFlyout
                            placement='top'
                            className=""
                            placementOffset={5}
                            content={
                              <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300 mr-1 cursor-default">  
                                <p className="text-sm text-gray-900 dark:text-dark-100">Resolved</p>
                              </div>
                            }>
                            <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-600" aria-hidden="true" />
                          </PopoverFlyout>
                        ) : (
                          <PopoverFlyout
                            placement='top'
                            className=""
                            placementOffset={5}
                            content={
                              <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300 mr-1 cursor-default">  
                                <p className="text-sm text-gray-900 dark:text-dark-100">Unresolved</p>
                              </div>
                            }>
                            <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-700" aria-hidden="true" />
                          </PopoverFlyout>
                        )}
                      </dt>)
                      : <div />
                    }
                    {allowManagement && (
                      <dt className="flex items-center justify-center gap-x-2 pl-3 pr-3">
                        <button
                          onClick={() => {
                            if (allowManagement && onEdit) {
                              onEdit(row);
                            }
                          }}
                        >
                          <PencilIcon
                            className="h-5 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          onClick={() => {
                            if (allowManagement && onRemove) {
                              onRemove(row);
                            }
                          }}
                        >
                          <TrashIcon
                            className="h-5 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out"
                            aria-hidden="true"
                          />
                        </button>
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => {
                              if (allowManagement && action.onClick) {
                                action.onClick(row);
                              }
                            }}
                            title={action.tooltip || ''}
                          >
                            {typeof action.icon === 'function' ? (
                              action.icon(row)
                            ) : (
                              <action.icon className="h-5 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out" aria-hidden="true" />
                            )}
                          </button>
                        ))}
                      </dt>
                    )}
                    {allowExpand && (
                      <div
                        className="cursor-pointer pl-3 flex items-center"
                        onClick={() => handleToggleExpand(rowIndex)}
                      >
                        <ChevronDownIcon
                          className={`h-6 w-6 text-gray-400 dark:text-dark-500 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>
                </dl>
              </div>
            </div>
            {/* Expandable content with slide animation */}
            {allowExpand && (
              <div
                ref={(el) => (contentRefs.current[rowIndex] = el)} // Assign ref for each row
                style={{
                  height: isExpanded ? heights[rowIndex] || 0 : 0,
                  transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                }}
              >
                <div className="bg-gray-50 dark:bg-dark-800 px-4 py-2 border-t border-gray-200 dark:border-dark-700 animate-fade-in">
                  {renderExpandableContent ? renderExpandableContent(row, rowIndex) : null}
                </div>
              </div>
            )}
          </li>
        );
      })}

      {/* Placeholder rows */}
      {Array.from({ length: placeholdersToShow }).map((_, idx) => (
        <li
          key={`placeholder-${idx}`}
          className="w-full border-b border-gray-200 dark:border-dark-700 pointer-events-none opacity-50"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-3 sm:flex-nowrap">
            <div className="w-full">
              <div className="h-4 bg-gray-100 dark:bg-dark-800 rounded-xl w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-100 dark:bg-dark-800 rounded-xl w-3/4"></div>
            </div>
            <div>
              <dl className="flex w-full flex-none justify-between gap-x-4 sm:w-auto px-4">
                <div className="flex">
                  <div className="flex flex-row -space-x-0.5">
                    <div className="rounded-full bg-gray-100 dark:bg-dark-800 size-6 ring-2 ring-white dark:ring-dark-900" />
                    <div className="rounded-full bg-gray-100 dark:bg-dark-800 size-6 ring-2 ring-white dark:ring-dark-900" />
                  </div>
                </div>
                <div className="flex justify-center items-center w-full divide-x divide-gray-200 dark:divide-dark-700">
                  <div className="flex items-center" />
                  {allowManagement && (
                    <dt className="flex items-center justify-center gap-x-2 pl-3 pr-3">
                      <PencilIcon className="h-5 w-6 text-gray-300 dark:text-dark-700" aria-hidden="true" />
                      <TrashIcon className="h-5 w-6 text-gray-300 dark:text-dark-700" aria-hidden="true" />
                    </dt>
                  )}
                  {allowExpand && (
                    <div className="pl-3 flex items-center">
                      <ChevronDownIcon className="h-6 w-6 text-gray-300 dark:text-dark-700" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </dl>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}