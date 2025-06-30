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

      // Group options by mode
      if (filter.advanced) {
        const checkedOptions = filter.options.filter(opt => opt.checked);
        const uncheckedOptions = filter.options.filter(opt => !opt.checked);

        if (checkedOptions.length === 0) return false;

        // "solo" mode: always include if checked and matches
        if (checkedOptions.some(opt => opt.mode === 'solo' && filterExpression(opt.value))) {
          return true;
        }

        // "and" mode: must match at least one checked "and" and not match any unchecked
        const checkedAndOptions = checkedOptions.filter(opt => opt.mode === 'and');
        if (checkedAndOptions.length > 0) {
          const matchesAnd = checkedAndOptions.some(opt => filterExpression(opt.value));
          const matchesUnchecked = uncheckedOptions.some(opt => filterExpression(opt.value));
          return matchesAnd && !matchesUnchecked;
        }

        // Fallback: must match at least one checked and not match any unchecked
        const matchesChecked = checkedOptions.some(opt => filterExpression(opt.value));
        const matchesUnchecked = uncheckedOptions.some(opt => filterExpression(opt.value));
        return matchesChecked && !matchesUnchecked;
      }

      if (filter.id === 'include') {
        // For "include" filters, check if the item matches any of the options
        return filter.options.some((option) => {
          if (option.checked) {
            return filterExpression(option.value);
          }
          return false;
        });
      }

      if (filter.id === 'exclude') {
        // For "exclude" filters, check if the item does not match any of the options
        return !filter.options.some((option) => {
          if (option.checked) {
            return filterExpression(option.value);
          }
          return false;
        });
      }

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

function resolveColumnParameters(column, parameters, dateRange) {
  if (!column.parameters) return undefined;
  return Object.fromEntries(
    Object.entries(column.parameters).map(([k, v]) => {
      // Add more types as needed

      if (v.type === 'endDate' && dateRange?.endDate) return [k, dateRange.endDate];
      if (v.type === 'startDate' && dateRange?.startDate) return [k, dateRange.startDate];
      // Add more custom logic for other types here
      return [k, v.default];
    })
  );
}

