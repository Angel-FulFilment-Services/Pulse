export default function CheckboxInput(props) {
  const {
    id,
    label,
    annotation,
    checked = false,
    onChange,
    error,
    clearErrors,
    disabled = false,
  } = props;

  const handleCheckboxChange = () => {
    onChange(!checked); // Toggle the checked state
    if (clearErrors) clearErrors(); // Clear errors if provided
  };

  return (
    <div>
      {/* Label and Annotation */}
      {(label || annotation) && (
        <label
          htmlFor={id}
          className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2"
        >
          {label}
          {annotation && (
            <span className="text-neutral-500 dark:text-dark-400 font-normal">
              {annotation}
            </span>
          )}
        </label>
      )}

      {/* Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onChange={handleCheckboxChange}
          disabled={disabled}
          className={`h-4 w-4 text-theme-600 dark:text-theme-700 border-gray-300 dark:border-dark-600 rounded focus:ring-theme-600 dark:focus:ring-theme-700 accent-theme-400 ${
            disabled ? "opacity-75 cursor-not-allowed" : ""
          }`}
        />
        <label
          htmlFor={id}
          className={`ml-2 text-sm text-gray-900 dark:text-dark-100 ${
            disabled ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {label}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 dark:text-red-700 text-sm pt-2">
          {error.message}
        </div>
      )}
    </div>
  );
}