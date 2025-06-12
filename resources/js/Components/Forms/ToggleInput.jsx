import { Switch } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ToggleInput({
  id,
  label,
  annotation,
  checked = false,
  onChange,
  error,
  clearErrors,
  disabled = false,
  checkedIcon,
  uncheckedIcon,
  uncheckedStyle = null,
  labelInline = false
}) {
  const handleToggleChange = (value) => {
    onChange(value);
    if (clearErrors) clearErrors();
  };

  return (
    <div className={`${labelInline ? 'flex items-center gap-x-4' : 'block'}`}>
      {/* Label and Annotation */}
      {(label || annotation) && (
        <label
        //   htmlFor={id}
          className={`block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 ${labelInline ? 'flex-1' : 'mb-2'}`}
        >
          {label}
          {annotation && (
            <span className="text-neutral-500 dark:text-dark-400 font-normal"> {annotation} </span>
          )}
        </label>
      )}

      {/* Toggle */}
      <Switch
        checked={checked}
        onChange={handleToggleChange}
        disabled={disabled}
        className={classNames(
          checked ? 'bg-theme-600' : uncheckedStyle ? uncheckedStyle : 'bg-gray-200 dark:bg-dark-700',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-theme-600 focus:ring-offset-2',
          disabled ? 'opacity-75 cursor-not-allowed' : ''
        )}
        id={id}
        name={id}
      >
        <span className="sr-only">{label}</span>
        <span
          className={classNames(
            checked ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        >
          <span
            className={classNames(
              checked ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            {uncheckedIcon ? uncheckedIcon : null}
          </span>
          <span
            className={classNames(
              checked ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            {checkedIcon ? checkedIcon : null}
          </span>
        </span>
      </Switch>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 dark:text-red-700 text-sm pt-2">
          {error.message}
        </div>
      )}
    </div>
  );
}