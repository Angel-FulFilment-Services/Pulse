import { generateTechnicalSupportLog, generateKitDetails } from '../Components/Reporting/Reports/AssetsReportGenerators';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

const assetsReportsConfig = [
  {
    id: 'technical_support_log',
    label: 'Technical Support Log',
    generate: generateTechnicalSupportLog,
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
            id: "agent",
            label: "Agent",
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
            id: "title",
            label: "Title",
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
            id: "logged_by",
            label: "Logged By",
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
            id: "logged_at",
            label: "Logged At",
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
            label: "Time Spent",
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
            format: (value) => {
              if (!isNaN(value)) {
                return `${Math.floor(value / 60 / 60)}h ${value / 60 % 60}m`;
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "resolved",
            label: "Resolved",
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
            format: (value) => {
              if (value === 1) {
                return "Yes";
              } else if (value === 0) {
                return "No";
              }
              return value; // Return the value as is if it's not a boolean
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
        ],
        filters: [
            {
              id: 'agent',
              name: 'Agent',
              expression: (data) => (filterValue) => {
                return data?.agent === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.agent || seen.has(item.agent)) return false;
                    seen.add(item.agent);
                    return true;
                  })
                  .map(item => ({
                    value: item.agent,
                    label: item.agent,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            { 
              id: 'logged_by',
              name: 'Logged By',
              expression: (data) => (filterValue) => {
                return data?.logged_by === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.logged_by || seen.has(item.logged_by)) return false;
                    seen.add(item.logged_by);
                    return true;
                  })
                  .map(item => ({
                    value: item.logged_by,
                    label: item.logged_by,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'resolved',
              name: 'Resolved',
              expression: (data) => (filterValue) => {
                if (filterValue === 'Yes') {
                  return data?.resolved === 1;
                }
                if (filterValue === 'No') {
                  return data?.resolved === 0;
                }
                return true; // If filterValue is not 'Yes' or 'No', return all data
              },
              calculateOptions: (reportData) => {
                return [
                  { value: 'Yes', label: 'Yes', checked: false },
                  { value: 'No', label: 'No', checked: false },
                ]
              },
            }
        ]
    },
  },
  {
    id: 'kit_details',
    label: 'Kit Details',
    generate: generateKitDetails,
    parameters: {
        targetAllowColumn: false,
        targetAllowCell: false,
        targetAllowRow: false,
        total: false,
        polling: 60000,
        dateRange: false,
        date: false,
        structure: [
          {
            id: "alias",
            label: "Kit Alias",
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
            id: "issued_to",
            label: "Issued To",
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
            id: "issued_on",
            label: "Issued On",
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
            format: (value) => {
              if (!value) return "";

              return format(new Date(value), 'dd MMMM, yyyy')
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "laptop_alias",
            label: "Laptop",
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
            id: "laptop_make",
            label: "Laptop Make",
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
            id: "telephone_alias",
            label: "Telephone",
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
            id: "headset_alias",
            label: "Headset",
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
        ],
        filters: [
            {
              id: 'issued_to',
              name: 'Issued To',
              expression: (data) => (filterValue) => {
                return data?.issued_to === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.issued_to || seen.has(item.issued_to)) return false;
                    seen.add(item.issued_to);
                    return true;
                  })
                  .map(item => ({
                    value: item.issued_to,
                    label: item.issued_to,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'laptop_make',
              name: 'Laptop Make',
              expression: (data) => (filterValue) => {
                return data?.laptop_make === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.laptop_make || seen.has(item.laptop_make)) return false;
                    seen.add(item.laptop_make);
                    return true;
                  })
                  .map(item => ({
                    value: item.laptop_make,
                    label: item.laptop_make,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            }
        ]
    },
  },
];

export default assetsReportsConfig;