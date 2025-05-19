import axios from 'axios';

export const generateTechnicalSupportLog = async (parameters) => {
    const { dateRange, report } = parameters;

    try {
        const response = await axios.get('/reporting/reports/generate/technical-support-log', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
        });

        return response.data; // Return the generated report data
    } catch (error) {
        console.error('Error generating attendance report:', error);
        throw error;
    }
};

export const generateKitDetails = async (parameters) => {
    const { dateRange, report } = parameters;

    try {
        const response = await axios.get('/reporting/reports/generate/kit-details', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
        });

        return response.data; // Return the generated report data
    } catch (error) {
        console.error('Error generating attendance report:', error);
        throw error;
    }
};