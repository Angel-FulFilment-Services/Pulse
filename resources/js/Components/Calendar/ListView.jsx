import { Fragment, useEffect, useState } from 'react';
import { ArrowDownCircleIcon, ArrowPathIcon, ArrowUpCircleIcon } from '@heroicons/react/20/solid';
import useFetchShifts from './useFetchShifts';
import useFetchTimesheets from './useFetchTimesheets';
import MenuComponent from './MenuComponent';
import UserItemFull from '../Account/UserItemFull';
import ShiftProgressBar from './ShiftProgressBar';
import { format, startOfDay, endOfDay, subDays, addDays, differenceInMinutes, isSameDay } from 'date-fns';

function groupShifts(shifts) {
  const grouped = {};

  // Sort shifts by shiftstart
  shifts.sort((a, b) => a.shiftstart - b.shiftstart);

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

  const startDate = format(startOfDay(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfDay(currentDate), 'yyyy-MM-dd');

  const { shifts, isLoading } = useFetchShifts(startDate, endDate);
  const { timesheets } = useFetchTimesheets(startDate, endDate);

  useEffect(() => {
    setGroupedShifts(groupShifts(shifts));
    if (shifts.length) {
      setIsTransitioning(false);
    }
  }, [shifts]);

  const handlePreviousTimeframe = () => {
    setIsTransitioning(true);
    setCurrentDate(subDays(currentDate, 1));
  };

  const handleNextTimeframe = () => {
    setIsTransitioning(true);
    setCurrentDate(addDays(currentDate, 1));
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-end border-b border-gray-200 gap-x-2 px-6 py-4">
        <MenuComponent
          currentView={viewType.charAt(0).toUpperCase() + viewType.slice(1)}
          setView={setView}
          currentDate={currentDate}
          handleNextTimeframe={handleNextTimeframe}
          handlePreviousTimeframe={handlePreviousTimeframe}
        />
      </header>
      <div className="isolate flex flex-auto flex-col overflow-auto bg-white transition-all duration-500 ease-in-out items-center">
        <div className="flex max-w-full flex-none flex-col sm:max-w-none w-full md:max-w-full">
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
                <table className="w-full text-left">
                  <tbody className="relative h-screen overflow-y-auto">
                    {Object.entries(groupedShifts).map(([date, shiftsByTime]) => (
                      <Fragment key={date}>
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
                              <tr className="text-sm leading-6 text-gray-900 sticky top-0">
                                <th scope="colgroup" colSpan={3} className="relative isolate py-2 font-semibold">
                                  {`${format(startDate, 'h:mm a').toLowerCase()} - ${format(endDate, 'h:mm a').toLowerCase()}`}
                                  <div className="absolute inset-y-0 right-full -z-10 w-screen border-b border-gray-200 bg-gray-50 shadow-sm" />
                                  <div className="absolute inset-y-0 left-0 -z-10 w-screen border-b border-gray-200 bg-gray-50 shadow-sm" />
                                </th>
                              </tr>
                              {shifts.map((shift) => {
                                return (
                                  <tr key={shift.id}>
                                    <td className="relative py-2 pr-6 w-96">
                                      <UserItemFull agent={{ hr_id: shift.hr_id, agent: shift.agent, job_title: shift.job_title }} shift={shift} timesheets={timesheets} />
                                      <div className="absolute bottom-0 right-full h-px w-screen bg-gray-100" />
                                      <div className="absolute bottom-0 left-0 h-px w-screen bg-gray-100" />
                                    </td>
                                    <td className="hidden py-4 sm:table-cell pr-6">
                                      <ShiftProgressBar shift={shift} timesheets={timesheets} />
                                    </td>
                                    <td className="py-2 text-right w-20">
                                      <div className="flex justify-end">
                                        <a
                                          href="#"
                                          className="text-sm font-medium leading-6 text-orange-600 hover:text-orange-500"
                                        >
                                          View<span className="hidden sm:inline"> shift</span>
                                          <span className="sr-only">
                                            , shift #{shift.hr_id}, {shift.agent}
                                          </span>
                                        </a>
                                      </div>
                                      <div className="mt-1 text-xs leading-5 text-gray-500">
                                        HR ID <span className="text-gray-900">#{shift.hr_id}</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
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
