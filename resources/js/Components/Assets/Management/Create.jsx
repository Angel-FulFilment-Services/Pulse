import { useState, useRef, useEffect } from 'react';
import TextInput from '../../Forms/TextInput';
import SelectInput from '../../Forms/SelectInput';
import ComboInput from '../../Forms/ComboInput';
import CheckboxGroupInput from '../../Forms/CheckboxGroupInput';
import { CheckIcon } from '@heroicons/react/20/solid';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { validateRequired, validateMatches } from '../../../Utils/Validation';
import useFetchKits from '../../Fetches/Assets/useFetchKits';

const types = [
    { id: 'generic', value: 'Generic' },
    { id: 'desktop_computer', value: 'Desktop Computer' },
    { id: 'monitor', value: 'Monitor' },
    { id: 'headset', value: 'Headset' },
    { id: 'power_lead', value: 'Power Lead' },
    { id: 'laptop_charger', value: 'Laptop Charger' },
    { id: 'telephone', value: 'Telephone' },
    { id: 'laptop', value: 'Laptop' },
    { id: 'furniture', value: 'Furniture' },
    { id: 'peripherals', value: 'Peripherals' },
    { id: 'usb_power_cable', value: 'USB Power Cable' },
    { id: 'patch_lead', value: 'Patch Lead' },
    { id: 'network_cable', value: 'Network Cable' },
].sort((a, b) => a.value.localeCompare(b.value));

const items = [
    { value: 1, label: '1m CAT5e Network Cable' },
    { value: 2, label: '10m CAT5e Network Cable' },
    { value: 3, label: '1m USB Power Cable' },
    { value: 4, label: 'USB Mouse' }
];

