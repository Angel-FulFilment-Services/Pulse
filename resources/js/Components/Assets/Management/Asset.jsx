import { useState, useRef, useEffect } from 'react';
import { PlusIcon, Square3Stack3DIcon, ArrowsRightLeftIcon } from '@heroicons/react/20/solid'
import { TrashIcon, ArrowUturnLeftIcon, EyeIcon, BoltIcon } from '@heroicons/react/24/solid';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { Fragment } from 'react'
import { Description, Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import SimpleFeed from '../../Lists/SimpleFeed';
import { format, addYears } from 'date-fns';
import ButtonControl from '../../Controls/ButtonControl';
import StackedList from '../../Lists/StackedList';

export default function Asset({ assetId, onCancel, data = {} }) {    
    const [asset, setAsset] = useState([]);
    const [history, setHistory] = useState([]);
    const [kit, setKit] = useState([]);
    const [pat, setPat] = useState([]);
    const [nextPatDue, setNextPatDue] = useState(null);

    useEffect(() => {
        const { asset, history, kit, pat} = data || {};

        if(asset){
            setAsset(asset);

            setHistory([
                {
                    id: 1,
                    content: 'Asset Created',
                    date: asset ? format(asset.created_at, "eo, MMM yy") : null,
                    datetime: asset ? asset.created_at : null,
                    icon: PlusIcon,
                    iconBackground: 'bg-green-500',
                },
            ]);
        }

        if(history && history.length > 0){
            const formattedHistory = history.map((event, index) => ({
                id: index + 2, // Start from 2 since we already have one event
                content: event.content,
                target: event.target,
                date: format(new Date(event.created_at), "eo, MMM yy"),
                datetime: event.created_at,
                icon: ArrowsRightLeftIcon,
                iconBackground: event.icon === 'check' ? 'bg-green-500' : 'bg-gray-400',
            }));
            setHistory(prevHistory => [...prevHistory, ...formattedHistory]);
        }

        if(kit && kit.length > 0){
            setKit(kit);
        }

        if (pat && pat.length > 0) {
            const formattedPat = pat.map((item, index) => ({
                id: index + 1,
                title: `Test -  (${item.class ? item.class : 'Unknown'})`,
                users: [{ name: item.name, user_id: item.user_id }],
                resolved: item.result === 'Pass' ? true : false,
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
                                Asset: #{assetId}
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                                View and manage the details of this asset.
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
                            <h3 className="font-medium text-gray-900 dark:text-dark-50">Asset Information</h3>
                            <div className="mt-2 flex flex-col divide-y divide-gray-900/10 dark:divide-dark-50/10 border-t border-gray-900/10 dark:border-dark-50/10">
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Asset ID</dt>
                                    <dd className="text-gray-900">#{asset.assetId || assetId || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Alias</dt>
                                    <dd className="text-gray-900">{asset.alias || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Type</dt>
                                    <dd className="text-gray-900">{asset.type || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Make</dt>
                                    <dd className="text-gray-900">{asset.make || '~'}</dd>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-medium">
                                    <dt className="text-gray-500">Model</dt>
                                    <dd className="text-gray-900">{asset.model || '~'}</dd>
                                </div>
                            </div>
                        </div>
                        <div className="w-1/2">
                            <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Asset History</h3>
                            <div className="max-h-48 overflow-y-auto flex flex-col divide-y divide-gray-900/10 dark:divide-dark-50/10 border-t border-gray-900/10 dark:border-dark-50/10">
                                <SimpleFeed timeline={history || []} />
                            </div>
                        </div>
                    </div>
                    { nextPatDue ? (
                        <div className="mt-3 flex flex-col gap-y-4 gap-x-8 mb-3">
                            <div className="w-full">
                                <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">PAT Testing</h3>
                                <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-2">
                                    {/* Leave this section blank for now */}
                                    <div className={`overflow-x-auto min-h-24 max-h-40 h-40 overflow-y-auto`}>
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
                                                renderDescription={(item) => (
                                                    <>    
                                                        <p>Technician: {item.name}</p>
                                                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                                            <circle cx={1} cy={1} r={1} />
                                                        </svg>
                                                        <p>Result: {item.result === 'Pass' ? 'Passed' : 'Failed'}</p>
                                                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                                            <circle cx={1} cy={1} r={1} />
                                                        </svg>
                                                        <p>
                                                            Completed: <time dateTime={item.date}>{format(new Date(item.datetime), "dd MMM, yy - HH:mm")}</time>
                                                        </p>
                                                    </>
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
                                        iconClass="h-5 w-5 text-gray-500 dark:text-gray-600 flex-shrink-0 -ml-2" 
                                        customClass="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-full" 
                                        buttonLabel={`Conduct Test - Next Due: ` + (nextPatDue ? format(new Date(nextPatDue), "dd MMM, yyyy") : 'N/A')} 
                                    />
                                </div>
                            </div>
                        </div>
                        ) : (
                            <div className="mt-3 flex flex-col gap-y-4 gap-x-8">
                                <div className="w-full">
                                    <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">PAT Testing</h3>
                                    <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-2">
                                        {/* Leave this section blank for now */}
                                        <div className={`overflow-x-auto min-h-24 max-h-40 h-40 overflow-y-auto`}>
                                            <div className="flex items-center justify-center h-full w-full flex-col gap-y-0">
                                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-gray-500 dark:text-dark-500 bg-gray-100 dark:bg-dark-800/20 ring ring-gray-600/20 dark:ring-dark-400/20 mb-2">
                                                    <BoltIcon className="h-6 w-6 text-yellow-500" />
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
                    { kit && kit.length > 0 ? (
                        <div className="mt-3 flex flex-col gap-y-4 gap-x-8">
                            <div className="w-full">
                                <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">Member of Kit -</h3>
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
                                                {kit && kit.length > 0 ? (
                                                    kit.map((row, idx) => {
                                                        return (
                                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer text-xs">
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
                            <div className="w-full flex items-center justify-between gap-x-4">
                                <ButtonControl Icon={EyeIcon} iconClass="h-5 w-5 text-gray-500 dark:text-gray-600 flex-shrink-0 -ml-2" customClass="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-full" buttonLabel="View Kit" />
                                <ButtonControl Icon={ArrowUturnLeftIcon} iconClass="h-5 w-5 text-gray-500 dark:text-gray-600 flex-shrink-0 -ml-2" customClass="inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-full" buttonLabel="Process Return" />
                                <ButtonControl Icon={TrashIcon} iconClass="h-5 w-5 text-white flex-shrink-0 -ml-2" customClass="inline-flex justify-center items-center rounded-md px-3 py-2 text-sm font-semibold bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 w-full" buttonLabel="Remove Asset" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-y-4 gap-x-8">
                            <div className="w-full">
                                <h3 className="font-medium text-gray-900 dark:text-dark-50 mb-2">PAT Testing</h3>
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