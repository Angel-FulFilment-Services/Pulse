import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function ButtonControl(props) {
  const { id, label, Icon, customClass, iconClass, buttonLabel, onButtonClick, preventBubble } = props;

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">{label}</label>}
      <div className="flex items-center">
        <button
          type="button"
          className={`${customClass ? customClass : "flex items-center justify-center w-full min-w-9 max-w-9 bg-white py-1.5 h-9 text-gray-400 hover:text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-theme-600 sm:text-sm sm:leading-6 rounded-md"}`}
          onClick={(event) => {
            if (preventBubble) event.stopPropagation();
            onButtonClick(event);
          }}
        >
          {buttonLabel && <span className="mr-2">{buttonLabel}</span>}
          {Icon && <Icon className={`${iconClass ? iconClass : "h-5 w-5 text-gray-400 flex-shrink-0"}`} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

ButtonControl.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  Icon: PropTypes.elementType, // Icon is a React component
  customClass: PropTypes.string, // Custom CSS class for styling
  iconClass: PropTypes.string, // Custom CSS class for styling
  buttonLabel: PropTypes.string, // Label for the button
  onButtonClick: PropTypes.func.isRequired, // Function to handle button click
  preventBubble: PropTypes.bool, // Prevent event bubbling
};

ButtonControl.defaultProps = {
  label: null,
  Icon: null,
  customClass: '',
  iconClass: '',
  buttonLabel: null,
  preventBubble: false,
};