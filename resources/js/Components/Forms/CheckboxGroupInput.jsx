export default function CheckboxGroupInput(props) {
  const {
    id,
    label,
    annotation,
    items = [], // Array of objects: { value, label }
    selectedItems = [], // Array of selected values
    onChange,
    error,
    clearErrors,
    disabled = false,
  } = props;

  const handleCheckboxChange = (value) => {
    const isChecked = selectedItems.includes(value);
    const updatedSelection = isChecked
      ? selectedItems.filter((item) => item !== value) // Remove value if already selected
      : [...selectedItems, value]; // Add value if not selected

    onChange(updatedSelection); // Pass updated selection to parent
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
            <span className="text-neutral-500 dark:text-dark-400 font-normal"> {annotation}</span>
          )}
        </label>
      )}

      {/* Checkbox Options */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <input
              type="checkbox"
              id={`${id}-${index}`}
              name={id}
              value={item.value}
              checked={selectedItems.includes(item.value)}
              onChange={() => handleCheckboxChange(item.value)}
              disabled={disabled}
              className={`h-4 w-4 text-theme-600 dark:text-theme-700 border-gray-300 dark:border-dark-600 rounded focus:ring-theme-600 dark:focus:ring-theme-700 accent-theme-600 dark:accent-theme-700 ${
                disabled ? "opacity-75 cursor-not-allowed" : ""
              }`}
            />
            <label
              htmlFor={`${id}-${index}`}
              className={`ml-2 text-sm text-gray-900 dark:text-dark-100 ${
                disabled ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {item.label}
            </label>
          </div>
        ))}
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