export default function ReportingTable({ parameters, structure, filters, data, targets, editing, handleTargetChange, setReportData, dateRange }) {
  const [sortConfig, setSortConfig] = useState(parameters?.sorting?.default ? parameters.sorting.default : { key: null, direction: 'asc' }); // State to track sorting configuration
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

  const groupedData = useMemo(() => {
    if (!parameters.grouping || !parameters.grouping.groupBy || parameters.grouping.groupBy.length === 0) {
      return data;
    }

    // Helper to get a unique group key for each row
    const getGroupKey = (row) =>
      parameters.grouping.groupBy.map((col) => row[col]).join('||');

    // Group rows by group key
    const groups = {};
    data.forEach((row) => {
      const key = getGroupKey(row);
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    // For each group, build a new row using groupColumns logic
    return Object.values(groups).map((groupRows) => {
      const groupedRow = {};
      parameters.grouping.groupColumns.forEach((col) => {
        if (col.group && typeof col.group === 'function') {
          groupedRow[col.id] = col.group(groupRows);
        } else {
          // Default: just take the first value
          groupedRow[col.id] = groupRows[0][col.id];
        }
      });
      return groupedRow;
    });
  }, [data, parameters.grouping]);

  // Apply filters to the data
  const filteredData = useMemo(() => {
    return applyFilters(groupedData, filters);
  }, [groupedData, filters]);

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
        const strA = valueA == null ? '' : String(valueA);
        const strB = valueB == null ? '' : String(valueB);
        return direction === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
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
    if (column.dataType === 'control' || (column?.sortable && !column.sortable)) {
      return ;
    }

    const { id } = column;

    // Determine the new sort direction
    const newDirection = sortConfig.key === id && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    setSortConfig({ key: id, direction: newDirection });
  };

  const getCellColour = (column, row) => {
    // Find the target with the matching column ID
    const target = targets.find((t) => t.id === column.id);

    if (parameters.targetAllowCell && target) {
      if (target?.target) {
        // If the target has a key prop, find the matching key value
        if (target.key) {
          const keyValue = row[target.key]; // Get the key value from the row
          const keyTarget = target.values.find((v) => v.keyValue === keyValue); // Find the matching key value in the target

          if (keyTarget) {
            // Use the high and low values from the keyTarget
            const { high, low } = keyTarget;
            const cellValue = parseFloat(row[column.id]);

            if ((high && target.targetDirection == "asc" && cellValue >= high) || (high && target.targetDirection == "desc" && cellValue <= high)) return 'bg-green-100 text-green-800 dark:bg-emerald-400 dark:text-emerald-200 dark:bg-opacity-25'; // High value
            if ((low && target.targetDirection == "asc" && cellValue <= low) || (low && target.targetDirection == "desc" && cellValue >= low)) return 'bg-red-100 text-red-800 dark:bg-red-400 dark:text-red-200 dark:bg-opacity-25'; // Low value
            if(low || high) {
              return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-300 dark:text-yellow-200 dark:bg-opacity-25'; // Between high and low
            }
          }
        } else {
          // Use the high and low values directly from the target
          const { high, low } = target.target;
          const cellValue = parseFloat(row[column.id]);
          if ((high && target.targetDirection == "asc" && cellValue >= high) || (high && target.targetDirection == "desc" && cellValue <= high)) return 'bg-green-100 text-green-800 dark:bg-emerald-400 dark:text-emerald-200 dark:bg-opacity-25'; // High value
          if ((low && target.targetDirection == "asc" && cellValue <= low) || (low && target.targetDirection == "desc" && cellValue >= low)) return 'bg-red-100 text-red-800 dark:bg-red-400 dark:text-red-200 dark:bg-opacity-25'; // Low value
          if(low || high) {
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-300 dark:text-yellow-200 dark:bg-opacity-25'; // Between high and low
          }
        }
      }
    }

    return ''; // Default color if no target is found
  };

  const getRowColour = (row) => {
    if (parameters.targetAllowRow && parameters.target) {
      return parameters.target(row);
    }
  }

  return (
    <div className={`flex flex-col`} style={{ height: tableHeight, overflowY: 'auto', marginTop: '0.5rem' }}>
      <div className="min-w-full align-middle">
        <table id="data-table" className="min-w-full divide-y divide-gray-300 dark:divide-dark-600 border-separate border-spacing-0">
          {/* Table Header */}
          <thead>
            {parameters.headerGrouping ? 
              <tr className="sticky top-0 z-10 bg-white dark:bg-dark-900">
                {parameters.headerGroups.map((column) =>
                  <th key={column.label} colSpan={column.colSpan} scope="col" className={`${column.headerClass}`}>{column.label}</th>
                )}
              </tr>
            : null}
            <tr className={`sticky ${parameters.headerGrouping ? "top-10" : "top-0"} z-10 bg-white dark:bg-dark-900`}>
              {structure.map((column) =>
                column.visible !== false ? (
                  <th
                    key={column.id}
                    scope="col"
                    className={`py-3.5 px-3 text-sm font-semibold text-gray-900 border-b border-gray-300 dark:text-dark-50 dark:border-dark-600 relative ${column.thClass} ${!editing ? 'cursor-pointer' : 'cursor-default'} ${column.dataType === 'control' ? 'control' : ''}`}
                    onClick={() => {if(!editing) handleSort(column)}}
                  >
                    <div className={`${column.headerClass || ''} whitespace-nowrap`}>
                      <div>
                        {column.label}
                        {column.headerAnnotation && (
                          <span className="text-gray-500 text-xs font-normal ml-1 dark:text-dark-400">
                            {column.headerAnnotation}
                          </span>
                        )}
                        {column.subLabel && (
                          <>
                            <br></br>
                            <span className="text-gray-500 text-xs font-normal dark:text-dark-400">
                              {column.subLabel}
                            </span>
                          </>
                        )}
                      </div>
                      {sortConfig.key === column.id && (
                        <span className="flex-shrink-0 text-theme-500 h-5 w-5 flex items-center justify-center dark:text-theme-600">
                            <ChevronUpDownIcon className="w-5 h-5" />
                        </span>
                      )}
                      {(editing && parameters.targetAllowColumn && column.allowTarget) ? (
                        <span className="">
                          <PopoverControl
                            icon={<ChevronDownIcon className="w-5 h-5 flex-shrink-0" />}
                            buttonClass={`flex-shrink-0 bg-theme-50 hover:bg-theme-100 text-theme-500 dark:bg-theme-100/75 dark:hover:bg-theme-200/75 dark:text-theme-600 h-5 w-5 rounded-full flex items-center justify-center cursor-pointer focus:outline-none`}
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
          <tbody className="bg-white dark:bg-dark-900">
            {sortedData.map((row, rowIndex) => (
              <tr key={rowIndex} className={`${getRowColour(row) || 'text-gray-800 dark:text-dark-200 even:bg-gray-50 dark:even:bg-dark-800'}`}>
                {structure.map((column) =>
                  column.visible !== false ? (
                    <td
                      key={column.id}
                      className={`whitespace-nowrap px-3 py-2 text-sm ${getCellColour(column, row)} ${column.tdClass}`}
                    >
                      <div className={`${column.cellClass || ''}`}>
                        {column.prefix || ''}
                        {column.control
                          ? column.control(
                            row, 
                            rowIndex,
                            setReportData, 
                            resolveColumnParameters(column, parameters, dateRange)
                          )
                          : column.format
                            ? (
                                column.requires
                                  ? column.format(
                                      ...column.requires.map(field => row[field]),
                                      resolveColumnParameters(column, parameters, dateRange)
                                    )
                                  : column.format(
                                      row[column.id],
                                      resolveColumnParameters(column, parameters, dateRange)
                                    )
                              )
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
                <tr className="bg-white dark:bg-dark-900 sticky bottom-0 font-semibold">
                  {structure.map((column, colIndex) =>
                    column.visible !== false ? (
                      <td
                        key={colIndex}
                        className={`whitespace-nowrap px-3 py-2 text-sm text-gray-900 dark:text-dark-50 border-t bg-white dark:bg-dark-900 border-gray-300 dark:border-dark-600 ${column.tdClass}`}
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
                                  return column.format
                                  ? (
                                      column.requires
                                        ? column.format(
                                            weightedAverage,
                                            resolveColumnParameters(column, parameters, dateRange)
                                          )
                                        : column.format(
                                            weightedAverage,
                                            resolveColumnParameters(column, parameters, dateRange)
                                          )
                                    ) + '%'
                                  : weightedAverage + '%';
                              } else {
                                // Sum numeric columns, use format with parameters if present
                                const totalValue = sortedData.reduce((sum, row) => sum + (parseFloat(row[column.id]) || 0), 0);
                                return column.format
                                  ? (
                                      column.requires
                                        ? column.format(
                                            totalValue,
                                            resolveColumnParameters(column, parameters, dateRange)
                                          )
                                        : column.format(
                                            totalValue,
                                            resolveColumnParameters(column, parameters, dateRange)
                                          )
                                    )
                                  : totalValue;
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
