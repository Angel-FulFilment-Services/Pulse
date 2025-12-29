import axios from 'axios';

export const generateChatMessageLog = async (parameters) => {
    const { dateRange } = parameters;
    const response = await axios.get('/reporting/reports/generate/chat-message-log', {
        params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        },
    });
    return response.data;
};

export const generateChatActivitySummary = async (parameters) => {
    const { dateRange } = parameters;
    const response = await axios.get('/reporting/reports/generate/chat-activity-summary', {
        params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        },
    });
    return response.data;
};

export const generateTeamChatActivity = async (parameters) => {
    const { dateRange } = parameters;
    const response = await axios.get('/reporting/reports/generate/team-chat-activity', {
        params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        },
    });
    return response.data;
};

export const generateDirectMessageActivity = async (parameters) => {
    const { dateRange } = parameters;
    const response = await axios.get('/reporting/reports/generate/dm-activity', {
        params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        },
    });
    return response.data;
};

export const generateChatAttachmentLog = async (parameters) => {
    const { dateRange } = parameters;
    const response = await axios.get('/reporting/reports/generate/chat-attachment-log', {
        params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        },
    });
    return response.data;
};

export const generateChatForwardedMessages = async (parameters) => {
    const { dateRange } = parameters;
    const response = await axios.get('/reporting/reports/generate/chat-forwarded-messages', {
        params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        },
    });
    return response.data;
};

export const generateChatDeletedMessages = async (parameters) => {
    const { dateRange } = parameters;
    const response = await axios.get('/reporting/reports/generate/chat-deleted-messages', {
        params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        },
    });
    return response.data;
};

export const generateChatEditedMessages = async (parameters) => {
    const { dateRange } = parameters;
    const response = await axios.get('/reporting/reports/generate/chat-edited-messages', {
        params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
        },
    });
    return response.data;
};
