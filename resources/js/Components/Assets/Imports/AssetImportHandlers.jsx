import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Expected CSV columns in order:
 * afs_id, alias, type, make, model, status, acq_date, supplier,
 * pat_class, pat_vi_socket, pat_vi_plug, pat_vi_switch, pat_vi_flex,
 * pat_vi_body, pat_vi_environment, pat_vi_continued_use, pat_ins_resis,
 * pat_earth_cont, pat_polarity, pat_leakage, pat_continuity, pat_result,
 * pat_comments, kit_alias
 */

/**
 * Validates and processes a CSV file for asset import, then shows preview
 * @param {File} file - The CSV file to import
 * @param {Function} onPreviewReady - Callback when preview is ready
 * @param {AbortController} abortController - Optional abort controller
 * @param {Function} setProgress - Optional progress callback
 * @returns {Promise<Object>} - The preview data
 */
export async function handleAssetImportPreview(file, onPreviewReady, abortController = null, setProgress = () => {}) {
    if (!(file instanceof File)) {
        toast.error('No valid file provided for import.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
        });
        throw new Error('No valid file provided for import.');
    }

    const controller = abortController || new AbortController();

    try {
        // Show loading toast
        const loadingToast = toast.loading('Processing CSV file...', {
            position: 'top-center',
        });

        setProgress(5);

        // 1. Read file as text
        const text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });

        setProgress(15);

        // 2. Process lines and validate structure
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) {
            toast.update(loadingToast, {
                render: 'CSV file is empty.',
                type: 'error',
                isLoading: false,
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            throw new Error('CSV file is empty.');
        }

        // Check if first line is header and remove it
        const firstLine = lines[0];
        const hasHeader = firstLine.toLowerCase().includes('afs_id') || firstLine.toLowerCase().includes('alias');
        const dataLines = hasHeader ? lines.slice(1) : lines;

        if (dataLines.length === 0) {
            toast.update(loadingToast, {
                render: 'CSV file contains only headers, no data rows found.',
                type: 'error',
                isLoading: false,
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            throw new Error('No data rows found in CSV file.');
        }

        setProgress(25);
        toast.update(loadingToast, { render: 'Validating CSV structure...' });

        // 3. Validate structure on first data line
        const firstDataColumns = dataLines[0].split(',').map(col => col.replace(/^"(.*)"$/, '$1').trim());
        
        // Expected minimum columns for basic validation
        const expectedColumnCount = 24; // All columns including optional ones
        
        if (firstDataColumns.length < 3) { // At minimum need afs_id, alias, type
            toast.update(loadingToast, {
                render: 'Structure error: CSV must have at least 3 columns (afs_id, alias, type).',
                type: 'error',
                isLoading: false,
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            throw new Error('Structure error: CSV must have at least 3 columns (afs_id, alias, type).');
        }

        // Check required field: type (column 3)
        if (!firstDataColumns[2] || firstDataColumns[2].trim() === '') {
            toast.update(loadingToast, {
                render: 'Structure error: Asset type (Column 3) is required and cannot be empty.',
                type: 'error',
                isLoading: false,
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            throw new Error('Structure error: Asset type (Column 3) is required and cannot be empty.');
        }

        setProgress(35);
        toast.update(loadingToast, { render: 'Processing data rows...' });

        // 4. Process and clean all data lines
        const processedData = [];
        const errors = [];
        const seen = new Set();

        dataLines.forEach((line, idx) => {
            const rowNumber = idx + 1;
            let columns = line.split(',').map(col => col.replace(/^"(.*)"$/, '$1').trim());

            // Pad columns to expected length with empty strings
            while (columns.length < expectedColumnCount) {
                columns.push('');
            }

            // Check for duplicates based on alias or afs_id
            const afsId = columns[0];
            const alias = columns[1];
            const duplicateKey = alias || afsId || `row_${rowNumber}`;
            
            if (duplicateKey !== `row_${rowNumber}` && seen.has(duplicateKey)) {
                errors.push(`Row ${rowNumber}: Duplicate entry found for ${alias ? `alias '${alias}'` : `AFS ID '${afsId}'`}`);
                return;
            }
            
            if (duplicateKey !== `row_${rowNumber}`) {
                seen.add(duplicateKey);
            }

            // Basic validation
            if (!columns[2]) { // type is required
                errors.push(`Row ${rowNumber}: Asset type is required`);
                return;
            }

            processedData.push(columns);
        });

        setProgress(50);
        toast.update(loadingToast, { render: 'Preparing data...' });

        // 5. Create FormData for backend
        const formData = new FormData();
        
        // Create a new CSV content without headers
        const csvContent = processedData.map(row => row.join(',')).join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('csv_file', csvBlob, 'assets_import.csv');

        setProgress(70);
        toast.update(loadingToast, { render: 'Uploading...' });

        // 6. Send to backend for preview
        const response = await axios.post(
            '/asset-management/assets/batch-import/preview',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: controller.signal,
            }
        );

        setProgress(100);
        toast.update(loadingToast, {
            render: 'Preview generated successfully!',
            type: 'success',
            isLoading: false,
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
        });

        const previewData = {
            ...response.data.preview,
            frontend_errors: errors,
            total_rows: processedData.length,
            file_name: file.name
        };

        // Show preview modal
        onPreviewReady(previewData, processedData);

        return previewData;

    } catch (error) {
        if (axios.isCancel(error)) {
            toast.info('Import preview request aborted.', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        } else {
            toast.error(`Error processing CSV file: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
            console.error('Error processing CSV for preview:', error);
        }
        throw error;
    }
}

/**
 * Executes the actual import after user confirms the preview
 * @param {Array} processedData - The processed CSV data
 * @param {AbortController} abortController - Optional abort controller
 * @param {Function} setProgress - Optional progress callback
 * @returns {Promise<Object>} - The import results
 */
export async function executeAssetImport(processedData, abortController = null, setProgress = () => {}) {
    const controller = abortController || new AbortController();

    try {
        setProgress(10);

        // Create FormData with the processed data
        const formData = new FormData();
        const csvContent = processedData.map(row => row.join(',')).join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('csv_file', csvBlob, 'assets_import.csv');

        setProgress(30);

        // Send to backend for actual import
        const response = await axios.post(
            '/asset-management/assets/batch-import',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: controller.signal,
            }
        );

        setProgress(100);

        const { created = 0, updated = 0, retired = [], errors = [] } = response.data.results;
        const total = created + updated;
        let message = `Asset import completed successfully. ${total} assets processed`;

        if (retired.length > 0) {
            message += `, ${retired.length} assets retired`;
        }

        if (errors.length > 0) {
            message += ` with ${errors.length} error${errors.length > 1 ? 's' : ''}.`;
        } else {
            message += '.';
        }

        toast.success(message, {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'light',
        });

        // Dispatch event to refresh asset data
        window.dispatchEvent(new Event('refreshAssets'));

        return response.data;

    } catch (error) {
        if (axios.isCancel(error)) {
            toast.info('Import request aborted.', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        } else {
            toast.error(`Error executing import: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
            console.error('Error executing asset import:', error);
        }
        throw error;
    }
}