import React from 'react';
import DashboardCard from '../DashboardCard.jsx';
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const MyDocumentsWidget = ({ employee }) => {
    const documents = [
        {
            id: 1,
            name: 'Employment Contract',
            type: 'contract',
            size: '2.4 MB',
            lastModified: '2025-01-15',
            status: 'signed'
        },
        {
            id: 2,
            name: 'Employee Handbook',
            type: 'policy',
            size: '5.7 MB',
            lastModified: '2025-09-01',
            status: 'updated'
        },
        {
            id: 3,
            name: 'September Payslip',
            type: 'payslip',
            size: '156 KB',
            lastModified: '2025-09-20',
            status: 'new'
        },
        {
            id: 4,
            name: 'Holiday Request Form',
            type: 'form',
            size: '89 KB',
            lastModified: '2025-08-15',
            status: 'template'
        }
    ];

    const getDocumentIcon = (type) => {
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            signed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            new: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            template: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <DashboardCard 
            title="My Documents"
            headerAction={
                <button className="flex items-center space-x-1 text-theme-600 hover:text-theme-700 text-sm">
                    <span>View All</span>
                </button>
            }
        >
            <div className="space-y-3">
                {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg cursor-pointer group">
                        <div className="flex-shrink-0">
                            {getDocumentIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                                    {doc.name}
                                </p>
                                {getStatusBadge(doc.status)}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-dark-400">
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span>Modified {new Date(doc.lastModified).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200">
                                <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardCard>
    );
};

export default MyDocumentsWidget;
