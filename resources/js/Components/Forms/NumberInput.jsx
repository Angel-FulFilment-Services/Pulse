import { Fragment, useState } from 'react'

export default function TextInput(props) {
  const { id, label, autoComplete, placeholder, annotation, currentState, onTextChange } = props;
  
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
          <div className={`flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-600 sm:max-w-md h-full`}>
              <input
                  type="number"
                  name={id}
                  value={currentState}
                  spellCheck="true"
                  onChange={ e => { handleTextChange(e.target);}}
                  id={id}
                  autoComplete={autoComplete}
                  className="block flex-1 border-0 bg-transparent py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none"
                  placeholder={placeholder}
              />
          </div>
          {/* {errors.email && <div className="text-red-600 text-sm pt-1">{errors.email}</div>} */}
      </div>
    </div>
  )
}
