import * as XLSX from 'xlsx-js-style'; // <-- Use xlsx-js-style instead of xlsx
import { toast } from 'react-toastify';
import axios from 'axios';
import { getRateForDate } from '../Utils/minimumWage.jsx';
import { differenceInYears, format } from 'date-fns';
import { rgbToHex } from '../Utils/Color.jsx'; // Ensure you have this utility function

function getCellStyle(color) {
    // Theme colors from CSS vars (fallbacks included)
    const themeBg = (getComputedStyle(document.body).getPropertyValue('--theme-200') || '#FED7AA').replace('#', '').toUpperCase();
    const themeText = (getComputedStyle(document.body).getPropertyValue('--theme-800') || '#B45309').replace('#', '').toUpperCase();

    switch ((color || '').toLowerCase()) {
        case 'green':
            return {
                fill: { patternType: 'solid', fgColor: { rgb: 'C6EFCE' } },
                font: { color: { rgb: '006100' } }
            };
        case 'red':
            return {
                fill: { patternType: 'solid', fgColor: { rgb: 'FFC7CE' } },
                font: { color: { rgb: '9C0006' } }
            };
        case 'yellow':
            return {
                fill: { patternType: 'solid', fgColor: { rgb: 'FFEB9C' } },
                font: { color: { rgb: '9C6500' } }
            };
        case 'theme':
            return {
                fill: { patternType: 'solid', fgColor: { rgb: themeBg.length === 6 ? themeBg : 'FED7AA' } },
                font: { color: { rgb: themeText.length === 6 ? themeText : 'B45309' } }
            };
        default:
            return {};
    }
}

// Helper: detect and format cell value
function formatCell(cell) {
    let v = cell.value;
    let z = undefined;

    if (typeof v === 'string' && v.includes('%')) {
        const decimalPlaces = v.includes('.') ? v.split('.')[1].replace('%', '').length : 0;
        const value = parseFloat(v.replace('%', '')) / 100;
        z = value === 0 ? '0%' : decimalPlaces > 0 ? `0.${'0'.repeat(decimalPlaces)}%` : '0%';
        v = value;
    } else if (typeof v === 'string' && v.includes('£')) {
        const value = parseFloat(v.replace(/[^0-9.-]+/g, ''));
        z = value === 0 ? '£#,##0' : '£#,##0.00';
        v = value;
    } else if (!isNaN(v) && v !== '' && v !== null && v !== undefined) {
        const value = parseFloat(v);
        if (!isNaN(value)) {
            const decimalPlaces = (v.toString().includes('.') ? v.toString().split('.')[1].length : 0);
            z = value === 0 ? '0' : decimalPlaces > 0 ? `0.${'0'.repeat(decimalPlaces)}` : '0';
            v = value;
        }
    }

    return { v, z };
}

