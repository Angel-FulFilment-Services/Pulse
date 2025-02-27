import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import MenuComponent from './MenuComponent';
import useFetchShifts from './useFetchShifts';
import './CalendarStyles.css';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, addDays, isSameDay, startOfDay, endOfDay, subDays } from 'date-fns';
import ShiftBlock from './ShiftBlock';
import DrawerOverlay from '../Overlays/DrawerOverlay';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const groupShifts = (shifts) => {
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

  // Merge shifts that fall within the widest time range
  Object.keys(grouped).forEach((date) => {
    const shiftsByTime = grouped[date];
    const mergedShifts = {};

    const timeKeys = Object.keys(shiftsByTime).sort((a, b) => {
      const [startA, endA] = a.split('-').map(Number);
      const [startB, endB] = b.split('-').map(Number);
      return startA - startB || endB - endA;
    });

    let currentKey = null;
    let currentShifts = [];

    timeKeys.forEach((key) => {
      const [start, end] = key.split('-').map(Number);

      if (!currentKey) {
        currentKey = key;
        currentShifts = shiftsByTime[key];
      } else {
        const [currentStart, currentEnd] = currentKey.split('-').map(Number);

        if (start >= currentStart && end <= currentEnd) {
          currentShifts = currentShifts.concat(shiftsByTime[key]);
        } else {
          mergedShifts[currentKey] = currentShifts;
          currentKey = key;
          currentShifts = shiftsByTime[key];
        }
      }
    });

    if (currentKey) {
      mergedShifts[currentKey] = currentShifts;
    }

    grouped[date] = mergedShifts;
  });

  return grouped;
};

