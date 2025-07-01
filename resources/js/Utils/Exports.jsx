import * as XLSX from 'xlsx-js-style'; // <-- Use xlsx-js-style instead of xlsx
import { toast } from 'react-toastify';
import axios from 'axios';
import { getRateForDate } from '../Utils/minimumWage.jsx';
import { differenceInYears, format } from 'date-fns';
import { rgbToHex } from '../Utils/Color.jsx'; // Ensure you have this utility function

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
        return structure.find((col) => col.id === key);
    }

    function buildRows(fields, filterFn = () => true, fixed = {}, styles = {}, sortFn = null, subDataField = null) {
        const { headerStyles = {}, dataStyles = {} } = styles;
    
        // Build header rows
        const headerRows = fields.map((headerRow) => {
            const row = [];
            let currentColumn = 0; // Track the next available column index
    
            headerRow.forEach((cell) => {
                // Skip cells with `visible: false`
                if (cell?.visible === false) {
                    return;
                }
    
                // Ensure the current column is available
                while (row[currentColumn]) {
                    currentColumn++;
                }
    
                const merge = cell.merge || undefined;
    
                // Place the cell at the current column
                row[currentColumn] = {
                    value: cell.label,
                    style: {
                        ...headerStyles,
                        ...cell.headerStyle, // Allow per-cell styles
                    },
                    merge, // Handle cell merging
                };
    
                // If the cell has a merge, adjust the currentColumn to skip the merged range
                if (merge) {
                    currentColumn += merge.c;
                } else {
                    currentColumn++;
                }
            });
    
            return row;
        });
    
        // Build data rows
        let dataRows = data.filter(filterFn).flatMap((row) => {
            // If subDataField is specified, use sub-data to generate rows
            let subData = subDataField ? row[subDataField] || [] : [row];
            
            if (typeof subData === 'string') {
                try {
                    subData = JSON.parse(subData);
                    subData = subData.filter((subRow) => subRow !== null && subRow !== undefined); // Filter out null/undefined entries
                } catch (error) {
                    subData = [];
                }
            }

            return subData.map((subRow) => {
                return fields[fields.length - 1].map((f) => {
                    const isSubDataField = f.key?.includes('.'); // Check if the field references sub-data
                    const [topLevelKey, subKey] = isSubDataField ? f.key.split('.') : [f.key, null];
    
                    let value;
                    if (fixed[f.key] !== undefined) {
                        value = fixed[f.key];
                    } else if (isSubDataField) {
                        value = subRow[subKey]; // Use sub-data field
                    } else {
                        value = row[topLevelKey]; // Use top-level field
                    }
    
                    const col = getColByKey(f.key);
    
                    if (col && typeof col.format === 'function') {
                        const params = buildColumnParameters(col, parameters);
    
                        if (col.requires && Array.isArray(col.requires) && col.requires.length > 0) {
                            value = col.format(
                                ...col.requires.map((field) => (isSubDataField ? subRow[field] : row[field])),
                                params
                            );
                        } else {
                            value = col.format(value, params);
                        }
                    }
    
                    if (col) {
                        if (col.prefix) value = `${col.prefix}${value ?? ''}`;
                        if (col.suffix) value = `${value ?? ''}${col.suffix}`;
                    }
    
                    return {
                        key: f.key,
                        value,
                        style: {
                            ...dataStyles,
                            ...f.dataStyle, // Allow per-cell styles
                        },
                        visible: f.visible !== false, // Ensure the cell is visible unless explicitly set to false
                    };
                });
            });
        });
    
        // Apply sorting if a sort function is provided
        if (sortFn) {
            dataRows = dataRows.sort((a, b) => sortFn(a, b));
        }
    
        return [...headerRows, ...dataRows];
    }
    
    // Build all sheets
    return sheetsConfig.map((sheet) => {
        const rows = buildRows(
            sheet.fields,
            sheet.filterFn,
            sheet.fixed,
            sheet.styles,
            sheet.sortFn,
            sheet.subData // Pass the subData field name
        );
    
        // Handle cell merging
        const merges = [];
        rows.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell.merge) {
                    merges.push({
                        s: { r: rowIndex, c: colIndex },
                        e: { r: rowIndex + cell.merge.r - 1, c: colIndex + cell.merge.c - 1 },
                    });
                }
            });
        });
    
        return {
            name: sheet.name,
            data: rows,
            rowHeights: sheet.rowHeights || [],
            columnWidths: sheet.columnWidths || [],
            fields: sheet.fields,
            rowColorFn: sheet.rowColorFn,
            merges,
        };
    });
}

