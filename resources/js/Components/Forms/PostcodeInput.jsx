import { Fragment, useState, useEffect, useCallback } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import axios from 'axios';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ComboInput(props) {
  const { id, label, currentState, placeholder, onComboChange, disabled } = props;
  const [selected, setSelected] = useState(currentState);
  const [query, setQuery] = useState(currentState || '');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const fetchAddresses = useCallback(debounce((postcode) => {
    axios.get(`https://ws.postcoder.com/pcw/PCW7F-DULCX-52UQC-47Y6J/address/uk/${postcode}`)
      .then(response => {
        if (response.data.length > 0) {
          const addresses = response.data.map((address, index) => {
            const premise = address.premise || '';
            const street = address.street || '';
            const organisation = address.organisation ? `${address.organisation}, ` : '';
            const address1 = `${organisation} ${premise}, ${street}`.trim().replace(/,\s*$/, ''); // Remove trailing comma

            return {
              id: index,
              value: address.postcode, // Use postcode as the value
              address1: address1, // Combine organisation, premise, and street
              address2: '', // Assuming there's no second address line
              address3: '', // Assuming there's no third address line
              town: address.posttown,
              county: address.county,
              displayValue: address.summaryline // Use summaryline for display
            };
          });
          setItems(addresses);
          setError('');
        } else {
          setItems([]);
          setError('No addresses found for this postcode');
        }
      })
      .catch(error => {
        console.error('Error fetching addresses:', error);
        setItems([]);
        setError('Error fetching addresses');
      });
  }, 500), []);

  useEffect(() => {
    if (query.length > 5) {
      fetchAddresses(query);
    } else {
      setItems([]);
      setError('');
    }
  }, [query, fetchAddresses]);

  const handleComboChange = (selectedItem) => {
    setSelected(selectedItem);
    onComboChange([
      { id: id.postcode, value: selectedItem.value },
      { id: id.address1, value: selectedItem.address1 },
      { id: id.address2, value: selectedItem.address2 },
      { id: id.address3, value: selectedItem.address3 },
      { id: id.town, value: selectedItem.town },
      { id: id.county, value: selectedItem.county }
    ]);
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    onComboChange([{ id: 'postcode', value }]); // Update postcode as user types
    if (value.length > 5) {
      fetchAddresses(value);
    } else {
      setItems([]);
      setError('');
      setSelected(undefined); // Clear the selected state when input is cleared
    }
  };

  return (
    <>
      <Combobox as="div" value={currentState} onChange={handleComboChange}>
        <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100">{label}</Combobox.Label>
        <div className="mt-2">
          <div class="w-full relative">
            <Combobox.Input
              className={`w-full rounded-md border-0 bg-white dark:bg-dark-900 py-1.5 pl-3 pr-10 z-10 text-gray-900 dark:text-dark-100 ${error && !disabled ? "ring-red-600 dark:text-red-700" : "ring-gray-300 dark:ring-dark-600"}  ${typeof selected !== "undefined" && !selected.value && "text-gray-400 dark:text-dark-500"} shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:outline-none focus:ring-theme-600 dark:focus:ring-theme-700 sm:text-sm sm:leading-6 uppercase placeholder:normal-case disabled:text-gray-600 dark:disabled:text-dark-500 ${disabled ? "opacity-75 cursor-not-allowed" : ""}`}
              onChange={handleInputChange}
              displayValue={currentState}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={8}
              spellCheck="false" // Disable spellcheck
              autoComplete="stop-autocom" // Disable browser autofill
              name="stop-autocom" // Use a random string for the name attribute
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none disabled:cursor-not-allowed" disabled={disabled}>
              <ChevronUpDownIcon className={`h-5 w-5 ${error && !disabled ? "text-red-600 dark:text-red-700" : "text-gray-400 dark:text-dark-500" }`} aria-hidden="true" />
            </Combobox.Button>
          </div>
          {items.length > 0 && (
            <Combobox.Options className="absolute z-10 max-h-60 max-w-max overflow-auto rounded-md bg-white dark:text-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm">
              {items.map((item) => (
                <Combobox.Option
                  key={item.id}
                  value={item}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-dark-100' : 'text-gray-900 dark:text-dark-100'
                    )
                  }
                >
                  {({ active, selected }) => (
                    <>
                      <span className={classNames('block truncate', selected && 'font-semibold')}>{item.displayValue}</span>
                      {selected && (
                        <span
                          className={classNames(
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                            active ? 'text-white dark:text-dark-900' : 'text-theme-600 dark:text-theme-700'
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
        {error && !disabled && <p className="mt-2 text-sm text-red-600 dark:text-red-700">{error}</p>}
      </Combobox>
    </>
  );
}