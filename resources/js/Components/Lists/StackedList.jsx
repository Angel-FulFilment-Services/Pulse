import React, { useRef, useState, useEffect } from 'react';
import { CheckCircleIcon, ChevronDownIcon, ExclamationCircleIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import UserItem from '../User/UserItem.jsx';

export default function StackedList({
  data,
  allowSupportManagement = true,
  onRemove,
  onEdit,
  renderTitle,
  renderDescription,
  allowExpand = true // New prop with default true
}) {
  const [expandedRow, setExpandedRow] = useState(null);

  const handleToggleExpand = (rowIndex) => {
    setExpandedRow(prev => (prev === rowIndex ? null : rowIndex));
  };

  return (
    <ul className="w-full">
      {data.map((row, rowIndex) => {
        const contentRef = useRef(null);
        const isExpanded = expandedRow === rowIndex;
        const [height, setHeight] = useState(0);

        useEffect(() => {
          if (isExpanded && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
          } else {
            setHeight(0);
          }
        }, [isExpanded]);

        return (
          <li key={rowIndex} className="w-full border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-2 sm:flex-nowrap">
              <div
                className={`w-full${allowExpand ? ' cursor-pointer' : ''}`}
                onClick={allowExpand ? () => handleToggleExpand(rowIndex) : undefined}
              >
                {/* Title section */}
                {renderTitle ? (
                  renderTitle(row, rowIndex)
                ) : (
                  <p className="text-sm font-semibold leading-6 text-gray-900">
                    {row.title || row.category}
                  </p>
                )}
                {/* Description section */}
                <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
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
                    <div>
                      <UserItem
                        userId={row.createdBy}
                        searchState={"userId"}
                        showState={false}
                        customClass={"ring-2 ring-white"}
                        size="extra-small"
                      />
                    </div>
                    <div>
                      <UserItem
                        userId={row.loggedby}
                        searchState={"userId"}
                        showState={false}
                        customClass={"ring-2 ring-white"}
                        size="extra-small"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-44 divide-x divide-gray-200">
                    <dt className="flex items-center pr-3">
                      {row.resolved ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                      ) : (
                        <ExclamationCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      )}
                    </dt>
                    <dt className="flex items-center gap-x-2 pl-3 pr-3">
                      <PencilIcon
                        className="h-5 w-6 text-orange-600 hover:text-orange-700 cursor-pointer transition-all ease-in-out"
                        aria-hidden="true"
                        onClick={() => onEdit && onEdit(row)}
                      />
                      <button
                        onClick={() => {
                          if (allowSupportManagement && onRemove) {
                            onRemove(row);
                          }
                        }}
                      >
                        <TrashIcon className="h-5 w-6 text-orange-600 hover:text-orange-700 cursor-pointer transition-all ease-in-out" aria-hidden="true" />
                      </button>
                      {row.resolved ? (
                        <XMarkIcon className="h-5 w-6 text-orange-600 hover:text-orange-700 cursor-pointer transition-all ease-in-out" aria-hidden="true" />
                      ) : (
                        <CheckIcon className="h-5 w-6 text-orange-600 hover:text-orange-700 cursor-pointer transition-all ease-in-out" aria-hidden="true" />
                      )}
                    </dt>
                    {allowExpand && (
                      <div
                        className="cursor-pointer pl-3 flex items-center"
                        onClick={() => handleToggleExpand(rowIndex)}
                      >
                        <ChevronDownIcon
                          className={`h-6 w-6 text-gray-400 transition-transform duration-300  ${isExpanded ? 'rotate-180' : ''}`}
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
                ref={contentRef}
                style={{
                  height: isExpanded ? height : 0,
                  transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                }}
              >
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 animate-fade-in">
                    { renderExpandableContent ? (renderExpand(row, rowIndex)) : null}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}