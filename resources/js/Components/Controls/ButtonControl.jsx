import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function ButtonControl(props) {
  const { id, label, Icon, className, iconClassName, buttonLabel, onClick, preventBubble, disabled } = props;

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">{label}</label>}
      <div className="flex items-center">
        <button
          type="button"
          disabled={disabled}
          className={`${className ? className : "flex items-center justify-center w-full min-w-9 px-2 bg-white dark:bg-dark-900 py-1.5 h-9 text-gray-400 hover:text-gray-600 dark:text-dark-500 dark:hover:text-dark-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 focus:outline-none focus:ring-2 focus:ring-theme-600 dark:focus:ring-theme-600 sm:text-sm sm:leading-6 rounded-md disabled:cursor-not-allowed"}`}
          onClick={(event) => {
            if (preventBubble) event.stopPropagation();
            onClick(event);
          }}
        >
          {Icon && <Icon className={`${iconClassName ? iconClassName : "h-5 w-5 text-gray-400 dark:text-dark-500 flex-shrink-0"} ${disabled ? "contrast-50 cursor-not-allowed" : null}`} aria-hidden="true" />}
          {buttonLabel && <span className="ml-1">{buttonLabel}</span>}
        </button>
      </div>
    </div>
  );
}

ButtonControl.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  Icon: PropTypes.elementType, // Icon is a React component
  className: PropTypes.string, // Custom CSS class for styling
  iconClassName: PropTypes.string, // Custom CSS class for styling
  buttonLabel: PropTypes.string, // Label for the button
  onClick: PropTypes.func.isRequired, // Function to handle button click
  preventBubble: PropTypes.bool, // Prevent event bubbling
};

ButtonControl.defaultProps = {
  label: null,
  Icon: null,
  className: '',
  iconClassName: '',
  buttonLabel: null,
  preventBubble: false,
};