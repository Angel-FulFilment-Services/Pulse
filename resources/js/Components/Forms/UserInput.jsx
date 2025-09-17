import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useCombobox } from 'downshift';
import { CheckIcon, ChevronUpDownIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid';
import UserIcon from '../User/UserIcon';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';
import axios from 'axios';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function UserInput(props) {
  const {
    id,
    label,
    currentState,
    placeholder,
    spellCheck,
    onComboChange,
    onBlur,
    error,
    clearErrors,
    disabled,
    uppercase,
    annotation,
    endpoint = '/users', // Default endpoint to fetch users, defaults to /users to get only active users.
    confirmChange = true,
  } = props;

  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const inputWrapperRef = useRef();

  // Fetch users on mount
  useEffect(() => {
    axios.get(endpoint)
      .then(response => {
        const users = response.data.map(user => ({
          id: user.id,
          value: user.name,
          img: user.profile_photo || '',
        }));
        setItems(users);

        if (currentState) {
          const currentUser = users.find(user => user.id === currentState);
          if (currentUser) setSelectedItem(currentUser);
        }
        setIsLoading(false);
      })
      .catch(() => setItems([]));
  }, [currentState]);

  // Filter items as input changes
  const filteredItems =
  inputValue === '' || (selectedItem && inputValue === selectedItem.value)
    ? items
    : items.filter(item =>
        item.value.toLowerCase().includes(inputValue.toLowerCase())
      );

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    openMenu,
  } = useCombobox({
    items: filteredItems,
    itemToString: item => (item ? item.value : ''),
    inputValue,
    selectedItem,
    onInputValueChange: ({ inputValue }) => setInputValue(inputValue),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem && confirmChange) {
        setPendingSelection(selectedItem);
        setIsDialogOpen(true);
      } else {
        handleComboChange(selectedItem);
      }
    },
    defaultSelectedItem: selectedItem,
    disabled,
  });

  const handleComboChange = (item) => {
    if (!item || !item.value) {
      onComboChange([{ id, value: '' }]);
      return;
    }
    onComboChange([{ id, value: item.value, userId: item.id }]);
    if (clearErrors) clearErrors();
    setSelectedItem(item);
  };

  return (
    <>
      {label && (
        <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">
          {label}
          {annotation && (
            <span className="text-neutral-500 dark:text-dark-400 font-normal"> {annotation} </span>
          )}
        </label>
      )}
      <div className="relative" ref={inputWrapperRef}>
        <input
          {...getInputProps({
            id,
            placeholder,
            spellCheck,
            disabled: isLoading || disabled,
            className: classNames(
              "w-full font-normal rounded-md border-0 bg-white dark:bg-dark-900 py-1.5 pl-3 pr-10 z-10 text-gray-900 dark:text-dark-100",
              typeof selectedItem !== "undefined" && !selectedItem?.value && error
                ? "ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900"
                : "ring-gray-300 dark:ring-dark-600",
              "shadow-sm ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-inset focus:ring-theme-600 dark:focus:ring-theme-700 sm:text-sm sm:leading-6",
              disabled ? "opacity-75 cursor-not-allowed" : "",
              uppercase ? "uppercase placeholder:normal-case" : ""
            ),
            onBlur: e => { if (onBlur) onBlur([id]); },
                onFocus: () => {
            setTimeout(() => openMenu(), 0);
            },
            onClick: () => {
              setTimeout(() => openMenu(), 0);
            },
            autoComplete: "off",
          })}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-2"
          onClick={openMenu}
          disabled={disabled}
        >
          {error ? (
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-700" />
          ) : (
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" aria-hidden="true" />
          )}
        </button>
        <ul
          {...getMenuProps()}
          className={classNames(
            "absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm",
            isOpen ? "" : "hidden"
          )}
        >
          {isOpen && filteredItems.length > 0 &&
            filteredItems.map((item, index) => (
              <li
                key={item.id}
                {...getItemProps({
                  item,
                  index,
                  className: classNames(
                    "relative cursor-default select-none py-2 pl-3 pr-9",
                    highlightedIndex === index
                      ? "bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100"
                      : "text-gray-900 dark:text-dark-100"
                  ),
                })}
              >
                <span className="flex items-center">
                  <UserIcon size="extra-small" profilePhoto={item.img} />
                  <span className={classNames('ml-3 block truncate font-normal', selectedItem && selectedItem.id === item.id && 'font-semibold')}>
                    {item.value}
                  </span>
                </span>
                {selectedItem && selectedItem.id === item.id && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-theme-600 dark:text-theme-700">
                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
              </li>
            ))}
          {isOpen && filteredItems.length === 0 && (
            <li className="px-4 py-2 text-gray-500 dark:text-dark-400 text-sm text-left">No Results Found...</li>
          )}
        </ul>
      </div>
      {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message}</div>}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setPendingSelection(null);
        }}
        title="Confirm Change"
        description="Are you sure you want to change this user?"
        isYes={() => {
          handleComboChange(pendingSelection);
          setIsDialogOpen(false);
        }}
        type="question"
        yesText="Yes"
        cancelText="Cancel"
      />
    </>
  );
}

UserInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  currentState: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  spellCheck: PropTypes.bool,
  onComboChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  error: PropTypes.object,
  clearErrors: PropTypes.func,
  disabled: PropTypes.bool,
  uppercase: PropTypes.bool,
  annotation: PropTypes.string,
};
