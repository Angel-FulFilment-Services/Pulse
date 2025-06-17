import { useState, useRef, useEffect } from 'react';
import TextInput from '../../Forms/TextInput';
import SelectInput from '../../Forms/SelectInput';
import NumberInput from '../../Forms/NumberInput';
import { CheckIcon } from '@heroicons/react/20/solid';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { validateRequired, validateMatches } from '../../../Utils/Validation';
import useFetchKits from '../../Fetches/Assets/useFetchKits';
import ToggleInput from '../../Forms/ToggleInput';
import { ComputerDesktopIcon, XMarkIcon } from '@heroicons/react/24/solid';
import ButtonControl from '../../Controls/ButtonControl';
import isEmpty from 'lodash/isEmpty';

const types = [
    { id: 0, value: 'Class 1', tests: 
        [
            {label: 'Earth Bond Ω', limit: {high: 0.1}, item: 'earthBond'},
            {label: 'Insulation MΩ', limit: {low: 1}, item: 'insulation'}, 
            {label: 'Leakage mA', limit: {high: 5}, item: 'leakage'},
        ]
    },
    { id: 1, value: 'Class 2', tests: 
        [
            {label: 'Insulation MΩ', limit: {low: 2}, item: 'insulation'}, 
            {label: 'Leakage mA', limit: {high: 5}, item: 'leakage'}
        ]
    },
    { id: 2, value: 'Class 2 FE', tests: 
        [
            {label: 'Earth Bond Ω', limit: null, item: 'earthBond'},
            {label: 'Insulation MΩ', limit: {low: 2}, item: 'insulation'}, 
            {label: 'Leakage mA', limit: {high: 5}, item: 'leakage'}
        ]
    },
    { id: 3, value: 'Lead', tests: 
        [
            {label: 'Insulation MΩ', limit: {low: 1}, item: 'insulation'}, 
            {label: 'Continuity Ω', limit: {high: 0.1}, item: 'continuity'}
        ]
    },
    { id: 5, value: 'Visual Only' },
];

const visualCheckes = [
    { id: 0, value: 'Socket', item: 'socket' },
    { id: 1, value: 'Plug', item: 'plug' },
    { id: 2, value: 'Switch', item: 'switch' },
    { id: 3, value: 'Flex', item: 'flex' },
    { id: 4, value: 'Body', item: 'body' },
    { id: 5, value: 'Enviroment', item: 'environment' },
    { id: 5, value: 'Continued Use', item: 'continuedUse' },
];

