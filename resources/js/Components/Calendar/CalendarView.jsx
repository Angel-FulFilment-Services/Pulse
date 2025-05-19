import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import MenuComponent from './MenuComponent';
import useFetchShifts from '../Fetches/Rota/useFetchShifts';
import './CalendarStyles.css';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, addDays, isSameDay, startOfDay, endOfDay, subDays } from 'date-fns';
import ShiftBlock from './ShiftBlock';
import DrawerOverlay from '../Overlays/DrawerOverlay';
import { ThreeDots } from 'react-loader-spinner'
import { groupShifts } from '../../Utils/Rota';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function CalendarView({ setView, viewType }) {
  const container = useRef(null);
  const containerNav = useRef(null);
  const containerOffset = useRef(null);
  const containerLoading = useRef(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [groupedShifts, setGroupedShifts] = useState({});
  const [slideFrom, setSlideFrom] = useState('right');

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth <= 768 && viewType === 'Week') {
          container.current.scrollTo({ top: 0, behavior: 'smooth' });
          setIsTransitioning(true);
          setGroupedShifts({});
          setView('Day');
        }
    };
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
    };
  }, [viewType]);


  const startDate = viewType === 'Week' 
    ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') 
    : format(startOfDay(currentDate), 'yyyy-MM-dd');
  const endDate = viewType === 'Week' 
    ? format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') 
    : format(endOfDay(currentDate), 'yyyy-MM-dd');

  const { shifts, isLoading } = useFetchShifts(startDate, endDate);

  useEffect(() => {
    setGroupedShifts(groupShifts(shifts, true));
    if(shifts.length){
      setIsTransitioning(false);
    }
  }, [shifts]);

  // useEffect(() => {
  //   const currentMinute = new Date().getHours() * 60;
  //   if (currentMinute >= 480 && currentMinute <= 1320) {
  //     container.current.scrollTop =
  //       ((container.current.scrollHeight - containerNav.current.offsetHeight - containerOffset.current.offsetHeight) *
  //         (currentMinute - 480)) /
  //       840;
  //   }
  // }, []);

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
    setIsTransitioning(true);
    setCurrentDate(viewType === 'Week' ? subWeeks(currentDate, 1) : subDays(currentDate, 1));
  };

  const handleNextTimeframe = () => {
    setIsTransitioning(true);
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

  const handleBlockClick = (event, colIndex) => {
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

    // Determine the slide direction based on the column index
    setSlideFrom(colIndex < 4 ? 'right' : 'left');

    // Open the drawer
    setIsDrawerOpen(true);
  };

  const handleDateClick = (date) => {
    setCurrentDate(date);
    setViewWithTransition('Day');
  };

  const setViewWithTransition = (view) => {
    if (view !== viewType) {
      container.current.scrollTo({ top: 0, behavior: 'smooth' });
      setIsTransitioning(true);
      setTimeout(() => {
        setGroupedShifts({});
        setView(view);
      }, 300); // Adjust the timeout duration as needed
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-end border-b border-gray-200 dark:border-dark-700 gap-x-2 px-6 py-4">
        <MenuComponent currentView={viewType.charAt(0).toUpperCase() + viewType.slice(1)} setView={setViewWithTransition} handleNextTimeframe={handleNextTimeframe} handlePreviousTimeframe={handlePreviousTimeframe} currentDate={currentDate}/>
      </header>
      <div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white transition-all duration-500 ease-in-out">
        <div style={{ width: viewType === 'Week' ? '165%' : '100%' }} className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full">
          <div
            ref={containerNav}
            className="sticky top-0 z-30 flex-none bg-white dark:bg-dark-900 shadow ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 sm:pr-8"
          >
            <div className={`${viewType === 'Week' ? 'grid-cols-7 grid sm:hidden' : 'grid-cols-1 hidden' } text-sm leading-6 text-gray-500 dark:text-dark-400`}>
              {daysOfWeek.map((day, index) => (
                <div key={index} type="button" className={`flex flex-col items-center ${viewType === 'Week' ? 'hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer' : ''} pb-3 pt-2`} onClick={() => handleDateClick(day)}>
                  {format(day, 'E')[0]}{' '}
                  <span
                    className={`mt-1 flex h-8 w-8 items-center justify-center font-semibold ${
                      isSameDay(day, today) ? 'rounded-full bg-theme-600 text-white dark:text-dark-100' : 'text-gray-900 dark:text-dark-100'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              ))}
            </div>

            <div className={`-mr-px ${viewType === 'Week' ? 'grid-cols-7 hidden sm:grid' : 'grid-cols-1 grid'} divide-x divide-gray-100 dark:divide-dark-800 border-r border-gray-100 dark:border-dark-800 text-sm leading-6 text-gray-500 dark:text-dark-400`}>
              <div className="col-end-1 w-14" />
              {daysOfWeek.map((day, index) => (
                <div key={index} className={`flex items-center ${viewType === 'Week' ? 'hover:bg-gray-50 dark:bg-dark-800 cursor-pointer' : ''} justify-center py-3`} onClick={() => handleDateClick(day)}>
                  <span className="flex gap-x-1">
                    {format(day, 'EEE')}{' '}
                    <span
                      className={`items-center justify-center font-semibold ${
                        isSameDay(day, today) ? 'flex h-6 w-6 rounded-full bg-theme-600 text-white dark:text-dark-100' : 'text-gray-900 dark:text-dark-100'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-auto relative bg-white dark:bg-dark-900">
          {isLoading && (
              <div ref={containerLoading} className="inset-0 z-20 h-full absolute left-0 w-full flex-none bg-black/30 dark:bg-dark-50/30 flex items-center justify-center">
                <ThreeDots
                  visible={true}
                  height="48"
                  width="80"
                  color="#FFFFFF"
                  radius="12.5"
                  ariaLabel="three-dots-loading"
                  wrapperStyle={{}}
                  wrapperClass=""
                />
              </div>
            )}

            <div className="sticky left-0 z-10 w-14 flex-none bg-white dark:bg-dark-900 ring-1 ring-gray-100 dark:ring-dark-800" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Horizontal lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100 dark:divide-dark-800"
                style={{ gridTemplateRows: 'repeat(29, minmax(3.5rem, 1fr))' }}
              >
                <div ref={containerOffset} className="row-end-1 h-7"></div>
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    8AM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    9AM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    10AM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    11AM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    12PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    1PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    2PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    3PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    4PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    5PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    6PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    7PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    8PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    9PM
                  </div>
                </div>
                <div />
                <div>
                  <div className="sticky left-0 z-10 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-dark-500">
                    10PM
                  </div>
                </div>
                <div />
              </div>

              {/* Vertical lines */}
              <div className={`col-start-1 col-end-2 row-start-1 hidden ${viewType === 'Week' ? 'grid-cols-7' : 'grid-cols-1'} grid-rows-1 divide-x divide-gray-100 dark:divide-dark-800 sm:grid`}>
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
                className={`col-start-1 col-end-2 row-start-1 grid grid-cols-1 ${viewType === 'Week' ? 'sm:grid-cols-7' : ''} sm:pr-8 fade ${!isTransitioning && 'show'}`}
                style={{ gridTemplateRows: '1.75rem repeat(58, minmax(1.75rem, 1fr)) auto', zIndex: 10, position: 'relative' }}
              >
                {Object.entries(groupedShifts)
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                .map(([date, shiftsByTime]) => {
                  return Object.entries(shiftsByTime).map(([key, shifts]) => {
                    const day = new Date(date).getDay();
                    const colIndex = (day === 0) ? 6 : day - 1
                    return (
                        <ShiftBlock
                          key={`${date}-${key}`}
                          date={date}
                          shiftKey={key}
                          shifts={shifts}
                          colIndex={viewType === 'Week' ? colIndex : 0}
                          handleOnClick={(event) => handleBlockClick(event, (viewType === 'Week' ? colIndex : 0))}
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
        slideFrom={slideFrom}
        onClose={() => setIsDrawerOpen(false)}
        title="Shift Block"
      >
        {/* No child components for now */}
      </DrawerOverlay>
    </div>
  );
}
