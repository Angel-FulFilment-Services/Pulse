import { useState, useEffect } from 'react';
import Datepicker from "react-tailwindcss-datepicker"; 
import { dateSelectorOptions } from '../../Utils/Date';

export default function DateInput(props) {
  const { startDateId, endDateId, label, autoComplete, placeholder, annotation, dateRange, showShortcuts, minDate, maxDate, currentState, onDateChange, onBlur, error, clearErrors, width = "w-56" } = props;
  const [shortcuts, setShortcuts] = useState({});

  const handleDateChange = (event) => {   
    if (dateRange) {
      onDateChange([{id: startDateId, value: event.startDate}, {id: endDateId, value: event.endDate}]);
    }else{
      onDateChange([{id: endDateId, value: event.endDate}]);
    }
    if (clearErrors) clearErrors(); // Clear errors when a valid date is selected
  }

  useEffect(() => { 
    const min = minDate ? new Date(minDate) : null;
    const max = maxDate ? new Date(maxDate) : null;

    setShortcuts(dateSelectorOptions(min, max)); 
  }, [minDate, maxDate])

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
              minDate={minDate} 
              maxDate={maxDate} 
              placeholder={placeholder}
              useRange={false} 
              asSingle={!dateRange} 
              showShortcuts={showShortcuts}
              value={currentState} 
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
