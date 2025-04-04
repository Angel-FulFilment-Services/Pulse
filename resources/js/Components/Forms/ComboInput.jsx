import { Fragment, useState } from 'react'
import PropTypes from 'prop-types';
import { Combobox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ComboInput(props) {
  const { id, label, currentState, items, placeholder, spellCheck, onComboChange, onBlur, error, clearErrors } = props;
  const [selected, setSelected] = useState((currentState && items.find(item => item.value === currentState)));
  const [query, setQuery] = useState('');
  
  var filteredItems =
    query === ''
      ? items
      : items.filter((item) => {
          return item.value.toLowerCase().includes(query.toLowerCase())
        })

  const handleComboChange = (event) => {
    onComboChange([{id: id, value: event.value}]);
    if (clearErrors) clearErrors();
  }

  return (
    <>
      <Combobox as="div" value={currentState} onChange={ e => { setSelected(e); handleComboChange(e);}}>
        <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900">{label}</Combobox.Label>
        <div className="relative mt-2">
          <Combobox.Input
            className={`w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 z-10 text-gray-900 ${typeof selected !== "undefined" && !selected.value && error ? "ring-red-600 text-red-800" : "ring-gray-300"} shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:outline-none focus:ring-orange-600 sm:text-sm sm:leading-6`}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            spellCheck={spellCheck}
            displayValue={currentState}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
            {error ? 
              <ExclamationCircleIcon className="absolute right-2 top-1/2 transform w-5 h-5 text-red-600 -translate-y-1/2 pointer-events-none" />
              :
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            }
          </Combobox.Button>
          {error && <div className="text-red-600 text-sm pt-2">{error.message}</div>}
          {filteredItems.length > 0 && (
            <Combobox.Options className="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredItems.map((item) => (
                <Combobox.Option
                  key={item.id}
                  value={item}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'
                    )
                  }
                >
                  {({ active, selected }) => (
                    <>
                      <span className={classNames('block truncate', selected && 'font-semibold')}>{item.value}</span>

                      {currentState === item.value && (
                        <span
                          className={classNames(
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                            active ? 'text-white' : 'text-orange-600'
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
    </>
  )
}
