import { generateSMSLog, generateAuditLog, generateAccessLog } from '../Components/Reporting/Reports/SystemReportGenerators';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

const systemReportsConfig = [
  {
      id: 'sms_log',
      label: 'SMS Log',
      generate: generateSMSLog,
      parameters: {
          targetAllowColumn: false,
          targetAllowCell: false,
          targetAllowRow: false,
          total: false,
          polling: 60000,
          dateRange: {
              default: {
                startDate: format(startOfDay(subDays(new Date(), 31)), 'yyyy-MM-dd'),
                endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
              },
              maxDate: new Date(),
              minDate: new Date().setFullYear(new Date().getFullYear() - 1),
          },
          date: false,
          structure: [
            {
              id: "message_to",
              label: "To",
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
              format: (value) => value,
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "message_from",
              label: "From",
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
              format: (value) => value,
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "message",
              label: "Message",
              dataType: "string",
              visible: true,
              allowTarget: true,
              target: 0,
              targetDirection: 'asc',
              prefix: "",
              suffix: "",
              cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full max-w-[35rem] overflow-hidden text-elipsis text-wrap",
              headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full max-w-[35rem]",
              headerAnnotation: "",
              format: (value) => value,
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "provider",
              label: "Provider",
              dataType: "string",
              visible: true,
              allowTarget: false,
              target: 0,
              targetDirection: 'asc',
              prefix: "",
              suffix: "",
              cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full max-w-[40rem] overflow-hidden text-elipsis text-wrap",
              headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full max-w-[40rem]",
              headerAnnotation: "",
              format: (value) => value,
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "sent_by",
              label: "Sent By",
              dataType: "string",
              visible: true,
              allowTarget: true,
              target: 0,
              targetDirection: 'asc',
              prefix: "",
              suffix: "",
              cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
              headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
              headerAnnotation: "",
              format: (value) => value,
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "sent_at",
              label: "Sent At",
              dataType: "date",
              visible: true,
              allowTarget: true,
              target: 0,
              targetDirection: 'asc',
              prefix: "",
              suffix: "",
              cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
              headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
              headerAnnotation: "",
              format: (value) => format(new Date(value), 'dd MMMM, yyyy HH:mm:ss'),
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
          ],
          filters: [
              {
                id: 'sent_by',
                name: 'Sent By',
                expression: (data) => (filterValue) => {
                  return data?.sent_by === filterValue;
                },
                calculateOptions: (reportData) => {
                  const seen = new Set();
                  return reportData
                    .filter(item => {
                      if (!item.sent_by || seen.has(item.sent_by)) return false;
                      seen.add(item.sent_by);
                      return true;
                    })
                    .map(item => ({
                      value: item.sent_by,
                      label: item.sent_by,
                      checked: false,
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label));
                },
              },
          ]
      },
  },
  {
    id: 'audit_log',
    label: 'Audit Log',
    generate: generateAuditLog,
    parameters: {
        targetAllowColumn: false,
        targetAllowCell: false,
        targetAllowRow: false,
        total: false,
        polling: 60000,
        dateRange: {
            default: {
              startDate: format(startOfDay(subDays(new Date(), 31)), 'yyyy-MM-dd'),
              endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
            },
            maxDate: new Date(),
            minDate: new Date().setFullYear(new Date().getFullYear() - 1),
        },
        date: false,
        structure: [
          {
            id: "type",
            label: "Type",
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
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "action",
            label: "Action",
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
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "notes",
            label: "Notes",
            dataType: "string",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full max-w-[35rem] overflow-hidden text-elipsis text-wrap",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full max-w-[35rem]",
            headerAnnotation: "",
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "user",
            label: "User",
            dataType: "string",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "",
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "created_at",
            label: "Occured At",
            dataType: "date",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "",
            format: (value) => format(new Date(value), 'dd MMMM, yyyy HH:mm:ss'),
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
        ],
        filters: [
            {
              id: 'user',
              name: 'User',
              expression: (data) => (filterValue) => {
                return data?.user === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.user || seen.has(item.user)) return false;
                    seen.add(item.user);
                    return true;
                  })
                  .map(item => ({
                    value: item.user,
                    label: item.user,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'type',
              name: 'Type',
              expression: (data) => (filterValue) => {
                return data?.type === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.type || seen.has(item.type)) return false;
                    seen.add(item.type);
                    return true;
                  })
                  .map(item => ({
                    value: item.type,
                    label: item.type,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'action',
              name: 'Action',
              expression: (data) => (filterValue) => {
                return data?.action === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.action || seen.has(item.action)) return false;
                    seen.add(item.action);
                    return true;
                  })
                  .map(item => ({
                    value: item.action,
                    label: item.action,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
        ]
    },
  },
  {
    id: 'access_log',
    label: 'Access Log',
    generate: generateAccessLog,
    parameters: {
        targetAllowColumn: false,
        targetAllowCell: false,
        targetAllowRow: false,
        total: false,
        polling: 60000,
        dateRange: {
            default: {
              startDate: format(startOfDay(subDays(new Date(), 31)), 'yyyy-MM-dd'),
              endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
            },
            maxDate: new Date(),
            minDate: new Date().setFullYear(new Date().getFullYear() - 1),
        },
        date: false,
        structure: [
          {
            id: "user",
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
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "ip",
            label: "IP Address",
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
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "url",
            label: "URL",
            dataType: "string",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full max-w-[35rem] overflow-hidden text-elipsis text-wrap",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full max-w-[35rem]",
            headerAnnotation: "",
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "method",
            label: "Method",
            dataType: "string",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "",
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "created_at",
            label: "Occured At",
            dataType: "date",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "",
            format: (value) => format(new Date(value), 'dd MMMM, yyyy HH:mm:ss'),
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "duration",
            label: "Duration",
            dataType: "integer",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(ms)",
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "status",
            label: "Status",
            dataType: "integer",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "",
            format: (value) => value,
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
        ],
        filters: [
            {
              id: 'user',
              name: 'User',
              expression: (data) => (filterValue) => {
                return data?.user === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.user || seen.has(item.user)) return false;
                    seen.add(item.user);
                    return true;
                  })
                  .map(item => ({
                    value: item.user,
                    label: item.user,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'method',
              name: 'Method',
              expression: (data) => (filterValue) => {
                return data?.method === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.method || seen.has(item.method)) return false;
                    seen.add(item.method);
                    return true;
                  })
                  .map(item => ({
                    value: item.method,
                    label: item.method,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'status',
              name: 'Status',
              expression: (data) => (filterValue) => {
                return data?.status === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.status || seen.has(item.status)) return false;
                    seen.add(item.status);
                    return true;
                  })
                  .map(item => ({
                    value: item.status,
                    label: item.status,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            }
        ]
    },
  },
];

export default systemReportsConfig;