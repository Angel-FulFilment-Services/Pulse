import axios from 'axios';
import { toast } from 'react-toastify';
import { isValid, parse, format, subMonths } from 'date-fns';

/**
 * Handles importing a CSV file, cleaning the first column, sending it to the backend, and returning the parsed data.
 * @param {File} file - The CSV file to import.
 * @param {AbortController} abortController - Optional abort controller.
 * @param {Function} setProgress - Optional progress callback.
 * @returns {Promise<Object>} - The backend response (e.g., parsed table data).
 */
export async function handleGrossPayImport(file, abortController = null, setProgress = () => {}, setIsDialogOpen = () => {}) {
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
        let interval;
        setProgress(5);

        // 1. Read file as text
        const text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });

        setProgress(12);

        // 2. Process each line, validate structure, and clean
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) {
            toast.error('CSV file is empty.', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
            throw new Error('CSV file is empty.');
        }

        // Structure check on the first line only
        const firstColumns = lines[0].split(',');

        // Check column 1: String (not empty)
        const empId = firstColumns[0] ? firstColumns[0].split('-')[0].replace(/\D/g, '') : '';
        if (!empId) {
            throw new Error('Structure error: Employee ID (Column 1) is missing or invalid.');
        }

        // Check column 2: Date (dd/MM/yyyy)
        const payrollDate = firstColumns[1] || '';
        let parsedDate;
        try {
            parsedDate = parse(payrollDate, 'dd/MM/yyyy', new Date());
            if (isNaN(parsedDate) || payrollDate.length !== 10) throw new Error();
        } catch {
            throw new Error('Structure error: Payroll Date (Column 2) is missing or invalid.');
        }

        // Check column 7: Numeric
        const grossPayPreSacrifice = firstColumns[6];
        if (isNaN(Number(grossPayPreSacrifice))) {
            throw new Error('Structure error: Gross Pay Pre Sacrifice (Column 7) is not numeric.');
        }

        // ...continue with the rest of your import logic for all lines...
        // (no need to repeat structure checks for other lines)
        const seen = new Set();
        const errors = [];
        const cleanedLines = [];

        lines.forEach((line, idx) => {
            const columns = line.split(',');

            // Remove duplicates based on empId and payrollDate
            const empId = columns[0] ? columns[0].split('-')[0].replace(/\D/g, '') : '';
            const payrollDate = columns[1] || '';
            const key = `${empId}|${payrollDate}`;
            if (seen.has(key)) return;
            seen.add(key);

            // Clean first column
            columns[0] = empId;

            // Calculate start/end dates
            let startDate = '';
            let endDate = '';
            try {
                const parsedDate = parse(payrollDate, 'dd/MM/yyyy', new Date());
                const start = subMonths(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 29), 2);
                const end = subMonths(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 28), 1);
                let startDateObj = new Date(start.getFullYear(), start.getMonth(), 29);
                if (startDateObj.getMonth() !== start.getMonth()) {
                    startDateObj = new Date(start.getFullYear(), start.getMonth() + 1, 1);
                }
                startDate = format(startDateObj, 'dd/MM/yyyy');
                endDate = format(end, 'dd/MM/yyyy');
            } catch {}

            // Insert start/end date after payroll date
            columns.splice(2, 0, startDate, endDate);

            // Drop the last 12 columns if present
            if (columns.length > 12) {
                columns.splice(-12, 12);
            }

            cleanedLines.push(columns);
        });

        setProgress(22);

        // Map to objects
        const dataArray = cleanedLines.map(columns => ({
            empId: columns[0],
            payrollDate: columns[1],
            startDate: columns[2],
            endDate: columns[3],
            week: columns[4],
            month: columns[5],
            grossPayPreSacrifice: columns[6],
            grossPayPostSacrifice: columns[7],
            grossPayTaxible: columns[8],
            payeTax: columns[9],
            payeNi: columns[10],
            employerNi: columns[11],
            payePension: columns[12],
            employerPension: columns[13],
            studentLoan: columns[14],
            ssp: columns[15],
            spp: columns[16],
            netPay: columns[17],
        }));

        let fakeProgress = 28;
        setProgress(fakeProgress);

        interval = setInterval(() => {
            fakeProgress += 1;
            if (fakeProgress < 90) setProgress(fakeProgress);
        }, 200);

        // Send as JSON
        const response = await axios.post(
            '/payroll/imports/gross-pay',
            { data: dataArray, errors },
            {
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
            }
        );

        const { imported = 0, updated = 0 } = response.data;
        const total = imported + updated;
        let message = `CSV has been imported successfully. ${total} records created/updated`;

        if (errors.length > 0) {
            message += ` with ${errors.length} error${errors.length > 1 ? 's' : ''}.`;
        } else {
            message += '.';
        }

        toast.success(message, {    
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
        });

        window.dispatchEvent(new Event('refreshImports'));
        setProgress(100);

        // Return the backend's parsed data (e.g., for loading into a table)
        return response.data;
    } catch (error) {
        setIsDialogOpen(false);

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
            toast.error(`Error importing CSV file. ${error.message}`, {    
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
            console.error('Error importing CSV:', error);
        }
        throw error;
    }
};