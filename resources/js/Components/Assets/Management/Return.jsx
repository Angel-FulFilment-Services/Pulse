import { useState, useRef, useEffect } from 'react';
import TextAreaInput from '../../Forms/TextAreaInput';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { CheckIcon } from '@heroicons/react/20/solid';
import { toast } from 'react-toastify';
import { validateRequired, validateMatches } from '../../../Utils/Validation';
import SelectInput from '../../Forms/SelectInput';
import CheckboxInput from '../../Forms/CheckboxInput';
import ButtonControl from '../../Controls/ButtonControl';

const STATUS_OPTIONS = [
  { value: 'Functioning' },
  { value: 'Faulty' },
  { value: 'Damaged' },
  { value: 'Not Returned' },
];

export default function ReturnKit({ data, onCancel, goBack, refreshKit, refrehAssets, initialData = null }) {
    const { kit, history, items } = data || {}

    const RETIRE_OPTIONS = [
    { value: 'No' },
    { value: 'Yes' },
    ];

    const [formData, setFormData] = useState({
        statuses: items.reduce((acc, item) => {
        acc[item.asset_id] = '';
        return acc;
        }, {}),
        notes: '',
        attachments: [],
        retire: 'No',
        userId: null,
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

  // Add userId to formData based on currently assigned.
  useEffect(() => {
        let userId = null;
        history.forEach(event => {
            if (event.source === 'Issue') {
                if (event.status === 'Issued') {
                    userId = event.user_id;
                } else if (event.status === 'Returned') {
                    userId = null;
                }
            }
        });
        setFormData(prev => ({
            ...prev,
            userId: userId,
        }));
  }, [history])

  // Validation rules
  const validationRules = {
    // Dynamically checked for each asset below
    notes: [
      (value, extra) =>
        validateRequired(
          value,
          'Notes',
          {
            customMessage: 'Please give a short description of any faults and/or damage.',
            condition: () => extra && extra.anyFaultOrDamage,
          }
        ),
      (value) =>
        validateMatches(
          value,
          /^[a-zA-Z0-9\s.,'"\-()!?;:@#&%]*$/,
          null,
          {
            customMessage: 'Notes must contain only valid characters (letters, numbers, and common symbols).',
            condition: () => value.trim() !== '',
          }
        ),
    ],
    // Attachments: not required
  };

  // Validate function
  const validate = (fieldsToValidate, extra = {}) => {
    const newErrors = {};

    // Validate statuses for each asset
    items.forEach(item => {
      if (!formData.statuses[item.asset_id]) {
        newErrors[`status_${item.asset_id}`] = 'Required';
      }
    });

    // Validate other fields
    fieldsToValidate.forEach((field) => {
      const value = formData[field];
      const fieldRules = validationRules[field];
      if (fieldRules) {
        for (const rule of fieldRules) {
          const error = rule(value, extra);
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

    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleStatusChange = (asset_id, value) => {
    setFormData(prev => ({
      ...prev,
      statuses: { ...prev.statuses, [asset_id]: value[0]?.value || '' },
    }));
    setErrors(prev => ({
      ...prev,
      [`status_${asset_id}`]: undefined,
    }));
  };

  const handleNotesChange = value => {
    setFormData(prev => ({ ...prev, notes: value[0]?.value || '' }));
    setErrors(prev => ({ ...prev, notes: undefined }));
  };

  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleDragOver = (event) => event.preventDefault();

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  // Submission
  const handleSubmit = async () => {
    const anyFaultOrDamage = Object.values(formData.statuses).some(
      v => v === 'Faulty' || v === 'Damaged'
    );
    if (!validate(['notes'], { anyFaultOrDamage })) return;
    setIsProcessing(true);
    setIsSuccess(false);

    // Format arrays by status
    const statusArrays = {
      functioning: [],
      faulty: [],
      damaged: [],
      not_returned: [],
    };
    items.forEach(item => {
        const status = formData.statuses[item.asset_id];
        if (status && statusArrays[status.toLowerCase().replace(' ', '_')]) {
            statusArrays[status.toLowerCase().replace(' ', '_')].push(item.asset_id);
        }
    });

    // Prepare payload
    const payload = new FormData();
    payload.append('kit_id', kit.id);
    payload.append('notes', formData.notes);
    Object.entries(statusArrays).forEach(([status, arr]) => {
        arr.forEach((id, idx) => payload.append(`${status}[${idx}]`, id));
    });
    formData.attachments.forEach((file, idx) => {
      payload.append(`attachments[${idx}]`, file);
    });
    payload.append('retire', formData.retire === 'Yes' ? '1' : '0');
    payload.append('user_id', formData.userId || '');

    try {
      // Replace with your API endpoint
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
       const response = await fetch('/asset-management/kits/returns/process', {
        method: 'POST',
        headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {},
        body: payload,
      });

      if (!response.ok) {
        // Check if the response is a validation error (422)
        if (response.status === 422) {
            const errorData = await response.json();
            setErrors(errorData.errors); // Set validation errors
            throw new Error('Validation failed');
        }

        throw new Error('Failed to process equipment return');
      }

      setIsProcessing(false);
      setIsSuccess(true);
      toast.success('Equipment return submitted successfully!', { position: 'top-center' });
      setTimeout(() => {
        setIsSuccess(false);
        goBack?.();
      }, 1000);
    } catch (err) {
      setIsProcessing(false);
      setIsSuccess(false);
      toast.error('Failed to submit return. Please try again.', { position: 'top-center' });
    }
  };

  // Show notes/attachments if any item is faulty/damaged
  const showFaultSection = Object.values(formData.statuses).some(
    v => v === 'Faulty' || v === 'Damaged'
  );

    function getReturnStatus() {
        const statuses = Object.values(formData.statuses);
        if (statuses.every(s => s === 'Not Returned')) {
            return { label: 'No Items Returned', color: 'yellow' };
        }
        if (statuses.some(s => s === 'Faulty' || s === 'Damaged' || s === 'Not Returned')) {
            return { label: 'Attention Required', color: 'red' };
        }
        if (statuses.every(s => s === 'Functioning')) {
            return { label: 'All Items Returned', color: 'green' };
        }
        return { label: 'Pending', color: 'gray' };
    }

    const handlePassAll = () => {
        setFormData(prev => ({
            ...prev,
            statuses: items.reduce((acc, item) => {
            acc[item.asset_id] = 'Functioning';
            return acc;
            }, {}),
        }));
        // Optionally clear errors for statuses
        setErrors(prev => {
            const newErrors = { ...prev };
            items.forEach(item => {
            delete newErrors[`status_${item.asset_id}`];
            });
            return newErrors;
        });
    };

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="space-y-3 h-full relative">
        {/* Title */}
        <div className="border-b border-gray-900/10 dark:border-dark-50/10 pb-3 sticky top-0 z-10 bg-white dark:bg-dark-900 border-collapse flex items-center justify-between">
            <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-dark-100">
                Equipment Return for Kit: <span className="font-bold">{kit.alias}</span>
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-dark-400">
                Please review the condition of each item and provide details for any faults or damage.
                </p>
            </div>
            <div>
                {(() => {
                const status = getReturnStatus();
                let pillClass = "inline-flex items-center rounded-full px-6 py-1.5 text-sm font-medium ring-1 ring-inset ";
                if (status.color === 'green') pillClass += "bg-green-50 text-green-700 ring-green-600/20";
                else if (status.color === 'red') pillClass += "bg-red-50 text-red-700 ring-red-600/20";
                else if (status.color === 'yellow') pillClass += "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
                else pillClass += "bg-gray-100 text-gray-700 ring-gray-600/20";
                return <span className={pillClass}>{status.label}</span>;
                })()}
            </div>
        </div>

        {/* Asset Condition Checklist */}
        <div className="mt-4 w-full">
          <div className="flex flex-row items-center justify-between mb-2 w-full">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                Asset Condition Checklist
            </h3>
            <div>
                <ButtonControl
                    customClass="inline-flex justify-center items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 max-w-52 w-52 dark:bg-dark-900 dark:text-dark-100 dark:ring-dark-700 dark:hover:bg-dark-800"
                    buttonLabel="Mark All as Functioning"
                    onButtonClick={handlePassAll}
                    disabled={isProcessing || isSuccess}
                />
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {items.map(item => (
              <div key={item.asset_id} className="flex flex-row items-center justify-between py-1.5">
                <div className="w-1/2 lock text-sm font-base leading-6 text-gray-900 dark:text-dark-100">
                  - {item.asset_alias ? `${item.asset_alias} (${item.type})` : item.type} <span className="text-neutral-500 dark:text-dark-400 font-normal">(Required)</span>
                </div>
                <div className="max-w-52 w-full">
                  <SelectInput
                    id={`status_${item.asset_id}`}
                    items={STATUS_OPTIONS}
                    currentState={formData.statuses[item.asset_id]}
                    onSelectChange={value => handleStatusChange(item.asset_id, value)}
                    disabled={isProcessing || isSuccess}
                    error={errors[`status_${item.asset_id}`]}
                    placeholder="Select status"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retire Checkbox */}
        <div className="mt-3 w-full xl:w-2/3 flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-dark-100 mb-3">
                Retire any faulty / damage equipment
            </span>
            <div className="max-w-40 w-full">
                <SelectInput
                id="retire"
                items={RETIRE_OPTIONS}
                currentState={formData.retire}
                onSelectChange={value => setFormData(prev => ({ ...prev, retire: value[0]?.value || 'No' }))}
                disabled={isProcessing || isSuccess}
                placeholder=""
                />
            </div>
        </div>

        {/* Notes Section */}
        {showFaultSection && (
          <div className="mt-3 w-full border-t border-gray-200 dark:border-dark-700 pt-3">
            <TextAreaInput
              id="notes"
              label="Please give a short description of any faults and/or damage to the kit items"
              annotation="(Required)"
              rows={4}
              currentState={formData.notes}
              onTextChange={handleNotesChange}
              error={errors.notes}
              disabled={isProcessing || isSuccess}
              maxLength={500}
              warnMaxLength={true}
            />
          </div>
        )}

        {/* Attachments Section */}
        <div className="mt-3 w-full border-t border-gray-200 dark:border-dark-700 pt-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-2">Attach Supporting Files</h3>
        <div className="mt-2">
            {formData.attachments.length > 0 && (
            <ul className="mb-4">
                {formData.attachments.map((file, index) => (
                <li key={index} className="flex items-center justify-between text-sm text-gray-600 dark:text-dark-400">
                    <span>{file.name}</span>
                    <button
                    type="button"
                    className="text-theme-600 hover:underline"
                    onClick={() => handleRemoveAttachment(index)}
                    disabled={isProcessing || isSuccess}
                    >
                    Remove
                    </button>
                </li>
                ))}
            </ul>
            )}
            <div
            className="flex justify-center rounded-lg border border-dashed px-6 py-4 border-gray-900/25 dark:border-dark-50/25"
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
                    disabled={isProcessing || isSuccess}
                    />
                </label>
                <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-dark-400">PNG, JPG, GIF up to 10MB</p>
            </div>
            </div>
        </div>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="mt-6 flex items-center justify-end gap-x-6 w-full">
          <button
            type="button"
            className="text-sm font-semibold text-gray-900 dark:text-dark-100"
            onClick={onCancel}
            disabled={isProcessing}
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
              'Submit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}