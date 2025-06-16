import { useState, useRef, useEffect } from 'react';
import { PlusIcon, Square3Stack3DIcon, ArrowsRightLeftIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/20/solid'
import { TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import { Fragment } from 'react'
import { Description, Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import SimpleFeed from '../../Lists/SimpleFeed';
import { format, addYears, intervalToDuration, isBefore } from 'date-fns';
import ButtonControl from '../../Controls/ButtonControl';
import StackedList from '../../Lists/StackedList';
import UserInput from '../../Forms/UserInput';
import axios from 'axios';

export default function Kit({ assetId, onCancel, goBack, goTo, changeAsset, data = {} }) {    
    const [kit, setKit] = useState([]);
    const [kitItems, setKitItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [assignedTo, setAssignedTo] = useState(null);

    function formatDueInterval(dueDate) {
        if (!dueDate) return 'N/A';
        const now = new Date();
        const due = new Date(dueDate);

        // If due date is in the past, show "Due now"
        if (isBefore(due, now)) return 'Now';

        const { months, days } = intervalToDuration({ start: now, end: due });

        let parts = [];
        if (months) parts.push(`${months} month${months > 1 ? 's' : ''}`);
        if (days) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (parts.length === 0) return 'Today';
        return parts.join(', ');
    }

    useEffect(() => {
        const { history, kit, items} = data || {}

        if(kit){
            setKit(kit);

            setHistory([
                {
                    id: 1,
                    content: 'Kit Created',
                    date: kit ? format(kit.created_at, "do, MMM yy") : null,
                    datetime: kit ? kit.created_at : null,
                    icon: PlusIcon,
                    iconBackground: 'bg-green-500',
                },
            ]);
        }

        if (history && history.length > 0) {
            // Group Log items by date
            const logGroups = {};
            history.forEach(event => {
                if (event.type === 'Log') {
                    const dateKey = format(new Date(event.created_at), "yyyy-MM-dd");
                    if (!logGroups[dateKey]) logGroups[dateKey] = [];
                    logGroups[dateKey].push(event);
                }
            });

            // Create formatted history
            const formattedHistory = [];
            let idx = 2; // Start from 2 since 1 is Kit Created

            // Add grouped Log items
            Object.entries(logGroups).forEach(([dateKey, events]) => {
                formattedHistory.push({
                    id: idx++,
                    content: `${events.length} Items Assigned to Kit`,
                    date: format(new Date(dateKey), "do, MMM yy"),
                    datetime: dateKey,
                    icon: ArrowsRightLeftIcon,
                    iconBackground: 'bg-gray-400',
                });
            });

            let assignedTo = null;
            // Add issue items and any other types
            history.forEach(event => {
                if (event.type === 'Issue') {
                    if (event.status === 'Issued') {
                        assignedTo = event.name;
                    } else if (event.status === 'Returned') {
                        assignedTo = null;
                    }

                    formattedHistory.push({
                        id: idx++,
                        content: event.status == 'Issued' ? `Kit Assigned To: ${event.target || ''}` : `Kit Returned From: ${event.target || ''}`,
                        target: event.name,
                        date: format(new Date(event.created_at), "do, MMM yy"),
                        datetime: event.created_at,
                        icon: event.status == 'Issued' ? ArrowRightIcon : ArrowLeftIcon,
                        iconBackground: event.status == 'Issued' ? 'bg-green-500' : 'bg-red-500',
                    });
                }
                // Add other types as needed...
            });

            setAssignedTo(assignedTo);
            setHistory(prevHistory => [...prevHistory, ...formattedHistory]);
        }

        if(items && items.length > 0){
            const formattedItems = items.map((item, index) => ({
                id: index + 1,
                afs_id: item.afs_id,
                asset_alias: item.asset_alias,
                type: item.type,
            }));
            setKitItems(formattedItems);
        }
    }, [data]);

    const assignKit = (user) => {
        if(user){
            console.log('Assigned To:', user);
            axios.post(`/asset-management/kits/assign`,{
                user_id: user,
                kit_id: kit.id,
            })
                .then(response => {
                    const user = response.data[0];
                    setAssignedTo(user.name);
                    window.dispatchEvent(new CustomEvent('refreshKit', { detail: { kitId: kit.id } }));

                    toast.success(`Kit assigned to ${user.name}`, {
                        position: 'top-center',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: true,
                        progress: undefined,
                        theme: 'light',
                    });
                })
                .catch(error => {
                    console.error('Error fetching assigned user:', error);
                    setAssignedTo(null);

                    toast.error('Failed to assign kit. Please try again.', {
                        position: 'top-center',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: true,
                        progress: undefined,
                        theme: 'light',
                    });
                });
        }
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
                                Kit: {kit.alias}
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                                View and manage the details of this kit.
                            </p>
                        </div>
                        <div className="flex items-center justify-between flex-shrink-0 pr-1">
                            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
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
                    
                    <div className="mt-3 flex gap-x-8">
                        <div className="w-1/2">
                            <h3 className="font-medium text-gray-900 dark:text-dark-50">Kit Information</h3>
                            <div className="mt-2 flex flex-col divide-y divide-gray-900/10 dark:divide-dark-50/10 border-t border-gray-900/10 dark:border-dark-50/10">
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Alias</dt>
                                    <dd className="text-gray-900">{kit.alias || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium items-center">
                                    <dt className="text-gray-500">Assigned To</dt>
                                    { assignedTo ? (
                                        <dd className="text-gray-900">
                                            <span className="text-gray-900 dark:text-dark-100">{assignedTo}</span>
                                        </dd>
                                    ) : (
                                        <div className="w-4/6">
                                            <UserInput 
                                                id="assigned_to"
                                                onComboChange={(value) => {
                                                    assignKit(value[0]?.userId);
                                                }}
                                                placeholder="Assign to kit to"

                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="w-1/2">
                            <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Kit History</h3>
                            <div className="max-h-48 overflow-y-auto flex flex-col divide-y divide-gray-900/10 dark:divide-dark-50/10 border-t border-gray-900/10 dark:border-dark-50/10">
                                <SimpleFeed timeline={history || []} />
                            </div>
                        </div>
                    </div>
                    { kitItems && kitItems.length > 0 ? (
                        <div className="mt-3 flex flex-col gap-y-4 gap-x-8">
                            <div className="w-full">
                                <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Kit Items</h3>
                                <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-2">
                                    <div className={`overflow-x-auto rounded-md border border-gray-200 dark:border-dark-700 mt-2 min-h-24 max-h-48 h-48 overflow-y-auto`}>
                                        <table className="divide-y divide-gray-200 dark:divide-dark-700 text-sm border-separate border-spacing-0">
                                            <thead className="bg-gray-50 dark:bg-dark-800 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200">Alias</th>
                                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200 w-full">Asset ID</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-dark-900">
                                                {kitItems && kitItems.length > 0 ? (
                                                    kitItems.map((row, idx) => {
                                                        return (
                                                            {...row.afs_id ? (
                                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer text-xs" onClick={() => {changeAsset(row.afs_id)}}>
                                                                    <td className="px-3 py-2 whitespace-nowrap border-b border-gray-100 dark:border-dark-700">{row.asset_alias || row.type}</td>
                                                                    <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">{row.afs_id ? `#${row.afs_id}` : null}</td>
                                                                </tr>
                                                            ) : (
                                                                <tr key={idx} className="text-xs">
                                                                    <td className="px-3 py-2 whitespace-nowrap border-b border-gray-100 dark:border-dark-700">{row.asset_alias || row.type}</td>
                                                                    <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">N/A</td>
                                                                </tr>
                                                            )}
                                                        );
                                                    })
                                                ) : (
                                                <tr>
                                                    <td colSpan={7} className="px-3 py-4 text-center text-gray-400 dark:text-dark-500">
                                                    No ping results found for the last week.
                                                    </td>
                                                </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full flex items-center justify-between gap-x-4">
                                <ButtonControl id="process_return" Icon={ArrowUturnLeftIcon} iconClass="h-5 w-5 text-gray-500 dark:text-gray-600 flex-shrink-0 -ml-2" customClass="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-full" buttonLabel="Process Return" onButtonClick={() => {}} />
                                <ButtonControl id="remove_asset" Icon={TrashIcon} iconClass="h-5 w-5 text-white flex-shrink-0 -ml-2" customClass="inline-flex justify-center items-center rounded-md px-3 py-2 text-sm font-semibold bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 w-full" buttonLabel="Retire Kit" onButtonClick={() => {}} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-y-4 gap-x-8">
                            <div className="w-full">
                                <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Kit Items</h3>
                                <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-2">
                                    <div className={`overflow-x-auto min-h-24 max-h-40 h-40 overflow-y-auto`}>
                                        <div className="flex items-center justify-center h-full w-full flex-col gap-y-0">
                                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-gray-500 dark:text-dark-500 bg-gray-100 dark:bg-dark-800/20 ring ring-gray-600/20 dark:ring-dark-400/20 mb-2">
                                                <Square3Stack3DIcon className="h-6 w-6" />
                                            </div>
                                            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-100">No Kit Assigned</h1>
                                            <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
                                                This asset is not part of any kit.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}