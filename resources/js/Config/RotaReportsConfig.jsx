import { generateAttendanceReport } from '../Components/Reporting/Reports/RotaReportGenerators';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

const rotaReportsConfig = [
  {
    id: 'attendence_report',
    label: 'Attendence Report',
    generate: generateAttendanceReport,
    parameters: {
        targetAllowColumn: true,
        targetAllowCell: false,
        targetAllowRow: false,
        total: true,
        polling: 60000,
        dateRange: {
            default: {
            startDate: format(startOfDay(subDays(new Date(), 7)), 'yyyy-MM-dd'),
            endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
            },
            maxDate: new Date().setFullYear(new Date().getFullYear() + 1),
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
            label: "Hours Scheduled To Work",
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
];

export default rotaReportsConfig;