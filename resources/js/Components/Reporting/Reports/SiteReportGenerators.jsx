import axios from 'axios';

export const generateAccessLog = async (parameters) => {
    const { dateRange, report } = parameters;

    try {
        const response = await axios.get('/reporting/reports/generate/site-access-log', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
        });

        return response.data; // Return the generated report data
    } catch (error) {
        console.error('Error generating site access report:', error);
        throw error;
    }
};