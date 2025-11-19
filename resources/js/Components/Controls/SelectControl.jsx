import { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function SelectInput(props) {
  const { id, items, onSelectChange, placeholder, defaultSelected, label, width = "w-full", opaque = false } = props;
  
  const [selected, setSelected] = useState(defaultSelected || '');

  useEffect(() => {
    setSelected(defaultSelected || '');
  }, [defaultSelected]);

  const handleSelectChange = (event) => {
    setSelected(event);
    onSelectChange({ id: id, value: event.value });
  };

  return (
    <Listbox key={id} value={selected} onChange={handleSelectChange}>
      {({ open }) => (
        <div className="w-full">
          {label ? <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">{label}</Listbox.Label> : null}
          <div className="relative w-full">
            <Listbox.Button className={opaque 
              ? `relative cursor-pointer py-1.5 pl-3 pr-8 text-left text-gray-700 dark:text-dark-200 hover:text-gray-900 dark:hover:text-dark-100 text-sm transition-colors ${width}`
              : `relative cursor-default rounded-md bg-white dark:bg-dark-900 py-1.5 pl-3 pr-10 text-left text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 focus:outline-none focus:ring-2 focus:ring-theme-600 dark:focus:ring-theme-700 sm:text-sm sm:leading-6 ${width}`
            }>
              <span className={opaque
                ? 'block truncate text-center text-gray-500 dark:text-dark-200 font-semibold'
                : `block truncate ${!selected.value && "text-gray-400 dark:text-dark-500"}`
              }>
                {selected.displayValue ? selected.displayValue : placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                {/* <ChevronUpDownIcon 
                  className={opaque
                    ? `h-4 w-4 text-gray-500 dark:text-dark-400 transition-transform ${open ? 'rotate-180' : ''}`
                    : "h-5 w-5 text-gray-400 dark:text-dark-500"
                  } 
                  aria-hidden="true" 
                /> */}
                <ChevronDownIcon className={opaque
                  ? `h-4 w-4 text-gray-500 dark:text-dark-400 transition-transform stroke-[2.5] ${open ? 'rotate-180' : ''}`
                  : "h-5 w-5 text-gray-400 dark:text-dark-500"
                  } 
                  aria-hidden="true" 
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className={opaque
                ? `absolute z-10 mt-1 max-h-60 w-36 -ml-4 overflow-auto rounded-md bg-white dark:bg-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm`
                : `absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm`
              }>
                {items.map((item) => (
                  <Listbox.Option
                    key={item.id}
                    className={({ active }) =>
                      classNames(
                        active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-900 dark:text-dark-100',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={item}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                          {item.displayValue}
                        </span>
                        {selected ? (
                          <span
                            className={classNames(
                              active ? 'text-gray-900 dark:text-dark-100' : 'text-theme-600 dark:text-theme-700',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </div>
      )}
    </Listbox>
  );
}

SelectInput.propTypes = {
  id: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    displayValue: PropTypes.string.isRequired,
  })).isRequired,
  onSelectChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  defaultSelected: PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    displayValue: PropTypes.string.isRequired,
  }),
  label: PropTypes.string,
};

SelectInput.defaultProps = {
  placeholder: 'Select an option',
  defaultSelected: null,
  label: null,
};
