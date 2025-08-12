import React, { useState, useEffect } from 'react';
import useFetchTechnicalSupport from '../Fetches/Assets/useFetchTechnicalSupport.jsx';
import useFetchKit from '../Fetches/Assets/useFetchKit.jsx';
import { format, differenceInMinutes } from 'date-fns';
import ShiftProgressBar from '../Calendar/ShiftProgressBar.jsx';
import DateInput from '../Forms/DateInput.jsx';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ButtonControl from '../Controls/ButtonControl.jsx';
import ConfirmationDialog from '../Dialogs/ConfirmationDialog';
import StackedList from '../Lists/StackedList.jsx';
import SupportForm from '../Assets/Support/SupportForm.jsx';
import { toast } from 'react-toastify';
import { hasPermission } from '../../Utils/Permissions.jsx';
import PopoverFlyout from '../Flyouts/PopoverFlyout.jsx';

export default function UserFlyoutContentTechnicalSupport({ hrId, handleDateChange, dateRange }) {
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false); // State to toggle content
  
  const { events } = useFetchTechnicalSupport(dateRange.startDate, dateRange.endDate, hrId);
  const { kit, responses } = useFetchKit(dateRange.startDate, dateRange.endDate, hrId);

  const allowSupportManagement = hasPermission("pulse_manage_technical_support");

  useEffect(() => {
    setIsTransitioning(false);
  }, [events]);

  const handleRemoveEvent = async () => {
    try {
      if (!selectedEvent || !allowSupportManagement) {
        toast.error('You cannot remove this event.', {
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

      const response = await fetch('/asset-management/support/events/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ eventId: selectedEvent.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove the event');
      }

      window.dispatchEvent(new Event('refreshEvents'));

      toast.success('Event removed successfully!', {
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
      toast.error('Failed to remove the event. Please try again.', {
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

  const handleUpdateResolved = async (row) => {
    try {
      if (!allowSupportManagement) {
        toast.error('You cannot update this event.', {
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

      const response = await fetch('/asset-management/support/events/resolved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ eventId: row.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update the event');
      }

      window.dispatchEvent(new Event('refreshEvents'));

      toast.success('Event updated successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    } catch (error) {
      toast.error('Failed to update the event. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    }
  };

  return (
    <div className="px-4 py-3 h-full flex flex-col justify-start items-start divide-y divide-gray-200 dark:divide-dark-700">
      {showSupportForm ? (
        <SupportForm
          hrId={hrId}
          allowSupportManagement={allowSupportManagement}
          onCancel={() => {
            setSelectedEvent(null);
            setShowSupportForm(false);
          }}
          initialData={selectedEvent}
        />
      ) : (
        <>
          <div className="flex gap-x-2 items-center pb-2 justify-between w-full">
            <div className="gap-y-1 flex flex-col">
              <h3 className="text-base font-semibold text-gray-900 dark:text-dark-100">Technical Support</h3>
              <p className="max-w-2xl text-sm text-gray-500 dark:text-dark-400">
                Technical support for the period of{' '}
                {format(new Date(dateRange.startDate), 'dd MMMM, yyyy')} -{' '}
                {format(new Date(dateRange.endDate), 'dd MMMM, yyyy')}
              </p>
            </div>
            <div className="flex gap-x-4 items-center">
              {allowSupportManagement && (
                <ButtonControl
                  id="add_button"
                  Icon={PlusIcon}
                  className="w-7 h-7"
                  iconClassName="w-7 h-7 text-theme-500 hover:text-theme-600 dark:text-theme-600 dark:hover:text-theme-500 transition-all ease-in-out"
                  onClick={() => {
                    setSelectedEvent(null);
                    setShowSupportForm(true);
                  }}
                />
              )}
              <DateInput
                startDateId={'startDate'}
                endDateId={'endDate'}
                label={null}
                showShortcuts={true}
                placeholder={'Date'}
                dateRange={true}
                minDate={new Date().setFullYear(new Date().getFullYear() - 100)}
                maxDate={new Date().setFullYear(new Date().getFullYear() + 100)}
                currentState={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                onDateChange={handleDateChange}
              />
            </div>
          </div>

          <div className={`w-full h-full isolate max-h-full overflow-auto flex flex-col justify-between divide-y divide-gray-200 dark:divide-dark-700 pb-2`}>
              <div className={`w-full h-full max-h-96 overflow-auto flex flex-col isolate`}>
                {isTransitioning
                  ? Array.from({ length: 5 }).map((_, subRowIndex) => (
                    <></>
                  ))
                : (() => {
                    const data = events.map((record) => ({
                      date: record.on_time
                        ? format(new Date(record.date), 'dd MMMM, yyyy')
                        : '-',
                      startedTime:
                        record.on_time
                          ? format(new Date(record.on_time), 'h:mm a')
                          : '',
                      endedTime:
                        record.off_time
                          ? format(new Date(record.off_time), 'h:mm a')
                          : '',
                      started: record.on_time 
                        ? { hour: format(new Date(record.on_time), 'h'), minute: format(new Date(record.on_time), 'mm') }
                        : { hour: '', minute: '' },
                      ended: record.off_time
                        ? {hour: format(new Date(record.off_time), 'h'), minute: format(new Date(record.off_time), 'mm')}
                        : {hour: '', minute: ''},
                      category: record.category || record.type || 'N/A',
                      on_time: record.on_time,
                      notes: record.notes,
                      duration:
                        record.off_time
                          ? `${Math.floor(
                              differenceInMinutes(
                                new Date(record.off_time),
                                new Date(record.on_time)
                              ) / 60
                            )}h ${differenceInMinutes(
                              new Date(record.off_time),
                              new Date(record.on_time)
                            ) % 60}m`
                          : '',
                      logged: record.created_at
                        ? format(new Date(record.created_at), 'dd MMMM, yyyy h:mm a')
                        : '-',
                      loggedby: record.logged_by,
                      users: [{ userId: record.user_id, name: record.user_name }, { userId: record.created_by_user_id, name: record.logged_by }],
                      resolved: record.resolved,
                      id: record.id,
                      attachments: record.attachments,
                    }));

                    const sortedData = data.sort(
                      (a, b) => new Date(a.on_time) - new Date(b.on_time)
                    );

                    return sortedData.length > 0 ? (
                      <StackedList
                        data={sortedData}
                        allowManagement={allowSupportManagement}
                        onRemove={(row) => {
                          setSelectedEvent(row);
                          setIsDialogOpen(true);
                        }}
                        onEdit={(row) => {
                          setSelectedEvent(row);
                          setShowSupportForm(true);
                        }}
                        actions={[
                          {
                            icon: (row) => (!row.resolved ? <CheckIcon className="h-5 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out" /> : <XMarkIcon className="h-5 w-6 text-theme-600 hover:text-theme-700  dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out" />),
                            onClick: (row) => {
                              handleUpdateResolved(row);
                            },
                            tooltip: 'Toggle Resolved',
                          },
                        ]}
                        renderDescription={(row) => (
                          <>
                            <p>Time Spent: {row.duration}</p>
                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                              <circle cx={1} cy={1} r={1} />
                            </svg>
                            <p>Technician: {row.loggedby}</p>
                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                              <circle cx={1} cy={1} r={1} />
                            </svg>
                            <p>
                              <time dateTime={row.logged}>{row.logged}</time>
                            </p>
                          </>
                        )}
                        renderExpandableContent={(row) => (
                          <>
                            <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-dark-100">
                              {row.date}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-400">
                              {row.startedTime} - {row.endedTime}
                            </p>
                            {row.notes && (
                              <div className="mt-2 text-xs text-gray-700 dark:text-dark-200">
                                <span className="font-semibold">Notes: </span>
                                {row.notes}
                              </div>
                            )}
                            {row.attachments && row.attachments.length > 0 && (
                              <div className="mt-3 text-xs text-gray-700 dark:text-dark-200">
                                <span className="font-semibold pb-2">Attachments: </span>
                                <ul className="list-disc list-inside">
                                  {row.attachments.map((attachment, index) => (
                                    <li key={index}>
                                      <a
                                        href={attachment.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-theme-500 dark:text-theme-600 hover:underline"
                                      >
                                        {attachment.original_name || 'Download'}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      />
                    ) : (
                      <p className="py-2 text-sm text-gray-500 dark:text-dark-400">No support log events available.</p>
                    );
                  })()}
              </div>
              
              <div className="flex w-full mt-4">
                {/* Kit Items Section */}
                <div className="w-1/2 pr-2">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-dark-100 pt-4">
                    {kit && kit.length > 0 ? 'Kit: ' + kit[1].kit_alias || 'Kit Items' : 'Kit Items'}
                  </h4>
                  <p className="max-w-2xl text-sm text-gray-500 dark:text-dark-400">
                    Currently assigned equipment for this employee.
                  </p>
                  <ul className={`mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 bg-gray-50 dark:bg-dark-800 rounded-md border min-h-24 h-72 max-h-72 border-gray-200 dark:border-dark-700 p-4`}>
                    {kit && kit.length > 0 ? (
                      kit.map((item, index) => (
                        <li
                          key={index}
                          className="border border-gray-200 rounded-md p-3 shadow-sm bg-white dark:bg-dark-900 dark:border-dark-700"
                        >
                          <p className="text-xs font-semibold text-gray-900 dark:text-dark-100">
                            Alias: {item.alias || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-dark-400">Category: {item.type || 'N/A'}</p>
                          <p className="text-xs text-gray-500 dark:text-dark-400">Asset ID: {item.afs_id || 'N/A'}</p>
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-dark-400">No kit items available.</p>
                    )}
                  </ul>
                </div>

                {/* Blank Section */}
                <div className="w-1/2 pl-2">
                  {/* Leave this section blank for now */}
                  <h4 className="text-base font-semibold text-gray-900 dark:text-dark-100 pt-4">
                    Latency
                  </h4>
                  <p className="max-w-2xl text-sm text-gray-500 dark:text-dark-400">
                    Automated latency test results for the period of{' '}
                    {format(new Date(dateRange.startDate), 'dd MMMM, yyyy')} -{' '}
                    {format(new Date(dateRange.endDate), 'dd MMMM, yyyy')}
                  </p>
                  <div className={`overflow-x-auto rounded-md border border-gray-200 dark:border-dark-700 mt-2 min-h-24 max-h-72 overflow-y-auto h-72`}>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700 text-sm border-separate border-spacing-0">
                      <thead className="bg-gray-50 dark:bg-dark-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200">Date/Time</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200">IP</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200">Min (ms)</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200">Max (ms)</th>
                          <PopoverFlyout
                              placement='top'
                              placementOffset={5}
                              element="th"
                              className={`px-3 py-2 text-right font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200`}
                              content={
                                <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300 mr-1 cursor-default">  
                                  <p className="text-sm text-gray-900 dark:text-dark-100 font-normal">Optimum latency is less than 100ms, a maximum latency of 150ms is acceptable.</p>
                                </div>
                              }>
                                Avg (ms)
                            </PopoverFlyout>
                            <PopoverFlyout
                              placement='top'
                              placementOffset={5}
                              element="th"
                              className={`px-3 py-2 text-right font-semibold text-gray-700 dark:text-dark-200 dark:border-dark-700 border-b border-gray-200`}
                              content={
                                <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300 mr-1 cursor-default">  
                                  <p className="text-sm text-gray-900 dark:text-dark-100 font-normal">A lost rate of greater than 0% is not acceptable.</p>
                                </div>
                              }>
                                Lost (%)
                            </PopoverFlyout>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-dark-900">
                      {responses && responses.length > 0 ? (
                        responses.map((row, idx) => {
                          // Parse values as numbers for comparison
                          const avg = Number(row.avg);
                          const lost = Number(row.lost_rate);

                          let highlightClass = "";
                          let popoverContent = "";
                          let popoverEnabled = false;
                          if (avg > 150 || lost > 0) {
                            highlightClass = "bg-red-100 text-red-800 dark:bg-red-400 dark:text-red-200 dark:bg-opacity-25";
                            popoverContent = "This latency test has failed. (Avg. Response > 150ms or Lost > 0%)";
                            popoverEnabled = true;
                          } else if (avg > 100) {
                            highlightClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-300 dark:text-yellow-200 dark:bg-opacity-25";
                            popoverContent = "This latency test is borderline. (Avg. Response > 100ms)";
                            popoverEnabled = true;
                          }else {
                            highlightClass = "odd:bg-gray-50 dark:odd:bg-dark-800 dark:text-dark-200 text-gray-800";
                          }

                          return (
                            <PopoverFlyout
                              placement='top'
                              placementOffset={5}
                              element="tr"
                              className={`${highlightClass}`}
                              key={idx}
                              enabled={popoverEnabled}
                              content={
                                <div className="w-full mx-auto p-2 flex flex-col space-y-1 divide-y divide-gray-300 mr-1 cursor-default">  
                                  <p className="text-sm text-gray-900 dark:text-dark-100">{popoverContent}</p>
                                </div>
                              }>
                                <td className="px-3 py-2 whitespace-nowrap border-b border-gray-100 dark:border-dark-700">{format(new Date(row.datetime), 'dd/MM/yyyy HH:mm:ss')}</td>
                                <td className="px-3 py-2 whitespace-nowrap border-b border-gray-100 dark:border-dark-700">{row.ip}</td>
                                <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">{row.min}</td>
                                <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">{row.max}</td>
                                <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">{row.avg}</td>
                                <td className="px-3 py-2 text-right border-b border-gray-100 dark:border-dark-700">{row.lost_rate * 100}%</td>
                            </PopoverFlyout>
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
          </div>

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Confirm Removal"
            description="Are you sure you want to remove this support event? This action cannot be undone."
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