import { Fragment, useState } from 'react'
import PropTypes from 'prop-types';
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SelectInput(props) {
  const { id, label, currentState, items, onSelectChange, onBlur, placeholder, error, clearErrors } = props;
  
  const [selected, setSelected] = useState((currentState && items.find(item => item.value === currentState)));

  const handleSelectChange = (event) => {
    onSelectChange([{id: id, value: event.value}]);
    if (clearErrors) clearErrors();
  }

  return (
    <Listbox key={id} value={currentState} onChange={ e => { setSelected(e); handleSelectChange(e);}}>
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">{label}</Listbox.Label>
          <div className="relative mt-2">
              <Listbox.Button className={`relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ${error ? "ring-red-600 text-red-800" : "ring-gray-300"} focus:outline-none focus:ring-2 focus:ring-theme-600 sm:text-sm sm:leading-6`}>
                <span className={`block truncate ${(typeof selected == "undefined" || !selected.value) && "text-gray-400"}`}>{typeof selected !== "undefined" && selected.value ? selected.value : `${placeholder}`}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                {error ? 
                  <ExclamationCircleIcon className="absolute right-2 top-1/2 transform w-5 h-5 text-red-600 -translate-y-1/2 pointer-events-none" />
                  :
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                }
                </span>
              </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {items.map((item) => (
                    <Listbox.Option
                        key={item.id}
                        className={({ active }) =>
                        classNames(
                            active ? 'bg-gray-100 dark:bg-dark-800 text-gray-900' : 'text-gray-900',
                            'relative cursor-default select-none py-2 pl-3 pr-9'
                        )
                        }
                        value={item}
                    >
                        {({ selected, active }) => (
                        <>
                            <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                            {item.value}
                            </span>
                            {currentState === item.value ? (
                            <span
                                className={classNames(
                                active ? 'text-gray-900' : 'text-theme-600',
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
            {error && <div className="text-red-600 text-sm pt-2">{error.message}</div>}
          </div>
        </>
      )}
    </Listbox>
  )
}
