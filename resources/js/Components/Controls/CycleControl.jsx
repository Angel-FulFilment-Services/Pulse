import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import './ControlStyles.css';


export default function CycleControl(props) {
  const { id, currentValue, placeholder, label, onNext, onPrevious } = props;

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">{label}</label>}
      <div className="flex items-center">
        <button
          type="button"
          className="flex items-center justify-center w-full min-w-9 max-w-9 bg-white py-1.5 h-9 text-gray-400 hover:text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm sm:leading-6 rounded-l-md"
          onClick={onPrevious}
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="relative w-full">
          <div className="relative text-center w-full cursor-default select-none bg-white py-1.5 px-2 text-gray-900 shadow-sm focus:outline-none sm:text-sm sm:leading-6 middle-ring">
            <span className={`block truncate ${!currentValue && "text-gray-400"}`}>
              {currentValue ? currentValue : placeholder}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center justify-center w-full min-w-9  max-w-9 bg-white py-1.5 h-9 text-gray-400 hover:text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm sm:leading-6 rounded-r-md"
          onClick={onNext}
        >
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

CycleControl.propTypes = {
  id: PropTypes.string.isRequired,
  currentValue: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
};

CycleControl.defaultProps = {
  placeholder: 'Select an option',
  label: null,
};