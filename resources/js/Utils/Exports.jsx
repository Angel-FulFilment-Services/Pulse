import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

export async function exportTableToExcel(tableRef, filename = 'table.xlsx') {
    // Ensure the table reference is valid
    const table = tableRef?.querySelector('table');

    if (!table || !(table instanceof HTMLTableElement)) {
        console.error('Error exporting table to Excel:', 'HTML Element not found');
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
        return;
    }

    try {
        // Convert the table to a worksheet
        const worksheet = XLSX.utils.table_to_sheet(table);

        // Apply cell styles and formatting based on class names and content
        const range = XLSX.utils.decode_range(worksheet['!ref']); // Get the range of the worksheet
        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cellElement = table.rows[row]?.cells[col]; // Get the corresponding HTML cell
                if (!worksheet[cellAddress] || !cellElement) continue; // Skip if the cell doesn't exist

                // Skip formatting for the header row
                if (row === 0) continue;

                // Check the class name of the HTML cell
                const className = cellElement.className || '';
                const cellContent = cellElement.textContent.trim();

                // Apply styles based on the class name
                if (className.includes('green')) {
                    worksheet[cellAddress].s = {
                        fill: {
                            patternType: 'solid',
                            fgColor: { rgb: 'C6EFCE' }, // Light green background
                        },
                        font: {
                            color: { rgb: '006100' }, // Dark green text
                        },
                    };
                } else if (className.includes('red')) {
                    worksheet[cellAddress].s = {
                        fill: {
                            patternType: 'solid',
                            fgColor: { rgb: 'FFC7CE' }, // Light red background
                        },
                        font: {
                            color: { rgb: '9C0006' }, // Dark red text
                        },
                    };
                } else if (className.includes('orange')) {
                    worksheet[cellAddress].s = {
                        fill: {
                            patternType: 'solid',
                            fgColor: { rgb: 'FFEB9C' }, // Light orange background
                        },
                        font: {
                            color: { rgb: '9C6500' }, // Dark orange text
                        },
                    };
                }

                // Apply formatting based on content
                if (cellContent.includes('%')) {
                    // Detect decimal places in the percentage
                    const decimalPlaces = cellContent.includes('.')
                        ? cellContent.split('.')[1].replace('%', '').length
                        : 0;
                
                    const value = parseFloat(cellContent.replace('%', '')) / 100; // Convert to decimal
                
                    // Format as percentage with detected decimal places, but remove decimals if the value is zero
                    worksheet[cellAddress].z = value === 0 ? '0%' : decimalPlaces > 0 ? `0.${'0'.repeat(decimalPlaces)}%` : '0%';
                    worksheet[cellAddress].v = value;
                } else if (cellContent.includes('£')) {
                    // Format as currency
                    const value = parseFloat(cellContent.replace(/[^0-9.-]+/g, '')); // Extract numeric value
                    worksheet[cellAddress].z = value === 0 ? '£#,##0' : '£#,##0.00'; // Remove decimals if the value is zero
                    worksheet[cellAddress].v = value;
                } else if (!isNaN(cellContent) && cellContent.trim() !== '') {
                    // Detect decimal places for numeric values
                    const decimalPlaces = cellContent.includes('.')
                        ? cellContent.split('.')[1].length
                        : 0;
                
                    const value = parseFloat(cellContent); // Convert to a float
                
                    // Format as a float with detected decimal places, but remove decimals if the value is zero
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