import React from 'react';
import { BanknotesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const PayrollSummaryWidget = ({ employee }) => {
    return (
        <div>
            {/* Main payday info */}
            <div className="border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-dark-300">
                            Next Payday
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                            October 31, 2025
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-dark-100">
                            £2,850
                        </p>
                        <div className="flex items-center space-x-1 text-green-600">
                            <ArrowTrendingUpIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">+5.2%</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-dark-700 text-center p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                    <p className="text-xl font-bold text-gray-900 dark:text-dark-100">£28,500</p>
                    <p className="text-xs text-gray-600 dark:text-dark-300">YTD Earnings</p>
                </div>
                <div className="border border-gray-200 dark:border-dark-700 text-center p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                    <p className="text-xl font-bold text-gray-900 dark:text-dark-100">£5,700</p>
                    <p className="text-xs text-gray-600 dark:text-dark-300">YTD Tax</p>
                </div>
            </div>
        </div>
    );
};

export default PayrollSummaryWidget;
