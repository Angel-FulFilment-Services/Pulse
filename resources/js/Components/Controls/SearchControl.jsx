import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCombobox } from 'downshift';
import { FixedSizeList as List } from 'react-window';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { MagnifyingGlassCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ITEM_SIZE = 40;
const MAX_HEIGHT = 240;

export default function SearchControl({
  id,
  items,
  onSelectChange,
  placeholder = 'Select an option',
  label,
  width = 'w-full',
  defaultSelected = null,
  disabled = false,
}) {
  const [inputValue, setInputValue] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const listRef = useRef();
  const inputWrapperRef = useRef();
  const filteredItems =
    inputValue === ''
      ? items
      : items.filter((item) =>
          (item.displayValue || item.value)
            .toLowerCase()
            .includes(inputValue.toLowerCase())
        );

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    selectedItem,
    openMenu,
  } = useCombobox({
    items: filteredItems,
    itemToString: (item) => (item ? item.displayValue || item.value : ''),
    onInputValueChange: ({ inputValue }) => setInputValue(inputValue),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onSelectChange(selectedItem.value);
    },
    defaultSelectedItem: defaultSelected,
    disabled,
  });

  const listHeight = Math.min(filteredItems.length * ITEM_SIZE, MAX_HEIGHT);

  // Scroll to top when inputValue changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [inputValue]);

  useEffect(() => {
    if (isOpen && inputWrapperRef.current) {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < MAX_HEIGHT && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  return (
    <div className={`relative ${width}`} ref={inputWrapperRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...getInputProps({
            id,
            placeholder,
            className:
              "w-full rounded-md border-0 bg-white dark:bg-dark-900 py-1.5 pl-3 pr-10 text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 focus:outline-none focus:ring-2 focus:ring-theme-600 dark:focus:ring-theme-700 sm:text-sm sm:leading-6",
            autoComplete: "off",
            disabled,
          })}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center pr-2"
          onClick={openMenu}
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" aria-hidden="true" />
        </button>
      </div>
      <ul
        {...getMenuProps()}
        className={classNames(
          "absolute z-10 w-full rounded-md bg-white dark:bg-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm mt-1",
          openUpwards ? "bottom-full mb-1" : "top-full mt-1",
          isOpen ? "" : "hidden"
        )}
        style={{
          maxHeight: MAX_HEIGHT,
          padding: 0,
          listStyle: "none",
        }}
      >
        {isOpen && filteredItems.length > 0 && (
          <List
            ref={listRef}
            height={listHeight}
            itemCount={filteredItems.length}
            itemSize={ITEM_SIZE}
            width="100%"
            style={{ overflowX: "hidden" }}
          >
            {({ index, style }) => {
              const item = filteredItems[index];
              return (
                <li
                  {...getItemProps({
                    key: item.id,
                    index,
                    item,
                    style: {
                      ...style,
                      backgroundColor:
                        highlightedIndex === index
                          ? "rgb(243 244 246 / var(--tw-bg-opacity,1))"
                          : "",
                      fontWeight: selectedItem && selectedItem.id === item.id ? "bold" : "normal",
                      padding: "8px 12px",
                      cursor: "pointer",
                      textAlign: "left",
                    },
                    className: classNames(
                      "relative select-none text-gray-900 dark:text-dark-100 text-left",
                      highlightedIndex === index
                        ? "bg-gray-100 dark:bg-dark-800 dark:text-dark-100"
                        : "text-gray-900 dark:text-dark-100"
                    ),
                  })}
                >
                  <span className={classNames("block truncate text-left", selectedItem && selectedItem.id === item.id && "font-semibold")}>
                    {item.displayValue || item.value}
                  </span>
                  {selectedItem && selectedItem.id === item.id && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-theme-600 dark:text-theme-700">
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </li>
              );
            }}
          </List>
        )}
        {isOpen && filteredItems.length === 0 && (
          <li className="px-4 py-2 text-gray-500 dark:text-dark-400 text-sm text-left">No Results Found...</li>
        )}
      </ul>
    </div>
  );
}

SearchControl.propTypes = {
  id: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      displayValue: PropTypes.string,
    })
  ).isRequired,
  onSelectChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  width: PropTypes.string,
  defaultSelected: PropTypes.object,
  disabled: PropTypes.bool,
};