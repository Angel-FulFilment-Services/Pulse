import { useState, useEffect } from 'react';
import Datepicker from "react-tailwindcss-datepicker"; 
import { dateSelectorOptions } from '../../Utils/Date';

export default function DateInput(props) {
  const { startDateId, endDateId, label, autoComplete, placeholder, annotation, dateRange, showShortcuts, minDate, maxDate, currentState, onDateChange, onBlur, error, clearErrors, width = "w-56" } = props;
  const [shortcuts, setShortcuts] = useState({});

  // Helper function to validate and sanitize dates
  const sanitizeDate = (date) => {
    if (!date) return null;
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  // Helper function to sanitize the current state value
  const sanitizeCurrentState = (state) => {
    if (!state) return null;
    
    // Handle different formats that currentState might have
    if (typeof state === 'string') {
      const parsed = new Date(state);
      return isNaN(parsed.getTime()) ? null : { startDate: parsed, endDate: parsed };
    }
    
    if (state && typeof state === 'object') {
      // Handle object format with startDate/endDate
      if (state.startDate || state.endDate) {
        const start = state.startDate ? sanitizeDate(state.startDate) : null;
        const end = state.endDate ? sanitizeDate(state.endDate) : null;
        
        // Return null if both dates are invalid
        if (!start && !end) return null;
        
        return {
          startDate: start,
          endDate: end || start // Use start date as end date if end is missing
        };
      }
    }
    
    return null;
  };

  const handleDateChange = (event) => {   
    if (dateRange) {
      onDateChange([{id: startDateId, value: event.startDate}, {id: endDateId, value: event.endDate}]);
    }else{
      onDateChange([{id: endDateId, value: event.endDate}]);
    }
    if (clearErrors) clearErrors(); // Clear errors when a valid date is selected
  }

  useEffect(() => { 
    // Validate dates before passing to dateSelectorOptions
    const isValidDate = (date) => date && !isNaN(new Date(date).getTime());
    const validMinDate = minDate && isValidDate(minDate) ? minDate : null;
    const validMaxDate = maxDate && isValidDate(maxDate) ? maxDate : null;
    
    const min = validMinDate ? new Date(validMinDate) : null;
    const max = validMaxDate ? new Date(validMaxDate) : null;

    setShortcuts(dateSelectorOptions(min, max)); 
  }, [minDate, maxDate])

  // Sanitize all date props before passing to Datepicker
  const sanitizedMinDate = sanitizeDate(minDate);
  const sanitizedMaxDate = sanitizeDate(maxDate);
  const sanitizedCurrentState = sanitizeCurrentState(currentState);

  return (
    <div>
      <label htmlFor={startDateId} className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100">
        {label}
        { annotation &&
          <span className='text-neutral-500 dark:text-dark-400 font-normal'> {annotation} </span>
        }
      </label>
      <div className={ label || annotation ? `mt-2` : ``}>
          <div className={`flex rounded-md shadow-sm ring-1 ring-inset ${error ? "ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900" : "ring-gray-300 dark:ring-dark-600"} focus-within:ring-2 focus-within:ring-inset focus-within:ring-theme-600 dark:focus:ring-theme-700 bg-white dark:bg-dark-900 sm:max-w-md cursor-pointer ${width}`}>
            <Datepicker
              startWeekOn="mon"
              readOnly={true}
              id={startDateId}
              displayFormat="DD/MM/YYYY"
              primaryColor={"orange"} 
              separator="-"
              inputClassName={`border-0 bg-transparent py-1.5 pl-3 ${error ? "text-red-800 dark:text-red-900" : "text-gray-900 dark:text-dark-100"} placeholder:text-gray-400 dark:placeholder:text-dark-600 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none cursor-pointer z-40`}
              minDate={sanitizedMinDate} 
              maxDate={sanitizedMaxDate} 
              placeholder={placeholder}
              useRange={false} 
              asSingle={!dateRange} 
              showShortcuts={showShortcuts}
              value={sanitizedCurrentState} 
              onChange={handleDateChange} 
              onBlur={ e => { if(onBlur) onBlur([id]);}}
              configs={{
                shortcuts
              }}
            /> 
          </div>
          {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message}</div>}
      </div>
    </div>
  );
}
