import React, { useState, useEffect, useRef } from 'react';
import PayrollHeader from '../../Components/Payroll/PayrollHeader.jsx';
import '../../Components/Reporting/ReportingStyles.css';
import StackedList from '../../Components/Lists/StackedList.jsx';
import payrollImportConfig from '../../Config/PayrollImportConfig.jsx';
import ProgressDialog from '../../Components/Dialogs/ProgressDialog.jsx';
import { toast } from 'react-toastify';
import useFetchImports from '../../Components/Fetches/Payroll/useFetchImports.jsx';

const Payroll = ({ tabs, handleTabClick, activeTab }) => {
    const [progress, setProgress] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [imports, setImports] = useState(
        payrollImportConfig.map((imp) => ({
            id: imp.id,
            value: imp.id,
            displayValue: imp.label,
        })).sort((a, b) => a.displayValue.localeCompare(b.displayValue))
    );
    const [imp, setImp] = useState(imports[0]);
    const fileInputRef = useRef(null);

    const [logs, setLogs] = useState([]);
    const { imports: data } = useFetchImports();
    
    useEffect(() => {
        if (data && data.length > 0) {
            const logs = data.map(log => {
                let notes = [];
                try {
                    notes = JSON.parse(log.notes);
                } catch (e) {
                    notes = [];
                }
                return { ...log, notes };
            });
            setLogs(logs);
        } else {
            setLogs([]);
        }
    }, [data]);

    const handleImportChange = (report) => {
        setImp(payrollImportConfig.find((r) => r.id === report.value));
    };

    const handleImport = () => {
        // Trigger the hidden file input
        if (fileInputRef.current) {
            fileInputRef.current.value = null; // Reset file input
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file.name.toLowerCase().endsWith('.csv')) {
            toast.error('Invalid file type. Please select a CSV file.', {
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

        setIsDialogOpen(true);
        setProgress(0);
        const importHandler = payrollImportConfig.find((r) => r.id === imp.id)?.import;
        await importHandler(file, null, setProgress, setIsDialogOpen);
        setProgress(100);
        setTimeout(() => setIsDialogOpen(false), 800);
    };

    return (
        <>
            <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <div id="reporting_header" className="z-30">
                <div className="z-30">
                    <PayrollHeader
                        tabs={tabs}
                        selectPlaceholder="Select import type"
                        activeTab={activeTab}
                        handleTabClick={handleTabClick}
                        handleReportChange={handleImportChange}
                        handleImport={handleImport}
                        reports={imports}
                        report={imp}
                    />
                </div>
            </div>
            <div className="py-2 h-full flex flex-col">
                <div className="gap-y-1 flex flex-col py-2 pb-4 border-b border-gray-200 dark:border-dark-700 px-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-dark-100">Import History</h3>
                    <p className="max-w-full text-sm text-gray-500 dark:text-dark-400">
                        View the history of payroll imports. You can see the status of each import, including whether it was completed successfully or if there were any issues.
                    </p>
                </div>
                <div className="h-full px-6 py-2 overflow-y-auto isolate mb-44">
                    <StackedList 
                        data={(logs ?? []).map((log) => ({
                            title: log.action,
                            description: `Imported by ${log.user} on ${new Date(log.created_at).toLocaleDateString()} at ${new Date(log.created_at).toLocaleTimeString()}`,
                            users: [{name: log.user, userId: log.user_id}],
                            resolved: !log.notes.errors || log.notes.errors.length === 0,
                            notes: log.notes,
                        }))}
                        allowManagement={false}
                        allowExpand={true}
                        renderExpandableContent={(row) => (
                          <>
                            <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-dark-100">
                              {row.created_at}
                            </p>
                            {row.notes && (
                              <div className="mt-2 text-xs text-gray-700 dark:text-dark-200 flex flex-col gap-y-1">
                                <span className="font-semibold">Details: </span>
                                {row.notes.imported ? <span> Imported {row.notes.imported} records successfully.</span> : null}
                                {row.notes.updated ? <span> Updated {row.notes.updated} records successfully.</span> : null}

                                <span className="font-semibold">Errors: </span>
                                <ul className="list-decimal list-inside">
                                    {row.notes.errors && row.notes.errors.length > 0 && (
                                        row.notes.errors.map((err, i) => (
                                            <li key={i} className="text-red-600 dark:text-red-400">
                                               {err}
                                            </li>
                                        ))
                                    )}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                    />
                </div>
            </div>
            <ProgressDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                progress={progress}
                flavourTexts={[
                    "Cleaning Dirty Sage File . . .",
                    "Hiding Senior Managers . . .",
                    "Processing CSV . . .",
                    "Finding Employees . . .",
                ]}
                title="Importing Sage Payroll Import File"
                description="Please wait while we process your CSV import."
            />
        </>
    );
};

export default Payroll;