export default function Create({ assetId, onCancel, initialData = null }) {    
    const { kits } = useFetchKits();

    const [formData, setFormData] = useState({
        assetId: assetId || '',
        alias: '',
        type: '',
        make: '',
        model: '',
        kit: '',
        items: null,
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const [createKit, setCreateKit] = useState(false);

    const validationRules = {
        alias: [
        (value) =>
            validateRequired(value, 'alias', {
            customMessage: 'Please enter an alias.',
            }),
        ],
        make: [
        (value) =>
            validateMatches(value, /^[a-zA-Z0-9\s.,'"\-()!?;:@#&%]*$/, null, {
            customMessage: 'Make must contain only valid characters (letters, numbers, and common symbols).',
            condition: () => value.trim() !== '', // Only validate if the field is not empty
            }),
        ],
        model: [
        (value) =>
            validateMatches(value, /^[a-zA-Z0-9\s.,'"\-()!?;:@#&%]*$/, null, {
            customMessage: 'Model must contain only valid characters (letters, numbers, and common symbols).',
            condition: () => value.trim() !== '', // Only validate if the field is not empty
            }),
        ],
        kit: [
            (value) =>
                validateMatches(value, /^[a-zA-Z0-9\s.,'"\-()!?;:@#&%]*$/, null, {
                customMessage: 'Kit name must contain only valid characters (letters, numbers, and common symbols).',
                condition: () => value.trim() !== '', // Only validate if the field is not empty
                }),
            ],
    };

    // Populate form data if initialData is provided
    useEffect(() => {
        if (initialData) {
            setFormData({
                assetId: initialData.assetId || assetId || '',
                alias: initialData.category || '',
            });
        }
    }, [initialData]);

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

    const handleKitChange = (field, value) => {
        setCreateKit(value === 'CREATE');
        if (value === 'CREATE'){
            setFormData((prev) => ({
                ...prev,
                items: items.map(item => item.value) // Reset items to default
            }));
            setErrors((prev) => ({
                ...prev,
                [field]: undefined, // Clear the error for the field when it changes
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: undefined, // Clear the error for the field when it changes
        }));
    }

    const handleSubmit = async () => {            
        const isValid = validate(['alias', 'make', 'model', 'kit']);
        if (!isValid) return;

        // Set processing state
        setIsProcessing(true);
        setIsSuccess(false);

        console.log('Submitting form data:', JSON.stringify(formData));

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            const response = await fetch('/asset-management/assets/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken, // Include the CSRF token
                },
                body: JSON.stringify(formData), // Use FormData as the request body
            });

            if (!response.ok) {
            // Check if the response is a validation error (422)
            if (response.status === 422) {
                const errorData = await response.json();
                setErrors(errorData.errors); // Set validation errors
                throw new Error('Validation failed');
            }

            throw new Error('Failed to create asset');
            }

            // On success
            setIsProcessing(false);
            setIsSuccess(true);

            toast.success('Asset has been created successfully!', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });

            // Wait 3 seconds before triggering onCancel
            setTimeout(() => {
                setIsSuccess(false);
                onCancel();
            }, 1000);
        } catch (error) {
            console.error(error);
            if (error.message !== 'Validation failed') {
                toast.error('Asset could not be created, Please try again.', {
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
            assetId: assetId || '', 
            alias: '',
            type: '',
            make: '',
            model: '',
            kit: '',
            items: null,
        });
        onCancel();
    }

    return (
        <div className="w-full h-full max-h-full overflow-y-auto">
            <div className="space-y-6 h-full  justify-between flex flex-col">
                {/* Title Field */}
                <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-6">
                    <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-2">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-dark-100">
                            Create an Asset
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                            Please fill out the form below with the required information.
                        </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 w-full">
                        <div className="sm:col-span-3">
                            <TextInput
                                id="alias"
                                label="Asset ID"
                                placeholder="Please enter an ID"
                                currentState={formData.assetId}
                                disabled={true}
                            />
                        </div>
                        <div className="sm:col-span-3 sm:row-start-2">
                            <TextInput
                                id="alias"
                                label="Alias"
                                annotation="(Required)"
                                placeholder="Please enter an alias"
                                currentState={formData.alias}
                                onTextChange={(value) => handleInputChange('alias', value[0].value)}
                                onBlur={() => validate(['alias'])}
                                error={errors.alias}
                            />
                        </div>
                        <div className="sm:col-span-3 sm:row-start-2">
                            <SelectInput
                                id="type"
                                label="Type"
                                annotation="(Optional)"
                                currentState={formData.type}
                                items={types}
                                onSelectChange={(value) => handleInputChange('type', value[0].value)}
                                placeholder="Select a type of asset"
                            />
                        </div>
                        <div className="sm:col-span-3 sm:row-start-3">
                            <TextInput
                                id="make"
                                label="Make"
                                annotation="(Optional)"
                                placeholder="Please enter a make"
                                currentState={formData.make}
                                onTextChange={(value) => handleInputChange('make', value[0].value)}
                                onBlur={() => validate(['make'])}
                                error={errors.make}
                            />
                        </div>
                        <div className="sm:col-span-3 sm:row-start-3">
                            <TextInput
                                id="model"
                                label="Model"
                                annotation="(Optional)"
                                placeholder="Please enter a model"
                                currentState={formData.model}
                                onTextChange={(value) => handleInputChange('model', value[0].value)}
                                onBlur={() => validate(['model'])}
                                error={errors.model}
                            />
                        </div>
                        <div className="sm:col-span-3 sm:row-start-4">
                            <ComboInput
                                id="kit"
                                label="Is this asset part of a kit?"
                                annotation="(Optional)"
                                uppercase={true}
                                currentState={formData.kit}
                                items={kits.map(kit => ({ id: kit.id, value: kit.alias }))}
                                onComboChange={(value) => handleKitChange('kit', value[0].value.toUpperCase())}
                                onBlur={() => {validate(['kit'])}}
                                placeholder="Enter a kit name or select from the list"
                                error={errors.kit}
                                confirmed={createKit}
                                action={!createKit ? 
                                    {
                                        value: 'create',
                                        item: <>
                                                <span className={'block truncate'}>Create new kit: ({formData.kit})</span>
                                                <span className={'absolute inset-y-0 right-0 flex items-center pr-4 text-theme-600 dark:text-theme-700'}>
                                                    <PlusCircleIcon className="h-6 w-6" aria-hidden="true" />
                                                </span>
                                            </>
                                    } : null
                                }
                            />
                        </div>
                        { createKit && (
                            <div className="sm:col-span-3 sm:row-start-5">
                                <CheckboxGroupInput
                                    id="items"
                                    label="Add these generic items to the kit?"
                                    annotation="(Optional)"
                                    items={items || []}
                                    selectedItems={formData.items || items.map(item => item.value) }
                                    onChange={(selectedItems) => { handleInputChange('items', selectedItems)}}
                                    error={errors.items}
                                />
                            </div>
                         )}
                    </div>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="mt-6 flex items-center justify-end gap-x-6 w-full">
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