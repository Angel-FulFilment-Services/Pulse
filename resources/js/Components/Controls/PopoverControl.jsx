import { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/20/solid'

export default function PopoverControl(props) {
  const { label, buttonClass, icon, content } = props;

  return (
      <Popover.Group className="flex flex-shrink-0 items-center justify-end divide-x divide-gray-200">
        <Popover className="relative inline-block text-left">
            <Popover.Button className={buttonClass}>
              <span>{label}</span>
              {icon}
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Popover.Panel className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                <form className="max-h-96 overflow-y-auto">
                    {content}
                </form>
              </Popover.Panel>
            </Transition>
          </Popover>
      </Popover.Group>
  );
}