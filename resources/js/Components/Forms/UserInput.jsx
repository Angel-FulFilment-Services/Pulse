import { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Combobox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import UserIcon from '../User/UserIcon';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function UserInput(props) {
  const { id, label, currentState, placeholder, spellCheck, onComboChange, onBlur, error, clearErrors, disabled, uppercase, annotation } = props;
  const [selected, setSelected] = useState(null);
  const [prevSelected, setPrevSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [change, setChange] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all users on mount
  useEffect(() => {
    if (!items.length) {
      axios.get('/users')
        .then(response => {
          const users = response.data.map(user => ({
            id: user.id,
            value: user.name,
            img: user.profile_photo || '',
          }));
          setItems(users);

          if (currentState) {
            const currentUser = users.find(user => user.id === currentState);

            if (currentUser) {
              setSelected(currentUser);
            }
          } else {
            setSelected(null);
          }

          setIsLoading(false);
        })
        .catch(() => setItems([]));
    }
  }, [currentState]);

  // Filter users as query changes
  var filteredItems =
    query === ''
      ? items
      : items.filter((item) => {
          return item.value.toLowerCase().includes(query.toLowerCase())
        })

  const handleComboChange = (event) => {
    if (!event || !event.value){
      onComboChange([{id: id, value: ''}]);
      return;
    }
    onComboChange([{id: id, value: event.value, userId: event.id}]);
    if (clearErrors) clearErrors();
  }

  const confirmComboChange = (event) => {
    setPrevSelected(selected);
    setSelected(event);
    setChange(event);
    setIsDialogOpen(true);
  }

  return (
    <>
      <Combobox as="div" value={selected} onChange={ e => { if(e) confirmComboChange(e);}}>
        { label && (
            <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">
              {label}
              { annotation &&
                <span className='text-neutral-500 dark:text-dark-400 font-normal'> {annotation} </span>
              }
          </Combobox.Label>
        )}
        <div className="relative">
          <Combobox.Input
            className={`w-full font-normal rounded-md border-0 bg-white dark:bg-dark-900 py-1.5 pl-3 pr-10 z-10 text-gray-900 dark:text-dark-100 ${typeof selected !== "undefined" && !selected?.value && error ? "ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900" : "ring-gray-300 dark:ring-dark-600"} shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-theme-600 dark:focus:ring-theme-700 sm:text-sm sm:leading-6 disabled:text-gray-600 dark:disabled:text-dark-500 ${disabled ? "opacity-75 cursor-not-allowed" : ""} ${uppercase ? "uppercase placeholder:normal-case" : ""}`}
            onChange={(event) => {setQuery(event.target.value);}}
            onBlur={ e => { if(onBlur) onBlur([id]);}}
            placeholder={placeholder}
            spellCheck={spellCheck}
            disabled={isLoading || disabled}
            displayValue={(item) => item ? item.value : ''}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none disabled:cursor-not-allowed" disabled={disabled}>
            {error ? 
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-700" />
            : 
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" aria-hidden="true" />
            }
          </Combobox.Button>
          {filteredItems.length > 0 && (
            <Combobox.Options className="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredItems.map((item) => (
                <Combobox.Option
                  key={item.id}
                  value={item}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-900 dark:text-dark-100'
                    )
                  }
                >
                  {({ active, selected }) => (
                    <>
                      <span className="flex items-center">
                        <UserIcon 
                          size="extra-small"
                          profilePhoto={item.img}
                        />
                        <span className={classNames('ml-3 block truncate font-normal', selected && 'font-semibold')}>{item.value}</span>
                      </span>
                      {selected && (
                        <span
                          className={classNames(
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                            active ? 'text-gray-900 dark:text-dark-100' : 'text-theme-600 dark:text-theme-700',
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
      {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message}</div>}
      <ConfirmationDialog
          isOpen={isDialogOpen}
          setIsOpen={(state) => {setIsDialogOpen(state); setSelected(prevSelected); setChange(null);}}
          title="Confirm Change"
          description="Are you sure you want to change this user?"
          isYes={() => handleComboChange(change)}
          type="question"
          yesText="Yes"
          cancelText="Cancel"
      />
    </>
  )
}