export default function Pat({ assetId, onCancel, initialData = null, refreshAsset  }) {    
    const { kits } = useFetchKits();

    const [formData, setFormData] = useState({
        assetId: assetId || '',
        socket: false,
        plug: false,
        switch: false,
        flex: false,
        body: false,
        environment: false,
        continuedUse: false,
        earthBond: null,
        insulation: null,
        leakage: null,
        continuity: null,
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const validationRules = {
        type: [
        (value) =>
            validateRequired(value, 'Test Type', {
            customMessage: 'Please select the type of test for this asset.',
            condition: () => true, // Always validate type
            }),
        ],
        earthBond: [
        (value) =>
            validateRequired(value, 'Earth Bond Ω', {
            customMessage: 'Earth Bond Ω is required for this test.',
            condition: () => formData.type === 'Class 1',
            }),
        ],
        insulation: [
        (value) =>
            validateRequired(value, 'Insulation MΩ', {
            customMessage: 'Insulation MΩ is required for this test.',
            condition: () => formData.type === 'Class 1' || formData.type === 'Class 2' || formData.type === 'Class 2 FE' || formData.type === 'Lead',
            }),
        ],
        continuity: [
        (value) =>
            validateRequired(value, 'Continuity Ω', {
            customMessage: 'Continuity Ω is required for this test.',
            condition: () => formData.type === 'Lead',
            }),
        ],
        leakage: [
        (value) =>
            validateRequired(value, 'Leakage mA', {
            customMessage: 'Leakage mA is required for this test.',
            condition: () => formData.type === 'Class 1' || formData.type === 'Class 2' || formData.type === 'Class 2 FE',
            }),
        ],
    };

    useEffect(() => {
        // Reset test data when type changes
        setFormData((prev) => ({
            ...prev,
            earthBond: null,
            insulation: null,
            leakage: null,
            continuity: null,
            socket: false,
            plug: false,
            switch: false,
            flex: false,
            body: false,
            environment: false,
            continuedUse: false,
        }));
        setErrors({}); // Reset errors when type changes
    }, [formData.type]);

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

    const handleSubmit = async () => {            
        const isValid = validate(['type', 'earthBond', 'insulation', 'leakage', 'continuity']);
        if (!isValid) return;

        setIsProcessing(true);
        setIsSuccess(false);

        const payload = {
            ...formData,
            result: getTestStatus(),
        }

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            const response = await fetch('/asset-management/assets/pat-test/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken, // Include the CSRF token
                },
                body: JSON.stringify(payload), // Use FormData as the request body
            });

            if (!response.ok) {
            // Check if the response is a validation error (422)
            if (response.status === 422) {
                const errorData = await response.json();
                setErrors(errorData.errors); // Set validation errors
                throw new Error('Validation failed');
            }

            throw new Error('Failed to create PAT test');
            }

            refreshAsset(); // Refresh the asset data after successful submission

            // On success
            setIsProcessing(false);
            setIsSuccess(true);

            toast.success('This PAT test has been processed successfully!', {
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
            setIsSuccess(false);
            onCancel();
        } catch (error) {
            console.error(error);
            if (error.message !== 'Validation failed') {
                toast.error('This PAT test could not be processed, Please try again.', {
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

    const handleCancel = () => {
        // Reset form data
        setFormData({
            assetId: assetId || '', 
            earthBond: null,
            insulation: null,
            leakage: null,
            continuity: null,
            socket: false,
            plug: false,
            switch: false,
            flex: false,
            body: false,
            environment: false,
            continuedUse: false,
        });
        onCancel();
    }

    function getTestStatus() {
        // Check all visual checks
        const allVisualPassed = visualCheckes.every(item => formData[item.item] === true);

        // Get the current type's tests
        const typeObj = types.find(t => t.value === formData.type);
        let allTypePassed = true;

        if (typeObj && typeObj.tests) {
            allTypePassed = typeObj.tests.every(test => {
                const value = formData[test.item];
                if (test.limit?.high !== undefined) {
                    // Should be less than high
                    return value !== null && value !== undefined && (!isNaN(Number(value)) && Number(value) <= test.limit.high || value === `<${test.limit.high}`);
                }
                if (test.limit?.low !== undefined) {
                    // Should be greater than low
                    return value !== null && value !== undefined && (!isNaN(Number(value)) && Number(value) >= test.limit.low || value === `>${test.limit.low}`);
                }
                // If no limit, just check it's not empty
                return !test.limit || (value !== null && value !== undefined && value !== '');
            });
        }

        return allVisualPassed && allTypePassed ? 'pass' : 'fail';
    }

    return (
        <div className="w-full h-full max-h-full overflow-y-auto">
            <div className="space-y-6 h-full  justify-between flex flex-col">
                {/* Title Field */}
                <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-6">
                    <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-2 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-dark-100">
                                Process PAT Test
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                                Please fill in the details below to process the PAT test for this asset.
                            </p>
                        </div>
                        <div>
                            {getTestStatus() === 'pass' ? (
                                <span className="inline-flex items-center rounded-full bg-green-50 px-10 py-1.5 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                    Pass
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-red-50 px-10 py-1.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                    Fail
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 w-full xl:w-2/3">
                        <div className="sm:col-span-3 sm:row-start-1">
                            <TextInput
                                id="alias"
                                label="Asset ID"
                                placeholder="Please enter an ID"
                                currentState={formData.assetId}
                                disabled={true}
                            />
                        </div>
                        <div className="sm:col-span-3 sm:row-start-1">
                            <SelectInput
                                id="type"
                                label="Test Type"
                                annotation="(Required)"
                                currentState={formData.type}
                                items={types}
                                error={errors.type}
                                onSelectChange={(value) => handleInputChange('type', value[0].value)}
                                placeholder="Select a type of asset"
                            />
                        </div>
                        {formData.type ? (
                            <>
                                <div className="sm:col-span-6 sm:row-start-2 w-full gap-y-3 flex flex-col divide-y divide-gray-200 dark:divide-dark-600">
                                    <div className="w-full flex flex-row items-center">
                                        <p className="w-full">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                                                Visual Checks
                                            </span>
                                        </p>
                                        <div>
                                            <ButtonControl
                                                Icon={CheckIcon} 
                                                iconClass="h-5 w-5 text-gray-500 dark:text-gray-600 flex-shrink-0 -ml-2" 
                                                customClass="inline-flex justify-center items-center rounded-md bg-white px-6 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-max" 
                                                buttonLabel="Pass All" 
                                                onButtonClick={() => {
                                                    visualCheckes.forEach(item => {
                                                        handleInputChange(item.item, true);
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ul className="flex flex-col gap-y-2 w-full pt-3">
                                        { visualCheckes.map((item, index) => (
                                            <li key={index} className="w-full flex flex-col pr-1">
                                                <ToggleInput 
                                                    id={`visual-check-${item.value}`}
                                                    label={`- ${item.value}`}
                                                    labelInline={true}
                                                    checkedIcon={
                                                        <svg className="h-3 w-3 text-theme-600 dark:text-theme-700" fill="currentColor" viewBox="0 0 12 12">
                                                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                                                        </svg>
                                                    }
                                                    uncheckedIcon={
                                                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                                                            <path
                                                            d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    }
                                                    checked={formData[item.item]}
                                                    onChange={(value) => { handleInputChange(item.item, value)}}
                                                    error={errors.kit}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                { formData.type !== 'Visual Only' ? 
                                    (
                                        <div className="sm:col-span-6 sm:row-start-3 w-full gap-y-3 flex flex-col divide-y divide-gray-200 dark:divide-dark-600">
                                            <div className="w-full flex flex-row items-center">
                                                <p className="w-full">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                                                        {formData.type} Tests
                                                    </span>
                                                </p>
                                                <div>
                                                    <ButtonControl
                                                        Icon={CheckIcon} 
                                                        iconClass="h-5 w-5 text-gray-500 dark:text-gray-600 flex-shrink-0 -ml-2" 
                                                        customClass="inline-flex justify-center items-center rounded-md bg-white px-6 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 w-max" 
                                                        buttonLabel="Pass All" 
                                                        onButtonClick={() => {
                                                            types.find(item => item.value === formData.type)?.tests?.forEach(test => {
                                                                if (test.item) {
                                                                    handleInputChange(test.item, test.limit?.high !== undefined ? `<${test.limit.high}` : test.limit?.low !== undefined ? `>${test.limit.low}` : null);
                                                                }
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <ul className="flex flex-col gap-y-2 w-full pt-3">
                                                { types.find(item => item.value === formData.type)?.tests?.map((item, index) => (
                                                    <li key={index} className="w-full flex flex-row items-center pr-1">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 w-full">
                                                            <div className="w-full max-w-xs flex-1">
                                                                <NumberInput
                                                                    id={item.label.toLowerCase().replace(/\s+/g, '-')}
                                                                    high={999}
                                                                    low={-999}
                                                                    label={`${item.label}`}
                                                                    placeholder={`Enter ${item.label} value`}
                                                                    currentState={formData[item.item]}
                                                                    error={errors[item.item]}
                                                                    onTextChange={(value) => handleInputChange(item.item, value[0].value)}
                                                                    annotation={item.limit ? `Limit: ${item.limit.low ? `≥ ${item.limit.low}` : ''} ${item.limit.high ? `≤ ${item.limit.high}` : ''}` : '(Optional)'}
                                                                />
                                                            </div>
                                                            {item.limit ? (
                                                                <div className="w-full flex items-center sm:mt-8 justify-end">
                                                                    <ToggleInput 
                                                                        id={`visual-check-${item.value}`}
                                                                        checkedIcon={
                                                                            <svg className="h-3 w-3 text-theme-600 dark:text-theme-700" fill="currentColor" viewBox="0 0 12 12">
                                                                                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                                                                            </svg>
                                                                        }
                                                                        uncheckedIcon={
                                                                            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                                                                                <path
                                                                                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                                                                                stroke="currentColor"
                                                                                strokeWidth={2}
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                />
                                                                            </svg>
                                                                        }
                                                                        uncheckedStyle={
                                                                            formData[item.item] !== null && !isEmpty(formData[item.item]) ? "bg-red-600" : null
                                                                        }
                                                                        checked={
                                                                            (item.limit?.high !== undefined && formData[item.item] !== null && !isEmpty(formData[item.item]) && (formData[item.item] === `<${item.limit.high}` || formData[item.item] <= item.limit.high)) ||
                                                                            (item.limit?.low !== undefined && formData[item.item] !== null && !isEmpty(formData[item.item]) && (formData[item.item] === `>${item.limit.low}` || formData[item.item] >= item.limit.low))
                                                                        }
                                                                        onChange={(value) => {
                                                                            if (value) {
                                                                                if (item.limit?.high !== undefined) {
                                                                                    handleInputChange(item.item, `<${item.limit.high}`);
                                                                                } else if (item.limit?.low !== undefined) {
                                                                                    handleInputChange(item.item, `>${item.limit.low}`);
                                                                                }
                                                                            } else {
                                                                                if (item.limit?.high !== undefined) {
                                                                                    handleInputChange(item.item, `>${item.limit.high}`);
                                                                                } else if (item.limit?.low !== undefined) {
                                                                                    handleInputChange(item.item, `<${item.limit.low}`);
                                                                                }
                                                                            }
                                                                        }}
                                                                        error={errors.kit}
                                                                    />
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null
                                }
                            </>    
                        ) : (
                            <div className="mt-3 flex flex-col gap-y-4 gap-x-8 w-full sm:col-span-6 sm:row-start-2">
                                <div className="w-full">
                                    <div className="w-full border-t border-gray-900/10 dark:border-dark-50/10 pt-6">
                                        {/* Leave this section blank for now */}
                                        <div className='flex items-center justify-center h-full w-full'>
                                            <div className="flex items-center justify-center h-full w-full flex-col gap-y-0">
                                                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-gray-500 dark:text-dark-500 bg-gray-100 dark:bg-dark-800/20 ring ring-gray-600/20 dark:ring-dark-400/20 mb-2">
                                                    <ComputerDesktopIcon className="h-12 w-12 text-gray-500" />
                                                </div>
                                                <h1 className="text-xl mt-1 font-bold text-gray-900 dark:text-dark-100">
                                                    Select Type of Test
                                                </h1>
                                                <p className="mt-2 text-base text-gray-600 dark:text-dark-400">
                                                    Please select the type of test to see the required fields.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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