import { Fragment, useState } from 'react';
import InputMask from 'react-input-mask';

export default function MaskedInput(props) {
  const { id, label, autoComplete, placeholder, annotation, mask, maskChar, uppercase, Icon, currentState, onInputChange, onBlur, error, clearErrors } = props;

  const handleInputChange = (event) => {
    onInputChange([{ id: id, value: event.value }]);
    if (clearErrors) clearErrors(); // Clear errors when a valid input is provided
  };

  return (
    <div>
      {(label || annotation) && <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">
        {label}
        {annotation && <span className="text-neutral-500 dark:text-dark-400 font-normal"> {annotation} </span>}
      </label>}
      <div className="">
        <div className={`relative flex rounded-md shadow-sm ring-1 ring-inset ${error ? 'ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900' : 'ring-gray-300 dark:ring-dark-600'} focus-within:ring-2 focus-within:ring-inset focus-within:ring-theme-600 dark:focus:ring-theme-700 sm:max-w-md h-full`}>
          <InputMask
            mask={mask}
            maskChar={maskChar}
            name={id}
            value={currentState}
            onChange={(e) => {
              handleInputChange(e.target);
            }}
            onBlur={ e => { if(onBlur) onBlur([id]);}}
            id={id}
            className={`block flex-1 border-0 bg-transparent py-1.5 pl-3 ${error ? 'text-red-800 dark:text-red-900' : 'text-gray-900 dark:text-dark-100'} placeholder:text-gray-400 dark:placeholder:text-dark-600 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none placeholder:normal-case ${uppercase ? 'uppercase' : ''}`}
            autoComplete={autoComplete}
            placeholder={placeholder}
          />
          {Icon && <Icon className={`absolute right-2 top-1/2 transform w-5 h-5 ${error ? 'text-red-600 dark:text-red-700' : 'text-gray-400 dark:text-dark-500'} -translate-y-1/2 pointer-events-none`} />}
        </div>
        {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message}</div>}
      </div>
    </div>
  );
}
