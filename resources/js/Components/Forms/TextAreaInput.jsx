import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

export default function TextInput(props) {
  const { id, label, autoComplete, placeholder, annotation, rows, cols, isDisabled, Icon, currentState, onTextChange, onBlur, error, clearErrors, height = "h-32", maxLength = 1000, warnMaxLength } = props;
  
  const handleTextChange = (event) => {
    onTextChange([{id: id, value: event.value}]);
    if (clearErrors) clearErrors();
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100">
        {label}
        { warnMaxLength && 
            <span className={`${currentState.length > (maxLength - maxLength * 0.05) ? "text-red-600 dark:text-red-700" : "text-neutral-500 dark:text-dark-400"} font-normal`}> ({maxLength - currentState.length})</span>
        }
        { annotation &&
          <span className='text-neutral-500 dark:text-dark-400 font-normal'> {annotation} </span>
        }
      </label>
      <div className="mt-2">
          <div className={`relative flex rounded-md shadow-sm ring-1 ring-inset ${error ? "ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900" : "ring-gray-300 dark:ring-dark-600"} ${isDisabled ? "ring-gray-200 bg-gray-50 dark:ring-dark-700 dark:bg-dark-800" : "ring-gray-300 dark:ring-dark-600"} focus-within:ring-2 focus-within:ring-inset focus-within:ring-theme-600 dark:focus-within:ring-theme-700 w-full ${height}`}> 
              <textarea
                  name={id}
                  cols={cols}
                  rows={rows}
                  disabled={isDisabled}
                  value={currentState}
                  onChange={ e => { handleTextChange(e.target);}}
                  onBlur={ e => { if(onBlur) onBlur([id]);}}
                  id={id}
                  autoComplete={autoComplete}
                  className={`block flex-1 border-0 bg-transparent py-1.5 pl-3 resize-none ${error ? "text-red-800 dark:text-red-900" : "text-gray-900 dark:text-dark-100"} placeholder:text-gray-400 dark:placeholder:text-dark-500 disabled:placeholder:text-gray-200 dark:disabled:placeholder:text-dark-700 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none`}
                  placeholder={placeholder}
                  maxLength={maxLength}
              />
              {Icon && !error && <Icon className={`absolute right-2 top-1/2 transform w-5 h-5 text-gray-400 dark:text-dark-500 -translate-y-1/2 pointer-events-none`} />}
              {error && <ExclamationCircleIcon className={`absolute right-2 top-4 transform w-5 h-5 text-red-600 dark:text-red-700 -translate-y-1/2 pointer-events-none`} />}
          </div>
          {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message}</div>}
      </div>
    </div>
  )
}
