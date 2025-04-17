import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ChartPieIcon } from '@heroicons/react/20/solid';
import ButtonControl from '../../Components/Controls/ButtonControl';

function applyFilters(data, filters = []) {
  // If no filters are provided, return the original data
  if (!filters || filters.length === 0) {
    return data;
  }

  return data.filter((item) => {
    return filters.every((filter) => {
      const filterExpression = filter.expression(item);
      const activeOptions = filter.options.filter((option) => option.checked);

      // If no options are checked, include all items
      if (activeOptions.length === 0) {
        return true;
      }

      // Check if the item matches any of the active filter options
      return activeOptions.some((option) => filterExpression(option.value));
    });
  });
}

export default function ReportingTable({ parameters, structure, filters, data }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); // State to track sorting configuration

  console.log(parameters);

  // Apply filters to the data
  const filteredData = useMemo(() => {
    return applyFilters(data, filters);
  }, [data, filters]);

  // Apply sorting to the filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const { key, direction } = sortConfig;

    return [...filteredData].sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];
      const column = structure.find((col) => col.id === key);

      if (column.dataType === 'integer' || column.dataType === 'float') {
        return direction === 'asc'
          ? parseFloat(valueA) - parseFloat(valueB)
          : parseFloat(valueB) - parseFloat(valueA);
      }

      if (column.dataType === 'string') {
        return direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (column.dataType === 'date') {
        return direction === 'asc'
          ? new Date(valueA) - new Date(valueB)
          : new Date(valueB) - new Date(valueA);
      }

      return 0; // Default case for unsupported data types
    });
  }, [filteredData, sortConfig, structure]);

  const handleSort = (column) => {
    const { id } = column;

    // Determine the new sort direction
    const newDirection = sortConfig.key === id && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    setSortConfig({ key: id, direction: newDirection });
  };

  return (
    <div className="flex flex-col flex-grow h-[42rem] overflow-y-auto overflow-x-hidden">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full align-middle px-6">
          <table id="data-table" className="min-w-full divide-y divide-gray-300 border-separate border-spacing-0">
            {/* Table Header */}
            <thead>
              <tr className="sticky top-0 z-10 bg-white">
                {structure.map((column) =>
                  column.visible !== false ? (
                    <th
                      key={column.id}
                      scope="col"
                      className="py-3.5 px-3 text-sm font-semibold cursor-pointer text-gray-900 border-b border-gray-300 relative group"
                      onClick={() => handleSort(column)}
                    >
                      {parameters.targetAllowColumn && (
                            <div className="absolute top-0 left-0 w-6 h-full">
                              <ButtonControl id={`${column.id}"target_icon"`} Icon={ChartPieIcon} customClass="flex flex-shrink-0 items-center justify-center w-full min-w-6 max-w-6 bg-white py-1.5 h-6 text-gray-400 hover:text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm sm:leading-6 rounded-md group-hover:flex hidden" preventBubble={true} iconClass="w-4 h-4 text-gray-400 flex-shrink-0"/>
                            </div>
                        )}
                      <div className={`${column.headerClass || ''} whitespace-nowrap`}>
                        <div>
                          {column.label}
                          {column.headerAnnotation && (
                            <span className="text-gray-500 text-xs font-normal ml-1">
                              {column.headerAnnotation}
                            </span>
                          )}
                        </div>
                        {sortConfig.key === column.id && (
                          <span className="flex-shrink-0 bg-orange-500 text-white h-5 w-5 rounded flex items-center justify-center">
                            {sortConfig.direction === 'asc' ? (
                              <ChevronUpIcon className="w-5 h-5" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ) : null
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white">
              {sortedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="even:bg-gray-50">
                  {structure.map((column) =>
                    column.visible !== false ? (
                      <td
                        key={column.id}
                        className="whitespace-nowrap px-3 py-2 text-sm"
                      >
                        <div className={`${column.cellClass || ''}`}>
                          {column.prefix || ''}
                          {column.format
                            ? column.format(row[column.id])
                            : row[column.id]}
                          {column.suffix || ''}
                        </div>
                      </td>
                    ) : null
                  )}
                </tr>
              ))}

                {/* Totals Row */}
                {parameters.total && (
                  <tr className="bg-white sticky bottom-0 font-semibold">
                    {structure.map((column, colIndex) =>
                      column.visible !== false ? (
                        <td
                          key={colIndex}
                          className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 border-t border-gray-300"
                        >
                          <div className={`${column.cellClass || ''}`}>
                            {(() => {
                              if (column.dataType === 'integer' || column.dataType === 'float') {
                                if (column.suffix === '%' && column.numeratorId && column.denominatorId) {
                                  // Calculate weighted average for percentage columns
                                  const totalNumerator = sortedData.reduce(
                                    (sum, row) => sum + (parseFloat(row[column.numeratorId]) || 0),
                                    0
                                  );
                                  const totalDenominator = sortedData.reduce(
                                    (sum, row) => sum + (parseFloat(row[column.denominatorId]) || 0),
                                    0
                                  );
                                  const weightedAverage = totalDenominator
                                    ? ((totalNumerator / totalDenominator) * 100).toFixed(2)
                                    : 0;
                                  return `${column.format(weightedAverage)}%`;
                                } else {
                                  // Sum numeric columns
                                  return column.format(
                                    sortedData.reduce((sum, row) => sum + (parseFloat(row[column.id]) || 0), 0)
                                  );
                                }
                              } else if (column.dataType === 'string') {
                                // Leave string columns empty or provide a label
                                return colIndex === 0 ? 'Total' : '';
                              } else if (column.dataType === 'date') {
                                // Leave date columns empty
                                return '';
                              } else {
                                return ''; // Default case for unsupported data types
                              }
                            })()}
                          </div>
                        </td>
                      ) : null
                    )}
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
