import { useEffect, useRef, useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import MenuComponent from '../../Components/Calendar/MenuComponent.jsx';
import useFetchShifts from './useFetchShifts';
import './CalendarStyles.css';
import ShiftBlock from './ShiftBlock';

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

export default function DayView({ setView }) {
  const container = useRef(null);
  const containerOffset = useRef(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = format(currentDate, 'yyyy-MM-dd');
  const endDate = format(currentDate, 'yyyy-MM-dd');
  const shifts = useFetchShifts(startDate, endDate);

  const groupedShifts = groupShifts(shifts);

  useEffect(() => {
    const currentMinute = new Date().getHours() * 60;
    if (currentMinute >= 480 && currentMinute <= 1320) {
      container.current.scrollTop =
        ((container.current.scrollHeight - containerOffset.current.offsetHeight) *
          (currentMinute - 480)) /
        840;
    }
  }, []);

  const handlePreviousDay = () => {
    setCurrentDate(addDays(currentDate, -1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const today = new Date();

  const handleMouseEnter = () => {
    container.current.classList.add('hovering');
  };

  const handleMouseLeave = () => {
    container.current.classList.remove('hovering');
  };

  const handleBlockClick = (event) => {
    container.current.classList.add('hovering');
     
    // Calculate the offset of the header row and add a small gap
    const headerOffset = 20; // Add a 10px gap
    
    const currentTarget = event.currentTarget;

    // Scroll the time block into view after a short delay
    if (container.current) {
      const blockTop = currentTarget.getBoundingClientRect().top;
      const containerTop = container.current.getBoundingClientRect().top;
      const scrollOffset = blockTop - containerTop + container.current.scrollTop - headerOffset;
      
      // Only scroll if the scroll distance is greater than 10px
      if (Math.abs(scrollOffset - container.current.scrollTop) > 25) {
        container.current.scrollTo({ top: scrollOffset, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center w-full border-b border-gray-200 gap-x-2 px-6 py-4">
        <MenuComponent currentView="Day" setView={setView} handleNextTimeframe={handleNextDay} handlePreviousTimeframe={handlePreviousDay} currentDate={currentDate}/>
      </header>
      <div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div style={{ width: '100%' }} className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full">
          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Horizontal lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                style={{ gridTemplateRows: 'repeat(28, minmax(3.5rem, 1fr))' }}
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
              <div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-1 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-1">
                <div className="col-start-1 row-span-full" />
              </div>

              {/* Events */}
              <ol
                className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-1 sm:pr-8 px-10"
                style={{ gridTemplateRows: '1.75rem repeat(56, minmax(1.75rem, 1fr)) auto', zIndex: 10, position: 'relative' }}
              >
                {Object.entries(groupedShifts)
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                .map(([date, shiftsByTime], colIndex) => {
                  return Object.entries(shiftsByTime).map(([key, shifts]) => {
                    return (
                        <ShiftBlock
                          key={`${date}-${key}`}
                          date={date}
                          shiftKey={key}
                          shifts={shifts}
                          colIndex={colIndex}
                          handleOnClick={handleBlockClick}
                          handleMouseEnter={handleMouseEnter}
                          handleMouseLeave={handleMouseLeave}
                          enableScale={false}
                        />
                    );
                  });
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}