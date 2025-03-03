import { Fragment, useEffect, useState } from 'react';
import { ArrowDownCircleIcon, ArrowPathIcon, ArrowUpCircleIcon } from '@heroicons/react/20/solid';
import useFetchShifts from './useFetchShifts';
import MenuComponent from './MenuComponent';
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, subWeeks, subDays, addWeeks, addDays } from 'date-fns';

const statuses = {
  Paid: 'text-green-700 bg-green-50 ring-green-600/20',
  Withdraw: 'text-gray-600 bg-gray-50 ring-gray-500/10',
  Overdue: 'text-red-700 bg-red-50 ring-red-600/10',
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function groupShifts(shifts) {
  const grouped = {};

  shifts.forEach((shift) => {
    const date = format(new Date(shift.shiftdate), 'yyyy-MM-dd');
    const key = `${shift.shiftstart}-${shift.shiftend}`;
    if (!grouped[date]) {
      grouped[date] = {};
    }
    if (!grouped[date][key]) {
      grouped[date][key] = [];
    }
    grouped[date][key].push(shift);
  });

  return grouped;
}

export default function ListView({ setView, viewType }) {
  const [groupedShifts, setGroupedShifts] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endDate = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { shifts, isLoading } = useFetchShifts(startDate, endDate);

  useEffect(() => {
    setGroupedShifts(groupShifts(shifts));
    if (shifts.length) {
      setIsTransitioning(false);
    }
  }, [shifts]);

  const handlePreviousTimeframe = () => {
    setIsTransitioning(true);
    setCurrentDate(viewType === 'Week' ? subWeeks(currentDate, 1) : subDays(currentDate, 1));
  };

  const handleNextTimeframe = () => {
    setIsTransitioning(true);
    setCurrentDate(viewType === 'Week' ? addWeeks(currentDate, 1) : addDays(currentDate, 1));
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-end border-b border-gray-200 gap-x-2 px-6 py-4">
        <MenuComponent currentView={viewType.charAt(0).toUpperCase() + viewType.slice(1)} setView={setView} currentDate={currentDate}/>
      </header>
      <div className="isolate flex flex-auto flex-col overflow-auto bg-white transition-all duration-500 ease-in-out">
        <div className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full"> 
          <div className="overflow-hidden border-t border-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
                <table className="w-full text-left">
                  <thead className="sr-only">
                    <tr>
                      <th>Time</th>
                      <th className="hidden sm:table-cell">Employee</th>
                      <th>More details</th>
                    </tr>
                  </thead>
                  <tbody className="relative">
                    {Object.entries(groupedShifts).map(([date, shiftsByTime]) => (
                      <Fragment key={date}>
                        <tr className="text-sm leading-6 text-gray-900 sticky top-0">
                          <th scope="colgroup" colSpan={3} className="relative isolate py-2 font-semibold">
                            <time dateTime={date}>{format(date, 'MMM dd, yyyy')}</time>
                            <div className="absolute inset-y-0 right-full -z-10 w-screen border-b border-gray-200 bg-gray-50" />
                            <div className="absolute inset-y-0 left-0 -z-10 w-screen border-b border-gray-200 bg-gray-50" />
                          </th>
                        </tr>
                        {Object.entries(shiftsByTime).map(([key, shifts]) => {
                          const [start, end] = key.split('-').map(Number);
                          const startHour = Math.floor(start / 100);
                          const startMinute = start % 100;
                          const endHour = Math.floor(end / 100);
                          const endMinute = end % 100;

                          // Create Date objects for start and end times
                          const startDate = new Date();
                          startDate.setHours(startHour, startMinute);

                          const endDate = new Date();
                          endDate.setHours(endHour, endMinute);

                          return (
                            <Fragment key={key}>
                              <tr className="text-sm leading-6 text-gray-900">
                                <th scope="colgroup" colSpan={3} className="relative isolate py-2 font-semibold">
                                  {`${format(startDate, 'h:mm a').toLowerCase()} - ${format(endDate, 'h:mm a').toLowerCase()}`}
                                  <div className="absolute inset-y-0 right-full -z-10 w-screen border-b border-gray-200 bg-gray-50" />
                                  <div className="absolute inset-y-0 left-0 -z-10 w-screen border-b border-gray-200 bg-gray-50" />
                                </th>
                              </tr>
                              {shifts.map((shift) => (
                                <tr key={shift.id}>
                                  <td className="relative py-5 pr-6">
                                    <div className="flex gap-x-6">
                                      <div className="flex-auto">
                                        <div className="flex items-start gap-x-3">
                                          <div className="text-sm font-medium leading-6 text-gray-900">{shift.agent}</div>
                                          <div
                                            className={classNames(
                                              statuses['Paid'],
                                              'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                                            )}
                                          >
                                            Shift
                                          </div>
                                        </div>
                                        <div className="mt-1 text-xs leading-5 text-gray-500">
                                          {shift.agent}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="absolute bottom-0 right-full h-px w-screen bg-gray-100" />
                                    <div className="absolute bottom-0 left-0 h-px w-screen bg-gray-100" />
                                  </td>
                                  <td className="hidden py-5 pr-6 sm:table-cell">
                                  </td>
                                  <td className="py-5 text-right">
                                    <div className="flex justify-end">
                                      <a
                                        href="#"
                                        className="text-sm font-medium leading-6 text-indigo-600 hover:text-indigo-500"
                                      >
                                        View<span className="hidden sm:inline"> shift</span>
                                        <span className="sr-only">
                                          , shift #{shift.hr_id}, {shift.agent}
                                        </span>
                                      </a>
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-gray-500">
                                      Shift <span className="text-gray-900">#{shift.hr_id}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </Fragment>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
