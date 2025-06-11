import { useState, useRef, useEffect } from 'react';
import { CheckIcon, HandThumbUpIcon, Square3Stack3DIcon, ArrowsRightLeftIcon } from '@heroicons/react/20/solid'
import { toast } from 'react-toastify';
import useFetchKits from '../../Fetches/Assets/useFetchKits';
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import SimpleFeed from '../../Lists/SimpleFeed';
import { format } from 'date-fns';

export default function Asset({ assetId, onCancel, asset = null, assetHistory = null }) {    
    const [history, setHistory] = useState([]);
    
    const { kits } = useFetchKits();

    useEffect(() => {
        if(asset){
            setHistory([
                {
                    id: 1,
                    content: 'Asset Created',
                    date: asset ? format(asset.created_at, "eo, MMM yy") : null,
                    datetime: asset ? asset.created_at : null,
                    icon: Square3Stack3DIcon,
                    iconBackground: 'bg-green-500',
                },
            ]);
        }
    }, [asset]);

    useEffect(() => {
        if(assetHistory && assetHistory.length > 0){
            const formattedHistory = assetHistory.map((event, index) => ({
                id: index + 2, // Start from 2 since we already have one event
                content: event.content,
                target: event.target,
                date: format(new Date(event.created_at), "eo, MMM yy"),
                datetime: event.created_at,
                icon: ArrowsRightLeftIcon,
                iconBackground: event.icon === 'check' ? 'bg-green-500' : 'bg-blue-500',
            }));
            setHistory(prevHistory => [...prevHistory, ...formattedHistory]);
        }
    }, [assetHistory]);

    // Handle form submission
    const handleCancel = () => {
        onCancel();
    }

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    return (
        <div className="w-full h-full max-h-full overflow-y-auto">
            <div className="space-y-6 h-full  justify-between flex flex-col">
                {/* Title Field */}
                <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-6">
                    <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-2 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-dark-100">
                                Asset - Asset Reference: #{assetId}
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                                Viewing and editing asset details.
                                {asset ? ' You can update the asset details below.' : ' Please fill in the details to create a new asset.'}
                            </p>
                        </div>
                        <div className="flex items-center justify-between flex-shrink-0 pr-1">
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Active
                            </span>
                            <Menu as="div" className="relative ml-3 inline-block text-left">
                            <div>
                                <Menu.Button className="-my-2 flex items-center rounded-full bg-white p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-theme-600">
                                <span className="sr-only">Open options</span>
                                <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                                </Menu.Button>
                            </div>
                
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    <Menu.Item>
                                    {({ active }) => (
                                        <a
                                        href="#"
                                        className={classNames(
                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                            'flex justify-between px-4 py-2 text-sm'
                                        )}
                                        >
                                        <span>Edit</span>
                                        </a>
                                    )}
                                    </Menu.Item>
                                    <Menu.Item>
                                    {({ active }) => (
                                        <a
                                        href="#"
                                        className={classNames(
                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                            'flex justify-between px-4 py-2 text-sm'
                                        )}
                                        >
                                        <span>Duplicate</span>
                                        </a>
                                    )}
                                    </Menu.Item>
                                    <Menu.Item>
                                    {({ active }) => (
                                        <button
                                        type="button"
                                        className={classNames(
                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                            'flex w-full justify-between px-4 py-2 text-sm'
                                        )}
                                        >
                                        <span>Archive</span>
                                        </button>
                                    )}
                                    </Menu.Item>
                                </div>
                                </Menu.Items>
                            </Transition>
                            </Menu>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex gap-x-8">
                        <div className="w-1/2">
                            <h3 className="font-medium text-gray-900 dark:text-dark-50">Information</h3>
                            <div className="mt-2 flex flex-col divide-y divide-gray-900/10 dark:divide-dark-50/10 border-t border-gray-900/10 dark:border-dark-50/10">
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Asset ID</dt>
                                    <dd className="text-gray-900">#{asset.assetId || assetId || 'Not provided'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Alias</dt>
                                    <dd className="text-gray-900">{asset.alias || 'Not provided'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Type</dt>
                                    <dd className="text-gray-900">{asset.type || 'Not provided'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Make</dt>
                                    <dd className="text-gray-900">{asset.make || 'Not provided'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Model</dt>
                                    <dd className="text-gray-900">{asset.model || 'Not provided'}</dd>
                                </div>
                            </div>
                        </div>
                        <div className="w-1/2">
                            <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">History</h3>
                            <div className="max-h-48 overflow-y-auto flex flex-col divide-y divide-gray-900/10 dark:divide-dark-50/10 border-t border-gray-900/10 dark:border-dark-50/10">
                                <SimpleFeed timeline={history || []} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="mt-6 flex items-center justify-end gap-x-6 w-full xl:w-2/3">
                    <button
                        type="button"
                        className="text-sm font-semibold text-gray-900 dark:text-dark-100"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}