export default function CalendarView({ setView, viewType }) {
  const container = useRef(null);
  const containerNav = useRef(null);
  const containerOffset = useRef(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const startDate = viewType === 'Week' 
    ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') 
    : format(startOfDay(currentDate), 'yyyy-MM-dd');
  const endDate = viewType === 'Week' 
    ? format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') 
    : format(endOfDay(currentDate), 'yyyy-MM-dd');
  const shifts = useFetchShifts(startDate, endDate);

  const groupedShifts = groupShifts(shifts);

  useEffect(() => {
    const currentMinute = new Date().getHours() * 60;
    if (currentMinute >= 480 && currentMinute <= 1320) {
      container.current.scrollTop =
        ((container.current.scrollHeight - containerNav.current.offsetHeight - containerOffset.current.offsetHeight) *
          (currentMinute - 480)) /
        840;
    }
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) {
      const previouslyClicked = document.querySelector('.clicked');
      if (previouslyClicked) {
        previouslyClicked.classList.remove('clicked');
      }
      container.current.classList.remove('clicked_contrast');
    }
  }, [isDrawerOpen]);

  const handlePreviousTimeframe = () => {
    setCurrentDate(viewType === 'Week' ? subWeeks(currentDate, 1) : subDays(currentDate, 1));
  };

  const handleNextTimeframe = () => {
    setCurrentDate(viewType === 'Week' ? addWeeks(currentDate, 1) : addDays(currentDate, 1));
  };

  const daysOfWeek = viewType === 'Week'
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i))
    : [currentDate];
  const today = new Date();
  
  const handleMouseEnter = () => {
    container.current.classList.add('hovering');
  };

  const handleMouseLeave = () => {
    container.current.classList.remove('hovering');
  };

  const handleBlockClick = (event) => {
    // Remove 'clicked' class from any previously clicked block
    const previouslyClicked = document.querySelector('.clicked');
    if (previouslyClicked) {
      previouslyClicked.classList.remove('clicked');
      if (previouslyClicked === event.currentTarget) {
        // If the same block is clicked, remove the 'clicked' class and cancel the function
        container.current.classList.remove('clicked_contrast');
        return;
      }
    }
  
    // Add 'clicked' class to the currently clicked block
    event.currentTarget.classList.add('clicked');
    
    // Add 'hovering' class to the container
    container.current.classList.add('clicked_contrast');
    
    // Ensure containerNav is not null
    if (containerNav.current) {
      // Capture the reference to containerNav.current
      const containerNavCurrent = containerNav.current;
      
      // Calculate the offset of the header row and add a small gap
      const headerOffset = containerNavCurrent.offsetHeight + 20; // Add a 10px gap
      
      const currentTarget = event.currentTarget;
  
      // Scroll the time block into view after a short delay
      if (container.current && containerNavCurrent) {
        const blockTop = currentTarget.getBoundingClientRect().top;
        const containerTop = container.current.getBoundingClientRect().top;
        const scrollOffset = blockTop - containerTop + container.current.scrollTop - headerOffset;
        
        // Only scroll if the scroll distance is greater than 10px
        if (Math.abs(scrollOffset - container.current.scrollTop) > 25) {
          container.current.scrollTo({ top: scrollOffset, behavior: 'smooth' });
        }
      }
    }

    // Open the drawer
    setIsDrawerOpen(true);
  };

  const handleDateClick = (date) => {
    setCurrentDate(date);
    setView('Day');
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-end border-b border-gray-200 gap-x-2 px-6 py-4">
        <MenuComponent currentView={viewType.charAt(0).toUpperCase() + viewType.slice(1)} setView={setView} handleNextTimeframe={handleNextTimeframe} handlePreviousTimeframe={handlePreviousTimeframe} currentDate={currentDate}/>
      </header>
      <div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white transition-all duration-500 ease-in-out">
        <div style={{ width: viewType === 'Week' ? '165%' : '100%' }} className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full">
          <div
            ref={containerNav}
            className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black ring-opacity-5 sm:pr-8"
          >
            <div className="grid grid-cols-7 text-sm leading-6 text-gray-500 sm:hidden">
              {daysOfWeek.map((day, index) => (
                <div key={index} type="button" className="flex flex-col items-center pb-3 pt-2" onClick={() => handleDateClick(day)}>
                  {format(day, 'E')[0]}{' '}
                  <span
                    className={`mt-1 flex h-8 w-8 items-center justify-center font-semibold ${
                      isSameDay(day, today) ? 'rounded-full bg-orange-600 text-white' : 'text-gray-900'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              ))}
            </div>

            <div className={`-mr-px hidden ${viewType === 'Week' ? 'grid-cols-7' : 'grid-cols-1'} divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 sm:grid`}>
              <div className="col-end-1 w-14" />
              {daysOfWeek.map((day, index) => (
                <div key={index} className={`flex items-center ${viewType === 'Week' ? 'hover:bg-gray-50 cursor-pointer' : ''} justify-center py-3`} onClick={() => handleDateClick(day)}>
                  <span className="flex gap-x-1">
                    {format(day, 'EEE')}{' '}
                    <span
                      className={`items-center justify-center font-semibold ${
                        isSameDay(day, today) ? 'flex h-6 w-6 rounded-full bg-orange-600 text-white' : 'text-gray-900'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Horizontal lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                style={{ gridTemplateRows: 'repeat(29, minmax(3.5rem, 1fr))' }}
              >
                <div ref={containerOffset} className="row-end-1 h-7"></div>
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    8AM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    9AM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    10AM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    11AM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    12PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    1PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    2PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    3PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    4PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    5PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    6PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    7PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    8PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    9PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                    10PM
                  </div>
                </div>
                <div />
              </div>

              {/* Vertical lines */}
              <div className={`col-start-1 col-end-2 row-start-1 hidden ${viewType === 'Week' ? 'grid-cols-7' : 'grid-cols-1'} grid-rows-1 divide-x divide-gray-100 sm:grid`}>
                <div className="col-start-1 row-span-full" />
                {viewType === 'Week' && (
                  <>
                    <div className="col-start-2 row-span-full" />
                    <div className="col-start-3 row-span-full" />
                    <div className="col-start-4 row-span-full" />
                    <div className="col-start-5 row-span-full" />
                    <div className="col-start-6 row-span-full" />
                    <div className="col-start-7 row-span-full" />
                    <div className="col-start-8 row-span-full w-8" />
                  </>
                )}
              </div>

              {/* Events */}
              <ol
                className={`col-start-1 col-end-2 row-start-1 grid grid-cols-1 ${viewType === 'Week' ? 'sm:grid-cols-7' : ''} sm:pr-8`}
                style={{ gridTemplateRows: '1.75rem repeat(58, minmax(1.75rem, 1fr)) auto', zIndex: 10, position: 'relative' }}
              >
                {Object.entries(groupedShifts)
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                .map(([date, shiftsByTime], colIndex) => {
                  return Object.entries(shiftsByTime).map(([key, shifts]) => {
                    return (
                        <ShiftBlock
                          date={date}
                          shiftKey={key}
                          shifts={shifts}
                          colIndex={viewType === 'Week' ? colIndex : 0}
                          handleOnClick={handleBlockClick}
                          handleMouseEnter={handleMouseEnter}
                          handleMouseLeave={handleMouseLeave}
                          enableScale={true}
                        />
                    );
                  });
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
      <DrawerOverlay
        isOpen={isDrawerOpen}
        hasBackdrop={false}
        onClose={() => setIsDrawerOpen(false)}
        title="Drawer Title"
      >
        {/* No child components for now */}
      </DrawerOverlay>
    </div>
  );
}
