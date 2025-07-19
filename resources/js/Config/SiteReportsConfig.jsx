import { generateAccessLog } from '../Components/Reporting/Reports/SiteReportGenerators';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

const siteReportsConfig = [
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
            format: (value) => {
              // Title case the type for better readability
              return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "category",
            label: "Category",
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
            format: (value) => {
              // Title case and replace any hyphens with spaces for better readability
              value = value.replace(/-/g, ' ');
              return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
          {
            id: "person",
            label: "Person",
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
            id: "location",
            label: "Location",
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
            id: "company",
            label: "Company",
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
            id: "visiting",
            label: "Visiting",
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
            id: "car_registration",
            label: "Car Registration",
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
            id: "signed_in",
            label: "Signed In",
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
            id: "signed_out",
            label: "Signed Out",
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
              // If the date is null, return a placeholder string
              if (!value) return '';

              return format(new Date(value), 'dd MMMM, yyyy HH:mm:ss');
            },
            cellAnnotation: (value) => value,
            cellAction: (value) => value,
          },
        ],
        filters: [
            {
              id: 'person',
              name: 'Person',
              expression: (data) => (filterValue) => {
                return data?.person === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.person || seen.has(item.person)) return false;
                    seen.add(item.person);
                    return true;
                  })
                  .map(item => ({
                    value: item.person,
                    label: item.person,
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
                    label: item.type.replace(/-/g, ' ').charAt(0).toUpperCase() + item.type.replace(/-/g, ' ').slice(1).toLowerCase(),
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'category',
              name: 'Category',
              expression: (data) => (filterValue) => {
                return data?.category === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.category || seen.has(item.category)) return false;
                    seen.add(item.category);
                    return true;
                  })
                  .map(item => ({
                    value: item.category,
                    label: item.category.replace(/-/g, ' ').charAt(0).toUpperCase() + item.category.replace(/-/g, ' ').slice(1).toLowerCase(),
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
            {
              id: 'location',
              name: 'Location',
              expression: (data) => (filterValue) => {
                return data?.location === filterValue;
              },
              calculateOptions: (reportData) => {
                const seen = new Set();
                return reportData
                  .filter(item => {
                    if (!item.location || seen.has(item.location)) return false;
                    seen.add(item.location);
                    return true;
                  })
                  .map(item => ({
                    value: item.location,
                    label: item.location,
                    checked: false,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));
              },
            },
      ],
    },
  },
];

export default siteReportsConfig;