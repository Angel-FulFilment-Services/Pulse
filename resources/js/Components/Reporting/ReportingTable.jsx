import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ChevronUpDownIcon, ChartPieIcon } from '@heroicons/react/20/solid';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ButtonControl from '../../Components/Controls/ButtonControl';
import PopoverControl from '../../Components/Controls/PopoverControl';
import SelectControl from '../../Components/Controls/SelectControl';
import NumberInput from '../../Components/Forms/NumberInput';
import ReportingTargets from './ReportingTargets';

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

export default function ReportingTable({ parameters, structure, filters, data, targets, editing, handleTargetChange }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); // State to track sorting configuration
  const [tableHeight, setTableHeight] = useState('calc(100vh - 15rem)'); // Default height

  useEffect(() => {
    const headerElement = document.getElementById('reporting_header');
    const mediaQuery = window.matchMedia('(min-width: 1024px)'); // Tailwind's `lg` breakpoint

    const updateTableHeight = () => {
      if (!headerElement) return;

      const headerHeight = headerElement.getBoundingClientRect().height;

      if (mediaQuery.matches) {
        // Screen width is `lg` or larger
        setTableHeight(`calc(100vh - ${headerHeight + 20}px)`);
      } else {
        // Screen width is below `lg`
        setTableHeight(`calc(100vh - ${headerHeight + 85}px)`);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateTableHeight();
    });

    if (headerElement) {
      resizeObserver.observe(headerElement); // Start observing the header element
    }

    mediaQuery.addEventListener('change', updateTableHeight); // Listen for screen width changes

    // Initial calculation
    updateTableHeight();

    return () => {
      resizeObserver.disconnect(); // Cleanup observer on component unmount
      mediaQuery.removeEventListener('change', updateTableHeight); // Remove event listener
    };
  }, []);

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

  const getCellColour = (column, row) => {
    // Find the target with the matching column ID
    const target = targets.find((t) => t.id === column.id);

    if (target?.target) {
      // If the target has a key prop, find the matching key value
      if (target.key) {
        const keyValue = row[target.key]; // Get the key value from the row
        const keyTarget = target.values.find((v) => v.keyValue === keyValue); // Find the matching key value in the target

        if (keyTarget) {
          // Use the high and low values from the keyTarget
          const { high, low } = keyTarget;
          const cellValue = parseFloat(row[column.id]);

          if ((high && target.targetDirection == "asc" && cellValue >= high) || (high && target.targetDirection == "desc" && cellValue <= high)) return 'bg-green-100 text-green-800'; // High value
          if ((low && target.targetDirection == "asc" && cellValue <= low) || (low && target.targetDirection == "desc" && cellValue >= low)) return 'bg-red-100 text-red-800'; // Low value
          if(low || high) {
            return 'bg-yellow-100 text-yellow-800'; // Between high and low
          }
        }
      } else {
        // Use the high and low values directly from the target
        const { high, low } = target.target;
        const cellValue = parseFloat(row[column.id]);
        if ((high && target.targetDirection == "asc" && cellValue >= high) || (high && target.targetDirection == "desc" && cellValue <= high)) return 'bg-green-100 text-green-800'; // High value
        if ((low && target.targetDirection == "asc" && cellValue <= low) || (low && target.targetDirection == "desc" && cellValue >= low)) return 'bg-red-100 text-red-800'; // Low value
        if(low || high) {
          return 'bg-yellow-100 text-yellow-700'; // Between high and low
        }
      }
    }

    return ''; // Default color if no target is found
  };

  return (
    <div className={`flex flex-col`} style={{ height: tableHeight, overflowY: 'auto', marginTop: '0.5rem' }}>
      <div className="min-w-full align-middle">
        <table id="data-table" className="min-w-full divide-y divide-gray-300 border-separate border-spacing-0">
          {/* Table Header */}
          <thead>
            {parameters.headerGrouping ? 
              <tr className="sticky top-0 z-10 bg-white">
                {parameters.headerGroups.map((column) =>
                  <th key={column.label} colSpan={column.colSpan} scope="col" className={`${column.headerClass}`}>{column.label}</th>
                )}
              </tr>
            : null}
            <tr className={`sticky ${parameters.headerGrouping ? "top-10" : "top-0"} z-10 bg-white`}>
              {structure.map((column) =>
                column.visible !== false ? (
                  <th
                    key={column.id}
                    scope="col"
                    className={`py-3.5 px-3 text-sm font-semibold text-gray-900 border-b border-gray-300 relative ${column.thClass} ${!editing ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => {if(!editing) handleSort(column)}}
                  >
                    <div className={`${column.headerClass || ''} whitespace-nowrap`}>
                      <div>
                        {column.label}
                        {column.headerAnnotation && (
                          <span className="text-gray-500 text-xs font-normal ml-1">
                            {column.headerAnnotation}
                          </span>
                        )}
                        {column.subLabel && (
                          <>
                            <br></br>
                            <span className="text-gray-500 text-xs font-normal">
                              {column.subLabel}
                            </span>
                          </>
                        )}
                      </div>
                      {sortConfig.key === column.id && (
                        <span className="flex-shrink-0 text-orange-500 h-5 w-5 flex items-center justify-center">
                            <ChevronUpDownIcon className="w-5 h-5" />
                        </span>
                      )}
                      {(editing && parameters.targetAllowColumn && column.allowTarget) ? (
                        <span className="">
                          <PopoverControl
                            icon={<ChevronDownIcon className="w-5 h-5 flex-shrink-0" />}
                            buttonClass={`flex-shrink-0 bg-orange-50 hover:bg-orange-100 text-orange-500 h-5 w-5 rounded-full flex items-center justify-center cursor-pointer focus:outline-none`}
                            content ={(
                              <ReportingTargets column={column} targets={targets} handleTargetChange={handleTargetChange}/>
                            )}
                            />
                        </span>
                      ) : null}
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
                      className={`whitespace-nowrap px-3 py-2 text-sm ${getCellColour(column, row)} ${column.tdClass}`}
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
                        className={`whitespace-nowrap px-3 py-2 text-sm text-gray-900 border-t bg-white border-gray-300 ${column.tdClass}`}
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
                              return colIndex === 0 ? 'Total' : '';
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
  );
}
