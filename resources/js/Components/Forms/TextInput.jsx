import { Fragment, useState } from 'react'

export default function TextInput(props) {
  const { id, label, autoComplete, placeholder, annotation, currentState, spellCheck, Icon, onTextChange, onBlur, error } = props;
  
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
          <div className={`relative flex rounded-md shadow-sm ring-1 ring-inset ${error ? "ring-red-600" : "ring-gray-300"} focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-600 sm:max-w-md h-full`}>
              <input
                  type="text"
                  name={id}
                  value={currentState}
                  spellCheck={spellCheck}
                  onChange={ e => { handleTextChange(e.target);}}
                  onBlur={ e => { onBlur([id]);}}
                  id={id}
                  autoComplete={autoComplete}
                  className="block flex-1 border-0 bg-transparent py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none"
                  placeholder={placeholder}
              />
              {Icon && <Icon className={`absolute right-2 top-1/2 transform w-5 h-5 ${error ? "text-red-600" : "text-gray-400"} -translate-y-1/2 pointer-events-none`} />}
          </div>
          {error && <div className="text-red-600 text-sm pt-1">{error.message}</div>}
      </div>
    </div>
  )
}
