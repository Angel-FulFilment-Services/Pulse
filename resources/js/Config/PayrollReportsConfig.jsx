import { generatePayrollExport } from '../Components/Payroll/Exports/PayrollExportGenerators';
import { format, startOfDay, endOfDay, subDays, isBefore, isAfter, setDate, subMonths, addMonths, differenceInYears, intervalToDuration, addDays } from 'date-fns';
import { getMinimumWageForPeriodByDOB } from '../Utils/minimumWage.jsx';

const payrollReportsConfig = [
  {
      id: 'payroll_export',
      label: 'Payroll Export',
      generate: generatePayrollExport,
      parameters: {
          targetAllowColumn: false,
          targetAllowCell: false,
          targetAllowRow: false,
          total: false,
          polling: 60000,
          dateRange: {
              default: {
                startDate: format(isBefore(new Date(), setDate(new Date(), 29)) ? setDate(subMonths(new Date(), 1), 29) : setDate(new Date(), 29), 'yyyy-MM-dd'),
                endDate: format(isAfter(new Date(), setDate(new Date(), 28)) ? setDate(addMonths(new Date(), 1), 28) : setDate(new Date(), 28), 'yyyy-MM-dd'),
              },
              maxDate: new Date(),
              minDate: new Date().setFullYear(new Date().getFullYear() - 1),
          },
          date: false,
          structure: [
            {
              id: "sage_id",
              label: "Sage ID",
              dataType: "integer",
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
              id: "hr_id",
              label: "Employee Reference",
              dataType: "integer",
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
              id: "firstname",
              label: "First Name",
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
              id: "surname",
              label: "Surname",
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
              id: "dob",
              label: "Date of Birth",
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
                return format(new Date(value), 'dd/MM/yyyy');
              },
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "age",
              label: "Age",
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
              format: (dob, { referenceDate } = {}) => {
                if (!dob) return "";
                return differenceInYears(new Date(referenceDate), new Date(dob));
              },
              parameters: {
                referenceDate: {
                  type: 'endDate',
                  label: 'Reference Date',
                  default: new Date(),
                  description: 'The date to calculate the age against. Defaults to today.',
                },
              },
              requires: ['dob'],
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "start_date",
              label: "Start Date",
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
                return format(new Date(value), 'dd/MM/yyyy');
              },
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "rate_of_pay",
              label: "Rate of Pay",
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
              format: (dob, { startDate, endDate } = {}) => {
                if (!dob || !startDate || !endDate) return "";
                // Get array of daily rates for the period
                const rates = getMinimumWageForPeriodByDOB(dob, startDate, endDate);
                if (Array.isArray(rates)) {
                  // Average the rates over the period
                  const avg = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
                  return avg ? avg.toFixed(2) : "";
                }
                return rates ? rates.toFixed(2) : "";
              },
              parameters: {
                startDate: {
                  type: 'startDate',
                  label: 'Start Date',
                  default: new Date(),
                  description: 'The date to calculate the ROP against. Defaults to today.',
                },
                endDate: {
                  type: 'endDate',
                  label: 'End Date',
                  default: new Date(),
                  description: 'The date to calculate the age against. Defaults to today.',
                },
              },
              requires: ['dob'],
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "hours",
              label: "Hours",
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
                if (!value || isNaN(value) || Number(value) <= 0) return "0";
                return parseFloat(value).toFixed(2);
              },
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "bonus",
              label: "Bonus",
              dataType: "integer",
              visible: true,
              allowTarget: true,
              target: 0,
              targetDirection: 'asc',
              prefix: "£",
              suffix: "",
              cellClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
              headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
              headerAnnotation: "",
              format: (value) => {
                if (!value || isNaN(value) || Number(value) <= 0) return "0.00";
                return parseFloat(value).toFixed(2);
              },
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "holiday",
              label: "Holiday",
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
                if (!value || isNaN(value) || Number(value) <= 0) return "0";
                const num = Number(value);
                return Number.isInteger(num) ? Math.round(num) : num.toFixed(2);
              },
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "holiday_pay",
              label: "Holiday Pay",
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
                if (!value || isNaN(value) || Number(value) <= 0) return "0.00";
                return parseFloat(value).toFixed(2);
              },
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "length_of_service",
              label: "Length of Service",
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
              format: (days, { startDate } = {} ) => {
                if (!days || isNaN(days)) return "";
                
                const duration = intervalToDuration({
                  start: subDays(new Date(startDate), Number(days)),
                  end: new Date(startDate),
                });
                const parts = [];
                if (duration.years) parts.push(`${duration.years} years`);
                else parts.push('0 years');
                if (duration.months) parts.push(`${duration.months} months`);
                else parts.push('0 months');
                return parts.length ? parts.join(' ') : '0 months';
              },
              parameters: {
                startDate: {
                  type: 'endDate',
                  label: 'End Date',
                  default: new Date(0),
                  description: 'The date to calculate the length of service against. Defaults to the Unix epoch.',
                },
              },
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "days_of_week",
              label: "Days Per Week",
              dataType: "integer",
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
          ]
      },
  },
];

export default payrollReportsConfig;