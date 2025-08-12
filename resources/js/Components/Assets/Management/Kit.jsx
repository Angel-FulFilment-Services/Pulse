import { useState, useRef, useEffect } from 'react';
import { PlusIcon, Square3Stack3DIcon, ArrowsRightLeftIcon, ArrowRightIcon, ArrowLeftIcon, ArrowDownIcon } from '@heroicons/react/20/solid'
import { TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import { Fragment } from 'react'
import { Description, Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import {PlusCircleIcon, TrashIcon as Trash } from '@heroicons/react/24/outline';
import SimpleFeed from '../../Lists/SimpleFeed';
import { format, addYears, intervalToDuration, isBefore } from 'date-fns';
import ButtonControl from '../../Controls/ButtonControl';
import StackedList from '../../Lists/StackedList';
import UserInput from '../../Forms/UserInput';
import axios from 'axios';
import ConfirmationDialog from '../../Dialogs/ConfirmationDialog';
import ScrollHint from '../../Hints/ScrollHint';
import useFetchAssets from '../../Fetches/Assets/useFetchAssets';
import SearchControl from '../../Controls/SearchControl';

export default function Kit({ onCancel, goBack, goTo, changeAsset, refreshAsset, refreshKit, data = {} }) {    
    const [kit, setKit] = useState([]);
    const [kitItems, setKitItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [assignedTo, setAssignedTo] = useState(null);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDialogOpenUnassign, setIsDialogOpenUnassign] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const historyScrollRef = useRef(null);

    const { assets } = useFetchAssets(true);

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
        const assignedAfsIds = (kitItems || []).map(item => String(item.afs_id));
        const availableAssets = (assets || []).filter(
            asset => !assignedAfsIds.includes(String(asset.value)) || asset.value === 0
        );

        setAvailableAssets(availableAssets);

    }, [kitItems, assets]);

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
            const addedGroups = {};
            const removedGroups = {};

            history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            history.forEach(event => {
                if (event.source === 'Log' && event.type === 'Added') {
                    const dateKey = format(new Date(event.created_at), "yyyy-MM-dd");
                    if (!addedGroups[dateKey]) addedGroups[dateKey] = [];
                    addedGroups[dateKey].push(event);
                }
                if (event.source === 'Log' && event.type === 'Removed') {
                    const dateKey = format(new Date(event.created_at), "yyyy-MM-dd");
                    if (!removedGroups[dateKey]) removedGroups[dateKey] = [];
                    removedGroups[dateKey].push(event);
                }
            });

            // Create formatted history
            const formattedHistory = [];
            let idx = 2; // Start from 2 since 1 is Kit Created

            // Add grouped Log items
            Object.entries(addedGroups).forEach(([dateKey, events]) => {
                formattedHistory.push({
                    id: idx++,
                    content: `${events.length} Item${events.length > 1 ? 's' : ''} Assigned to Kit`,
                    date: format(new Date(dateKey), "do, MMM yy"),
                    datetime: events[0].created_at,
                    icon: ArrowsRightLeftIcon,
                    iconBackground: 'bg-gray-400',
                });
            });

            Object.entries(removedGroups).forEach(([dateKey, events]) => {
                formattedHistory.push({
                    id: idx++,
                    content: `${events.length} Item${events.length > 1 ? 's' : ''} Removed from Kit`,
                    date: format(new Date(dateKey), "do, MMM yy"),
                    datetime: events[0].created_at,
                    icon: TrashIcon,
                    iconBackground: 'bg-red-500',
                });
            });

            let assignedTo = null;

            // Add issue items and any other types
            history.forEach(event => {
                if (event.source === 'Issue') {
                    if (event.status === 'Issued') {
                        assignedTo = {name: event.name, user_id: event.user_id };
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
                        iconBackground: event.status == 'Issued' ? 'bg-green-500' : 'bg-gray-400',
                    });
                }
                // Add other types as needed...
            });

            formattedHistory.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

            setAssignedTo(assignedTo);
            setHistory(prevHistory => [...prevHistory, ...formattedHistory]);
        }

        if(items && items.length > 0){
            const formattedItems = items.map((item, index) => ({
                id: index + 1,
                asset_id: item.asset_id,
                afs_id: item.afs_id,
                asset_alias: item.asset_alias,
                type: item.type,
            }));

            formattedItems.sort((a, b) => {
                const aHasId = a.afs_id > 0;
                const bHasId = b.afs_id > 0;

                if (aHasId && bHasId) {
                    return a.afs_id - b.afs_id; // ascending
                } else if (!aHasId && !bHasId) {
                    return (a.asset_alias || '').localeCompare(b.asset_alias || '');
                } else if (aHasId) {
                    return -1; // a comes before b
                } else {
                    return 1; // b comes before a
                }
            });
            setKitItems(formattedItems);
        }
    }, [data]);

    const assignKit = (user) => {
        if(user){
            axios.post(`/asset-management/kits/assign`,{
                user_id: user,
                kit_id: kit.id,
            })
                .then(response => {
                    const user = response.data[0];
                    setAssignedTo(user.name);
                    refreshKit();
                    refreshAsset();

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

    const unassignKit = (userId) => {
        if (!kit?.id) return;
        setIsProcessing(true);
        axios.post(`/asset-management/kits/unassign`, {
            kit_id: kit.id,
            user_id: userId,
        })
            .then(response => {
                setAssignedTo(null);
                refreshKit();
                refreshAsset();
                toast.success(`Kit unassigned successfully`, {
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
                console.error('Error unassigning kit:', error);
                setAssignedTo(null);
                toast.error('Failed to unassign kit. Please try again.', {
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

    const removeItemFromKit = (assetId) => {
        if (!assetId || !kit?.id) return;
        setIsProcessing(true);
        setSelectedItem(null);

        axios.post(`/asset-management/kits/item/remove`, { 
            asset_id: assetId,
            kit_id: kit.id,
        })
            .then(response => {
                const updatedItems = kitItems.filter(i => i.asset_id !== assetId);
                setKitItems(updatedItems);
                setIsDialogOpen(false);
                setIsProcessing(false);
                refreshKit();
                refreshAsset();
                toast.success(`Item removed from kit successfully`, {
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
                console.error('Error removing item from kit:', error);
                setIsDialogOpen(false);
                setIsProcessing(false);
                toast.error('Failed to remove item from kit. Please try again.', {
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

    const addItemToKit = (assetId) => {
        if (!assetId || !kit?.id) return;
        setIsProcessing(true);
        axios.post(`/asset-management/kits/item/add`, {
            asset_id: assetId,
            kit_id: kit.id,
        })
            .then(response => {
                const newItem = response.data;
                setIsProcessing(false);
                refreshKit();
                refreshAsset();
                toast.success(`Item added to kit successfully`, {
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
                console.error('Error adding item to kit:', error);
                setIsProcessing(false);
                toast.error('Failed to add item to kit, it may already be assigned. Please try again.', {
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

    const markKit = (active) => {
        if (!kit || !kit.id) {
            toast.error('No kit selected to mark.', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
            return;
        }
        setIsProcessing(true);
        // Call the API to retire the asset
        axios.post('/asset-management/kits/mark', { kit_id: kit.id, active: active })
            .then(response => {
                toast.success(`Kit #${kit.alias} has been marked as "${active ? 'active' : 'inactive'}" successfully.`, {
                    position: 'top-center',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: 'light',
                });
                // Optionally, you can refresh the asset data or redirect
                refreshKit(kit.id);
                setIsProcessing(false);
            })
            .catch(error => {
                console.error('Error retiring kit:', error);
                toast.error(`Failed to mark kit #${kit.alias} as "${active ? 'active' : 'inactive'}". Please try again.`, {
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

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    const getStatus = () => {
        if (!kit) return { label: 'Unknown', color: 'gray' };

        switch (kit.active) {
            case 1:
                return { label: 'Active', color: 'green' };
            default:
                return { label: 'Retired', color: 'yellow' };
        }
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
                            {(() => {
                                const status = getStatus();
                                let pillClass = "inline-flex items-center rounded-full px-6 py-1.5 text-sm font-medium ring-1 ring-inset ";
                                if (status.color === 'green') pillClass += "bg-green-50 text-green-700 ring-green-600/20";
                                else if (status.color === 'red') pillClass += "bg-red-50 text-red-700 ring-red-600/20";
                                else if (status.color === 'yellow') pillClass += "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
                                else pillClass += "bg-gray-100 text-gray-700 ring-gray-600/20";
                                return <span className={pillClass}>{status.label}</span>;
                            })()}
                            <Menu as="div" className="relative ml-3 inline-block text-left">
                            <div>
                                <Menu.Button className="-my-2 flex items-center rounded-full bg-white p-2 text-gray-400 hover:text-gray-600 dark:bg-dark-900 dark:text-dark-500 dark:hover:text-dark-400 focus:outline-none focus:ring-2 focus:ring-theme-600 dark:focus:ring-theme-700">
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
                                <Menu.Items className="absolute right-0 z-10 mt-3 w-32 origin-top-right rounded-md bg-white dark:bg-dark-900 shadow-lg ring-1 dark:ring-dark-100 dark:ring-opacity-5 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    { kit && kit.active !== 0 ? (
                                        <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    markKit(0);
                                                }}
                                                className={classNames(
                                                    active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-700 dark:text-dark-200',
                                                    'flex justify-between px-4 py-2 text-sm w-full'
                                                )}
                                            >
                                                <span>Retire</span>
                                            </button>
                                        )}
                                        </Menu.Item>
                                    ) : null}
                                    { kit && kit.active !== 1 ? (
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        markKit(1);
                                                    }}
                                                    className={classNames(
                                                        active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-700 dark:text-dark-200',
                                                        'flex w-full justify-between px-4 py-2 text-sm text-left'
                                                    )}
                                                >
                                                    <span>Reactivate</span>
                                                </button>
                                            )}
                                        </Menu.Item>
                                    ) : null}
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
                                        <dd className="text-gray-900 flex flex-col items-end gap-y-0.5">
                                            <span className="text-gray-900 dark:text-dark-100">{assignedTo.name}</span>
                                            <button 
                                                className="text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 text-xs w-full text-right" 
                                                onClick={() => setIsDialogOpenUnassign(true)}
                                            >
                                                Unassign
                                            </button>
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
                        <div className="w-1/2 relative">
                            <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Kit History</h3>
                            <div
                                ref={historyScrollRef}
                                className="overflow-y-auto flex flex-col border-t border-gray-900/10 dark:border-dark-50/10 max-h-48"
                            >
                                <SimpleFeed timeline={history || []} />
                            </div>
                            <ScrollHint scrollRef={historyScrollRef}></ScrollHint>
                        </div>
                    </div>
                    { kitItems && kitItems.length > 0 ? (
                        <div className="mt-3 flex flex-col gap-y-4 gap-x-8">
                            <div className="w-full">
                                <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Kit Items</h3>
                                <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-2">
                                    <div className={`overflow-x-auto rounded-md border border-gray-200 dark:border-dark-700 mt-2 min-h-24 max-h-72 overflow-y-auto`}>
                                        <table className="divide-y divide-gray-200 dark:divide-dark-700 text-sm border-separate border-spacing-0">
                                            <thead className="bg-gray-50 dark:bg-dark-800 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200">Alias</th>
                                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200 w-full">Asset ID</th>
                                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200 w-full"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-dark-900">
                                                {kitItems.map((row, idx) => {
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer text-xs" onClick={() => {changeAsset(row.asset_id)}}>
                                                            <td className="px-3 py-2 whitespace-nowrap border-b border-gray-100 dark:border-dark-700">{row.asset_alias || row.type}</td>
                                                            <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">{row.afs_id ? `#${row.afs_id}` : null}</td>
                                                            <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">
                                                                <div className="flex items-center justify-end gap-x-2">
                                                                    <button
                                                                        onClick={(event) => {event.stopPropagation(); setSelectedItem(row.asset_id); setIsDialogOpen(true);}}
                                                                    >
                                                                        <Trash
                                                                        className="h-5 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out"
                                                                        aria-hidden="true"
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
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
                    <div className="w-full flex items-center justify-center gap-x-1 pt-4">
                        <SearchControl
                            id="asset_search"
                            items={availableAssets}
                            placeholder="Add Asset to Kit..."
                            width='w-full'
                            onSelectChange={(item) => {
                                if (!item) return;
                            }}
                        />
                        <ButtonControl 
                            id="add_asset_to_kit" 
                            Icon={PlusIcon} 
                            iconClassName="h-5 w-5 text-gray-500 dark:text-dark-500 flex-shrink-0" 
                            className="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-9 dark:ring-dark-600 dark:text-dark-100 dark:bg-dark-800 dark:hover:bg-dark-700" 
                            onClick={() => {
                                const asset = document.getElementById('asset_search').value;
                                const assetId = assets.find(a => a.displayValue == asset)?.id || assets.find(a => a.value == asset)?.id;
                                if (!assetId) {
                                    toast.error('Please select an asset to add to the kit.', {
                                        position: 'top-center',
                                        autoClose: 3000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: false,
                                        draggable: true,
                                        progress: undefined,
                                        theme: 'light',
                                    });
                                    return;
                                }
                                addItemToKit(assetId);
                            }} 
                        />
                    </div>
                </div>
                {
                    assignedTo && (
                        <div className="w-full flex items-center justify-between gap-x-4">
                            <ButtonControl 
                                id="process_return" 
                                Icon={ArrowUturnLeftIcon} 
                                iconClassName="h-5 w-5 text-gray-500 dark:text-dark-500 flex-shrink-0 -ml-2 mr-1" 
                                className="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-full dark:ring-dark-600 dark:text-dark-100 dark:bg-dark-800 dark:hover:bg-dark-700" 
                                buttonLabel="Process Return" 
                                onClick={() => {
                                    goTo({ type: 'return', kitId: kit.id, kit: data });
                                }}
                            />
                        </div>
                    )
                }
            </div>
            <ConfirmationDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);  
                    setSelectedItem(null)
                }}
                title="Remove this item from the kit?"
                description="Are you sure you want to remove this item from the kit?"
                isYes={() => removeItemFromKit(selectedItem)}
                type="delete"
                yesText="Remove"
                cancelText="Cancel"
            />
            <ConfirmationDialog
                isOpen={isDialogOpenUnassign}
                title="Unassign Kit?"
                description="Are you sure you want to unassign this kit?"            
                isYes={() => unassignKit(assignedTo.user_id)}
                onClose={() => setIsDialogOpenUnassign(false)}
                type="question"
                yesText="Yes"
                cancelText="Cancel"
            />
        </div>
    );
}