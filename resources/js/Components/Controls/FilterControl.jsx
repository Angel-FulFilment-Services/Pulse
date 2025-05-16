import { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import TextInput from '../../Components/Forms/TextInput';

export default function FilterControl(props) {
  let [ search, setSearch ] = useState('');
  const { onFilterChange, clearFilters, filters } = props;
  
  const handleFilterChange = (event) => {
    onFilterChange({ id: event.target.name, value: event.target.value, checked: event.target.checked });
  };

  const handleSearchChange = (event) => {
    setSearch(event[0].value);
  };

  const activeFilters = filters
  .flatMap((filter) =>
    filter.options.filter((option) => option.checked).map((option) => ({
      id: filter.id,
      value: option.value,
      label: option.label,
    }))
  );

  return (
    <div className="flex justify-end 2xl:justify-between w-full">
      <div className="2xl:w-full flex justify-start items-center ">
        <h3 className="text-sm font-medium text-gray-500 pointer-events-none">
          Filters
        </h3>

        <div aria-hidden="true" className="h-6 w-px bg-gray-300 ml-4 block" />

        <div className="mx-4 items-center hidden 2xl:flex gap-x-3">
          <div className="-m-2.5 flex flex-wrap items-center">
            {activeFilters.map((activeFilter) => (
              <span
                key={activeFilter.value}
                className="m-1 inline-flex items-center rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-2 text-sm font-medium text-gray-900"
              >
                <span>{activeFilter.label}</span>
                <button
                  type="button"
                  onClick={() => (onFilterChange({ id: activeFilter.id, value: activeFilter.value, checked: false }))}
                  className="ml-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-500"
                >
                  <XMarkIcon className="h-4 w-4 flex-shrink-0" />
                </button>
              </span>
            ))}
            {activeFilters.length === 0 &&
              (<span
                key="filters"
                className="items-center pl-2.5 pr-2 text-sm text-gray-400"
              >
                <span className="pointer-events-none">No filters active . . .</span>
              </span>)
            }
          </div>
          {
            activeFilters.length > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-500"
            >
              <XMarkIcon className="h-4 w-4 flex-shrink-0" />
            </button>
          )}
        </div>
      </div>
      <Popover.Group className="flex flex-shrink-0 items-center justify-end divide-x divide-gray-200">
        {filters.map((section, sectionIdx) => {
          // Calculate the count of checked options for the current section
          const checkedCount = section.options.filter((option) => option.checked).length;

          return (
            <Popover key={section.name} className="relative inline-block px-4 text-left">
              <Popover.Button className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900 outline-none">
                <span>{section.name}</span>
                {checkedCount > 0 && (
                  <span className="flex justify-center items-center ml-1.5 h-5 w-5 rounded bg-theme-500 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white align-middle">
                    {checkedCount}
                  </span>
                )}
                <ChevronDownIcon
                  className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                  aria-hidden="true"
                />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
                afterLeave={() => setSearch('')}
              >
                <Popover.Panel className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {section.options.length > 10 && (
                    <>
                      <div className="pb-2 -mx-1 border-b border-gray-300">
                          <TextInput label={null} Icon={MagnifyingGlassIcon} autoComplete={false} onTextChange={handleSearchChange} placeholder="Search"/>
                      </div>
                      <div className="mt-4 w-full"></div>
                    </>
                  )}
                  <form className="space-y-4 max-h-96 overflow-y-auto">
                    {section.options.filter((option) => !search || option.label.toLowerCase().includes(search.toLowerCase())).map((option, optionIdx) => (
                      <div key={option.value} className="flex items-center">
                        <input
                          id={`filter-${section.id}-${optionIdx}`}
                          name={section.id}
                          value={option.value}
                          onChange={handleFilterChange}
                          type="checkbox"
                          checked={option.checked}
                          className="h-4 w-4 rounded border-gray-300 text-theme-600 focus:ring-theme-500 accent-theme-600"
                        />
                        <label
                          htmlFor={`filter-${section.id}-${optionIdx}`}
                          className="ml-3 whitespace-nowrap pr-6 text-sm font-medium text-gray-900"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                    {section.options.filter((option) => !search || option.label.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                      <div className="flex items-center justify-center text-sm text-gray-600">
                        <span>No results found . . .</span>
                      </div>
                    )}
                  </form>
                </Popover.Panel>
              </Transition>
            </Popover>
          );
        })}
      </Popover.Group>
    </div>
  );
}

// SelectInput.propTypes = {
//   id: PropTypes.string.isRequired,
//   items: PropTypes.arrayOf(PropTypes.shape({
//     id: PropTypes.string.isRequired,
//     value: PropTypes.string.isRequired,
//     displayValue: PropTypes.string.isRequired,
//   })).isRequired,
//   onSelectChange: PropTypes.func.isRequired,
//   placeholder: PropTypes.string,
//   defaultSelected: PropTypes.shape({
//     id: PropTypes.string.isRequired,
//     value: PropTypes.string.isRequired,
//     displayValue: PropTypes.string.isRequired,
//   }),
//   label: PropTypes.string,
// };
