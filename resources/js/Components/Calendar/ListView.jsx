import { Fragment, useEffect, useState, useMemo, useRef } from 'react';
import useFetchShifts from './useFetchShifts';
import useFetchTimesheets from './useFetchTimesheets';
import useFetchEvents from './useFetchEvents';
import useFetchCalls from './useFetchCalls';
import MenuComponent from './MenuComponent';
import UserItemFull from '../Account/UserItemFull';
import ShiftProgressBar from './ShiftProgressBar';
import DrawerOverlay from '../Overlays/DrawerOverlay';
import './CalendarStyles.css';
import { format, startOfDay, endOfDay, subDays, addDays, set } from 'date-fns';
import { groupShifts } from '../../Utils/Rota';
import ShiftView from './ShiftView';
import { useUserStates } from '../Context/ActiveStateContext';
import { UtilisationTargetsProvider } from '../Context/UtilisationTargetsContext.jsx';

export default function ListView({ setView, viewType }) {
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loadedItems, setLoadedItems] = useState(0); // Track how many items are loaded
  const [selectedShift, setSelectedShift] = useState(null);
  const container = useRef(null);

  const startDate = format(startOfDay(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfDay(currentDate), 'yyyy-MM-dd');

  const { shifts, isLoading } = useFetchShifts(startDate, endDate);
  const { timesheets } = useFetchTimesheets(startDate, endDate);
  const { events } = useFetchEvents(startDate, endDate);
  const { calls } = useFetchCalls(startDate, endDate);

  const userStates = useUserStates();
  const groupedShifts = useMemo(() => {
    return groupShifts(shifts, false, (shift) => `${shift.shiftstart}`, timesheets, userStates);
  }, [shifts, timesheets]);
  
  useEffect(() => {
    if (shifts.length) {
      setIsTransitioning(false);
      setLoadedItems(0); // Reset loaded items
    }
  }, [shifts]);
  
  useEffect(() => {    
    if (!isLoading && shifts.length) {
      let frameId;
      const updateLoadedItems = () => {
        setLoadedItems((prev) => {
          if (prev >= (shifts.length + groupedShifts[startDate]?.unallocated?.length)) {
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
  }, [isLoading, groupedShifts]);

  useEffect(() => {
    if (selectedShift) {
      // Find the updated shift data
      const updatedShift = shifts.find((shift) => shift.unq_id === selectedShift.shift.unq_id);
  
      // Find the updated timesheets and events for the selected shift
      const updatedTimesheets = timesheets.filter((timesheet) => timesheet.hr_id == selectedShift.shift.hr_id);
      const updatedEvents = events.filter((event) => event.shift_id == selectedShift.shift.unq_id);
  
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

  return (
    <UtilisationTargetsProvider>
      <div className="flex h-full flex-col pb-16 sm:pb-0">
      <header className="flex flex-none items-center justify-end border-b border-gray-200 gap-x-2 px-6 py-4">
        <MenuComponent
          currentView={viewType.charAt(0).toUpperCase() + viewType.slice(1)}
          setView={setView}
          currentDate={currentDate}
          handleNextTimeframe={handleNextTimeframe}
          handlePreviousTimeframe={handlePreviousTimeframe}
        />
      </header>
      <div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white transition-all duration-500 ease-in-out items-center">
        <div className="flex max-w-full flex-none flex-col sm:max-w-none w-full md:max-w-full">
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
                <table className="w-full text-left">
                  <tbody className="relative overflow-y-auto">
                    {isLoading
                      ? Array.from({ length: 3 }).map((_, headerIndex) => (
                          <Fragment key={`header-${headerIndex}`}>
                            {/* Header Row */}
                            <tr key={`row-${headerIndex}`} className="text-sm leading-6 text-gray-900">
                              <th scope="colgroup" colSpan={3} className="relative py-3 font-semibold">
                                <div className={`animate-pulse flex flex-col justify-center h-full w-full`}>
                                    <div className="h-4 bg-gray-200 rounded-lg w-28"></div>
                                </div>
                                <div className="absolute inset-y-0 right-full -z-10 w-screen border-b border-gray-200 bg-gray-50 shadow-sm" />
                                <div className="absolute inset-y-0 left-0 -z-10 w-screen border-b border-gray-200 bg-gray-50 shadow-sm" />
                              </th>
                            </tr>

                            {/* Sub-Rows */}
                            {Array.from({ length: 5 }).map((_, subRowIndex) => (
                              <tr key={`subrow-${headerIndex}-${subRowIndex}`}>
                                <td className="relative py-2 pr-6 w-4/5 sm:w-1/3">
                                  <UserItemFull isLoading={true} />
                                </td>
                                <td className="hidden py-2 sm:table-cell pr-6">
                                  <ShiftProgressBar isLoading={true} />
                                </td>
                                <td className="py-2 text-right w-20">
                                  <div className={`animate-pulse flex flex-col items-end rounded h-10 w-1/2 ml-auto`}>
                                    <div className="h-4 bg-gray-100 rounded-lg w-14 mb-2"></div>
                                    <div className="h-4 bg-gray-100 rounded-lg w-14"></div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        ))
                      : (() => {
                          let cumulativeIndex = 0; // Track the cumulative index across all grouped shifts

                          return Object.entries(groupedShifts)
                          .map(([date, shiftsByTime]) => (
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
                                    <tr key={`row-${key}`} className="text-sm leading-6 text-gray-900">
                                      <th scope="colgroup" colSpan={3} className="relative py-2 font-semibold">
                                        {isNaN(startDate.getTime())
                                        ? key.charAt(0).toUpperCase() + key.slice(1)
                                        : `Starting: ${format(startDate, 'h:mm a').toLowerCase()}`}
                                        <div className="absolute inset-y-0 right-full -z-10 w-screen border-b border-gray-200 bg-gray-50 shadow-sm" />
                                        <div className="absolute inset-y-0 left-0 -z-10 w-screen border-b border-gray-200 bg-gray-50 shadow-sm" />
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
                                          <td className="hidden py-2 sm:table-cell pr-6">
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
                                              <div className={`animate-pulse flex flex-col items-end rounded h-10 w-1/2 ml-auto`}>
                                                <div className="h-4 bg-gray-100 rounded-lg w-14 mb-2"></div>
                                                <div className="h-4 bg-gray-100 rounded-lg w-14"></div>
                                              </div>
                                            ) : (
                                              <div className="flex justify-end">
                                                <a
                                                  onClick={() => {
                                                    setSelectedShift({
                                                      shift,
                                                      timesheets: relevantTimesheets, // Use precomputed timesheets
                                                      events: relevantEvents, // Use precomputed events
                                                    });
                                                    setIsDrawerOpen(true);
                                                  }}
                                                  className="text-sm font-medium leading-6 text-orange-600 hover:text-orange-500 cursor-pointer"
                                                >
                                                  View<span className="hidden sm:inline"> shift</span>
                                                </a>
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
                        })()}
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

                return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
              })()
            : ""
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