function getCellStyle(style = {}) {
    const { bgColor, fontColor, fontSize, bold, horizontal, vertical, border, wrapText, fontFamily } = style;

    const borders = border === 'all' ? {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
    } : undefined;

    return {
        fill: bgColor ? { patternType: 'solid', fgColor: { rgb: bgColor } } : undefined,
        font: {
            color: fontColor ? { rgb: fontColor } : undefined,
            bold: bold || false,
            sz: fontSize || 10,
            name: fontFamily || 'Calibri', // Default to 'Calibri' if no font family is provided
        },
        alignment: {
            horizontal: horizontal || 'left',
            vertical: vertical || 'center',
            wrapText: wrapText || false, // Enable or disable text wrapping
        },
        border: borders,
    };
}

// Helper: detect and format cell value
function formatCell(cell, columnConfig = {}) {
    let v = cell.value;
    let z = undefined;

    // Apply formatting based on the column's `format` property
    if (columnConfig.format) {
        switch (columnConfig.format) {
            case 'date':
                if (v) {
                    let date;
                    // Check if the value is in yyyy-mm-dd format
                    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                        date = new Date(v);
                    }
                    // Check if the value is in dd/mm/yyyy format
                    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
                        const [day, month, year] = v.split('/');
                        date = new Date(`${year}-${month}-${day}`);
                    } else {
                        date = new Date(v); // Fallback for other formats
                    }

                    if (!isNaN(date)) {
                        v = format(date, 'dd/MM/yyyy'); // Format as dd/MM/yyyy
                        z = 'dd/mm/yyyy'; // Excel date format
                    } else {
                        v = ''; // Invalid date, set to empty
                    }
                }
                break;
            case 'currency':
                if (v !== null && v !== undefined || !isNaN(v)) {
                    if (v.includes('-')) {
                        v = parseFloat(v.split('-£')[1]); // Handle negative values
                        z = '-£#,##0.00'; // Format negative values in red with parentheses
                    } else {
                        v = parseFloat(v.split('£')[1]);
                        z = '£#,##0.00'; // Format positive values normally
                    }
                } else {
                    v = 0; // Default to 0 if invalid
                    z = '£#,##0.00'
                }
                break;
            case 'percentage':
                if (v !== null && v !== undefined && !isNaN(v)) {
                    v = parseFloat(v) / 100;
                    z = '0.00%'; // Percentage format
                } else {
                    v = 0; // Default to 0 if invalid
                    z = '0.00%'; // Percentage format
                }
                break;
            case 'float':
                if (v !== null && v !== undefined && !isNaN(v)) {
                    v = parseFloat(v);
                    z = '0.00'; // Number with two decimal places
                } else {
                    v = 0; // Default to 0 if invalid
                    z = '0.00'; // Number with two decimal places
                }
                break;
            case 'number':
                if (v !== null && v !== undefined && !isNaN(v)) {
                    v = parseFloat(v);
                    z = '0'; // Number with two decimal places
                } else {
                    v = 0; // Default to 0 if invalid
                    z = '0'; // Number with two decimal places
                }
                break;
            default:
                break; // Fallback to best-guess approach
        }
    }

    // Fallback to current best-guess approach if no format is provided
    if (z === undefined) {
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
    }

    // Force cell to be empty if `forceEmptyIfZero` is true and value is zero
    if (columnConfig.forceEmptyIfZero && (v === 0 || isNaN(v))) {
        v = '';
    }

    if (v === undefined || v === null) {
        v = ''; // Ensure null or undefined values are set to empty string
    }

    return { v, z, style: cell.style || {} };
}

