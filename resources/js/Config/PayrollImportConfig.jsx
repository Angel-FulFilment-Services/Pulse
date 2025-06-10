import { handleGrossPayImport } from '../Components/Payroll/Imports/PayrollImportHandlers';

const payrollImportConfig = [
  {
      id: 'gross_pay_import',
      label: 'Gross Pay Import',
      import: handleGrossPayImport,
  },
];

export default payrollImportConfig;