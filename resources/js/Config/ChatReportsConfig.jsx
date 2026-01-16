import { 
    generateChatMessageLog, 
    generateChatActivitySummary, 
    generateTeamChatActivity, 
    generateDirectMessageActivity,
    generateChatAttachmentLog,
    generateChatForwardedMessages,
    generateChatDeletedMessages,
    generateChatEditedMessages
} from '../Components/Reporting/Reports/ChatReportGenerators';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const chatReportsConfig = [
    {
        id: 'chat_message_log',
        label: 'Message Log',
        generate: generateChatMessageLog,
        parameters: {
            targetAllowColumn: false,
            targetAllowCell: false,
            targetAllowRow: false,
            total: false,
            polling: false,
            dateRange: {
                default: {
                    startDate: format(startOfDay(subDays(new Date(), 7)), 'yyyy-MM-dd'),
                    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
                },
                maxDate: new Date(),
                minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            },
            date: false,
            structure: [
                {
                    id: "sender_name",
                    label: "Sender",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "chat_type",
                    label: "Chat Type",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value === 'team' ? 'Team' : 'Direct',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "recipient_name",
                    label: "Recipient/Team",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "body",
                    label: "Message",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[30rem] overflow-hidden text-ellipsis text-wrap",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[30rem]",
                    headerAnnotation: "",
                    format: (value) => value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : '[Attachment Only]',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "attachment_count",
                    label: "Attachments",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "is_forwarded",
                    label: "Forwarded",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? 'Yes' : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "is_deleted",
                    label: "Deleted",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? 'Yes' : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "sent_at",
                    label: "Sent At",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm:ss') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
            ],
            filters: [
                {
                    id: 'sender_name',
                    name: 'Sender',
                    expression: (data) => (filterValue) => {
                        return data?.sender_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.sender_name || seen.has(item.sender_name)) return false;
                                seen.add(item.sender_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.sender_name,
                                label: item.sender_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
                {
                    id: 'chat_type',
                    name: 'Chat Type',
                    expression: (data) => (filterValue) => {
                        return data?.chat_type === filterValue;
                    },
                    options: [
                        { value: 'team', label: 'Team Chat', checked: false },
                        { value: 'dm', label: 'Direct Message', checked: false },
                    ],
                },
                {
                    id: 'recipient_name',
                    name: 'Recipient/Team',
                    expression: (data) => (filterValue) => {
                        return data?.recipient_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.recipient_name || seen.has(item.recipient_name)) return false;
                                seen.add(item.recipient_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.recipient_name,
                                label: item.recipient_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
                {
                    id: 'is_forwarded',
                    name: 'Forwarded',
                    expression: (data) => (filterValue) => {
                        return (data?.is_forwarded ? 'yes' : 'no') === filterValue;
                    },
                    options: [
                        { value: 'yes', label: 'Forwarded', checked: false },
                        { value: 'no', label: 'Not Forwarded', checked: false },
                    ],
                },
                {
                    id: 'is_deleted',
                    name: 'Deleted',
                    expression: (data) => (filterValue) => {
                        return (data?.is_deleted ? 'yes' : 'no') === filterValue;
                    },
                    options: [
                        { value: 'yes', label: 'Deleted', checked: false },
                        { value: 'no', label: 'Not Deleted', checked: false },
                    ],
                },
            ]
        },
    },
    {
        id: 'chat_activity_summary',
        label: 'User Activity Summary',
        generate: generateChatActivitySummary,
        parameters: {
            targetAllowColumn: false,
            targetAllowCell: false,
            targetAllowRow: false,
            total: true,
            polling: false,
            dateRange: {
                default: {
                    startDate: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'),
                    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
                },
                maxDate: new Date(),
                minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            },
            date: false,
            structure: [
                {
                    id: "user_name",
                    label: "User",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "total_messages",
                    label: "Total Messages",
                    dataType: "number",
                    visible: true,
                    allowTarget: true,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "team_messages",
                    label: "Team Messages",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "dm_messages",
                    label: "Direct Messages",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "attachments_sent",
                    label: "Attachments Sent",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "reactions_given",
                    label: "Reactions Given",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "messages_forwarded",
                    label: "Forwarded",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "messages_deleted",
                    label: "Deleted",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
            ],
            filters: [
                {
                    id: 'user_name',
                    name: 'User',
                    expression: (data) => (filterValue) => {
                        return data?.user_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.user_name || seen.has(item.user_name)) return false;
                                seen.add(item.user_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.user_name,
                                label: item.user_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
            ]
        },
    },
    {
        id: 'team_chat_activity',
        label: 'Team Chat Activity',
        generate: generateTeamChatActivity,
        parameters: {
            targetAllowColumn: false,
            targetAllowCell: false,
            targetAllowRow: false,
            total: true,
            polling: false,
            dateRange: {
                default: {
                    startDate: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'),
                    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
                },
                maxDate: new Date(),
                minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            },
            date: false,
            structure: [
                {
                    id: "team_name",
                    label: "Team",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown Team',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "member_count",
                    label: "Members",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "total_messages",
                    label: "Total Messages",
                    dataType: "number",
                    visible: true,
                    allowTarget: true,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "unique_senders",
                    label: "Active Users",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "attachments_shared",
                    label: "Attachments",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "avg_messages_per_day",
                    label: "Avg/Day",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value != null ? parseFloat(value).toFixed(1) : '0.0',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
            ],
            filters: [
                {
                    id: 'team_name',
                    name: 'Team',
                    expression: (data) => (filterValue) => {
                        return data?.team_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.team_name || seen.has(item.team_name)) return false;
                                seen.add(item.team_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.team_name,
                                label: item.team_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
            ]
        },
    },
    {
        id: 'dm_activity',
        label: 'Direct Message Activity',
        generate: generateDirectMessageActivity,
        parameters: {
            targetAllowColumn: false,
            targetAllowCell: false,
            targetAllowRow: false,
            total: true,
            polling: false,
            dateRange: {
                default: {
                    startDate: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'),
                    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
                },
                maxDate: new Date(),
                minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            },
            date: false,
            structure: [
                {
                    id: "user1_name",
                    label: "User 1",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "user2_name",
                    label: "User 2",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "total_messages",
                    label: "Total Messages",
                    dataType: "number",
                    visible: true,
                    allowTarget: true,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "user1_sent",
                    label: "User 1 Sent",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "user2_sent",
                    label: "User 2 Sent",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value?.toLocaleString() || 0,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "first_message",
                    label: "First Message",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "last_message",
                    label: "Last Message",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
            ],
            filters: [
                {
                    id: 'user1_name',
                    name: 'User 1',
                    expression: (data) => (filterValue) => {
                        return data?.user1_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.user1_name || seen.has(item.user1_name)) return false;
                                seen.add(item.user1_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.user1_name,
                                label: item.user1_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
                {
                    id: 'user2_name',
                    name: 'User 2',
                    expression: (data) => (filterValue) => {
                        return data?.user2_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.user2_name || seen.has(item.user2_name)) return false;
                                seen.add(item.user2_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.user2_name,
                                label: item.user2_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
            ]
        },
    },
    {
        id: 'chat_attachment_log',
        label: 'Attachment Log',
        generate: generateChatAttachmentLog,
        parameters: {
            targetAllowColumn: false,
            targetAllowCell: false,
            targetAllowRow: false,
            total: false,
            polling: false,
            dateRange: {
                default: {
                    startDate: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'),
                    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
                },
                maxDate: new Date(),
                minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            },
            date: false,
            structure: [
                {
                    id: "sender_name",
                    label: "Sent By",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "file_name",
                    label: "File Name",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[20rem] overflow-hidden text-ellipsis",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[20rem]",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "file_type",
                    label: "Type",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => {
                        const labels = { image: 'Image', video: 'Video', audio: 'Audio', pdf: 'PDF', file: 'File' };
                        return labels[value] || 'File';
                    },
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "file_size",
                    label: "Size",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'desc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => {
                        if (!value) return '-';
                        if (value < 1024) return value + ' B';
                        if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
                        return (value / (1024 * 1024)).toFixed(1) + ' MB';
                    },
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "chat_type",
                    label: "Chat Type",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value === 'team' ? 'Team' : 'Direct',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "recipient_name",
                    label: "Recipient/Team",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "is_forwarded",
                    label: "Forwarded",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? 'Yes' : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "created_at",
                    label: "Uploaded At",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm:ss') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "download",
                    label: "Download",
                    dataType: "control",
                    visible: true,
                    allowTarget: false,
                    control: (row) => (
                        <a 
                            href={`/reporting/chat/attachment/${row.id}/download`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-theme-600 hover:text-theme-700 hover:bg-theme-50 dark:text-theme-500 dark:hover:text-theme-400 dark:hover:bg-dark-700 transition-colors"
                            title={`Download ${row.file_name}`}
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                        </a>
                    ),
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                },
            ],
            filters: [
                {
                    id: 'sender_name',
                    name: 'Sent By',
                    expression: (data) => (filterValue) => {
                        return data?.sender_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.sender_name || seen.has(item.sender_name)) return false;
                                seen.add(item.sender_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.sender_name,
                                label: item.sender_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
                {
                    id: 'file_type',
                    name: 'File Type',
                    expression: (data) => (filterValue) => {
                        return data?.file_type === filterValue;
                    },
                    options: [
                        { value: 'image', label: 'Image', checked: false },
                        { value: 'video', label: 'Video', checked: false },
                        { value: 'audio', label: 'Audio', checked: false },
                        { value: 'pdf', label: 'PDF', checked: false },
                        { value: 'file', label: 'Other', checked: false },
                    ],
                },
                {
                    id: 'chat_type',
                    name: 'Chat Type',
                    expression: (data) => (filterValue) => {
                        return data?.chat_type === filterValue;
                    },
                    options: [
                        { value: 'team', label: 'Team Chat', checked: false },
                        { value: 'dm', label: 'Direct Message', checked: false },
                    ],
                },
                {
                    id: 'recipient_name',
                    name: 'Recipient/Team',
                    expression: (data) => (filterValue) => {
                        return data?.recipient_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.recipient_name || seen.has(item.recipient_name)) return false;
                                seen.add(item.recipient_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.recipient_name,
                                label: item.recipient_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
            ]
        },
    },
    {
        id: 'chat_forwarded_messages',
        label: 'Forwarded Messages',
        generate: generateChatForwardedMessages,
        parameters: {
            targetAllowColumn: false,
            targetAllowCell: false,
            targetAllowRow: false,
            total: false,
            polling: false,
            dateRange: {
                default: {
                    startDate: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'),
                    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
                },
                maxDate: new Date(),
                minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            },
            date: false,
            structure: [
                {
                    id: "forwarded_by",
                    label: "Forwarded By",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "original_sender",
                    label: "Original Sender",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "original_message",
                    label: "Original Message",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[25rem] overflow-hidden text-ellipsis text-wrap",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[25rem]",
                    headerAnnotation: "",
                    format: (value) => value ? (value.length > 80 ? value.substring(0, 80) + '...' : value) : '[Attachment]',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "forwarded_to_type",
                    label: "Forwarded To",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value === 'team' ? 'Team' : 'Direct',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "forwarded_to_name",
                    label: "Recipient/Team",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "forwarded_at",
                    label: "Forwarded At",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm:ss') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
            ],
            filters: [
                {
                    id: 'forwarded_by',
                    name: 'Forwarded By',
                    expression: (data) => (filterValue) => {
                        return data?.forwarded_by === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.forwarded_by || seen.has(item.forwarded_by)) return false;
                                seen.add(item.forwarded_by);
                                return true;
                            })
                            .map(item => ({
                                value: item.forwarded_by,
                                label: item.forwarded_by,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
                {
                    id: 'original_sender',
                    name: 'Original Sender',
                    expression: (data) => (filterValue) => {
                        return data?.original_sender === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.original_sender || seen.has(item.original_sender)) return false;
                                seen.add(item.original_sender);
                                return true;
                            })
                            .map(item => ({
                                value: item.original_sender,
                                label: item.original_sender,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
                {
                    id: 'forwarded_to_type',
                    name: 'Forwarded To',
                    expression: (data) => (filterValue) => {
                        return data?.forwarded_to_type === filterValue;
                    },
                    options: [
                        { value: 'team', label: 'Team Chat', checked: false },
                        { value: 'dm', label: 'Direct Message', checked: false },
                    ],
                },
            ]
        },
    },
    {
        id: 'chat_deleted_messages',
        label: 'Deleted Messages',
        generate: generateChatDeletedMessages,
        parameters: {
            targetAllowColumn: false,
            targetAllowCell: false,
            targetAllowRow: false,
            total: false,
            polling: false,
            dateRange: {
                default: {
                    startDate: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'),
                    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
                },
                maxDate: new Date(),
                minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            },
            date: false,
            structure: [
                {
                    id: "sender_name",
                    label: "Deleted By",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "body",
                    label: "Original Message",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[30rem] overflow-hidden text-ellipsis text-wrap",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[30rem]",
                    headerAnnotation: "",
                    format: (value) => value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : '[No text content]',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "chat_type",
                    label: "Chat Type",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value === 'team' ? 'Team' : 'Direct',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "recipient_name",
                    label: "Recipient/Team",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "sent_at",
                    label: "Originally Sent",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm:ss') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "deleted_at",
                    label: "Deleted At",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm:ss') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
            ],
            filters: [
                {
                    id: 'sender_name',
                    name: 'Deleted By',
                    expression: (data) => (filterValue) => {
                        return data?.sender_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.sender_name || seen.has(item.sender_name)) return false;
                                seen.add(item.sender_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.sender_name,
                                label: item.sender_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
                {
                    id: 'chat_type',
                    name: 'Chat Type',
                    expression: (data) => (filterValue) => {
                        return data?.chat_type === filterValue;
                    },
                    options: [
                        { value: 'team', label: 'Team Chat', checked: false },
                        { value: 'dm', label: 'Direct Message', checked: false },
                    ],
                },
                {
                    id: 'recipient_name',
                    name: 'Recipient/Team',
                    expression: (data) => (filterValue) => {
                        return data?.recipient_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.recipient_name || seen.has(item.recipient_name)) return false;
                                seen.add(item.recipient_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.recipient_name,
                                label: item.recipient_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
            ]
        },
    },
    {
        id: 'chat_edited_messages',
        label: 'Edited Messages',
        generate: generateChatEditedMessages,
        parameters: {
            targetAllowColumn: false,
            targetAllowCell: false,
            targetAllowRow: false,
            total: false,
            polling: false,
            dateRange: {
                default: {
                    startDate: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'),
                    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
                },
                maxDate: new Date(),
                minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            },
            date: false,
            structure: [
                {
                    id: "sender_name",
                    label: "Edited By",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 'Unknown',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "original_body",
                    label: "Original Message",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[20rem] overflow-hidden text-ellipsis text-wrap",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[20rem]",
                    headerAnnotation: "",
                    format: (value) => value ? (value.length > 80 ? value.substring(0, 80) + '...' : value) : '[No original]',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "current_body",
                    label: "Current Message",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[20rem] overflow-hidden text-ellipsis text-wrap",
                    headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full max-w-[20rem]",
                    headerAnnotation: "",
                    format: (value) => value ? (value.length > 80 ? value.substring(0, 80) + '...' : value) : '[No text content]',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "edit_count",
                    label: "Edit Count",
                    dataType: "number",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || 1,
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "chat_type",
                    label: "Chat Type",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value === 'team' ? 'Team' : 'Direct',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "recipient_name",
                    label: "Recipient/Team",
                    dataType: "string",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value || '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "sent_at",
                    label: "Originally Sent",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm:ss') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
                {
                    id: "edited_at",
                    label: "Last Edited",
                    dataType: "date",
                    visible: true,
                    allowTarget: false,
                    target: 0,
                    targetDirection: 'asc',
                    prefix: "",
                    suffix: "",
                    cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
                    headerAnnotation: "",
                    format: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm:ss') : '-',
                    cellAnnotation: (value) => value,
                    cellAction: (value) => value,
                },
            ],
            filters: [
                {
                    id: 'sender_name',
                    name: 'Edited By',
                    expression: (data) => (filterValue) => {
                        return data?.sender_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.sender_name || seen.has(item.sender_name)) return false;
                                seen.add(item.sender_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.sender_name,
                                label: item.sender_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
                {
                    id: 'chat_type',
                    name: 'Chat Type',
                    expression: (data) => (filterValue) => {
                        return data?.chat_type === filterValue;
                    },
                    options: [
                        { value: 'team', label: 'Team Chat', checked: false },
                        { value: 'dm', label: 'Direct Message', checked: false },
                    ],
                },
                {
                    id: 'recipient_name',
                    name: 'Recipient/Team',
                    expression: (data) => (filterValue) => {
                        return data?.recipient_name === filterValue;
                    },
                    calculateOptions: (reportData) => {
                        const seen = new Set();
                        return reportData
                            .filter(item => {
                                if (!item.recipient_name || seen.has(item.recipient_name)) return false;
                                seen.add(item.recipient_name);
                                return true;
                            })
                            .map(item => ({
                                value: item.recipient_name,
                                label: item.recipient_name,
                                checked: false,
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label));
                    },
                },
            ]
        },
    },
];

export default chatReportsConfig;
