import { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function TimeInput(props) {
  const { id, label, startTime, endTime, currentState, onTimeChange, error } = props;

  const [hours, setHours] = useState([]);
  const [minutes, setMinutes] = useState([]);
  const [selectedHour, setSelectedHour] = useState(currentState?.hour || '');
  const [selectedMinute, setSelectedMinute] = useState(currentState?.minute || '');

  // Update internal state when currentState changes
  useEffect(() => {
    setSelectedHour(currentState?.hour || '');
    setSelectedMinute(currentState?.minute || '');
  }, [currentState]);

  // Generate hours based on startTime and endTime
  useEffect(() => {
    const startHour = startTime ? parseInt(startTime.split(':')[0], 10) : 0;
    const endHour = endTime ? parseInt(endTime.split(':')[0], 10) : 23;

    const generatedHours = Array.from({ length: endHour - startHour + 1 }, (_, i) =>
      (startHour + i).toString().padStart(2, '0')
    );
    setHours(generatedHours);
  }, [startTime, endTime]);

  // Generate minutes dynamically based on the selected hour
  useEffect(() => {
    const startHour = startTime ? parseInt(startTime.split(':')[0], 10) : 0;
    const endHour = endTime ? parseInt(endTime.split(':')[0], 10) : 23;
    const startMinute = startTime ? parseInt(startTime.split(':')[1], 10) : 0;
    const endMinute = endTime ? parseInt(endTime.split(':')[1], 10) : 59;

    let generatedMinutes = [];
    if (selectedHour === startHour.toString().padStart(2, '0')) {
      // If the selected hour is the start hour, limit minutes to startMinute and above
      generatedMinutes = Array.from({ length: 60 - startMinute }, (_, i) =>
        (startMinute + i).toString().padStart(2, '0')
      );
    } else if (selectedHour === endHour.toString().padStart(2, '0')) {
      // If the selected hour is the end hour, limit minutes to endMinute and below
      generatedMinutes = Array.from({ length: endMinute + 1 }, (_, i) =>
        i.toString().padStart(2, '0')
      );
    } else {
      // Otherwise, show all 60 minutes
      generatedMinutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    }

    setMinutes(generatedMinutes);
  }, [selectedHour, startTime, endTime]);

  const handleHourChange = (hour) => {
    setSelectedHour(hour);

    // Check if the current selected minute is valid for the new hour
    const startHour = startTime ? parseInt(startTime.split(':')[0], 10) : 0;
    const endHour = endTime ? parseInt(endTime.split(':')[0], 10) : 23;
    const startMinute = startTime ? parseInt(startTime.split(':')[1], 10) : 0;
    const endMinute = endTime ? parseInt(endTime.split(':')[1], 10) : 59;

    let validMinutes = [];
    if (hour === startHour.toString().padStart(2, '0')) {
      // If the selected hour is the start hour, limit minutes to startMinute and above
      validMinutes = Array.from({ length: 60 - startMinute }, (_, i) =>
        (startMinute + i).toString().padStart(2, '0')
      );
    } else if (hour === endHour.toString().padStart(2, '0')) {
      // If the selected hour is the end hour, limit minutes to endMinute and below
      validMinutes = Array.from({ length: endMinute + 1 }, (_, i) =>
        i.toString().padStart(2, '0')
      );
    } else {
      // Otherwise, show all 60 minutes
      validMinutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    }

    // If the current selected minute is not valid, reset it
    if (!validMinutes.includes(selectedMinute)) {
      setSelectedMinute('');
      onTimeChange({ hour, minute: '' });
    } else {
      onTimeChange({ hour, minute: selectedMinute });
    }
  };

  const handleMinuteChange = (minute) => {
    setSelectedMinute(minute);
    onTimeChange({ hour: selectedHour, minute });
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </label>
      <div className="flex space-x-2 mt-2">
        {/* Hour Select */}
        <div className="flex-1">
          <Listbox value={selectedHour} onChange={handleHourChange}>
            {({ open }) => (
              <>
                <div className="relative">
                  <Listbox.Button
                    className={`relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left ${
                      selectedHour ? 'text-gray-900' : 'text-gray-400'
                    } shadow-sm ring-1 ring-inset ${
                      error ? 'ring-red-600 text-red-800' : 'ring-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm sm:leading-6`}
                  >
                    <span className="block truncate">{selectedHour || 'Hour'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {hours.map((hour) => (
                        <Listbox.Option
                          key={hour}
                          className={({ active }) =>
                            classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-900',
                              'relative cursor-default select-none py-2 pl-3 pr-9'
                            )
                          }
                          value={hour}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? 'font-semibold' : 'font-normal',
                                  'block truncate'
                                )}
                              >
                                {hour}
                              </span>
                              {selected ? (
                                <span
                                  className={classNames(
                                    active ? 'text-gray-900' : 'text-orange-600',
                                    'absolute inset-y-0 right-0 flex items-center pr-4'
                                  )}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
        </div>

        {/* Minute Select */}
        <div className="flex-1">
          <Listbox value={selectedMinute} onChange={handleMinuteChange}>
            {({ open }) => (
              <>
                <div className="relative">
                  <Listbox.Button
                    className={`relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left ${
                      selectedMinute ? 'text-gray-900' : 'text-gray-400'
                    } shadow-sm ring-1 ring-inset ${
                      error ? 'ring-red-600 text-red-800' : 'ring-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm sm:leading-6`}
                  >
                    <span className="block truncate">{selectedMinute || 'Minute'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {minutes.map((minute) => (
                        <Listbox.Option
                          key={minute}
                          className={({ active }) =>
                            classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-900',
                              'relative cursor-default select-none py-2 pl-3 pr-9'
                            )
                          }
                          value={minute}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? 'font-semibold' : 'font-normal',
                                  'block truncate'
                                )}
                              >
                                {minute}
                              </span>
                              {selected ? (
                                <span
                                  className={classNames(
                                    active ? 'text-gray-900' : 'text-orange-600',
                                    'absolute inset-y-0 right-0 flex items-center pr-4'
                                  )}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
        </div>
      </div>
      {error && <div className="text-red-600 text-sm pt-2">{error.message}</div>}
    </div>
  );
}

TimeInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  startTime: PropTypes.string, // Format: "HH:MM"
  endTime: PropTypes.string, // Format: "HH:MM"
  currentState: PropTypes.shape({
    hour: PropTypes.string,
    minute: PropTypes.string,
  }),
  onTimeChange: PropTypes.func.isRequired,
  error: PropTypes.object,
};