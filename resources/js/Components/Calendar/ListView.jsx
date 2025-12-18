import { Fragment, useEffect, useState, useMemo, useRef } from 'react';
import { format, startOfDay, endOfDay, subDays, addDays, set } from 'date-fns';
import { groupShifts, getStatus } from '../../Utils/Rota';
import { useUserStates } from '../Context/ActiveStateContext';
import { UtilisationTargetsProvider } from '../Context/UtilisationTargetsContext.jsx';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import useFetchShifts from '../Fetches/Rota/useFetchShifts';
import useFetchTimesheets from '../Fetches/Rota/useFetchTimesheets';
import useFetchEvents from '../Fetches/Rota/useFetchEvents';
import useFetchCalls from '../Fetches/Rota/useFetchCalls';
import MenuComponent from './MenuComponent';
import FilterControl from '../Controls/FilterControl';
import UserItemFull from '../User/UserItemFull';
import ShiftProgressBar from './ShiftProgressBar';
import DrawerOverlay from '../Overlays/DrawerOverlay';
import ShiftView from './ShiftView';
import './CalendarStyles.css';


export default function ListView({ setView, viewType }) {
  const [search, setSearch] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadedItems, setLoadedItems] = useState(0); // Track how many items are loaded
  const [selectedShift, setSelectedShift] = useState(null);
  const container = useRef(null);

  const startDate = format(startOfDay(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfDay(currentDate), 'yyyy-MM-dd');

  const { shifts, isLoading: isLoadingShifts, isLoaded: isLoadedShifts } = useFetchShifts(startDate, endDate);
  const { timesheets, isLoading: isLoadingTimesheets, isLoaded: isLoadedTimesheets } = useFetchTimesheets(startDate, endDate);
  const { events, isLoading: isLoadingEvents, isLoaded: isLoadedEvents } = useFetchEvents(startDate, endDate);
  const { calls, isLoading: isLoadingCalls, isLoaded: isLoadedCalls } = useFetchCalls(startDate, endDate);

  const [filters, setFilters] = useState(() => {
    return [
      {
        id: 'job_title',
        name: 'Job Title',
        expression: (shift, userStates) => (filterValue) => {
          const user = userStates[shift.hr_id];
          return user?.job_title === filterValue;
        },
        options: [
          {value: 'Team Manager', label: 'Team Manager', checked: false},
          {value: 'Duty Manager', label: 'Duty Manager', checked: false},
          {value: 'Contact Centre Agent', label: 'Contact Centre Agent', checked: false},
          {value: 'Housekeeping', label: 'Housekeeping', checked: false},
          {value: 'Quality Control Officer', label: 'Quality Control Officer', checked: false}
        ]
      },
      {
        id: 'status',
        name: 'Status',
        expression: (shift, userStates, timesheets, events) => (filterValue) => {
          const { status } = getStatus(shift, timesheets, events);
          return status === filterValue;
        },
        options: [
          { value: 'Absent', label: 'Absent', checked: false },
          { value: 'Attended', label: 'Attended', checked: false },
          { value: 'AWOL', label: 'AWOL', checked: false },
          { value: 'Late', label: 'Late', checked: false },
          { value: 'Reduced', label: 'Reduced', checked: false },
          { value: 'Sick', label: 'Sick', checked: false },
          { value: 'Surplus', label: 'Surplus', checked: false },
        ].sort((a, b) => a.label.localeCompare(b.label)),
      },
      {
        id: 'shiftcat',
        name: 'Shift Category',
        expression: (shift, userStates) => (filterValue) => {
          return shift.shiftcat === filterValue;
        },
        options: (() => {
          const seen = new Set();

          if(!shifts || shifts.length === 0) {
            return [
              {
                value: 'All',
                label: 'All',
                checked: false,
              }
            ];
          }

          return shifts
            .filter(item => {
              if (!item.shiftcat || seen.has(item.shiftcat)) return false;
              seen.add(item.shiftcat);
              return true;
            })
            .map(item => ({
              value: item.shiftcat,
              label: item.shiftcat,
              checked: false,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
        })(),
      },
      {
        id: 'shiftloc',
        name: 'Shift Location',
        expression: (shift, userStates) => (filterValue) => {
          return shift.shiftloc === filterValue;
        },
        options: (() => {
          const seen = new Set();

          if(!shifts || shifts.length === 0) {
            return [
              {
                value: 'All',
                label: 'All',
                checked: false,
              }
            ];
          }

          return shifts
            .filter(item => {
              if (!item.shiftloc || seen.has(item.shiftloc)) return false;
              seen.add(item.shiftloc);
              return true;
            })
            .map(item => ({
              value: item.shiftloc,
              label: item.shiftloc,
              checked: false,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
        })(),
      }
    ];
  });
  
  const { userStates } = useUserStates();
  const groupedShifts = useMemo(() => {
    return groupShifts(shifts, false, (shift) => `${shift.shiftstart}`, timesheets, events, userStates, filters, search);
  }, [shifts, timesheets, filters, search]);
  
  // Recalculate shift categories when shifts change
  useEffect(() => {
    if (shifts && shifts.length > 0) {
      setFilters(prevFilters => {
        return prevFilters.map(filter => {
          switch (filter.id) {
            case 'shiftcat':
                const seen = new Set();
                const existingChecked = new Set(
                  filter.options.filter(opt => opt.checked).map(opt => opt.value)
                );
                
                const newOptions = shifts
                  .filter(item => {
                    if (!item.shiftcat || seen.has(item.shiftcat)) return false;
                    seen.add(item.shiftcat);
                    return true;
                  })
                  .map(item => ({
                    value: item.shiftcat,
                    label: item.shiftcat,
                    checked: existingChecked.has(item.shiftcat),
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
                
                return { ...filter, options: newOptions };              
            case 'shiftloc':
                const seenLoc = new Set();
                const existingCheckedLoc = new Set(
                  filter.options.filter(opt => opt.checked).map(opt => opt.value)
                );
                
                const newOptionsLoc = shifts
                  .filter(item => {
                    if (!item.shiftloc || seenLoc.has(item.shiftloc)) return false;
                    seenLoc.add(item.shiftloc);
                    return true;
                  })
                  .map(item => ({
                    value: item.shiftloc,
                    label: item.shiftloc,
                    checked: existingCheckedLoc.has(item.shiftloc),
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
                
                return { ...filter, options: newOptionsLoc };
            default:
              break;
          }

          return filter;
        });
      });
    }
  }, [shifts]);
  
  useEffect(() => {
    if (shifts.length) {
      setIsTransitioning(false);
      setLoadedItems(0); // Reset loaded items
    }
  }, [shifts]);
  
  useEffect(() => {    
    if (isLoadedShifts && isLoadedTimesheets && isLoadedEvents && groupedShifts[startDate]) {
      let frameId;
      const updateLoadedItems = () => {
        setLoadedItems((prev) => {
          if (prev >= Object.values(groupedShifts[startDate]).reduce((acc, shiftsByTime) => acc + shiftsByTime.length, 0)) {
            cancelAnimationFrame(frameId);
            return prev;
          }
          return prev + 1;
        });
        frameId = requestAnimationFrame(updateLoadedItems);
      };
      frameId = requestAnimationFrame(updateLoadedItems);
      return () => cancelAnimationFrame(frameId);
    }
  }, [isLoadedShifts, isLoadedTimesheets, isLoadedEvents, groupedShifts]);

  useEffect(() => {
    if (selectedShift) {
      // Find the updated shift data
      const updatedShift = shifts.find((shift) => shift.unq_id === selectedShift.shift.unq_id);
  
      // Find the updated timesheets and events for the selected shift
      const updatedTimesheets = timesheets.filter((timesheet) => timesheet.hr_id == selectedShift.shift.hr_id);
      const updatedEvents = events.filter((event) => event.hr_id == selectedShift.shift.hr_id);
  
      // Update the selectedShift state with the latest data
      setSelectedShift({
        shift: updatedShift || selectedShift.shift, // Fallback to the current shift if not found
        timesheets: updatedTimesheets,
        events: updatedEvents,
      });
    }
  }, [shifts, timesheets, events]);

  const handlePreviousTimeframe = () => {
    setIsTransitioning(true);
    setCurrentDate(subDays(currentDate, 1));
    container.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextTimeframe = () => {
    setIsTransitioning(true);
    setCurrentDate(addDays(currentDate, 1));
    container.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (filter) => {
    const updatedFilters = filters.map((section) => {
      if (section.id === filter.id) {
        return {
          ...section,
          options: section.options.map((option) =>
            option.value === filter.value ? { ...option, checked: filter.checked } : option
          ),
        };
      }
      return section;
    });
    // Update the filters state or perform any necessary actions with the updated filters
    setFilters(updatedFilters);
  }

  const clearFilters = () => {
    const updatedFilters = filters.map((section) => ({
      ...section,
      options: section.options.map((option) => ({ ...option, checked: false })),
    }));
    setFilters(updatedFilters);
  };

  return (
    <UtilisationTargetsProvider>
      <div className="flex h-full flex-col pb-16 sm:pb-0">
      <header className="flex flex-col items-center justify-end border-b border-gray-200 dark:border-dark-700 gap-x-2 space-y-2 px-6 py-4 divide-gray-200 dark:divide-dark-700">
        <MenuComponent
          currentView={viewType.charAt(0).toUpperCase() + viewType.slice(1)}
          setView={setView}
          search={search}
          setSearch={setSearch}
          currentDate={currentDate}
          handleNextTimeframe={handleNextTimeframe}
          handlePreviousTimeframe={handlePreviousTimeframe}
        />
      </header>
      <div className="flex flex-col items-end justify-end border-b border-gray-200 dark:border-dark-700 gap-x-2 space-y-2 pl-6 px-2 py-3 divide-gray-200 dark:divide-dark-700">
          <FilterControl filters={filters} onFilterChange={handleFilterChange} clearFilters={clearFilters} />
      </div>
      <div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white dark:bg-dark-900 transition-all duration-500 ease-in-out items-center">
        <div className="flex max-w-full flex-none flex-col sm:max-w-none w-full md:max-w-full">
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl xl:max-w-none lg:w-4/5 px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
                <table className="w-full text-left">
                  <tbody className="relative overflow-y-auto">
                    {(isLoadingShifts || isLoadingTimesheets || isLoadingEvents || isTransitioning) ? (
                      Array.from({ length: 3 }).map((_, headerIndex) => (
                        <Fragment key={`header-${headerIndex}`}>
                          {/* Loading Skeleton */}
                          <tr key={`row-${headerIndex}`} className="text-sm leading-6 text-gray-900">
                            <th scope="colgroup" colSpan={3} className="relative py-3 font-semibold">
                              <div className={`animate-pulse flex flex-col justify-center h-full w-full`}>
                                <div className="h-4 bg-gray-200 dark:bg-dark-800 rounded-lg w-28"></div>
                              </div>
                              <div className="absolute inset-y-0 right-full -z-10 w-screen border-b border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-800 shadow-sm" />
                              <div className="absolute inset-y-0 left-0 -z-10 w-screen border-b border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-800 shadow-sm" />
                            </th>
                          </tr>
                          {/* Sub-Rows */}
                          {Array.from({ length: 5 }).map((_, subRowIndex) => (
                            <tr key={`subrow-${headerIndex}-${subRowIndex}`}>
                              <td className="relative py-2 pr-6 w-4/5 sm:w-1/3">
                                <UserItemFull isLoading={true} />
                              </td>
                              <td className="hidden py-2 sm:table-cell pr-6 w-96 xl:w-[30rem]">
                                <ShiftProgressBar isLoading={true} />
                              </td>
                              <td className="py-2 text-right w-20">
                                <div className={`animate-pulse flex flex-col justify-center items-end rounded h-10 w-1/2 ml-auto`}>
                                  <div className="h-4 bg-gray-100 dark:bg-dark-800 rounded-lg w-20"></div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))
                    ) : Object.keys(groupedShifts).length === 0 ? (
                      // Display message when there are no shifts
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-sm text-gray-500 dark:text-dark-400">
                          No shifts available for the selected date range.
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        let cumulativeIndex = 0; // Track the cumulative index across all grouped shifts

                        return Object.entries(groupedShifts).map(([date, shiftsByTime]) => (
                          <Fragment key={date}>
                            {Object.entries(shiftsByTime)
                              .sort(([keyA], [keyB]) => parseInt(keyA, 10) - parseInt(keyB, 10))
                              .map(([key, shifts]) => {
                                const startHour = parseInt(key.slice(0, 2), 10); // Extract hour
                                const startMinute = parseInt(key.slice(2, 4), 10); // Extract minute

                                const startDate = new Date();
                                startDate.setHours(startHour, startMinute, 0, 0); // Set hours and minutes

                                return (
                                  <Fragment key={key}>
                                    <tr key={`row-${key}`} className="text-sm leading-6 text-gray-900 dark:text-dark-50">
                                      <th scope="colgroup" colSpan={3} className="relative py-2 font-semibold">
                                        {isNaN(startDate.getTime())
                                          ? key.charAt(0).toUpperCase() + key.slice(1)
                                          : `Starting: ${format(startDate, 'h:mm a').toLowerCase()}`}
                                        <div className="absolute inset-y-0 right-full -z-10 w-screen border-b border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-800 shadow-sm" />
                                        <div className="absolute inset-y-0 left-0 -z-10 w-screen border-b border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-800 shadow-sm" />
                                      </th>
                                    </tr>
                                    {shifts.map((shift) => {
                                      const isLoaded = cumulativeIndex < loadedItems;
                                      const relevantTimesheets = timesheets.filter((timesheet) => timesheet.hr_id == shift.hr_id);
                                      const relevantEvents = events.filter((event) => event.hr_id == shift.hr_id);
                                      const relevantCalls = calls.filter((event) => event.hr_id == shift.hr_id);
                                      const rank = userStates[shift.hr_id]?.rank || null;

                                      cumulativeIndex++; // Increment the cumulative index for each shift
                                      return (
                                        <tr
                                          key={shift.id} // Apply fade-in class dynamically
                                          className={`${isLoaded ? 'fade-in' : ''}`}
                                        >
                                          <td className="relative py-2 pr-6 w-4/5 sm:w-1/3">
                                            <UserItemFull
                                              agent={{
                                                hr_id: shift.hr_id,
                                                agent: shift.agent,
                                              }}
                                              shift={shift}
                                              timesheets={relevantTimesheets}
                                              events={relevantEvents}
                                              isLoading={!isLoaded || isTransitioning}
                                            />
                                          </td>
                                          <td className="hidden py-2 lg:table-cell pr-6 w-96 xl:w-[30rem]">
                                            <ShiftProgressBar
                                              shift={shift}
                                              timesheets={relevantTimesheets}
                                              events={relevantEvents}
                                              calls={relevantCalls}
                                              rank={rank}
                                              isLoading={!isLoaded || isTransitioning}
                                            />
                                          </td>
                                          <td className="py-2 text-right w-20">
                                            {!isLoaded || isTransitioning ? (
                                              <div className={`animate-pulse flex flex-col justify-center items-end rounded h-10 w-1/2 ml-auto`}>
                                                <div className="h-4 bg-gray-100 dark:bg-dark-800 rounded-lg w-20"></div>
                                              </div>
                                            ) : (
                                              <div className="flex justify-end gap-x-4">
                                                <a
                                                  onClick={() => {
                                                    setSelectedShift({
                                                      shift,
                                                      timesheets: relevantTimesheets, // Use precomputed timesheets
                                                      events: relevantEvents, // Use precomputed events
                                                    });
                                                    setIsDrawerOpen(true);
                                                  }}
                                                  className="text-sm font-medium leading-6 text-theme-600 hover:text-theme-500 cursor-pointer"
                                                >
                                                  View<span className="hidden sm:inline"> shift</span>
                                                </a>
                                                  { relevantEvents.filter((event) => {
                                                      // Build shift start/end Date objects
                                                      const shiftDate = shift.shiftdate; // e.g. "2024-05-01"
                                                      const pad = (n) => n.toString().padStart(2, '0');
                                                      const startHour = Math.floor(shift.shiftstart / 100);
                                                      const startMinute = shift.shiftstart % 100;
                                                      const endHour = Math.floor(shift.shiftend / 100);
                                                      const endMinute = shift.shiftend % 100;

                                                      const shiftStart = new Date(`${shiftDate}T${pad(startHour)}:${pad(startMinute)}:00`);
                                                      const shiftEnd = new Date(`${shiftDate}T${pad(endHour)}:${pad(endMinute)}:00`);

                                                      // Parse event times
                                                      const eventOn = new Date(event.on_time);
                                                      const eventOff = new Date(event.off_time);

                                                      // Check for overlap: event must start before shift ends and end after shift starts
                                                      return eventOn < shiftEnd && eventOff > shiftStart;
                                                    }).find(event => event.requires_action) ?
                                                    <div className="w-6 h-6 flex items-center justify-center absolute -mr-12">
                                                      <div className="w-6 h-6 z-10 relative">
                                                        <div className="w-4 h-4 bg-white rounded-full my-1 mx-1 absolute"> </div>
                                                        <ExclamationCircleIcon className="w-6 h-6 text-red-400 rounded-full ring-inset absolute"></ExclamationCircleIcon>
                                                      </div>
                                                      <div className="bg-red-200 rounded-full flex items-center justify-center animate-pulse -z-10 absolute w-6 h-6"></div>
                                                    </div>
                                                    : null
                                                  }
                                              </div>
                                            )}
                                          </td>  
                                        </tr>
                                      );
                                    })}
                                  </Fragment>
                                );
                              })}
                          </Fragment>
                        ));
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawerOverlay
        isOpen={isDrawerOpen}
        hasBackdrop={true}
        slideFrom={"right"}
        onClose={() => setIsDrawerOpen(false)}
        title={
          selectedShift?.shift?.agent
            ? selectedShift.shift.agent
            : new Date(selectedShift?.shift?.shiftstart) > new Date()
            ? "Upcoming Shift"
            : "Previous Shift"
        }
        width="lg"
        subTitle={
          selectedShift
          ? (() => {
              const startHour = Math.floor(selectedShift.shift.shiftstart / 100);
              const startMinute = selectedShift.shift.shiftstart % 100;
              const endHour = Math.floor(selectedShift.shift.shiftend / 100);
              const endMinute = selectedShift.shift.shiftend % 100;
      
              const startDate = new Date();
              startDate.setHours(startHour, startMinute);
      
              const endDate = new Date();
              endDate.setHours(endHour, endMinute);
      
              // Find the last event or timesheet
              const lastEvent = selectedShift.events?.filter(ev => ev.category !== 'Note' && ev.category !== 'SMS Sent').reduce((latest, event) => {
                const eventOffTime = new Date(event.off_time);
                return eventOffTime > new Date(latest.off_time) ? event : latest;
              }, selectedShift.events[0]);
      
              const lastTimesheet = selectedShift.timesheets?.reduce((latest, timesheet) => {
                const timesheetOffTime = new Date(timesheet.off_time);
                return timesheetOffTime > new Date(latest.off_time) ? timesheet : latest;
              }, selectedShift.timesheets[0]);
      
              // Determine the latest off_time between the last event and timesheet
              const lastOffTime = (() => {
                if (lastEvent && lastTimesheet) {
                  return new Date(lastEvent.off_time) > new Date(lastTimesheet.off_time)
                    ? lastEvent.off_time
                    : lastTimesheet.off_time;
                }
                return lastEvent?.off_time || lastTimesheet?.off_time || null;
              })();
      
              const formattedLastOffTime = lastOffTime
                ? format(new Date(lastOffTime), 'h:mm a')
                : '';
      
              return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')} ${
                lastOffTime ? `(Last event: ${formattedLastOffTime})` : ''
              }`;
            })()
          : ''
        }
      >
        <ShiftView
          selectedShift={selectedShift}
        />
      </DrawerOverlay>
      </div>
    </UtilisationTargetsProvider>
  );
}
