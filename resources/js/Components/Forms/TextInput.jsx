import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

export default function TextInput(props) {
  const { 
    id, 
    label, 
    autoComplete, 
    placeholder, 
    annotation, 
    currentState, 
    spellCheck, 
    Icon, 
    onTextChange, 
    returnRaw, 
    onBlur, 
    error, 
    clearErrors, 
    disabled = false 
  } = props;
  
  const handleTextChange = (event) => {
    if (returnRaw) {
      onTextChange(event.value);
    }else{
      onTextChange([{id: id, value: event.value}]);
    }
    if (clearErrors) clearErrors();
  }

  return (
    <div>
      { (label || annotation) &&
        <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">
          {label}
          { annotation && 
            <span className='text-neutral-500 dark:text-dark-400 font-normal'> {annotation} </span>
          }
        </label>
      }
      <div className="">
          <div className={`relative flex rounded-md bg-white dark:bg-dark-900 shadow-sm ring-1 ring-inset ${error ? "ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900" : "ring-gray-300 dark:ring-dark-600"} focus-within:ring-2 focus-within:ring-inset focus-within:ring-theme-600 dark:focus-within:ring-theme-700 w-full h-full ${disabled ? "opacity-75 cursor-not-allowed" : ""}`}>
              <input
                  type="text"
                  name={id}
                  disabled={disabled}
                  value={currentState}
                  spellCheck={spellCheck}
                  onChange={ e => { handleTextChange(e.target);}}
                  onBlur={ e => { if(onBlur) onBlur([id]);}}
                  id={id}
                  autoComplete={autoComplete}
                  className={`block flex-1 border-0 bg-transparent py-1.5 pl-3 ${error ? "text-red-800 dark:text-red-900" : "text-gray-900 dark:text-dark-100"} placeholder:text-gray-400 dark:placeholder:text-dark-500 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none disabled:text-gray-600 dark:disabled:text-dark-500 disabled:cursor-not-allowed`}
                  placeholder={placeholder}
              />
              {Icon && !error && <Icon className={`absolute right-2 top-1/2 transform w-5 h-5 text-gray-400 dark:text-dark-500 -translate-y-1/2 pointer-events-none`} />}
              {error && <ExclamationCircleIcon className={`absolute right-2 top-1/2 transform w-5 h-5 text-red-600 dark:text-red-700 -translate-y-1/2 pointer-events-none`} />}
          </div>
          {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message || error}</div>}
      </div>
    </div>
  )
}
