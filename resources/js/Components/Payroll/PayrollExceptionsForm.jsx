import { useState, useRef, useEffect } from 'react';
// import TextInput from '../Forms/TextInput';
import SelectInput from '../Forms/SelectInput';
import TextAreaInput from '../Forms/TextAreaInput';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { CheckIcon } from '@heroicons/react/20/solid';
import { CurrencyPoundIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { validateRequired, validateMatches } from '../../Utils/Validation';
import NumberInput from '../Forms/NumberInput';
import { format } from 'date-fns';

export default function PayrollExceptionsForm({ hrId, onCancel, initialData = null, dateRange }) {    
    const [formData, setFormData] = useState({
        type: '',
        startDate: dateRange.startDate ? dateRange.startDate : new Date(),
        endDate: dateRange.endDate ? dateRange.endDate : new Date(),
        notes: '',
        days: '',
        amount: '',
        exceptionID: '',
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const isInitialising = useRef(true);

    const typeOptions = [
        { id: 'SSP', value: 'Statutory Sick Pay' },
        { id: 'SPP', value: 'Statutory Paternity Pay' },
        { id: 'PILON', value: 'Payment In Lieu of Notice' },
        { id: 'OTHER', value: 'Other Deductions' },
        { id: 'BONUS', value: 'Adhoc Bonus' },
    ];

    const validationRules = {
        type: [
        (value) =>
            validateRequired(value, 'Type', {
            customMessage: 'Please select a type.',
            }),
        ],
        notes: [
        (value) =>
            validateMatches(value, /^[a-zA-Z0-9\s.,'"\-()!?;:@#&%]*$/, null, {
            customMessage: 'Notes must contain only valid characters (letters, numbers, and common symbols).',
            condition: () => value.trim() !== '', // Only validate if the field is not empty
            }),
        ],
        days: [
            (value, allValues) =>
              validateRequired(value, 'Days', {
                customMessage: 'Please enter a quantity of days.',
                condition: () => !allValues.amount, // Only validate if amount is not set
              }),
            (value, allValues) =>
              validateMatches(value, /^-?\d*\.?\d*$/, null, {
                customMessage: 'Quantity of days must be a valid number.',
                condition: () => value.trim() !== '' && !allValues.amount, // Only validate if not empty and amount is not set
              }),
          ],
          amount: [
            (value, allValues) =>
              validateRequired(value, 'Amount', {
                customMessage: 'Please enter a monetary value.',
                condition: () => !allValues.days, // Only validate if days is not set
              }),
            (value, allValues) =>
              validateMatches(value, /^-?\d*\.?\d*$/, null, {
                customMessage: 'Amount must be a valid number.',
                condition: () => value.trim() !== '' && !allValues.days, // Only validate if not empty and days is not set
              }),
          ],
    };

    // Populate form data if initialData is provided
    useEffect(() => {
        if (initialData) {
            setFormData({
                type: initialData.type || '',
                notes: initialData.notes || '',
                startDate: initialData.startDate ? initialData.startDate : dateRange.startDate || new Date(),
                endDate: initialData.endDate ? initialData.endDate : dateRange.endDate || new Date(),
                days: initialData.days || '',
                amount: initialData.amount || '',
                exceptionID: initialData.id || '',
            });
        }
    }, [initialData, dateRange.startDate, dateRange.endDate]);

    useEffect(() => {
        if (formData.type && isInitialising.current) {
            isInitialising.current = false;   
            return;
        }
        if (formData.type === 'Other Deductions') {
            setFormData((prev) => ({
                ...prev,
                days: '',
                amount: '',
            }));
        }

    }, [formData.type]);

    const validate = (fieldsToValidate) => {
        const newErrors = {};

        fieldsToValidate.forEach((field) => {
        const value = formData[field];
        const fieldRules = validationRules[field];

        if (fieldRules) {
            for (const rule of fieldRules) {
            const error = rule(value, formData);
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

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setErrors((prev) => ({
            ...prev,
            [field]: undefined, // Clear the error for the field when it changes
        }));
    };

    const handleSubmit = async () => {
        // Validate all fields            
        const isValid = validate(['type', 'startDate', 'endDate', 'notes', 'days', 'amount']);
        if (!isValid) return;

        // Set processing state
        setIsProcessing(true);
        setIsSuccess(false);

        try {
            // Make the POST request to the API
            const formDataPayload = new FormData();

            // Append text fields to FormData
            formDataPayload.append('type', formData.type);
            formDataPayload.append('notes', formData.notes);
            formDataPayload.append(
                'startDate',
                formData.startDate
                  ? format(new Date(formData.startDate), 'yyyy-MM-dd')
                  : ''
              );
              formDataPayload.append(
                'endDate',
                formData.endDate
                  ? format(new Date(formData.endDate), 'yyyy-MM-dd')
                  : ''
              );
            formDataPayload.append('days', formData.days);
            formDataPayload.append('amount', formData.amount);
            formDataPayload.append('hrID', hrId);
            if (initialData) {
                formDataPayload.append('exceptionID', formData.exceptionID);
            }
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            const response = await fetch('/payroll/exports/exceptions/save', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken, // Include the CSRF token
                },
                body: formDataPayload, // Use FormData as the request body
            });

            if (!response.ok) {
            // Check if the response is a validation error (422)
            if (response.status === 422) {
                const errorData = await response.json();
                setErrors(errorData.errors); // Set validation errors
                throw new Error('Validation failed');
            }

            throw new Error('Failed to save exception');
            }

            // On success
            setIsProcessing(false);
            setIsSuccess(true);

            toast.success(initialData ? 'Exception been updated successfully!' : 'Exception been created successfully!', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });

            // Dispatch the custom event to refresh exceptions and regenerate the report
            window.dispatchEvent(new Event('refreshExceptions'));
            window.dispatchEvent(new Event('regenerate-report'));

            // Wait 3 seconds before triggering onCancel
            setTimeout(() => {
                setIsSuccess(false);
                onCancel();
            }, 1000);
        } catch (error) {
            console.error(error);
            if (error.message !== 'Validation failed') {
                toast.error(initialData ? 'Exception could not be updated, Please try again.' : 'Exception could not be created, Please try again.', {
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

    // Handle form submission
    const handleCancel = () => {
        // Reset form data
        setFormData({
            type: '',
            startDate: dateRange.startDate ? dateRange.startDate : new Date(),
            endDate: dateRange.endDate ? dateRange.endDate : new Date(),
            notes: '',
            days: '',
            amount: '',
            exceptionID: '',
        });
        onCancel();
    }

    return (
        <div className="w-full h-full max-h-[50rem] overflow-y-auto">
            <div className="space-y-6 h-full flex flex-col justify-between">
                {/* Title Field */}
                <div className="">
                <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-2">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-dark-100">
                    {initialData ? 'Edit Existing Payroll Exception' : 'Add New Payroll Exception'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                    {initialData
                        ? 'Updating the details of this payroll exception.'
                        : 'Please fill out the form below with the required information.'}
                    </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 w-full">
                    <div className="sm:col-span-3">
                        <SelectInput
                            id="type"
                            label="Type"
                            currentState={formData.type}
                            items={typeOptions}
                            onSelectChange={(value) => handleInputChange('type', value[0].value)}
                            placeholder="Select a type of exception"
                            onBlur={() => validate(['type'])}
                            error={errors.type}
                        />
                    </div>

                    {/* Notes Field */}
                    <div className="sm:col-span-6">
                        <TextAreaInput
                            id="notes"
                            label="Notes"
                            height={"h-auto"}
                            placeholder="Enter any notes regarding this exception"
                            annotation={`(${formData.notes.length}/500 characters)`}
                            rows={4}
                            currentState={formData.notes}
                            onTextChange={(value) => handleInputChange('notes', value[0].value)}
                            onBlur={() => validate(['notes'])}
                            maxLength={500}
                            error={errors.notes}
                        />
                    </div>
                    
                    { formData.type === 'Statutory Sick Pay' && (
                        <div className="sm:col-span-6">
                         <NumberInput 
                            id="days"
                            label="Quantity"
                            Icon={CalendarDaysIcon}
                            annotation="(Days)"
                            placeholder="Enter the quantity of days for SSP"
                            currentState={formData.days}
                            onTextChange={(value) => handleInputChange('days', value[0].value)}
                            onBlur={() => validate(['days'])}
                            error={errors.days}
                            low={0}
                            high={31}
                            showRangeAlert={true}
                         />
                        </div>
                    )}

                    { formData.type === 'Statutory Paternity Pay' && (
                        <div className="sm:col-span-6">
                         <NumberInput 
                            id="days"
                            label="Quantity"
                            annotation="(Days)"
                            Icon={CalendarDaysIcon}
                            placeholder="Enter the quantity of days for SPP"
                            currentState={formData.days}
                            onTextChange={(value) => handleInputChange('days', value[0].value)}
                            onBlur={() => validate(['days'])}
                            error={errors.days}
                            low={0}
                            high={31}
                            showRangeAlert={true}
                         />
                        </div>
                    )}

                    { formData.type === 'Payment In Lieu of Notice' && (
                        <div className="sm:col-span-6">
                            <NumberInput 
                            id="amount"
                            label="Quantity"
                            annotation="(Days)"
                            Icon={CalendarDaysIcon}
                            placeholder="Enter the quantity of days for PILON"
                            currentState={formData.amount}
                            onTextChange={(value) => handleInputChange('amount', value[0].value)}
                            onBlur={() => validate(['amount'])}
                            error={errors.amount}
                            low={0}
                            high={31}
                            showRangeAlert={true}
                            />
                        </div>
                    )}

                    { formData.type === 'Adhoc Bonus' && (
                        <div className="sm:col-span-6">
                            <NumberInput 
                                id="amount"
                                label="Quantity"
                                annotation="(Amount)"
                                Icon={CurrencyPoundIcon}
                                placeholder="Enter the monetary (£) amount for this exception"
                                currentState={formData.amount}
                                onTextChange={(value) => handleInputChange('amount', value[0].value)}
                                onBlur={() => validate(['amount'])}
                                error={errors.amount}
                                low={-10000}
                                high={10000}
                                showRangeAlert={true}
                            />   
                        </div>
                    )}

                    {formData.type === 'Other Deductions' && (
                        <div className="sm:col-span-6 flex flex-col sm:flex-row w-full items-center justify-items gap-x-4">
                            <div className="w-full">
                                <NumberInput 
                                    id="amount"
                                    label="Quantity"
                                    annotation="(Amount)"
                                    Icon={CurrencyPoundIcon}
                                    placeholder="Enter the monetary amount to be deducted"
                                    currentState={formData.amount}
                                    onTextChange={(value) => {
                                        handleInputChange('days', '');
                                        handleInputChange('amount', value[0].value)}
                                    }
                                    onBlur={() => validate(['amount'])}
                                    error={errors.amount}
                                    low={-10000}
                                    high={10000}
                                    showRangeAlert={true}
                                />
                            </div>
                            <p className={`text-sm font-semibold text-gray-600 dark:text-dark-400 ${(errors.days || errors.amount) ? '' : 'sm:mt-7'}`}>Or</p>
                            <div className="w-full">
                                <NumberInput 
                                    id="days"
                                    label="Quantity"
                                    annotation="(Days)"
                                    Icon={CalendarDaysIcon}
                                    placeholder="Enter the quantity of days deductable"
                                    currentState={formData.days}
                                    onTextChange={(value) => {
                                        handleInputChange('amount', '');
                                        handleInputChange('days', value[0].value)}
                                    }
                                    onBlur={() => validate(['days'])}
                                    error={errors.days}
                                    low={0}
                                    high={31}
                                    showRangeAlert={true}
                                />
                            </div>
                        </div>
                    )}
                    </div>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="mt-6 flex items-center justify-end gap-x-6 w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-6">
                <button
                    type="button"
                    className="text-sm font-semibold text-gray-900 dark:text-dark-100"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                <button
                className={`px-4 py-2 rounded-md text-white flex items-center justify-center w-32 h-10 disabled:cursor-not-allowed ${
                    isProcessing
                    ? 'bg-theme-500 dark:bg-theme-600'
                    : isSuccess
                    ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500'
                    : 'bg-theme-500 hover:bg-theme-600 dark:bg-theme-600 dark:hover:bg-theme-500'
                }`}
                onClick={handleSubmit}
                disabled={isProcessing || isSuccess}
                >
                {isProcessing ? (
                    <svg
                    className="inline w-5 h-5 animate-spin fill-theme-200 dark:fill-theme-700"
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
        </div>
    );
}