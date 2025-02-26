import React, { useState, useEffect } from 'react';
import InformationDialog from '../../Components/Account/MissingInformationDialog.jsx';
import Example from '../../Components/Cards/contact_cards.jsx';

import { BarsArrowUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'


const Dashboard = ({ token }) => {
    return (
        <div className="overflow-y-hidden">
            <div className="flex flex-row w-full justify-center bg-gray-100">                      
                <InformationDialog />
            </div>
            <div className="border-b border-gray-200 p-5 mx-10 sm:flex sm:items-center sm:justify-between">
                <div className="sm:w-0 sm:flex-1">
                    <h1 id="message-heading" className="text-base font-semibold leading-6 text-gray-900">
                        Due on Shift
                    </h1>
                    <p className="mt-1 truncate text-sm text-gray-500">Checkout and Payments Team</p>
                </div>
                <div className="mt-3 sm:ml-4 sm:mt-0">
                    <label htmlFor="mobile-search-candidate" className="sr-only">
                        Search
                    </label>
                    <label htmlFor="desktop-search-candidate" className="sr-only">
                        Search
                    </label>
                    <div className="flex rounded-md shadow-sm">
                        <div className="relative flex-grow focus-within:z-10">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                                <input
                                    type="text"
                                    name="mobile-search-candidate"
                                    id="mobile-search-candidate"
                                    className="block w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 !outline-none sm:hidden"
                                    placeholder="Search"
                                />
                                <input
                                    type="text"
                                    name="desktop-search-candidate"
                                    id="desktop-search-candidate"
                                    className="hidden w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-sm leading-6 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 !outline-none sm:block"
                                    placeholder="Search candidates"
                                />
                            </div>
                        <button
                        type="button"
                        className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <BarsArrowUpIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            View
                            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="mx-10 py-4">
                <Example></Example>
            </div>
        </div>
      );
}

export default Dashboard