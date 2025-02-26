import { Fragment, useState } from 'react'

export default function TextInput(props) {
  const { id, label, autoComplete, placeholder, annotation, rows, cols, isDisabled, currentState, onTextChange } = props;
  
  const handleTextChange = (event) => {
    onTextChange([{id: id, value: event.value}]);
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900">
        {label}
        { annotation &&
          <span className='text-neutral-500 font-normal'> {annotation} </span>
        }
      </label>
      <div className="mt-2">
          <div className={`flex rounded-md shadow-sm ring-1 ring-inset ${isDisabled ? "ring-gray-200 bg-gray-50" : "ring-gray-300"} focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-600 w-full h-72`}>
              <textarea
                  name={id}
                  cols={cols}
                  rows={rows}
                  disabled={isDisabled}
                  value={currentState}
                  onChange={ e => { handleTextChange(e.target);}}
                  id={id}
                  autoComplete={autoComplete}
                  className="block flex-1 border-0 bg-transparent py-1.5 pl-3 resize-none text-gray-900 placeholder:text-gray-400 disabled:placeholder:text-gray-200 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none"
                  placeholder={placeholder}
              />
          </div>
          {/* {errors.email && <div className="text-red-600 text-sm pt-1">{errors.email}</div>} */}
      </div>
    </div>
  )
}
