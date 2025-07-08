import React, { useState, useEffect } from 'react';
import useFetchExceptions from '../Fetches/Payroll/useFetchExceptions.jsx';
import { format, differenceInMinutes } from 'date-fns';
import { PlusIcon, ChevronDownIcon, BanknotesIcon, TrashIcon, PencilIcon  } from '@heroicons/react/24/outline';
import ButtonControl from '../Controls/ButtonControl.jsx';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';
import StackedList from '../Lists/StackedList.jsx';
import { toast } from 'react-toastify';
import PayrollExceptionsForm from './PayrollExceptionsForm.jsx';

export default function PayrollExceptions({ hrId, dateRange, handleClose }) {
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [selectedException, setSelectedException] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showExceptionsForm, setShowExceptionsForm] = useState(false); // State to toggle content
  
  const { exceptions, isLoaded } = useFetchExceptions(dateRange.startDate, dateRange.endDate, hrId);

  useEffect(() => {
    setIsTransitioning(false);
  }, [exceptions]);

  const handleRemoveEvent = async () => {
    try {
      if (!selectedException) {
        toast.error('You cannot remove this exception.', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
        return;
      }

      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

      const response = await fetch('/payroll/exports/exceptions/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ exceptionID: selectedException.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove the event');
      }

      window.dispatchEvent(new Event('refreshExceptions'));
      window.dispatchEvent(new Event('regenerate-report'));

      toast.success('Exception removed successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });

      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to remove this exception. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });

      setIsDialogOpen(false);
    }
  };

  return (
    <div className="px-4 py-3 h-full flex flex-col justify-start items-start divide-y divide-gray-200 dark:divide-dark-700">
      {showExceptionsForm ? (
        <PayrollExceptionsForm
          hrId={hrId}
          onCancel={() => {
            setSelectedException(null);
            setShowExceptionsForm(false);
          }}
          initialData={selectedException}
          dateRange={dateRange}
        />
      ) : (
        <>
          <div className="flex gap-x-2 items-center pb-2 justify-between w-full">
            <div className="gap-y-1 flex flex-col">
              <h3 className="text-base font-semibold text-gray-900 dark:text-dark-100">Payroll Exceptions</h3>
              <p className="max-w-2xl text-sm text-gray-500 dark:text-dark-400">
                Add any payroll exceptions for this month.
              </p>
            </div>
            <div className="flex gap-x-4 items-center">
              <ButtonControl
                id="add_button"
                Icon={PlusIcon}
                className="w-7 h-7"
                iconClass="w-7 h-7 text-theme-500 hover:text-theme-600 dark:text-theme-600 dark:hover:text-theme-500 transition-all ease-in-out"
                onClick={() => {
                  setSelectedException(null);
                  setShowExceptionsForm(true);
                }}
              />
            </div>
          </div>

          <div className={`w-full h-full isolate max-h-full overflow-auto flex flex-col justify-between divide-y divide-gray-200 dark:divide-dark-700 pb-2`}>
              <div className={`w-full h-full overflow-auto flex flex-col isolate`}>
                {!isLoaded
                ? (
                    <div className="flex items-center justify-center h-full w-full">
                      <svg
                        className="inline w-16 h-16 animate-spin text-gray-200 fill-theme-500 dark:fill-theme-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor"
                        />
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentFill"
                        />
                      </svg>
                    </div>
                )
                : (() => {
                    const data = exceptions.map((record) => ({
                      date: record.date
                        ? format(new Date(record.date), 'dd MMMM, yyyy')
                        : '-',
                      startDate:
                        record.startdate
                          ? format(new Date(record.startdate), 'dd MMMM, yyyy')
                          : '',
                      endDate:
                        record.enddate
                          ? format(new Date(record.enddate), 'dd MMMM, yyyy')
                          : '',
                      type: record.type || 'N/A',
                      notes: record.notes,
                      logged: record.created_at
                        ? format(new Date(record.created_at), 'dd MMMM, yyyy h:mm a')
                        : '-',
                      loggedby: record.logged_by,
                      amount: record.amount,
                      days: record.days,
                      users: [{ userId: record.user_id, name: record.user_name }, { userId: record.created_by_user_id, name: record.logged_by }],
                      id: record.id,
                    }));

                    const sortedData = data.sort(
                      (a, b) => new Date(a.startDate) - new Date(b.startDate)
                    );

                    return sortedData.length > 0 ? (
                      <>
                        <StackedList
                          data={sortedData}
                          allowManagement={true}
                          placeholderCount={5}
                          onRemove={(row) => {
                            setSelectedException(row);
                            setIsDialogOpen(true);
                          }}
                          onEdit={(row) => {
                            setSelectedException(row);
                            setShowExceptionsForm(true);
                          }}
                          renderDescription={(row) => (
                            <>
                              <p>Logged By: {row.loggedby}</p>
                              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                <circle cx={1} cy={1} r={1} />
                              </svg>
                              <p>
                                { row.days ? "Quantity of Days: " : "Amount of Pay (£): " }
                                { row.days || row.amount || 'N/A' }
                              </p>
                              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                <circle cx={1} cy={1} r={1} />
                              </svg>
                              <p className="text-xs text-gray-500 dark:text-dark-400">
                                {row.logged}
                              </p>
                            </>
                          )}
                          renderExpandableContent={(row) => (
                            <>
                              <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-dark-100">
                                Payroll Month:
                              </p>
                              <p className="text-xs text-gray-500 dark:text-dark-400">
                                { row.startDate && row.endDate
                                  ? ` (${row.startDate} - ${row.endDate})`
                                  : ''
                                }
                              </p>
                              {row.notes && (
                                <div className="mt-2 text-xs text-gray-700 dark:text-dark-200">
                                  <span className="font-semibold">Notes: </span>
                                  {row.notes}
                                </div>
                              )}
                            </>
                          )}
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gray-50 ring-1 ring-gray-200/50 dark:ring-dark-700/75 dark:bg-dark-800 mb-2">
                          <BanknotesIcon className="w-12 h-12 text-theme-500 dark:text-theme-600" />
                        </div>
                        <p className="py-2 text-md font-semibold text-gray-900 dark:text-dark-100">No payroll exceptions available.</p>
                        <p className="text-sm text-gray-500 dark:text-dark-400">
                          You can add exceptions by clicking the "Add" button above.
                        </p>
                      </div>
                    );
                  })()}
              </div>
              <div className="mt-2 flex items-center justify-end gap-x-6 w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-4 px-2">
                <button
                    type="button"
                    className="text-sm font-semibold text-gray-900 dark:text-dark-100"
                    onClick={handleClose}
                >
                    Done
                </button>
              </div>
          </div>

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            title="Confirm Removal"
            description="Are you sure you want to remove this payroll exception? This action cannot be undone."
            isYes={handleRemoveEvent}
            type="question"
            yesText="Remove"
            cancelText="Cancel"
          />
        </>
      )}
    </div>
  );
}