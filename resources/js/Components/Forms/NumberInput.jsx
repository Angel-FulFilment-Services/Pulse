import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { useRef } from 'react';
import { toast } from 'react-toastify'; // <-- Add this import

export default function NumberInput(props) {
  const {
    id,
    label,
    autoComplete,
    placeholder,
    annotation,
    currentState,
    spellCheck,
    Icon,
    prefix,
    suffix,
    iconPosition,
    width,
    onTextChange,
    onBlur,
    error,
    clearErrors,
    high,
    low,
    showRangeAlert = false, // <-- Add this prop, default to false
  } = props;

  const prevValue = useRef(currentState);

  const formatNumber = (value) => {
    if (!value) return '';
    const parts = String(value).replace(/,/g, '').split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add commas for thousand separators
    return parts.join('.');
  };

  // Helper: are two numbers in the same range of ten?
  const inSameRangeOfTen = (a, b) => Math.floor(a / 10) === Math.floor(b / 10);

  const handleTextChange = (event) => {
    let allowNegative = typeof low === 'number' && low < 0;
    let rawValue = String(event.target.value).replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, '');
    if (allowNegative) {
      rawValue = rawValue.replace(/(?!^)-/g, '');
    }
    let numericValue = rawValue ? parseFloat(rawValue) : null;
    let outOfRange = false;

    if (numericValue !== null) {
      if (high !== undefined && high !== null && numericValue > high) {
        outOfRange = true;
        if (inSameRangeOfTen(numericValue, high)) {
          rawValue = String(high);
        } else {
          rawValue = String(prevValue.current ?? '');
        }
      }
      if (low !== undefined && low !== null && numericValue < low) {
        outOfRange = true;
        if (inSameRangeOfTen(numericValue, low)) {
          rawValue = String(low);
        } else {
          rawValue = String(prevValue.current ?? '');
        }
      }
    }

    if (showRangeAlert && outOfRange) {
      if (!toast.isActive("range-toast")) {
        toast.warn(
          `Value must be between ${formatNumber(low)} and ${formatNumber(high)}`,
          {
            toastId: 'range-toast',
            position: 'top-center',
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
            theme: 'light',
          }
        );
      }
    }

    prevValue.current = rawValue;

    const formattedValue = formatNumber(rawValue); // Format the value with commas
    onTextChange([{ id: id, value: rawValue }]); // Pass the raw value (unformatted) to the parent
    if (clearErrors) clearErrors();
  };

  const handleInput = (event) => {
    let allowNegative = typeof low === 'number' && low < 0;
    const invalidChars = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g;
    if (invalidChars.test(event.target.value)) {
      event.target.value = event.target.value.replace(invalidChars, '');
    }
    if (allowNegative) {
      event.target.value = event.target.value.replace(/(?!^)-/g, '');
    }
  };

  return (
    <div>
      {(label || annotation) && (
        <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">
          {label}
          {annotation && <span className="text-neutral-500 dark:text-dark-400 font-normal"> {annotation} </span>}
        </label>
      )}
      <div className="">
        <div
          className={`relative flex rounded-md shadow-sm ring-1 ring-inset ${
            error ? 'ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900' : 'ring-gray-300 dark:ring-dark-600'
          } focus-within:ring-2 focus-within:ring-inset focus-within:ring-theme-600 dark:focus:ring-theme-700 sm:max-w-md h-full`}
        >
          <input
            type="text"
            name={id}
            value={formatNumber(currentState)} // Display the formatted value
            spellCheck={spellCheck}
            onInput={handleInput} // Prevent invalid characters
            onChange={(e) => handleTextChange(e)} // Handle text change
            onBlur={(e) => {
              if (onBlur) onBlur([id]);
            }}
            id={id}
            autoComplete={autoComplete}
            className={`block flex-1 border-0 bg-transparent py-1.5 ${
              prefix || iconPosition == 'left' ? 'pl-5' : 'pl-3'
            } pr-5 ${
              error ? 'text-red-800 dark:text-red-900' : 'text-gray-900 dark:text-dark-100'
            } placeholder:text-gray-400 dark:placeholder:text-dark-600 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none ${width}`}
            placeholder={placeholder}
          />
          {Icon && !error && (
            <Icon
              className={`absolute right-2 top-1/2 transform w-5 h-5 text-gray-400 dark:text-dark-600 -translate-y-1/2 pointer-events-none`}
            />
          )}
          {prefix && !error && (
            <span className={`absolute left-2 top-1/2 transform text-gray-400 dark:text-dark-600 -translate-y-1/2 pointer-events-none`}>
              {prefix}
            </span>
          )}
          {suffix && !error && (
            <span className={`absolute right-2 top-1/2 transform text-gray-400 dark:text-dark-600 -translate-y-1/2 pointer-events-none`}>
              {suffix}
            </span>
          )}
          {error && (
            <ExclamationCircleIcon
              className={`absolute right-2 top-1/2 transform w-5 h-5 text-red-600 dark:text-red-700 -translate-y-1/2 pointer-events-none`}
            />
          )}
        </div>
        {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message}</div>}
      </div>
    </div>
  );
}
