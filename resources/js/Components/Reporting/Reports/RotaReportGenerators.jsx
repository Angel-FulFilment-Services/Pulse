import axios from 'axios';
import { toast } from 'react-toastify';

export const generateAttendanceReport = async (parameters, abortController = null) => {
    const { dateRange, report } = parameters;
    const controller = abortController || new AbortController();

    try {
        const response = await axios.get('/reporting/reports/generate/attendance', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
            signal: controller.signal, // Attach the AbortController signal
        });

        return response.data; // Return the generated report data
    } catch (error) {
        if (axios.isCancel(error)) {
            toast.info('Previous report generation request aborted. Initiating a new request with updated parameters...',{
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
            console.error('Error generating attendance report:', error);
        }
        throw error;
    }
};

export const generateHoursComparisonReport = async (parameters, abortController = null) => {
    const { dateRange, report } = parameters;
    const controller = abortController || new AbortController();

    try {
        const response = await axios.get('/reporting/reports/generate/hours-comparison', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
            signal: controller.signal, // Attach the AbortController signal
        });

        return response.data; // Return the generated report data
    } catch (error) {
        if (axios.isCancel(error)) {
            toast.info('Previous report generation request aborted. Initiating a new request with updated parameters...',{
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
            console.error('Error generating attendance report:', error);
        }
        throw error;
    }
};

export const generateEventLog = async (parameters, abortController = null) => {
    const { dateRange, report } = parameters;
    const controller = abortController || new AbortController();

    try {
        const response = await axios.get('/reporting/reports/generate/event-log', {
            params: { start_date: dateRange.startDate, end_date: dateRange.endDate },
            signal: controller.signal, // Attach the AbortController signal
        });

        return response.data; // Return the generated report data
    } catch (error) {
        if (axios.isCancel(error)) {
            toast.info('Previous report generation request aborted. Initiating a new request with updated parameters...',{
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
            console.error('Error generating attendance report:', error);
        }
        throw error;
    }
};