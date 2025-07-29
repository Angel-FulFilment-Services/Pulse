import { useState, useRef, useEffect } from 'react';
import { PlusIcon, Square3Stack3DIcon, ArrowsRightLeftIcon } from '@heroicons/react/20/solid'
import { TrashIcon, ArrowUturnLeftIcon, EyeIcon, BoltIcon } from '@heroicons/react/24/solid';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { Fragment } from 'react'
import { Description, Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import SimpleFeed from '../../Lists/SimpleFeed';
import { format, addYears, intervalToDuration, isBefore } from 'date-fns';
import ButtonControl from '../../Controls/ButtonControl';
import StackedList from '../../Lists/StackedList';
import ScrollHint from '../../Hints/ScrollHint';
import axios from 'axios';
import { set } from 'lodash';
import ConfirmationDialog from '../../Dialogs/ConfirmationDialog';

export default function Asset({ onCancel, goBack, goTo, changeAsset, changeKit, refreshAsset, refreshKit, data = {} }) {    
    const [asset, setAsset] = useState([]);
    const [history, setHistory] = useState([]);
    const [kit, setKit] = useState([]);
    const [kitAlias, setKitAlias] = useState('Unknown Kit');
    const [kitId, setKitId] = useState(null);
    const [pat, setPat] = useState([]);
    const [nextPatDue, setNextPatDue] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const historyScrollRef = useRef(null);

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
        const { asset, history, kit, pat} = data || {};

        setAsset([]);
        setHistory([]);
        setKit([]);
        setKitAlias('Unknown Kit');
        setKitId(null);
        setPat([]);

        if(asset){
            setAsset(asset);

            console.log('Asset data:', asset);

            setHistory([
                {
                    id: 1,
                    content: 'Asset Created',
                    date: asset ? format(asset.created_at, "do, MMM yy") : null,
                    datetime: asset ? asset.created_at : null,
                    icon: PlusIcon,
                    iconBackground: 'bg-green-500',
                },
            ]);
        }

        if(history && history.length > 0){
            history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            const formattedHistory = history.map((event, index) => ({
                id: index + 2, // Start from 2 since we already have one event
                content: event.content,
                target: event.target,
                date: format(new Date(event.created_at), "do, MMM yy"),
                datetime: new Date(event.created_at),
                icon: ArrowsRightLeftIcon,
                iconBackground: event.icon === 'check' ? 'bg-green-500' : 'bg-gray-400',
            }));
            
            setHistory(prevHistory => [...prevHistory, ...formattedHistory]);
        }

        if(kit && kit.length > 0){
            const kitAlias = kit[0].alias || 'Unknown Kit';
            const kitId = kit[0].id || null;
            setKitAlias(kitAlias);
            setKitId(kitId);
            setKit(kit);
        }

        if (pat && pat.length > 0) {
            const formattedPat = pat.map((item, index) => ({
                id: index + 1,
                title: `${item.class ? item.class : 'Unknown'}`,
                users: [{ name: item.name, userId: item.user_id }],
                status: item.result === 'Pass' ? true : false,
                ...item,
            }));
            setPat(formattedPat);

            // Find latest PAT test date
            const latestPat = pat.reduce((latest, item) => {
                const date = new Date(item.datetime);
                return (!latest || date > new Date(latest.datetime)) ? item : latest;
            }, null);

            if (latestPat && latestPat.datetime) {
                setNextPatDue(addYears(new Date(latestPat.datetime), 1));
            } else {
                setNextPatDue(new Date());
            }
        } else {
            let patRequired = [
                'Desktop Computer',
                'Monitor',
                'Power Lead',
                'Laptop Charger',
                'Laptop',
                'IT Equipment',
            ]
            if( patRequired.includes(asset.type) ){
                setNextPatDue(new Date());
            } else {
                setNextPatDue(null);
            }
        }
    }, [data]);

    // Handle form submission
    const handleCancel = () => {
        onCancel();
    }

    const markAsset = (status) => {
        if (!asset || !asset.id) {
            toast.error('No asset selected to mark.', {
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
        axios.post('/asset-management/assets/mark', { asset_id: asset.id, status: status })
            .then(response => {
                toast.success(`Asset #${asset.afs_id} has been marked as "${status}" successfully.`, {
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
                refreshAsset(asset.assetId);
                setIsProcessing(false);
            })
            .catch(error => {
                console.error('Error retiring asset:', error);
                toast.error(`Failed to mark asset #${asset.afs_id} as "${status}". Please try again.`, {
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
        setIsDialogOpen(false);

        if (!assetId || !kitId) return;
        setIsProcessing(true);

        axios.post(`/asset-management/kits/item/remove`, { 
            asset_id: assetId,
            kit_id: kitId,
        })
            .then(response => {
                setKit([]);
                setKitAlias('Unknown Kit');
                setKitId(null);

                setIsProcessing(false);
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

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    const getStatus = () => {
        if (!asset || !asset.status) return { label: 'Unknown', color: 'gray' };
        
        switch (asset.status) {
            case 'Active':
                return { label: 'Active', color: 'green' };
            case 'Retired':
                return { label: 'Retired', color: 'yellow' };
            case 'Damaged':
                return { label: 'Damaged', color: 'red' };
            case 'Lost':
                return { label: 'Lost', color: 'yellow' };
            default:
                return { label: 'Unknown', color: 'gray' };
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
                                Asset: #{asset.afs_id || asset.id || '~'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                                View and manage the details of this asset.
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
                            { asset && !['Furniture', 'Patch Lead', 'USB Power Cable', 'Peripherals'].includes(asset.type) && !asset.generic ? (
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
                                        {/* <Menu.Item>
                                        {({ active }) => (
                                            <a
                                            href="#"
                                            className={classNames(
                                                active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-700 dark:text-dark-200',
                                                'flex justify-between px-4 py-2 text-sm'
                                            )}
                                            >
                                            <span>Edit</span>
                                            </a>
                                        )}
                                        </Menu.Item> */}
                                        { asset && asset.status !== 'Retired' && asset.status !== 'Damaged' && asset.status !== 'Lost' ? (
                                            <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        markAsset('Retired');
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
                                        { asset && asset.status !== 'Retired' && asset.status !== 'Damaged' && asset.status !== 'Lost' ? (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            markAsset('Lost');
                                                        }}
                                                        className={classNames(
                                                            active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-700 dark:text-dark-200',
                                                            'flex w-full justify-between px-4 py-2 text-sm text-left'
                                                        )}
                                                    >
                                                        <span>Mark as Lost</span>
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        ) : null}
                                        { asset && asset.status !== 'Retired' && asset.status !== 'Damaged' && asset.status !== 'Lost' ? (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            markAsset('Damaged');
                                                        }}
                                                        className={classNames(
                                                            active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-700 dark:text-dark-200',
                                                            'flex w-full justify-between px-4 py-2 text-sm text-left'
                                                        )}
                                                    >
                                                        <span>Mark as Damaged</span>
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        ) : null}
                                        { asset && (asset.status == 'Retired' || asset.status == 'Damaged' || asset.status == 'Lost') ? (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            markAsset('Active');
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
                            ) : null}
                        </div>
                    </div>
                    
                    <div className="mt-3 flex gap-x-8">
                        <div className="w-1/2">
                            <h3 className="font-medium text-gray-900 dark:text-dark-50">Asset Information</h3>
                            <div className="mt-2 flex flex-col divide-y divide-gray-900/10 dark:divide-dark-50/10 border-t border-gray-900/10 dark:border-dark-50/10">
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500 dark:text-dark-400">Asset ID</dt>
                                    <dd className="text-gray-900 dark:text-dark-100">#{asset.afs_id || asset.id || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500 dark:text-dark-400">Alias</dt>
                                    <dd className="text-gray-900 dark:text-dark-100">{asset.alias || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500 dark:text-dark-400">Type</dt>
                                    <dd className="text-gray-900 dark:text-dark-100">{asset.type || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500 dark:text-dark-400">Make</dt>
                                    <dd className="text-gray-900 dark:text-dark-100">{asset.make || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500 dark:text-dark-400">Model</dt>
                                    <dd className="text-gray-900 dark:text-dark-100">{asset.model || '~'}</dd>
                                </div>
                            </div>
                        </div>
                        <div className="w-1/2 relative">
                            <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Asset History</h3>
                            <div
                                ref={historyScrollRef}
                                className="overflow-y-auto flex flex-col border-t border-gray-900/10 dark:border-dark-50/10 max-h-48"
                            >
                                <SimpleFeed timeline={history || []} />
                            </div>
                            <ScrollHint scrollRef={historyScrollRef}></ScrollHint>
                        </div>
                    </div>
                    { nextPatDue ? (
                        <div className="mt-3 flex flex-col gap-y-4 gap-x-8 mb-3">
                            <div className="w-full">
                                <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">PAT Testing</h3>
                                <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-2">
                                    {/* Leave this section blank for now */}
                                    <div className={`overflow-x-auto min-h-24 max-h-36 h-36 overflow-y-auto`}>
                                        { pat && pat.length > 0 ? (
                                            <StackedList 
                                                data={pat || []}
                                                allowExpand={false}
                                                actions={[
                                                    {
                                                        icon: (row) => (<DocumentIcon className="h-5 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out" />),
                                                        onClick: (row) => {
                                                            () => {}
                                                        },
                                                        tooltip: 'Export to PDF',
                                                    },
                                                ]}
                                                renderTitle={(item) => (
                                                    <div className="flex items-center gap-x-2">
                                                        <span className={`inline-flex items-center rounded-full ${item.status ? 'bg-green-50 ring-green-600/20 text-green-700' : 'bg-red-50 ring-red-600/20 text-red-700'} px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset `}>
                                                            {item.status ? 'Passed' : 'Failed'}
                                                        </span>
                                                        <span className="text-sm font-semibold leading-6 text-gray-900 dark:text-dark-100">{item.title}</span>
                                                        <div className="flex items-center gap-x-2 text-xs leading-5 text-gray-500 dark:text-dark-400">
                                                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                                                <circle cx={1} cy={1} r={1} />
                                                            </svg>
                                                            <p>Technician: <span className="text-gray-900 dark:text-dark-200 font-medium">{item.name}</span></p>
                                                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                                                <circle cx={1} cy={1} r={1} />
                                                            </svg>
                                                            <p>
                                                                Date: <span className="text-gray-900 dark:text-dark-200 font-medium"><time dateTime={item.date}>{format(new Date(item.datetime), "dd MMM, yyyy")}</time></span> 
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            />    
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full flex-col gap-y-0">
                                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-gray-500 dark:text-dark-500 bg-gray-100 dark:bg-dark-800/20 ring ring-gray-600/20 dark:ring-dark-400/20 mb-2">
                                                    <BoltIcon className="h-6 w-6 text-yellow-500" />
                                                </div>
                                                <h1 className="text-xl mt-1 font-bold text-gray-900 dark:text-dark-100">No PAT Tests Conducted</h1>
                                                <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
                                                    This asset has not been tested for PAT compliance yet.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full flex items-center justify-between gap-x-4">
                                    <ButtonControl 
                                        Icon={BoltIcon} 
                                        onClick={() => {
                                            goTo({ type: 'pat', afsId: asset.afs_id, assetId: asset.id });
                                        }}
                                        iconClassName="h-5 w-5 text-gray-500 dark:text-dark-500 flex-shrink-0 -ml-2 mr-1" 
                                        className="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-full dark:ring-dark-700 dark:text-dark-100 dark:bg-dark-900 dark:hover:bg-dark-800" 
                                        buttonLabel={`Conduct Test - Next Due: ` + (nextPatDue ? formatDueInterval(nextPatDue) : 'N/A')} 
                                    />
                                </div>
                            </div>
                        </div>
                        ) : (
                            <div className="mt-3 flex flex-col gap-y-4 gap-x-8 mb-7">
                                <div className="w-full">
                                    <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">PAT Testing</h3>
                                    <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-7">
                                        {/* Leave this section blank for now */}
                                        <div className={`overflow-x-auto min-h-24 max-h-36 h-36 overflow-y-auto`}>
                                            <div className="flex items-center justify-center h-full w-full flex-col gap-y-0">
                                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-gray-500 dark:text-dark-500 bg-gray-100 dark:bg-dark-700/20 ring ring-gray-600/20 dark:ring-dark-400/20 mb-2">
                                                    <BoltIcon className="h-6 w-6 text-yellow-500 dark:text-yellow-600" />
                                                </div>
                                                <h1 className="text-xl mt-1 font-bold text-gray-900 dark:text-dark-100">PAT Testing Not Required</h1>
                                                <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
                                                    This asset does not require PAT testing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    { !asset.generic ? 
                        kit && kit.length > 0 ? (
                            <div className="mt-3 flex flex-col gap-y-4 gap-x-8">
                                <div className="w-full">
                                    <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Member of Kit - {kitAlias} </h3>
                                    <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-2">
                                        <div className={`overflow-x-auto rounded-md border border-gray-200 dark:border-dark-700 mt-2 min-h-24 max-h-44 lg:max-h-72 overflow-y-auto`}>
                                            <table className="divide-y divide-gray-200 dark:divide-dark-700 text-sm border-separate border-spacing-0">
                                                <thead className="bg-gray-50 dark:bg-dark-800 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200">Alias</th>
                                                        <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200 w-full">Asset ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-dark-900 dark:text-dark-100">
                                                    {kit && kit.length > 0 ? (
                                                        kit.map((row, idx) => {
                                                            return (
                                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer text-xs" onClick={() => {changeAsset(row.asset_id)}}>
                                                                    <td className="px-3 py-2 whitespace-nowrap border-b border-gray-100 dark:border-dark-700">{row.asset_alias || row.type}</td>
                                                                    <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">{row.afs_id ? `#${row.afs_id}` : null}</td>
                                                                </tr>
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
                                <div className="w-full flex items-center justify-between gap-x-4 mt-3">
                                    <ButtonControl 
                                        id="remove_from_kit" 
                                        Icon={TrashIcon} 
                                        iconClassName="h-5 w-5 text-white dark:text-dark-100 flex-shrink-0 -ml-2 mr-1" 
                                        className="inline-flex justify-center items-center rounded-md bg-red-500 dark:bg-red-600 dark:hover:bg-red-500 hover:bg-red-600 px-3 py-2 text-sm font-semibold text-white dark:text-dark-100 shadow-xs ring-1 ring-red-700/20 ring-inset w-full dark:ring-red-800/20" 
                                        buttonLabel="Remove from Kit" 
                                        onClick={() => {setIsDialogOpen(true)}}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="mt-3 flex flex-col gap-y-4 gap-x-8 mb-2">
                                <div className="w-full">
                                    <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Member of Kit</h3>
                                    <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-2">
                                        <div className={`overflow-x-auto min-h-24 max-h-44 lg:max-h-72 h-44 lg:h-72 overflow-y-auto`}>
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
                        )
                    :
                        null
                }
                </div>
                { kit && kit.length > 0 && !asset.generic && (
                    <div className="w-full flex items-center justify-between gap-x-4">
                            <ButtonControl id="view_kit" Icon={EyeIcon} iconClassName="h-5 w-5 text-gray-500 dark:text-dark-500 flex-shrink-0 -ml-2 mr-1" className="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-full dark:ring-dark-700 dark:text-dark-100 dark:bg-dark-900 dark:hover:bg-dark-800" buttonLabel="View Kit" onClick={() => {changeKit(kitId)}}/>
                    </div>
                )}
            </div>

            <ConfirmationDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                isYes={() => removeItemFromKit(asset.id)}
                title="Remove Item from Kit"
                message={`Are you sure you want to remove this asset from the kit "${kitAlias}"? This action cannot be undone.`}
                yesText="Remove"
                type="error"
            />
        </div>
    );
}