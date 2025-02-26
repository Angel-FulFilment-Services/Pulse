import { Fragment, useState } from 'react'
import Datepicker from "react-tailwindcss-datepicker"; 

export default function DateInput(props) {
  const { startDateId, endDateId, label, autoComplete, placeholder, annotation, dateRange, minDate, maxDate, currentState, onDateChange } = props;
  
  const handleDateChange = (event) => {   
    onDateChange([{id: startDateId, value: event.startDate}]);
    if (dateRange) {
      onDateChange([{id: endDateId, value: event.endDate}]);
    }
  }

  return (
    <div>
      <label htmlFor={startDateId} className="block text-sm font-medium leading-6 text-gray-900">
        {label}
        { annotation &&
          <span className='text-neutral-500 font-normal'> {annotation} </span>
        }
      </label>
      <div className="mt-2">
          <div className={`flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-600 sm:max-w-md cursor-pointer`}>
            <Datepicker
              readOnly={true}
              id={startDateId}
              displayFormat="DD/MM/YYYY"
              primaryColor={"orange"} 
              inputClassName={`border-0 bg-transparent py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none cursor-pointer`}
              minDate={minDate} 
              maxDate={maxDate} 
              placeholder={placeholder}
              useRange={dateRange} 
              asSingle={!dateRange} 
              value={currentState} 
              onChange={handleDateChange} 
            /> 
          </div>
          {/* {errors.email && <div className="text-red-600 text-sm pt-1">{errors.email}</div>} */}
      </div>
    </div>
  );
}
