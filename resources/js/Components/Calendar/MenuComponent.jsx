import { Fragment, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Menu, Transition } from '@headlessui/react';
import SelectControl from '../Controls/SelectControl';
import CycleControl from '../Controls/CycleControl';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { getOrdinalSuffix } from '../../Utils/Date';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function MenuComponent({ currentView, setView, handleNextTimeframe, handlePreviousTimeframe, currentDate }) {
  const views = [
    { id: 'day', value: 'Day', displayValue: 'Day view' },
    { id: 'week', value: 'Week', displayValue: 'Week view' },
    { id: 'month', value: 'Month', displayValue: 'Month view' },
  ];

  const handleSelectChange = (selected) => {
    setView(selected.value);
  };

  const defaultSelected = views.find(view => view.value.toLowerCase() === currentView.toLowerCase());

  const day = format(currentDate, 'd');
  const ordinalSuffix = getOrdinalSuffix(day);

  const formattedDate = currentView === 'Day'
    ? `${format(currentDate, 'MMMM')} ${day}${ordinalSuffix}, ${format(currentDate, 'yyyy')}`
    : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMMM')} ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd')}${getOrdinalSuffix(format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd'))}${format(startOfWeek(currentDate, { weekStartsOn: 1 }), ', yyyy')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMMM')} ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd')}${getOrdinalSuffix(format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd'))}${format(endOfWeek(currentDate, { weekStartsOn: 1 }), ', yyyy')}`;

  const formattedDay = currentView === 'Day'
    ? `${format(currentDate, 'EEEE')}`
    : '';

  const cycleControlDate = currentView === 'Day'
    ? format(currentDate, 'MMM dd, yyyy')
    : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`;

  return (
    <div className="w-full flex flex-row justify-between">
      <div className="w-full">
        <h1 className="text-base font-semibold leading-6 text-gray-900">
          <time dateTime={format(currentDate, 'yyyy-MM-dd')} className="sm:hidden">
            {formattedDate}
          </time>
          <time dateTime={format(currentDate, 'yyyy-MM-dd')} className="hidden sm:inline">
            {formattedDate}
          </time>
        </h1>
        {currentView === 'Day' && (
          <p className="mt-1 text-sm text-gray-500">{formattedDay}</p>
        )}
        {currentView === 'Week' && (
          <p className="mt-1 text-sm text-gray-500 h-5">{formattedDay}</p>
        )}
      </div>

      <div className="flex flex-row items-center justify-end w-full gap-x-2">
        <div className="w-36">
          <SelectControl
            id="view-select"
            items={views}
            onSelectChange={handleSelectChange}
            placeholder={`${currentView} view`}
            defaultSelected={defaultSelected}
          />
        </div>

        <div className="w-56">
          <CycleControl
              id="timeframe-cycle"
              currentValue={cycleControlDate}
              onNext={handleNextTimeframe}
              onPrevious={handlePreviousTimeframe}
          />
        </div>
      </div>
    </div>
  );
}