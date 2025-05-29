import axios from 'axios';

export const generatePayrollExport = async (parameters, abortController = null) => {
    const { dateRange, report } = parameters;
    const controller = abortController || new AbortController();

    try {
        const response = await axios.get('/payroll/exports/generate/payroll', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
            signal: controller.signal, // Attach the AbortController signal
        });

        return response.data; // Return the generated report data
    } catch (error) {
        if (axios.isCancel(error)) {
        } else {
            console.error('Error generating attendance report:', error);
        }
        throw error;
    }
};