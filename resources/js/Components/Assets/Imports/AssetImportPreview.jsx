import React from 'react';
import { 
    ExclamationTriangleIcon, 
    CheckCircleIcon, 
    InformationCircleIcon,
    ArrowUpTrayIcon,
    PlusIcon,
    MinusIcon,
    BoltIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function AssetImportPreview({ 
    previewData, 
    onConfirm, 
    onCancel, 
    isExecuting = false 
}) {
    if (!previewData) return null;

    const {
        assets_to_create = [],
        assets_to_update = [],
        assets_to_retire = [],
        kit_changes = [],
        pat_tests_to_create = [],
        frontend_errors = [],
        errors = [],
        total_rows,
        file_name
    } = previewData;

    const totalChanges = assets_to_create.length + assets_to_update.length + assets_to_retire.length;

    return (
        <div className="px-4">
            {/* Header */}
            <div className="mb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-100 dark:bg-theme-200/60 mb-4">
                    <ArrowUpTrayIcon className="h-7 w-7 text-theme-600 dark:text-theme-700" aria-hidden="true" />
                </div>
                <div className="text-center">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-dark-100 mb-2">
                        Asset Import Preview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-dark-400">
                        File: <span className="font-medium">{file_name}</span> • {total_rows} rows processed
                    </p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="mb-6">
                <p className="text-center text-sm text-gray-600 dark:text-dark-400 mb-4">
                    The following import will cause these changes to your system:
                </p>
                <div className="space-y-3 max-w-sm mx-auto">
                    <div className="flex items-center">
                        <PlusIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-dark-400">
                            <span className="font-medium text-gray-900 dark:text-dark-100">{assets_to_create.length}</span> new assets will be created
                        </span>
                    </div>
                    <div className="flex items-center">
                        <ArrowPathIcon className="h-5 w-5 text-theme-600 dark:text-theme-400 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-dark-400">
                            <span className="font-medium text-gray-900 dark:text-dark-100">{assets_to_update.length}</span> assets will be updated
                        </span>
                    </div>
                    <div className="flex items-center">
                        <MinusIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-dark-400">
                            <span className="font-medium text-gray-900 dark:text-dark-100">{assets_to_retire.length}</span> assets will be retired
                        </span>
                    </div>
                    <div className="flex items-center">
                        <BoltIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-dark-400">
                            <span className="font-medium text-gray-900 dark:text-dark-100">{pat_tests_to_create.length}</span> PAT tests will be processed
                        </span>
                    </div>
                </div>
            </div>

            {/* Changes Affecting Existing Data */}
            {(assets_to_retire.length > 0 || assets_to_update.length > 0 || kit_changes.some(change => change.action === 'reassign')) && (
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-dark-100 mb-3">
                        Changes to Existing Assets & Kits
                    </h4>
                    <div className="bg-gray-50 dark:bg-dark-700/50 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                            <thead className="bg-gray-100 dark:bg-dark-700">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">Asset</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">Change Type</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider">Current → New</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                                {/* Assets to Retire */}
                                {assets_to_retire.map((asset, index) => (
                                    <tr key={`retire-${index}`}>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-dark-100">{asset.alias}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                                Retire Asset
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-dark-400">
                                            Active → Retired
                                            {asset.current_kits.length > 0 && (
                                                <div className="text-xs text-gray-400 dark:text-dark-500">
                                                    Remove from kits: {asset.current_kits.join(', ')}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Assets to Update */}
                                {assets_to_update.map((asset, index) => (
                                    <tr key={`update-${index}`}>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-dark-100">
                                            {asset.current_data.alias || asset.new_data.alias}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                Update Asset
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-dark-400">
                                            {asset.current_data.status || 'Unknown'} → {asset.new_data.status}
                                            {asset.current_data.afs_id && (
                                                <div className="text-xs text-gray-400 dark:text-dark-500">
                                                    AFS ID: {asset.current_data.afs_id}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Kit Reassignments (only show reassignments, not new assignments) */}
                                {kit_changes.filter(change => change.action === 'reassign').map((change, index) => (
                                    <tr key={`kit-${index}`}>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-dark-100">{change.asset_alias}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                Kit Reassign
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-dark-400">
                                            {change.current_kit} → {change.target_kit}
                                            {!change.kit_exists && (
                                                <div className="text-xs text-gray-400 dark:text-dark-500">
                                                    New kit will be created
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                    onClick={onConfirm}
                    disabled={isExecuting}
                    className="inline-flex w-full justify-center rounded-md bg-theme-500 dark:bg-theme-600 hover:bg-theme-600 dark:hover:bg-theme-500 focus-visible:outline-theme-600 dark:focus-visible:outline-theme-500 text-white dark:text-dark-50 px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-theme-500 dark:disabled:hover:bg-theme-600"
                >
                    {isExecuting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Executing...
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="h-4 w-4 mr-2 mt-0.5" />
                            Confirm Import ({totalChanges} changes)
                        </>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isExecuting}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-dark-900 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:ring-dark-600 dark:hover:bg-dark-800 border-none border-transparent sm:col-start-1 sm:mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>

            {/* Warning if no changes */}
            {totalChanges === 0 && (
                <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-center">
                        <InformationCircleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" />
                        <p className="text-xs text-yellow-800 dark:text-yellow-400">
                            No changes detected. All data already exists in the system.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}