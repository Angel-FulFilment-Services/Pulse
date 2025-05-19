import axios from 'axios';

export const generateSMSLog = async (parameters) => {
    const { dateRange, report } = parameters;

    try {
        const response = await axios.get('/reporting/reports/generate/sms-log', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
        });

        return response.data; // Return the generated report data
    } catch (error) {
        console.error('Error generating attendance report:', error);
        throw error;
    }
};

export const generateAuditLog = async (parameters) => {
    const { dateRange, report } = parameters;

    try {
        const response = await axios.get('/reporting/reports/generate/audit-log', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
        });

        return response.data; // Return the generated report data
    } catch (error) {
        console.error('Error generating attendance report:', error);
        throw error;
    }
};