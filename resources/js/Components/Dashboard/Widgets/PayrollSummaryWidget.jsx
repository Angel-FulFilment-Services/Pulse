import React from 'react';
import { BanknotesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const PayrollSummaryWidget = ({ employee }) => {
    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30">
            {/* Header with icon */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                        💰 Payroll Summary
                    </h3>
                </div>
            </div>

            {/* Main payday info */}
            <div className="bg-white/60 dark:bg-dark-900/40 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/50 dark:border-dark-700/50">
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
                <div className="text-center p-3 bg-white/40 dark:bg-dark-900/30 rounded-lg">
                    <p className="text-xl font-bold text-gray-900 dark:text-dark-100">£28,500</p>
                    <p className="text-xs text-gray-600 dark:text-dark-300">YTD Earnings</p>
                </div>
                <div className="text-center p-3 bg-white/40 dark:bg-dark-900/30 rounded-lg">
                    <p className="text-xl font-bold text-gray-900 dark:text-dark-100">£5,700</p>
                    <p className="text-xs text-gray-600 dark:text-dark-300">YTD Tax</p>
                </div>
            </div>
        </div>
    );
};

export default PayrollSummaryWidget;
