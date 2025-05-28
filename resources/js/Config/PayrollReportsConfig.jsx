import { generatePayrollExport } from '../Components/Payroll/Exports/PayrollExportGenerators';
import { format, startOfDay, endOfDay, subDays, isBefore, isAfter, setDate, subMonths, addMonths, differenceInYears, intervalToDuration, addDays } from 'date-fns';
import { getMinimumWageForPeriodByDOB } from '../Utils/minimumWage.jsx';
import { FlagIcon } from '@heroicons/react/24/outline';
import ClickedModal from '../Components/Modals/ClickedModal.jsx';
import PayrollExceptions from '../Components/Payroll/PayrollExceptions.jsx';

const payrollReportsConfig = [
  {
      id: 'payroll_export',
      label: 'Payroll Export',
      generate: generatePayrollExport,
      parameters: {
          targetAllowColumn: false,
          targetAllowCell: false,
          targetAllowRow: true,
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
          target: (row) => {
            if (!row) return "";

            if(row.exception_count > 0) {
              return `bg-yellow-100 text-yellow-700 dark:bg-yellow-300 dark:text-yellow-200 dark:bg-opacity-25`;
            }

            if(row.leave_date) {
              return `bg-red-100 text-red-800 dark:bg-red-400 dark:text-red-200 dark:bg-opacity-25`;
            }
          },
          structure: [
            {
              id: "actions",
              label: "Actions",
              dataType: "control",
              visible: true,
              control: (row, rowIndex, { startDate, endDate } = {}) => (
                <div className="flex flex-row items-center justify-start gap-x-3">
                  <ClickedModal
                      overlay={true}
                      size={"xs"}
                      className={`w-full h-full justify-center items-center flex`}
                      onClose={() => null} // Clear the message when the flyout closes
                      content={(handleSubmit, handleClose) => <PayrollExceptions hrId={row.hr_id} dateRange={{startDate: startDate, endDate: endDate}} handleClose={handleClose} /> 
                    }
                  >
                    <FlagIcon
                      className="h-5 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out"
                      aria-hidden="true"
                    />
                  </ClickedModal>
                  {/* {
                    row.exception_count > 0 &&
                    <div className="text-red-600 dark:text-red-700 text-xs font-semibold rounded-full ring-red-600 ring-1 dark:ring-red-700 w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {row.exception_count}
                    </div>
                  } */}
                </div>
              ),
              headerClass: "text-center flex flex-row items-center justify-start w-full",
              cellClass: "text-center flex flex-row items-center justify-start w-full",
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
            },
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
              cellClass: "text-center font-medium flex flex-row items-center justify-center gap-x-2 w-full",
              headerClass: "text-center flex flex-row items-center justify-center gap-x-2 w-full",
              headerAnnotation: "",
              format: (value) => value,
              cellAnnotation: (value) => value,
              cellAction: (value) => value,
            },
            {
              id: "hr_id",
              label: "Employee ID",
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
            {
              id: "ssp_qty",
              label: "SSP (No. of Days)",
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
              id: "spp_qty",
              label: "SPP (No. of Days)",
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
              id: "pilon_qty",
              label: "PILON (No. of Days)",
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
              id: "od_qty",
              label: "Other Deductions",
              dataType: "integer",
              visible: true,
              allowTarget: false,
              target: 0,
              targetDirection: 'asc',
              prefix: "£",
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