export async function exportArrayToExcel(sheets, filename = 'export.xlsx') {
    try {
        const workbook = XLSX.utils.book_new();

        sheets.forEach((sheet) => {
            // Build worksheet data and styles
            const aoa = sheet.data.map((row) =>
                row.map((cell) =>
                    typeof cell === 'object' && cell !== null && 'value' in cell
                        ? cell
                        : { value: cell }
                )
            );

            // Create worksheet with just values
            const worksheet = XLSX.utils.aoa_to_sheet(
                aoa.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                        if (cell.visible === false) {
                            return ''; // Skip invisible cells
                        }

                        // Skip formatting for header rows
                        if (rIdx < sheet.fields.length) {
                            return cell.value;
                        }

                        // Format data rows
                        const columnConfig = sheet.fields[sheet.fields.length - 1][cIdx] || {};
                        const { v } = formatCell(cell, columnConfig);
                        return v;
                    })
                )
            );

            // Apply styles and number formats
            aoa.forEach((row, rIdx) => {
                const rowColorStyle = sheet.rowColorFn && rIdx >= sheet.fields.length ? sheet.rowColorFn(row) : null;

                row.forEach((cell, cIdx) => {
                    if (cell.visible === false) {
                        return; // Skip invisible cells
                    }

                    const addr = XLSX.utils.encode_cell({ r: rIdx, c: cIdx });
                    if (worksheet[addr]) {
                        // Get column configuration
                        const columnConfig = sheet.fields[sheet.fields.length - 1][cIdx] || {};

                        // Apply custom styles
                        const { style } = cell;
                        if (style) {
                            worksheet[addr].s = getCellStyle(style);
                        }

                        // Apply row-level coloration
                        if (rowColorStyle) {
                            worksheet[addr].s = {
                                ...worksheet[addr].s,
                                fill: {
                                    ...worksheet[addr].s?.fill,
                                    patternType: 'solid',
                                    fgColor: { rgb: rowColorStyle.bgColor || worksheet[addr].s?.fill?.fgColor?.rgb || 'FFFFFF' },
                                },
                                font: {
                                    ...worksheet[addr].s?.font,
                                    color: { rgb: rowColorStyle.fontColor || worksheet[addr].s?.font?.color?.rgb || '000000' },
                                },
                            };
                        }

                        // Apply dynamic coloration
                        if (columnConfig.colorFn && rIdx >= sheet.fields.length) {
                            const colorStyle = columnConfig.colorFn(cell);
                            if (colorStyle) {
                                worksheet[addr].s = {
                                    ...worksheet[addr].s,
                                    fill: {
                                        ...worksheet[addr].s?.fill,
                                        patternType: 'solid',
                                        fgColor: { rgb: colorStyle.bgColor || worksheet[addr].s?.fill?.fgColor?.rgb || 'FFFFFF'},
                                    },
                                    font: {
                                        ...worksheet[addr].s?.font,
                                        color: { rgb: colorStyle.fontColor || worksheet[addr].s?.font?.color?.rgb || '000000' },
                                    },
                                };
                            }
                        }

                        // Apply number format
                        const { z } = formatCell(cell, columnConfig);
                        if (rIdx < sheet.fields.length) return; // Skip header rows
                        if (z) worksheet[addr].z = z;
                    }
                });
            });

            // Add merges to the worksheet
            if (sheet.merges && sheet.merges.length > 0) {
                worksheet['!merges'] = sheet.merges.map((merge) => ({
                    s: { r: merge.s.r, c: merge.s.c }, // Start cell
                    e: { r: merge.e.r, c: merge.e.c }, // End cell
                }));
            }

            // Set row heights (if provided in the sheet config)
            if (sheet.rowHeights) {
                const headerRowCount = sheet.fields.length; // Number of header rows
                const dataRowHeight = sheet.rowHeights[headerRowCount] || sheet.rowHeights[headerRowCount - 1]; // Default to the last header height if not provided
            
                worksheet['!rows'] = Array.from({ length: aoa.length }, (_, index) => {
                    if (index < headerRowCount) {
                        // Use the specified height for header rows
                        return { hpx: sheet.rowHeights[index] || sheet.rowHeights[sheet.rowHeights.length - 1] };
                    } else {
                        // Apply the same height to all data rows
                        return { hpx: dataRowHeight };
                    }
                });
            }

            // Set column widths (if provided in the sheet config)
            if (sheet.columnWidths) {
                worksheet['!cols'] = sheet.columnWidths.map((width) => ({ wch: width }));
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        });

        XLSX.writeFile(workbook, filename);
    } catch (error) {
        console.error('Error exporting sheets to Excel:', error);
    }
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

        const { data } = await axios.get('/payroll/export/payroll', {
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
                    const payRate = emp.pay_rate;

                    const rate = (payRate && Number(payRate) > 0)
                        ? Number(payRate)
                        : getRateForDate(age, new Date(h.date));
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
        a.download = `Sage Import ${format(startDate, "dd_MM_yyyy")} - ${format(endDate, "dd_MM_yyyy")}.csv`;
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