import { generateAttendanceReport } from '../Components/Reporting/Reports/RotaReportGenerators';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

const rotaReportsConfig = [
  {
    id: 'attendence_report',
    label: 'Attendence Report',
    generate: generateAttendanceReport,
    parameters: {
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
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
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
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
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
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
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
            target: 0,
            targetDirection: 'asc',
            prefix: "",
            suffix: "%",
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
          }
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
            },
            {
              id: 'status',
              name: 'Status',
              expression: (shift, userStates, timesheets, events) => (filterValue) => {
                const { status } = getStatus(shift, timesheets, events);
                return status === filterValue;
              },
              options: [
                { value: 'Absent', label: 'Absent', checked: false },
                { value: 'Attended', label: 'Attended', checked: false },
                { value: 'Awol', label: 'Awol', checked: false },
                { value: 'Late', label: 'Late', checked: false },
                { value: 'Reduced', label: 'Reduced', checked: false },
                { value: 'Sick', label: 'Sick', checked: false },
                { value: 'Surplus', label: 'Surplus', checked: false },
              ].sort((a, b) => a.label.localeCompare(b.label)),
            },
        ]
    },
  },
];

export default rotaReportsConfig;