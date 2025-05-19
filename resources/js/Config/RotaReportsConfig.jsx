import { generateAttendanceReport, generateHoursComparisonReport } from '../Components/Reporting/Reports/RotaReportGenerators';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

const rotaReportsConfig = [
  {
    id: 'attendance_report',
    label: 'Attendance Report',
    generate: generateAttendanceReport,
    parameters: {
        targetAllowColumn: true,
        targetAllowCell: false,
        targetAllowRow: false,
        total: true,
        polling: 60000,
        dateRange: {
            default: {
              startDate: format(startOfDay(subDays(new Date(), 8)), 'yyyy-MM-dd'),
              endDate: format(endOfDay(subDays(new Date(), 1)), 'yyyy-MM-dd'),
            },
            maxDate: subDays(new Date(), 1),
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
            id: "shift_duration_hours",
            label: "Hours Scheduled",
            dataType: "float",
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
                return parseFloat(value).toFixed(2); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "worked_duration_hours",
            label: "Hours Worked",
            dataType: "float",
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
                return parseFloat(value).toFixed(2); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "worked_percentage",
            label: "Hours Worked",
            dataType: "float",
            visible: true,
            allowTarget: true,
            target: {low: 60, high: 80},
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
            numeratorId: "worked_duration_hours", 
            denominatorId: "shift_duration_hours",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(%)",
            format: (value) => {
              if (!isNaN(value)) {
                return parseFloat(value).toFixed(2); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "shifts_scheduled",
            label: "Shifts Scheduled",
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
          {
            id: "shifts_sick",
            label: "Shifts Sick",
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
          {
            id: "sick_percentage",
            label: "Shifts Sick",
            dataType: "float",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
            numeratorId: "shifts_sick",
            denominatorId: "shifts_scheduled",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(%)",
            format: (value) => {
              if (!isNaN(value)) {
                return parseFloat(value).toFixed(0); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "shifts_absent",
            label: "Shifts Absent",
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
          {
            id: "absent_percentage",
            label: "Shifts Absent",
            dataType: "float",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
            numeratorId: "shifts_absent",
            denominatorId: "shifts_scheduled",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(%)",
            format: (value) => {
              if (!isNaN(value)) {
                return parseFloat(value).toFixed(0); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "shifts_awol",
            label: "Shifts AWOL",
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
          {
            id: "awol_percentage",
            label: "Shifts AWOL",
            dataType: "float",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
            numeratorId: "shifts_awol",
            denominatorId: "shifts_scheduled",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(%)",
            format: (value) => {
              if (!isNaN(value)) {
                return parseFloat(value).toFixed(0); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "shifts_late",
            label: "Shifts Late",
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
          {
            id: "late_percentage",
            label: "Shifts Late",
            dataType: "float",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
            numeratorId: "shifts_late",
            denominatorId: "shifts_scheduled",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(%)",
            format: (value) => {
              if (!isNaN(value)) {
                return parseFloat(value).toFixed(0); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
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
              calculateOptions: (reportData) =>
                reportData
                  .map((item) => ({
                    value: item.agent,
                    label: item.agent,
                    checked: false,
              }))
              .sort((a, b) => a.label.localeCompare(b.label)),
            }
        ]
    },
  },
  {
    id: 'hours_comparison_report',
    label: 'Hours Comparison Report',
    generate: generateHoursComparisonReport,
    parameters: {
        targetAllowColumn: false,
        targetAllowCell: false,
        targetAllowRow: false,
        total: true,
        polling: 60000,
        dateRange: {
            default: {
              startDate: format(startOfDay(subDays(new Date(), 8)), 'yyyy-MM-dd'),
              endDate: format(endOfDay(subDays(new Date(), 1)), 'yyyy-MM-dd'),
            },
            maxDate: subDays(new Date(), 1),
            minDate: new Date().setFullYear(new Date().getFullYear() - 1),
        },
        date: false,
        headerGrouping: true,
        headerGroups: [
          {
            colSpan: 1,
          },
          {
            colSpan: 6,
            headerClass: "text-center w-full border-r border-gray-300 text-sm text-gray-400 dark:text-dark-500 font-semibold h-10",
            label: "Agent Hours"
          },
          {
            colSpan: 4,
            headerClass: "text-center w-full border-r border-gray-300 text-sm text-gray-400 dark:text-dark-500 font-semibold h-10",
            label: "TM / DM / QC Hours"
          },
          {
            colSpan: 2,
          }
        ],
        structure: [
          {
            id: "shift_date",
            label: "Shift Date",
            dataType: "date",
            visible: true,
            allowTarget: false,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-left font-medium flex flex-row items-center justify-start gap-x-2 w-full",
            headerClass: "text-left flex flex-row items-center justify-start gap-x-2 w-full",
            headerAnnotation: "",
            format: (value) => format(new Date(value), 'dd MMMM, yyyy'),
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "agent_shift_duration_hours",
            label: "Scheduled",
            dataType: "float",
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
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "agent_worked_duration_hours",
            label: "Worked",
            dataType: "float",
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
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "agent_worked_duration_hours_excl_breaks",
            label: "Worked",
            dataType: "float",
            visible: false,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(Excl. Breaks)",
            format: (value) => {
              if (!isNaN(value)) {
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "agent_difference",
            label: "Difference",
            dataType: "float",
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
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },          
          {
            id: "agent_worked_percentage",
            label: "Worked",
            dataType: "float",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
            numeratorId: "agent_worked_duration_hours", 
            denominatorId: "agent_shift_duration_hours",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(%)",
            format: (value) => {
              if (!isNaN(value)) {
                return parseFloat(value).toFixed(2); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "agent_sick_hours",
            label: "Sick",
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
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "agent_awol_hours",
            label: "AWOL",
            dataType: "integer",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            thClass: "border-r border-gray-300",
            tdClass: "border-r border-gray-300",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full pr-2",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full pr-2",
            headerAnnotation: "",
            format: (value) => {
              if (!isNaN(value)) {
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "management_shift_duration_hours",
            label: "Scheduled",
            dataType: "float",
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
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "management_worked_duration_hours",
            label: "Worked",
            dataType: "float",
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
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "management_worked_duration_hours_excl_breaks",
            label: "Worked",
            dataType: "float",
            visible: false,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(Excl. Breaks)",
            format: (value) => {
              if (!isNaN(value)) {
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "management_difference",
            label: "Difference",
            dataType: "float",
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
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },           
          {
            id: "management_worked_percentage",
            label: "Worked",
            dataType: "float",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
            numeratorId: "management_worked_duration_hours", 
            denominatorId: "management_shift_duration_hours",
            thClass: "border-r border-gray-300",
            tdClass: "border-r border-gray-300",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(%)",
            format: (value) => {
              if (!isNaN(value)) {
                return parseFloat(value).toFixed(2); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "minutes",
            label: "Internal Call Minutes",
            dataType: "float",
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
                return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },           
          {
            id: "utilisation",
            label: "Utilisation",
            dataType: "float",
            visible: true,
            allowTarget: true,
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
            numeratorId: "minutes", 
            denominatorId: "agent_worked_duration_seconds",
            cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
            headerAnnotation: "(%)",
            format: (value) => {
              if (!isNaN(value)) {
                return parseFloat(value).toFixed(2); // Convert to float and round to two decimal places
              }
              return value; // Return the value as is if it's not a number
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
        ],
        filters: [
        ]
    },
  },
];

export default rotaReportsConfig;