import React, { useState, useEffect } from 'react';
import SelectInput from '../Forms/SelectInput';
import DateInput from '../Forms/DateInput';
import TextAreaInput from '../Forms/TextAreaInput';
import TimeInput from '../Forms/TimeInput'; // Import the new TimeInput component
import { validateRequired, validateMatches } from '../../Utils/Validation';
import { CheckIcon } from '@heroicons/react/20/solid';
import { toast } from 'react-toastify';

export default function FlagShift({ selectedShift, onCancel }) {
  const [formData, setFormData] = useState({
    hrID: selectedShift.shift.hr_id,
    flagType: '',
    requiresAction: '',
    meetingDate: '',
    meetingTime: { hour: '', minute: '' },
    startTime: { hour: '', minute: '' },
    endTime: { hour: '', minute: '' },
    notes: '',
    date: selectedShift.shift.shiftdate,
    shiftID: selectedShift.shift.unq_id,
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');

  const flagOptions = [
    { id: 'sick', value: 'Sick' },
    { id: 'awol', value: 'AWOL' },
    { id: 'reduced', value: 'Reduced' },
  ];

  // Set default time and shift boundaries from selectedShift
  useEffect(() => {
    if (selectedShift.shift?.shiftstart && selectedShift.shift?.shiftend) {
      const startHour = selectedShift.shift.shiftstart.slice(0, 2);
      const startMinute = selectedShift.shift.shiftstart.slice(2, 4);
      const endHour = selectedShift.shift.shiftend.slice(0, 2);
      const endMinute = selectedShift.shift.shiftend.slice(2, 4);

      setShiftStart(`${startHour}:${startMinute}`);
      setShiftEnd(`${endHour}:${endMinute}`);

      setFormData((prev) => ({
        ...prev,
        startTime: { hour: startHour.padStart(2, '0'), minute: startMinute.padStart(2, '0') },
        endTime: { hour: endHour.padStart(2, '0'), minute: endMinute.padStart(2, '0') },
      }));
    }
  }, [selectedShift]);

  // Validation rules for each field
  const validationRules = {
    flagType: [
      (value) =>
        validateRequired(value, 'Flag Type', {
          customMessage: 'Please select a type of absence.',
        }),
    ],
    // requiresAction: [
    //   (value) =>
    //     validateRequired(value, 'Requires Action', {
    //       customMessage: 'Please select if any action is required.',
    //     }),
    // ],
    // meetingDate: [
    //   (value) =>
    //     validateRequired(value, 'Meeting Date', {
    //       customMessage: 'Please select a meeting date.',
    //       condition: () => formData.requiresAction === 'Yes',
    //     }),
    // ],
    // meetingTime: [
    //   (value) =>
    //     validateRequired(value.hour && value.minute, 'Meeting Time', {
    //       customMessage: 'Please select a meeting time.',
    //       condition: () => formData.requiresAction === 'Yes',
    //     }),
    // ],
    startTime: [
      (value) =>
        validateRequired(value.hour && value.minute, 'Time', {
          customMessage: 'Please select a time.',
        }),
    ],
    endTime: [
      (value) =>
        validateRequired(value.hour && value.minute, 'Time', {
          customMessage: 'Please select a time.',
        }),
    ],
    notes: [
      (value) =>
        validateMatches(value, /^[a-zA-Z0-9\s.,'"\-()!?;:@#&%]*$/, null, {
          customMessage: 'Notes must contain only valid characters (letters, numbers, and common symbols).',
          condition: () => value.trim() !== '', // Only validate if the field is not empty
        }),
    ],
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [key]: undefined, // Clear the error for the field when it changes
    }));
  };

  const validate = (fieldsToValidate) => {
    const newErrors = {};

    fieldsToValidate.forEach((field) => {
      const value = formData[field];
      const fieldRules = validationRules[field];

      if (fieldRules) {
        for (const rule of fieldRules) {
          const error = rule(value);
          if (error) {
            newErrors[field] = error;
            break;
          }
        }
      }
    });

    setErrors((prev) => ({
      ...prev,
      ...newErrors,
    }));

    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isValid = validate(['flagType', 'requiresAction', 'meetingDate', 'meetingTime', 'time', 'notes']);
    if (!isValid) return;
  
    // Check for overlap with timesheets or events
    const startTime = new Date(
      `${formData.date} ${formData.startTime.hour.padStart(2, '0')}:${formData.startTime.minute.padStart(2, '0')}:00`
    );
    const endTime = new Date(
      `${formData.date} ${formData.endTime.hour.padStart(2, '0')}:${formData.endTime.minute.padStart(2, '0')}:00`
    );

    const hasOverlap = [...(selectedShift.timesheets || []), ...(selectedShift.events || [])].some((item) => {
      const itemStart = new Date(item.on_time);
      const itemEnd = new Date(item.off_time || selectedShift.shift.shiftend); // Use itemStart if off_time is not available
      return startTime < itemEnd && endTime > itemStart; // Check for overlap
    });

    if (hasOverlap) {
      toast.error('The selected start and end times overlap with existing events, please select another.', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
      return; // Cancel submission
    }

    // Set processing state
    setIsProcessing(true);
    setIsSuccess(false);

    const payload = {
      ...formData,
      requiresAction: formData.requiresAction === 'Yes' || formData.requiresAction === true, // Convert to boolean
    };

    try {
      // Make the POST request to the API
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

      const response = await fetch('/rota/save-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken, // Include the CSRF token
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Check if the response is a validation error (422)
        if (response.status === 422) {
          const errorData = await response.json();
          setErrors(errorData.errors); // Set validation errors
          throw new Error('Validation failed');
        }

        throw new Error('Failed to save absence event');
      }

      // On success
      setIsProcessing(false);
      setIsSuccess(true);

      toast.success('Shift has been flagged successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });

      // Dispatch the custom event to refresh timesheets, and events
      window.dispatchEvent(new Event('refreshTimesheets'));
      window.dispatchEvent(new Event('refreshEvents'));

      // Wait 3 seconds before triggering onCancel
      setTimeout(() => {
        setIsSuccess(false);
        onCancel();
      }, 1000);
    } catch (error) {
      console.error(error);
      if (error.message !== 'Validation failed') {
        toast.error('Shift could not be flagged. Please try again.', {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      }
      setIsProcessing(false);
      setIsSuccess(false);
    }
  };

  return (
    <div className="divide-y divide-gray-200 border-b border-t border-gray-200">
      <h3 className="font-medium text-sm text-gray-900 py-4">Flag This Shift</h3>
      <div className="py-4 space-y-4">
        {/* Flag Type */}
        <SelectInput
          id="flagType"
          label="Type"
          currentState={formData.flagType}
          items={flagOptions}
          onSelectChange={(value) => handleChange('flagType', value[0].value)}
          placeholder="Select a flag type"
          onBlur={() => validate(['flagType'])}
          error={errors.flagType}
        />

        {/* Start Time */}
        <TimeInput
          id="time"
          label="Start Time"
          startTime={shiftStart}
          endTime={shiftEnd}
          currentState={formData.startTime}
          onTimeChange={(value) => handleChange('startTime', value)}
          error={errors.startTime}
        />

        {/* End Time */}
        <TimeInput
          id="time"
          label="End Time"
          startTime={shiftStart}
          endTime={shiftEnd}
          currentState={formData.endTime}
          onTimeChange={(value) => handleChange('endTime', value)}
          error={errors.endTime}
        />

        {/* Requires Action
        <SelectInput
          id="requiresAction"
          label="Requires Action"
          currentState={formData.requiresAction}
          items={[
            { id: 'yes', value: 'Yes' },
            { id: 'no', value: 'No' },
          ]}
          onSelectChange={(value) => handleChange('requiresAction', value[0].value)}
          placeholder="Select an option"
          onBlur={() => validate(['requiresAction'])}
          error={errors.requiresAction}
        /> */}

        {/* Meeting Date
        {formData.requiresAction === 'Yes' && (
          <DateInput
            startDateId="meetingDate"
            label="Meeting Date"
            currentState={{ startDate: formData.meetingDate, endDate: formData.meetingDate }}
            onDateChange={(value) => handleChange('meetingDate', value[0].value)}
            placeholder="Select a meeting date"
            dateRange={false}
            minDate={new Date()}
            onBlur={() => validate(['meetingDate'])}
            error={errors.meetingDate}
          />
        )} */}

        {/* Meeting Time
        {formData.requiresAction === 'Yes' && (
          <TimeInput
            id="meetingTime"
            label="Meeting Time"
            startTime="08:00"
            endTime="22:00"
            currentState={formData.meetingTime}
            onTimeChange={(value) => handleChange('meetingTime', value)}
            error={errors.meetingTime}
          />
        )} */}

        {/* Notes */}
        <TextAreaInput
          id="notes"
          label="Notes"
          rows={4}
          currentState={formData.notes}
          onTextChange={(value) => handleChange('notes', value[0].value)}
          placeholder="Add any additional notes"
          onBlur={() => validate(['notes'])}
          error={errors.notes}
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex justify-end space-x-4">
        <button
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:cursor-not-allowed"
          onClick={onCancel}
          disabled={isProcessing || isSuccess}
        >
          Cancel
        </button>
        <button
          className={`px-4 py-2 rounded-md text-white flex items-center justify-center w-32 disabled:cursor-not-allowed ${
            isProcessing
              ? 'bg-orange-500'
              : isSuccess
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
          onClick={handleSubmit}
          disabled={isProcessing || isSuccess}
        >
          {isProcessing ? (
            <svg
              className="inline w-5 h-5 animate-spin fill-orange-200"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          ) : isSuccess ? (
            <CheckIcon className="h-6 w-6" />
          ) : (
            'Save'
          )}
        </button>
      </div>
    </div>
  );
}