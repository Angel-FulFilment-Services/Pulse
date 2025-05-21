import { useState, useRef, useEffect } from 'react';
import TextInput from '../../Forms/TextInput';
import TextAreaInput from '../../Forms/TextAreaInput';
import TimeInput from '../../Forms/TimeInput';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { CheckIcon } from '@heroicons/react/20/solid';
import { toast } from 'react-toastify';
import { validateRequired, validateMatches } from '../../../Utils/Validation';

export default function SupportForm({ hrId, allowSupportManagement, onCancel, initialData = null }) {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        started: { hour: pad(now.getHours()), minute: pad(now.getMinutes()) },
        ended: { hour: pad(now.getHours()), minute: pad(now.getMinutes()) },
        attachments: [],
        eventID: null,
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const fileInputRef = useRef(null);

    const validationRules = {
        title: [
        (value) =>
            validateRequired(value, 'Title', {
            customMessage: 'Please enter a title.',
            }),
        ],
        started: [
        (value) =>
            validateRequired(value.hour && value.minute, 'Time', {
            customMessage: 'Please select a time.',
            }),
        ],
        ended: [
        (value) =>
            validateRequired(value.hour && value.minute, 'Time', {
            customMessage: 'Please select a time.',
            }),
        ],
        description: [
        (value) =>
            validateMatches(value, /^[a-zA-Z0-9\s.,'"\-()!?;:@#&%]*$/, null, {
            customMessage: 'Notes must contain only valid characters (letters, numbers, and common symbols).',
            condition: () => value.trim() !== '', // Only validate if the field is not empty
            }),
        ],
    };

    // Populate form data if initialData is provided
    useEffect(() => {
        const loadAttachments = async () => {
        if (initialData) {
            const attachments = await Promise.all(
            (initialData.attachments || []).map(async (attachment) => {
                const response = await fetch(attachment.path); // Fetch the file from the server
                const blob = await response.blob(); // Convert the response to a Blob
                return new File([blob], attachment.original_name, { type: blob.type }); // Create a File object
            })
            );

            setFormData({
            title: initialData.category || '',
            description: initialData.notes || '',
            started: initialData.started || { hour: '', minute: '' },
            ended: initialData.ended || { hour: '', minute: '' },
            attachments: attachments, // Set the attachments as File objects
            eventID: initialData.id || null,
            });
        }
        };

        loadAttachments();
    }, [initialData]);

    useEffect(() => {
        if(formData.started.hour > formData.ended.hour || (formData.started.hour === formData.ended.hour && formData.started.minute > formData.ended.minute)){
            setFormData((prev) => ({
                ...prev,
                ended: { hour: formData.started.hour, minute: formData.started.minute },
            }));
        }
    }, [formData.started])

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

    const handleAttachmentUpload = (event) => {
        const files = Array.from(event.target.files);
        setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...files],
        }));

        if (fileInputRef.current) {
        fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = (index) => {
        setFormData((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();

        const files = Array.from(event.dataTransfer.files);
        setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...files],
        }));
    };

    const handleSubmit = async () => {
        // Validate all fields
        if (!allowSupportManagement) {
            toast.error('You do not have permission to update the support log.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
            });
            return;
        }
            
        const isValid = validate(['title', 'started', 'ended', 'description']);
        if (!isValid) return;

        // Set processing state
        setIsProcessing(true);
        setIsSuccess(false);

        try {
            // Make the POST request to the API
            const formDataPayload = new FormData();

            // Append text fields to FormData
            formDataPayload.append('title', formData.title);
            formDataPayload.append('description', formData.description);
            formDataPayload.append('started[hour]', formData.started.hour);
            formDataPayload.append('started[minute]', formData.started.minute);
            formDataPayload.append('ended[hour]', formData.ended.hour);
            formDataPayload.append('ended[minute]', formData.ended.minute);
            formDataPayload.append('hrID', hrId);
            if (initialData) {
                formDataPayload.append('eventID', formData.eventID);
            }
        
            // Append attachments to FormData
            formData.attachments.forEach((file, index) => {
                formDataPayload.append(`attachments[${index}]`, file);
            });
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            const response = await fetch('/asset-management/support/events/save', {
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

            throw new Error('Failed to save absence event');
            }

            // On success
            setIsProcessing(false);
            setIsSuccess(true);

            toast.success('Support log has been updated successfully!', {
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
            window.dispatchEvent(new Event('refreshEvents'));

            // Wait 3 seconds before triggering onCancel
            setTimeout(() => {
                setIsSuccess(false);
                onCancel();
            }, 1000);
        } catch (error) {
            console.error(error);
            if (error.message !== 'Validation failed') {
                toast.error('Support log could not be updated, Please try again.', {
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
            title: '',
            description: '',
            started: { hour: pad(now.getHours()), minute: pad(now.getMinutes()) },
            ended: { hour: pad(now.getHours()), minute: pad(now.getMinutes()) },
            attachments: [],
            eventID: null,
        });
        onCancel();
    }

    return (
        <div className="w-full h-full max-h-[50rem] overflow-y-auto">
            <div className="space-y-6 h-full">
                {/* Title Field */}
                <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-6">
                <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-2">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-dark-100">
                    {initialData ? 'Edit Support Record' : 'Create Support Record'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                    {initialData
                        ? 'Update the details of the support record below.'
                        : 'Please fill out the form below with the required information.'}
                    </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 w-full xl:w-2/3">
                    <div className="sm:col-span-2">
                        <TextInput
                            id="title"
                            label="Title"
                            annotation="(required)"
                            placeholder="Enter the title"
                            currentState={formData.title}
                            onTextChange={(value) => handleInputChange('title', value[0].value)}
                            onBlur={() => validate(['title'])}
                            error={errors.title}
                        />
                    </div>

                    {/* Description Field */}
                    <div className="sm:col-span-4">
                        <TextAreaInput
                            id="description"
                            label="Description"
                            height={"h-auto"}
                            placeholder="Enter a detailed description"
                            annotation={`(${formData.description.length}/500 characters)`}
                            rows={4}
                            currentState={formData.description}
                            onTextChange={(value) => handleInputChange('description', value[0].value)}
                            onBlur={() => validate(['description'])}
                            maxLength={500}
                            error={errors.description}
                        />
                    </div>

                    {/* Started Time Field */}
                    <div className="sm:row-start-2 sm:col-span-3">
                    <TimeInput
                        id="started"
                        label="Started"
                        startTime="08:00"
                        endTime="21:59"
                        annotation="(required)"
                        currentState={formData.started}
                        onTimeChange={(value) => handleInputChange('started', value)}
                        error={errors.started}
                    />
                    </div>

                    {/* Ended Time Field */}
                    <div className="sm:row-start-2 sm:col-span-3">
                    <TimeInput
                        id="ended"
                        label="Ended"
                        startTime={`${formData.started.hour}:${formData.started.minute})`}
                        endTime="21:59"
                        annotation="(required)"
                        currentState={formData.ended}
                        onTimeChange={(value) => handleInputChange('ended', value)}
                        error={errors.ended}
                    />
                    </div>

                    {/* Attachments Field */}
                    <div className="col-span-full">
                    <label htmlFor="attachments" className="block text-sm font-medium text-gray-900 dark:text-dark-100">
                        Attachments
                    </label>
                    <div className="mt-2">
                        {/* Display Uploaded Attachments */}
                        {formData.attachments.length > 0 && (
                        <ul className="mb-4">
                            {formData.attachments.map((file, index) => (
                            <li key={index} className="flex items-center justify-between text-sm text-gray-600 dark:text-dark-400">
                                <span>{file.name}</span>
                                <button
                                type="button"
                                className="text-theme-600 hover:underline"
                                onClick={() => handleRemoveAttachment(index)}
                                >
                                Remove
                                </button>
                            </li>
                            ))}
                        </ul>
                        )}

                        {/* Drag-and-Drop Zone */}
                        <div
                        className={`flex justify-center rounded-lg border border-dashed px-6 py-4 border-gray-900/25 dark:border-dark-50/25`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        >
                            <div className="text-center">
                                <PhotoIcon aria-hidden="true" className="mx-auto h-12 w-12 text-gray-300 dark:text-dark-600" />
                                <div className="mt-4 flex text-sm text-gray-600">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md bg-white dark:bg-dark-900 font-semibold text-theme-600 dark:text-theme-700 focus-within:ring-2 focus-within:ring-theme-600 dark:focus-within:ring-theme-700 focus-within:ring-offset-2 hover:text-theme-500 dark:hover:text-theme-500"
                                >
                                    <span>Upload a file</span>
                                    <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/png, image/gif, image/jpeg, image/jpg"
                                    multiple
                                    onChange={handleAttachmentUpload}
                                    ref={fileInputRef}
                                    />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-dark-400">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="mt-6 flex items-center justify-end gap-x-6 w-full xl:w-2/3">
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