import { generatePayrollExport } from '../Components/Payroll/Exports/PayrollExportGenerators';
import { format, startOfDay, endOfDay, subDays, isBefore, isAfter, setDate, subMonths, addMonths, differenceInYears, intervalToDuration, addDays } from 'date-fns';
import { getMinimumWageForPeriodByDOB } from '../Utils/minimumWage.jsx';
import { FlagIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import ClickedModal from '../Components/Modals/ClickedModal.jsx';
import PayrollExceptions from '../Components/Payroll/PayrollExceptions.jsx';
import { exportArrayToExcel, buildExportSheets } from '../Utils/Exports';

const payrollSheetsConfig = [
    {
      name: "Salary",
      fields: [
          [
              { label: "EMPLOYEE INFORMATION", merge: { r: 1, c: 6 }, headerStyle: { bgColor: "A9D08E", border: "all" } },
              { label: "HOURS", merge: { r: 1, c: 2 }, headerStyle: { bgColor: "FFE699", border: "all", bold: false } },
              { label: "Bonuses", headerStyle: { bgColor: "00B0F0", border: "all", bold: false, fontSize: 10 } },
              { label: "HOLIDAY", headerStyle: { bgColor: "CCFF66", border: "all" } },
              { label: "LOS", headerStyle: { bgColor: "CCFF66", border: "all" } },
              { label: "", headerStyle: { bgColor: "CCFF66", border: "all" } }, // Blank cell
              { label: "OTHER PAYMENTS", merge: { r: 1, c: 4 }, headerStyle: { bgColor: "66FF66", border: "all" } },
              { label: "Deductions", merge: { r: 1, c: 2}, headerStyle: { bgColor: "FFFF00", border: "all" } },
          ],
          [
              { key: "hr_id", label: "Employee Reference", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "firstname", label: "First Name", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true, horizontal: "left", }, dataStyle: { border: "all", horizontal: "left", } },
              { key: "surname", label: "Surname", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true, horizontal: "left" }, dataStyle: { border: "all", horizontal: "left", } },
              { key: "dob", label: "DOB", format: "date", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "age", label: "Age", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "start_date", label: "Start Date", format: "date", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "hourly_rate", label: "Hourly Rate", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "total_hours", label: "Total Hours", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "bonus", label: "TOTAL BONUSES", format: "currency", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "holiday", label: "Holiday (No of Days)", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
                colorFn: (cell) => {
                  if (cell.value > 0) {
                      return { bgColor: "FFFF00" };
                  }
                  return null;
                }
              },
              { key: "length_of_service", label: "Length of Service", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "days_of_week", label: "Days worked per week", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
              { key: "ssp_qty", label: "SSP (No of Days)", forceEmptyIfZero: true, headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
                colorFn: (cell) => {
                  if (cell.value > 0) {
                      return { bgColor: "FFFF00" };
                  }
                  return null;
                }
              },
              { key: "spp_qty", label: "SPP (No of Days)", forceEmptyIfZero: true, headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
                colorFn: (cell) => {
                  if (cell.value > 0) {
                      return { bgColor: "FFFF00" };
                  }
                  return null;
                }
              },
              { key: "pilon_qty", label: "PILON (No of Days)", forceEmptyIfZero: true, headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
                colorFn: (cell) => {
                  if (cell.value > 0) {
                      return { bgColor: "FFFF00" };
                  }
                  return null;
                }
              },
              { key: "other_payment", label: "Other Payment", format: "currency", forceEmptyIfZero: true, headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
                colorFn: (cell) => {
                  if (cell.value > 0) {
                      return { bgColor: "FFFF00" };
                  }
                  return null;
                }
              },
              { key: "od_amount_qty", label: "Other Deductions (£)", format: "currency", forceEmptyIfZero: true, headerStyle: { bgColor: "FFFF00", border: "all", wrapText: true }, dataStyle: { border: "all" },
                colorFn: (cell) => {
                  if (cell.value !== '-£0') {
                      return { bgColor: "FFFF00", fontColor: "FF0000" };
                  }
                  return null;
                }
              },
              { key: "od_days_qty", label: "Other Deductions (No of Days)", forceEmptyIfZero: true, headerStyle: { bgColor: "FFFF00", border: "all", wrapText: true }, dataStyle: { border: "all" },
                colorFn: (cell) => {
                  if (cell.value > 0) {
                      return { bgColor: "FFFF00", fontColor: "FF0000" };
                  }
                  return null;
                }
              },
              { key: "leave_date", visible: false },
          ],
      ],
      rowHeights: [12.75, 31.50, 10.50],
      columnWidths: [9.00, 8.14, 8.86, 8.86, 3.57, 8.86, 20.57, 6.14, 7.86, 11.14, 14.13, 8.14, 8.14, 8.57, 8.00, 10.57, 13.57, 16.00],
      fixed: { hourly_rate: "SALARY", total_hours: "SALARY", other_payment: "" },
      filterFn: row => row.employment_category === "SALARY",
      rowColorFn: (row) => {
        if (row.find((cell) => cell.key === 'leave_date').value) {
          return { bgColor: "FF8080" };
        }
      },
      sortFn: (a, b) => {
        const aValue = a.find((cell) => cell.key === 'surname')?.value || '';
        const bValue = b.find((cell) => cell.key === 'surname')?.value || '';
        return aValue.localeCompare(bValue);
      },
      styles: {
          headerStyles: {
              fontColor: "000000",
              fontSize: 8,
              vertical: "bottom",
              horizontal: "center",
              bold: true,
              fontFamily: "Tahoma"
          },
          dataStyles: {
              fontColor: "000000",
              fontSize: 8,
              vertical: "center",
              horizontal: "center",
              fontFamily: "Tahoma"
          },
      },
  },
  {
    name: "Payroll Details",
    fields: [
      [
          { label: "EMPLOYEE INFORMATION", merge: { r: 1, c: 6 }, headerStyle: { bgColor: "A9D08E", border: "all" } },
          { label: "HOURS", merge: { r: 1, c: 2 }, headerStyle: { bgColor: "FFE699", border: "all", bold: false } },
          { label: "Bonuses", headerStyle: { bgColor: "00B0F0", border: "all", bold: false, fontSize: 10, } },
          { label: "HOLIDAY", merge: { r: 1, c: 2}, headerStyle: { bgColor: "CCFF66", border: "all" } },
          { label: "LOS", headerStyle: { bgColor: "CCFF66", border: "all" } },
          { label: "", headerStyle: { bgColor: "CCFF66", border: "all" } }, // Blank cell
          { label: "OTHER PAYMENTS", merge: { r: 1, c: 4 }, headerStyle: { bgColor: "66FF66", border: "all" } },
          { label: "Deductions", merge: { r: 1, c: 2}, headerStyle: { bgColor: "FFFF00", border: "all" } },
      ],
      [
          { key: "hr_id", label: "Employee Reference", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "firstname", label: "First Name", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "surname", label: "Surname", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "dob", label: "DOB", format: "date", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "age", label: "Age", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "start_date", label: "Start Date", format: "date", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "rate_of_pay", label: "Hourly Rate", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "hours", label: "Total Hours", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "bonus", label: "TOTAL BONUSES", format: "currency", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "holiday", label: "Holiday (No of Days)", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
            colorFn: (cell) => {
              if (cell.value > 0) {
                  return { bgColor: "FFFF00" };
              }
              return null;
            }
          },
          { key: "holiday_pay", label: "Total Holiday", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
            colorFn: (cell) => {
              if (cell.value > 0) {
                  return { bgColor: "FFFF00" };
              }
              return null;
            }
          },
          { key: "length_of_service", label: "Length of Service", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "days_of_week", label: "Days worked per week", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
          { key: "ssp_qty", label: "SSP (No of Days)", forceEmptyIfZero: true, headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
            colorFn: (cell) => {
              if (cell.value > 0) {
                  return { bgColor: "FFFF00" };
              }
              return null;
            }
          },
          { key: "spp_qty", label: "SPP (No of Days)", forceEmptyIfZero: true, headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
            colorFn: (cell) => {
              if (cell.value > 0) {
                  return { bgColor: "FFFF00" };
              }
              return null;
            }
          },
          { key: "pilon_qty", label: "PILON (No of Days)", forceEmptyIfZero: true, headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
            colorFn: (cell) => {
              if (cell.value > 0) {
                  return { bgColor: "FFFF00" };
              }
              return null;
            }
          },
          { key: "other_payment", label: "Other Payment", format: "currency", forceEmptyIfZero: true, headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" },
            colorFn: (cell) => {
              if (cell.value > 0) {
                  return { bgColor: "FFFF00" };
              }
              return null;
            }
          },
          { key: "od_amount_qty", label: "Other Deductions (£)", format: "currency", forceEmptyIfZero: true, headerStyle: { bgColor: "FFFF00", border: "all", wrapText: true }, dataStyle: { border: "all" },
            colorFn: (cell) => {
              if (cell.value !== '-£0') {
                  return { bgColor: "FFFF00", fontColor: "FF0000"};
              }
              return null;
            }
          },
          { key: "od_days_qty", label: "Other Deductions (No of Days)", forceEmptyIfZero: true, headerStyle: { bgColor: "FFFF00", border: "all", wrapText: true }, dataStyle: { border: "all" },
            colorFn: (cell) => {
              if (cell.value > 0) {
                  return { bgColor: "FFFF00", fontColor: "FF0000"};
              }
              return null;
            }
          },
          { key: "leave_date", visible: false },
      ],
    ],
    rowHeights: [12.75, 31.50, 10.50],
    columnWidths: [9.00, 8.14, 8.86, 8.86, 3.57, 8.86, 20.57, 6.14, 7.86, 11.14, 14.13, 14.13, 8.14, 8.14, 8.57, 8.00, 10.57, 13.57, 16.00],
    fixed: { other_payment: "" },
    filterFn: row => row.employment_category === "HOURLY",
    rowColorFn: (row) => {
      if (row.find((cell) => cell.key === 'leave_date').value) {
        return { bgColor: "FF8080" };
      }
    },
    sortFn: (a, b) => {
      const aValue = a.find((cell) => cell.key === 'surname')?.value || '';
      const bValue = b.find((cell) => cell.key === 'surname')?.value || '';
      return aValue.localeCompare(bValue);
    },
    styles: {
      headerStyles: {
          fontColor: "000000",
          fontSize: 8,
          vertical: "bottom",
          horizontal: "center",
          bold: true,
          fontFamily: "Tahoma"
      },
      dataStyles: {
          fontColor: "000000",
          fontSize: 8,
          vertical: "center",
          horizontal: "center",
          fontFamily: "Tahoma"
      },
    },
  },
  {
    name: "Leavers",
    fields: [
        [
            { label: "EMPLOYEE INFORMATION", merge: { r: 1, c: 7 }, headerStyle: { bgColor: "A9D08E", border: "all" } },
        ],
        [
            { key: "hr_id", label: "Employee Reference", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
            { key: "firstname", label: "First Name", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true, horizontal: "left" }, dataStyle: { border: "all", horizontal: "left" } },
            { key: "surname", label: "Surname", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true, horizontal: "left" }, dataStyle: { border: "all", horizontal: "left" } },
            { key: "start_date", format: "date", label: "Start Date", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true, horizontal: "left" }, dataStyle: { border: "all", horizontal: "left" } },
            { key: "leave_date", format: "date", label: "Leave Date", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
            { key: "hwk_returned", label: "HWK Returned?", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
            { key: "notes", label: "Notes", headerStyle: { bgColor: "D9D9D9", border: "all", wrapText: true }, dataStyle: { border: "all" } },
        ],
    ],
    rowHeights: [12.75, 24, 10.50],
    columnWidths: [8.57, 13.43, 10.57, 12.71, 13.00, 13.43, 7.86],
    fixed: { hwk_returned: "", notes: "" },
    filterFn: row => !!row.leave_date,
    sortFn: (a, b) => {
      const aValue = a.find((cell) => cell.key === 'firstname')?.value || '';
      const bValue = b.find((cell) => cell.key === 'firstname')?.value || '';
      return aValue.localeCompare(bValue);
    },
    styles: {
      headerStyles: {
          fontColor: "000000",
          fontSize: 8,
          vertical: "bottom",
          horizontal: "center",
          bold: true,
          fontFamily: "Tahoma"
      },
      dataStyles: {
          fontColor: "000000",
          fontSize: 8,
          vertical: "center",
          horizontal: "center",
          fontFamily: "Tahoma"
      },
    },
  },
  {
    name: "Adjustments",
    fields: [
        [
            { key: "hr_id", label: "Emp No", headerStyle: { bgColor: "D9D9D9", border: "all" }, dataStyle: { border: "all", horizontal: "right" } },
            { key: "firstname", label: "First Name", headerStyle: { bgColor: "D9D9D9", border: "all" }, dataStyle: { border: "all", horizontal: "left" } },
            { key: "surname", label: "Surname", headerStyle: { bgColor: "D9D9D9", border: "all" }, dataStyle: { border: "all", horizontal: "left" } },
            { key: "adjustment", label: "Adjustment Amount", headerStyle: { bgColor: "D9D9D9", border: "all" }, dataStyle: { border: "all", fontSize: 10 } },
            { label: "", headerStyle: { bgColor: "D9D9D9", border: "all" }, dataStyle: { border: "all", fontSize: 10 } },
            { key: "items.deduction", label: "Deduction", headerStyle: { bgColor: "D9D9D9", border: "all" }, dataStyle: { border: "all", fontSize: 10 } },
            { key: "items.payment", label: "Additional Payment", headerStyle: { bgColor: "D9D9D9", border: "all" }, dataStyle: { border: "all", fontSize: 10 } },
            { key: "items.notes", label: "Details", headerStyle: { bgColor: "D9D9D9", border: "all" }, dataStyle: { border: "all", fontSize: 10, wrapText: true } },
        ],
    ],
    rowHeights: [12.75],
    subData: 'items',
    columnWidths: [8, 11, 9, 20, 26, 11, 20, 22],
    fixed: { adjustment: "" },
    filterFn: row => row.exception_count || row.adhoc_qty,
    styles: {
      headerStyles: {
          fontColor: "000000",
          fontSize: 10,
          vertical: "bottom",
          horizontal: "center",
          bold: true,
          fontFamily: "Tahoma"
      },
      dataStyles: {
          fontColor: "000000",
          fontSize: 8,
          vertical: "center",
          horizontal: "center",
          fontFamily: "Tahoma"
      },
    },
  }
];

const payrollReportsConfig = [
  {
      id: 'payroll_export',
      label: 'Payroll Export',
      generate: generatePayrollExport,
      toExcel: (data, filename, startDate, endDate) => {

        const config = payrollReportsConfig.find(cfg => cfg.id === 'payroll_export');
        const structure = config.parameters.structure;
        const targetFn = config.parameters.target;
        const parameters = { startDate, endDate };

        const sheets = buildExportSheets({
            sheetsConfig: payrollSheetsConfig,
            data,
            structure,
            targetFn,
            parameters
        });

        exportArrayToExcel(sheets, filename);
      },
      parameters: {
          targetAllowColumn: false,
          targetAllowCell: false,
          targetAllowRow: true,
          total: false,
          polling: 60000,
          dateRange: (() => {
            const today = new Date();
            const day = today.getDate();
            const startDate = format(setDate(subMonths(today, day <= 5 ? 2 : 1), 29), 'yyyy-MM-dd');
            const endDate = format(setDate(subMonths(today, day <= 5 ? 1 : 0), 28), 'yyyy-MM-dd');
            return {
              default: { startDate, endDate },
              maxDate: endDate,
              minDate: new Date().setFullYear(new Date().getFullYear() - 1),
            };
          })(),
          date: false,
          target: (row) => {
            if (!row) return "";

            if(row.exception_count > 0) {
              return `bg-yellow-100 text-yellow-700 dark:bg-yellow-300 dark:text-yellow-200 dark:bg-opacity-25`;
            }

            if(row.leave_date) {
              return `bg-red-100 text-red-800 dark:bg-red-400 dark:text-red-200 dark:bg-opacity-25`;
            }

            if(row.last_qty == 0 || row.days_of_week == 0) {
              return `bg-theme-100 text-theme-800 dark:bg-theme-400 dark:text-theme-200 dark:bg-opacity-25`;
            }
          },
          sorting: {
            default: { key: 'surname', direction: 'asc' }
          },
          structure: [
            {
              id: "actions",
              label: "Actions",
              dataType: "control",
              visible: true,
              control: (row, rowIndex, { startDate, endDate } = {}) => (
                <div className={`flex flex-row items-center justify-start gap-x-2`}>
                  <div className="flex items-center justify-center h-6 w-6">
                    <PauseIcon
                      className="h-6 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-not-allowed transition-all ease-in-out"
                      aria-hidden="true"
                    />
                  </div>
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
                  <div className={`text-theme-600 dark:text-theme-700 text-sm font-semibold rounded-full ring-theme-600 ring-1 dark:ring-theme-700 w-5 h-5 flex items-center justify-center flex-shrink-0 ml-1 ${(Number(row.exception_count) || 0) + (Number(row.adhoc_qty) || 0) === 1 ? 'pr-0.5' : null}`}>
                    {(Number(row.exception_count) || 0) + (Number(row.adhoc_qty) || 0)}
                  </div>
                </div>
              ),
              headerClass: "text-center flex flex-row items-center justify-center w-full",
              cellClass: "text-center flex flex-row items-center justify-center w-full",
              tdClass: "bg-gray-50 dark:bg-dark-800 border-x border-gray-300 dark:border-dark-600",
              thClass: "bg-gray-50 dark:bg-dark-800 border-x border-gray-300 dark:border-dark-600 border-b-0",
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
              label: "Emp. ID",
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
              id: "leave_date",
              label: "Leave Date",
              dataType: "date",
              visible: false,
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
              subLabel: "(No. of Days)",
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
              label: "Holiday",
              subLabel: "(£)",
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
              id: "length_of_service",
              label: "LOS",
              subLabel: "(Length of Service)",
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
              label: "DOW",
              subLabel: "(Days of Week)",
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
              label: "SSP",
              subLabel: "(No. of Days)",
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
              label: "SPP",
              subLabel: "(No. of Days)",
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
              label: "PILON",
              subLabel: "(No. of Days)",
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
              id: "od_amount_qty",
              label: "Deductions",
              subLabel: "(£)",
              dataType: "integer",
              visible: true,
              allowTarget: false,
              target: 0,
              targetDirection: 'asc',
              prefix: "-£",
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
              id: "od_days_qty",
              label: "Deductions",
              subLabel: "(No. of Days)",
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
            {
              id: 'firstname',
              name: 'Firstname',
              expression: (data) => (filterValue) => {
                return data?.firstname === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.firstname || seen.has(item.firstname)) return false;
                    seen.add(item.firstname);
                    return true;
                  })
                  .map(item => ({
                    value: item.firstname,
                    label: item.firstname,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'surname',
              name: 'Surname',
              expression: (data) => (filterValue) => {
                return data?.surname === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.surname || seen.has(item.surname)) return false;
                    seen.add(item.surname);
                    return true;
                  })
                  .map(item => ({
                    value: item.surname,
                    label: item.surname,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'status',
              name: 'Status',
              expression: (data) => (filterValue) => {
                if (filterValue === 'not_exportable') {
                  return  data.exception_count > 0 || data.last_qty == 0 || data.days_of_week == 0 || data.leave_date;
                } else if (filterValue === 'exportable') {
                  return !data.leave_date && (!data.exception_count || data.exception_count <= 0) && (data.last_qty > 0 || data.days_of_week > 0);
                }
                return true; // Default case, no filter applied
              },
              options: [
                { value: 'not_exportable', label: 'Not Exportable', checked: false },
                { value: 'exportable', label: 'Exportable', checked: false }
              ]
            },
            {
              id: 'include',
              name: 'Include',
              advanced: true,
              expression: (data) => (filterValue) => {
                if (filterValue === 'leaver') {
                  return data.leave_date;
                } else if (filterValue === 'salaried') {
                  return data.employment_category === 'SALARY';
                } else if (filterValue === 'hourly') {
                  return data.employment_category === 'HOURLY';
                }
                return true; // Default case, no filter applied
              },
              options: [
                { value: 'leaver', label: 'Leavers', checked: true, mode: 'solo' },
                { value: 'hourly', label: 'Hourly Employees', checked: true, mode: 'and' },
                { value: 'salaried', label: 'Salaried Employees', checked: false, mode: 'and' },
              ]
            }
        ]
      },
  },
];

export default payrollReportsConfig;