export async function exportTableToExcel(tableRef, filename = 'table.xlsx') {
    try {
        const table = tableRef.current || tableRef; // Support both ref and direct element

        const themeBg = rgbToHex(getComputedStyle(document.body).getPropertyValue('--theme-200').trim());
        const themeText = rgbToHex(getComputedStyle(document.body).getPropertyValue('--theme-800').trim());

        // Find indices of columns to exclude (those with "control" in their th class)
        const ths = table.querySelectorAll('thead th');
        const controlColumnIndices = [];
        ths.forEach((th, idx) => {
            if (th.className && th.className.includes('control')) {
                controlColumnIndices.push(idx);
            }
        });

        // Clone the table and remove control columns from header and all rows
        const clonedTable = table.cloneNode(true);

        // Remove from header
        const headerRows = clonedTable.querySelectorAll('thead tr');
        headerRows.forEach(row => {
            controlColumnIndices.slice().reverse().forEach(idx => {
                if (row.cells[idx]) row.deleteCell(idx);
            });
        });

        // Remove from body
        const bodyRows = clonedTable.querySelectorAll('tbody tr');
        bodyRows.forEach(row => {
            controlColumnIndices.slice().reverse().forEach(idx => {
                if (row.cells[idx]) row.deleteCell(idx);
            });
        });

        // Now convert the cleaned table to a worksheet
        const worksheet = XLSX.utils.table_to_sheet(clonedTable);

        // Apply cell styles and formatting based on class names and content
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        const allRows = Array.from(clonedTable.querySelectorAll('tr'));
        for (let row = 1; row < allRows.length; row++) { // start at 1 to skip header
            const htmlRow = allRows[row];
            const rowClassName = htmlRow.className || '';

            if (
                rowClassName.includes('odd:bg-gray-50') ||
                rowClassName.includes('dark:odd:bg-dark-800')
            ) {
                continue;
            }

            for (let col = 0; col < htmlRow.cells.length; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cellElement = htmlRow.cells[col];
                if (!worksheet[cellAddress] || !cellElement) continue;

                // Combine row and cell class names
                const className = `${rowClassName} ${cellElement.className || ''}`;
                const cellContent = cellElement.textContent.trim();

                // Apply styles based on the combined class name
                if (className.includes('green')) {
                    worksheet[cellAddress].s = {
                        fill: {
                            patternType: 'solid',
                            fgColor: { rgb: 'C6EFCE' },
                        },
                        font: {
                            color: { rgb: '006100' },
                        },
                    };
                } else if (className.includes('red')) {
                    worksheet[cellAddress].s = {
                        fill: {
                            patternType: 'solid',
                            fgColor: { rgb: 'FFC7CE' },
                        },
                        font: {
                            color: { rgb: '9C0006' },
                        },
                    };
                } else if (className.includes('yellow')) {
                    worksheet[cellAddress].s = {
                        fill: {
                            patternType: 'solid',
                            fgColor: { rgb: 'FFEB9C' },
                        },
                        font: {
                            color: { rgb: '9C6500' },
                        },
                    };
                } else if (className.includes('theme')) {

                    const fallbackBg = 'FED7AA'; // Orange
                    const fallbackText = 'B45309'; // Dark orange

                    worksheet[cellAddress].s = {
                        fill: {
                            patternType: 'solid',
                            fgColor: { rgb: themeBg.length === 6 ? themeBg.toUpperCase() : fallbackBg },
                        },
                        font: {
                            color: { rgb: themeText.length === 6 ? themeText.toUpperCase() : fallbackText },
                        },
                    };
                }

                

                // Apply formatting based on content
                if (cellContent.includes('%')) {
                    const decimalPlaces = cellContent.includes('.')
                        ? cellContent.split('.')[1].replace('%', '').length
                        : 0;
                    const value = parseFloat(cellContent.replace('%', '')) / 100;
                    worksheet[cellAddress].z = value === 0 ? '0%' : decimalPlaces > 0 ? `0.${'0'.repeat(decimalPlaces)}%` : '0%';
                    worksheet[cellAddress].v = value;
                } else if (cellContent.includes('£')) {
                    const value = parseFloat(cellContent.replace(/[^0-9.-]+/g, ''));
                    worksheet[cellAddress].z = value === 0 ? '£#,##0' : '£#,##0.00';
                    worksheet[cellAddress].v = value;
                } else if (!isNaN(cellContent) && cellContent.trim() !== '') {
                    const decimalPlaces = cellContent.includes('.')
                        ? cellContent.split('.')[1].length
                        : 0;
                    const value = parseFloat(cellContent);
                    worksheet[cellAddress].z = value === 0 ? '0' : decimalPlaces > 0 ? `0.${'0'.repeat(decimalPlaces)}` : '0';
                    worksheet[cellAddress].v = value;
                }
            }
        }

        // Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // Write the workbook and trigger the download
        XLSX.writeFile(workbook, filename);
    } catch (error) {
        console.error('Error exporting table to Excel:', error);
        toast.error('Failed to export this report to Excel. Please try again.', {
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
}

export async function exportArrayToExcel(sheets, filename = 'export.xlsx') {
    try {
        const workbook = XLSX.utils.book_new();

        sheets.forEach(sheet => {
            // Build worksheet data and styles
            const aoa = sheet.data.map(row =>
                row.map(cell =>
                    typeof cell === 'object' && cell !== null && 'value' in cell
                        ? cell
                        : { value: cell }
                )
            );

            // Create worksheet with just values
            const worksheet = XLSX.utils.aoa_to_sheet(
                aoa.map(row => row.map(cell => formatCell(cell).v))
            );

            // Apply styles and number formats
            aoa.forEach((row, rIdx) => {
                row.forEach((cell, cIdx) => {
                    const addr = XLSX.utils.encode_cell({ r: rIdx, c: cIdx });
                    if (worksheet[addr]) {
                        // Style
                        if (cell.color) {
                            worksheet[addr].s = getCellStyle(cell.color);
                        }
                        // Number format
                        const { z } = formatCell(cell);
                        if (z) worksheet[addr].z = z;
                    }
                });
            });

            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        });

        XLSX.writeFile(workbook, filename);
    } catch (error) {
        console.error('Error exporting sheets to Excel:', error);
    }
}

import { toPng } from 'html-to-image';

export async function exportHTMLToImage(divRef, filename = 'capture.png') {
    if (!divRef || !divRef.current) {
        toast.error('Could not find the element to export.', {
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

    try {
        const modalContent = document.querySelector('#modal-content');
        let originalModalHeight = null; // Store the original height

        const scrollableContainer = divRef.current.querySelector('#scrollable_container');
        const scrollableContent = divRef.current.querySelector('#scrollable_content');
        if (scrollableContainer && scrollableContent) {
            // Get the scrollable height and current height
            const scrollableHeight = scrollableContent.scrollHeight; // Total height without scrollbars
            const currentHeight = scrollableContainer.clientHeight; // Current visible height

            // Calculate the height difference
            const heightDifference = scrollableHeight - currentHeight;

            if (heightDifference > 0 && modalContent) {
                // Store the original height of the modal
                originalModalHeight = modalContent.style.height || getComputedStyle(modalContent).height;

                // Adjust the height of the parent element with ID "modal-content"
                const currentModalHeight = parseFloat(getComputedStyle(modalContent).height);
                modalContent.style.height = `${currentModalHeight + heightDifference}px`;
            }
        }

        // Generate the image
        const dataUrl = await toPng(divRef.current, {
            cacheBust: true,
            backgroundColor: "#fff",
            pixelRatio: 2,
        });

        // Trigger the download
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();

        // Revert the height of the modal back to its original value
        if (modalContent && originalModalHeight !== null) {
            modalContent.style.height = null;
        }
    } catch (error) {
        console.error('Error exporting div to image:', error);
        toast.error('Failed to export this section as an image. Please try again.', {
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
}

export async function exportPayrollToCSV(startDate, endDate, setProgress = () => {}) {
    let interval;
    try {
        let fakeProgress = 0;
        setProgress(fakeProgress);

        // Simulate progress up to 85% over 9 seconds
        interval = setInterval(() => {
            fakeProgress += 3;
            if (fakeProgress < 85) setProgress(fakeProgress);
        }, 200);

        const { data } = await axios.get('/payroll/exports/generate/exp/payroll', {
            params: { startDate, endDate }
        });

        clearInterval(interval);
        setProgress(90);

        const { employees = [], hours = [], holiday = [], bonus = [] } = data;

        // 2. Index holiday and bonus by sage_id for quick lookup
        const holidayMap = Object.fromEntries(holiday.map(h => [h.sage_id, h.holiday]));
        const bonusMap = Object.fromEntries(bonus.map(b => [b.sage_id, b.bonus]));

        // 3. Index employees by sage_id for DOB lookup
        const employeeMap = Object.fromEntries(employees.map(e => [e.sage_id, e]));

        // 4. Group hours by sage_id
        const hoursBySage = {};
        for (const h of hours) {
            if (!hoursBySage[h.sage_id]) hoursBySage[h.sage_id] = [];
            hoursBySage[h.sage_id].push(h);
        }

        // 5. Prepare CSV rows
        const rows = [];
        rows.push(['sage_id', 'pay_ref', 'hours', 'rate']); // header

        for (const emp of employees) {
            const sage_id = emp.sage_id;

            // Holiday
            if (holidayMap[sage_id]) {
                rows.push([sage_id, 18, '1.00', Number(holidayMap[sage_id]).toFixed(2)]);
            }

            // Bonus
            if (bonusMap[sage_id]) {
                rows.push([sage_id, 100, '1.00', Number(bonusMap[sage_id]).toFixed(2)]);
            }

            // Hours
            const empHours = hoursBySage[sage_id] || [];
            if (empHours.length) {
                // Sort by date ascending for rate change detection
                empHours.sort((a, b) => new Date(a.date) - new Date(b.date));

                // Calculate rate for each entry
                const hoursWithRate = empHours.map(h => {
                    const dob = employeeMap[sage_id]?.DOB || employeeMap[sage_id]?.dob;
                    const age = dob ? differenceInYears(new Date(h.date), new Date(dob)) : null;

                    const rate = getRateForDate(age, new Date(h.date));
                    return { ...h, rate };
                });

                // Group by rate
                const grouped = [];
                let current = null;
                for (const h of hoursWithRate) {
                    if (!current || current.rate !== h.rate) {
                        if (current) grouped.push(current);
                        current = { rate: h.rate, hours: 0, pay_ref: null };
                    }
                    current.hours += Number(h.hours);
                }
                if (current) grouped.push(current);

                // If only one rate, pay_ref 96; if more, lowest rate is 102, others 96
                if (grouped.length === 1) {
                    rows.push([
                        sage_id,
                        96,
                        Number(grouped[0].hours).toFixed(2),
                        Number(grouped[0].rate).toFixed(2)
                    ]);
                } else {
                    const minRate = Math.min(...grouped.map(g => g.rate));
                    for (const g of grouped) {
                        rows.push([
                            sage_id,
                            g.rate === minRate ? 102 : 96,
                            Number(g.hours).toFixed(2),
                            Number(g.rate).toFixed(2)
                        ]);
                    }
                }
            }
        }

        setProgress(90);
        // 6. Convert to CSV string
        const csv = rows.map(row => row.join(',')).join('\r\n');

        // 7. Trigger download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll_export_${format(startDate, "dd.MM.yyyy")}_to_${format(endDate, "dd.MM.yyyy")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setProgress(100);
        return true;
    } catch (error) {
        if (interval) clearInterval(interval);
        setProgress(100);
        return false;
    }
}

/**
 * Build export-ready sheets from data and sheet configs.
 * @param {Array} sheetsConfig - Array of { name, fields, fixed, filterFn }
 * @param {Array} data - The data array
 * @param {Object} structure - The column structure (from config)
 * @param {Function} targetFn - Row color function (from config)
 * @param {Object} parameters - { startDate, endDate, ... }
 * @returns {Array} Array of { name, data }
 */
export function buildExportSheets({ sheetsConfig, data, structure, targetFn, parameters }) {
    function buildColumnParameters(col, parameters) {
        const params = {};
        if (col.parameters) {
            Object.entries(col.parameters).forEach(([paramKey, paramConfig]) => {
                if (paramConfig.type === 'startDate') params[paramKey] = parameters.startDate;
                if (paramConfig.type === 'endDate') params[paramKey] = parameters.endDate;
            });
        }
        return params;
    }

    function getColByKey(key) {
        return structure.find(col => col.id === key);
    }

    function buildRows(fields, filterFn = () => true, fixed = {}) {
        // Header row
        const header = fields.map(f => ({
            value: f.label,
            color: 'theme'
        }));

        // Data rows
        const rows = data.filter(filterFn).map(row => {
            const color = typeof targetFn === 'function' ? targetFn(row) : undefined;
            return fields.map(f => {
                if (fixed[f.key] !== undefined) return { value: fixed[f.key], color };
                const col = getColByKey(f.key);
                let value = row[f.key];

                if (col && typeof col.format === 'function') {
                    const params = buildColumnParameters(col, parameters);

                    if (col.requires && Array.isArray(col.requires) && col.requires.length > 0) {
                        value = col.format(
                            ...col.requires.map(field => row[field]),
                            params
                        );
                    } else {
                        value = col.format(row[f.key], params);
                    }
                }

                if (col) {
                    if (col.prefix) value = `${col.prefix}${value ?? ""}`;
                    if (col.suffix) value = `${value ?? ""}${col.suffix}`;
                }

                return { value, color };
            });
        });

        return [header, ...rows];
    }

    // Build all sheets
    return sheetsConfig.map(sheet => ({
        name: sheet.name,
        data: buildRows(sheet.fields, sheet.filterFn, sheet.fixed)
    }));
}