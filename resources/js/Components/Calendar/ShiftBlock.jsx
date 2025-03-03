import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { getNextColor } from '../../Utils/Color.jsx';

function ShiftBlock({ date, shiftKey, shifts, colIndex, handleMouseEnter, handleMouseLeave, handleOnClick, enableScale, isTransitioning }) {
  const [start, end] = shiftKey.split('-').map(Number);

  const startHour = Math.floor(start / 100);
  const startMinute = start % 100;
  const endHour = Math.floor(end / 100);
  const endMinute = end % 100;

  // Calculate the number of 15-minute intervals from 8 AM
  const startRow = (startHour - 8) * 4 + Math.floor(startMinute / 15) + 2;
  const endRow = (endHour - 8) * 4 + Math.floor(endMinute / 15) + 2;
  const spanRows = endRow - startRow;

  // Create Date objects for start and end times
  const startDate = new Date();
  startDate.setHours(startHour, startMinute);

  const endDate = new Date();
  endDate.setHours(endHour, endMinute);

  // Memoize the color assignment to ensure consistency
  const colorClass = useMemo(() => getNextColor(), []);

  // Check for multiple unique shiftstart and shiftend times
  const uniqueShifts = new Set(shifts.map(shift => `${shift.shiftstart}-${shift.shiftend}`));
  const isMultipleShiftPeriods = uniqueShifts.size > 1;

  // Group agents by shift period
  const agentsByShiftPeriod = {};
  shifts.forEach(shift => {
    const period = `${shift.shiftstart}-${shift.shiftend}`;
    if (!agentsByShiftPeriod[period]) {
      agentsByShiftPeriod[period] = [];
    }
    agentsByShiftPeriod[period].push(shift.agent);
  });

  return (
    <li
      key={`${date}-${shiftKey}`}
      className={`relative mt-px flex ${enableScale ? 'time-block-scale' : ''} duration-300 ease-in-out transform transition-all time-block mx-auto w-full max-w-[40rem]`}
      style={{
        gridRow: `${startRow} / span ${spanRows}`,
        gridColumn: `${colIndex + 1} / span 1`,
      }}
      onClick={handleOnClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href="#"
        className={`group absolute inset-1 mx-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs leading-5 ${colorClass} transition-all duration-300 ease-in-out`}
      >
        <div className={`order-1 font-semibold ${isMultipleShiftPeriods || shifts.length > 3 ? 'group-hover:hidden periods' : ''}`}>
          {isMultipleShiftPeriods || shifts.length > 3 ? `${shifts.length} shifts in this period` : (
            <ul className="ml-4 list-disc">
              {shifts.map((shift, index) => (
                <li key={index}>{shift.agent}</li>
              ))}
            </ul>
          )}
        </div>
        <p className="">
          <time dateTime={start}>
            {isMultipleShiftPeriods ? 'Between ' : ''}
            {`${format(startDate, 'h:mm a').toLowerCase()} - ${format(endDate, 'h:mm a').toLowerCase()}`}
          </time>
        </p>
        {(isMultipleShiftPeriods || shifts.length > 3) && (
          <div className="group-hover:block agents">
            {Object.entries(agentsByShiftPeriod).map(([period, agents], index) => {
              const [periodStart, periodEnd] = period.split('-').map(Number);
              const periodStartDate = new Date();
              periodStartDate.setHours(Math.floor(periodStart / 100), periodStart % 100);
              const periodEndDate = new Date();
              periodEndDate.setHours(Math.floor(periodEnd / 100), periodEnd % 100);
              return (
                <div key={period} className={index > 0 ? "mt-2" : ""}>
                  {isMultipleShiftPeriods && (
                    <p className="font-semibold">
                      {`${format(periodStartDate, 'h:mm a').toLowerCase()} - ${format(periodEndDate, 'h:mm a').toLowerCase()}`}
                    </p>
                  )}
                  <ul className="ml-4 list-disc">
                    {agents.map((agent, index) => (
                      <li key={index}>{agent}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </a>
    </li>
  );
}

ShiftBlock.propTypes = {
  date: PropTypes.string.isRequired,
  shiftKey: PropTypes.string.isRequired,
  shifts: PropTypes.array.isRequired,
  colIndex: PropTypes.number.isRequired,
  handleMouseEnter: PropTypes.func.isRequired,
  handleMouseLeave: PropTypes.func.isRequired,
  handleOnClick: PropTypes.func.isRequired,
  enableScale: PropTypes.bool,
};

ShiftBlock.defaultProps = {
  enableScale: false,
};

export default ShiftBlock;