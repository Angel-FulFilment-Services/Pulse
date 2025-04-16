import { useState } from 'react';
import SelectControl from '../../Components/Controls/SelectControl';
import DateInput from '../../Components/Forms/DateInput';

export default function ReportingHeader({ dateRange, tabs, activeTab, handleTabClick, handleDateChange, report, handleReportChange, reports }) {
  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <header className="relative isolate bg-white shadow-md z-20">
    <div className="border-b border-gray-200 bg-white/40 px-6 pt-4">
      <h3 className="text-lg font-semibold leading-6 text-gray-900">Reporting</h3>
      <div className="mt-4">
        <div className="block">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <a
                key={tab.label}
                onClick={(e => (handleTabClick(tab.path)))}
                className={classNames(
                  tab.current
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium cursor-pointer'
                )}
                aria-current={tab.current ? 'page' : undefined}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-16 top-full -mt-16 transform-gpu opacity-50 blur-3xl xl:left-1/2 xl:-ml-80">
          <div
            className="aspect-[1154/678] w-[72.125rem] bg-gradient-to-br from-[#ff9a63] to-[#fff308]"
            style={{
              clipPath:
                'polygon(100% 38.5%, 82.6% 100%, 60.2% 37.7%, 52.4% 32.1%, 47.5% 41.8%, 45.2% 65.6%, 27.5% 23.4%, 0.1% 35.3%, 17.9% 0%, 27.7% 23.4%, 76.2% 2.5%, 74.2% 56%, 100% 38.5%)',
            }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gray-900/5" />
      </div>
      <div className="mx-auto flex items-center justify-between max-w-full w-full px-6 py-5">
        <div className="max-w-56 w-full">
          {reports.length &&
            <SelectControl
              id="view-select"
              items={reports}
              onSelectChange={handleReportChange}
              placeholder={`Select Report`}
            />
          }
        </div>
        <div className="max-w-56 w-full">
          <DateInput 
            startDateId={"startDate"} 
            endDateId={"endDate"} 
            label={null} 
            placeholder={"Date Range"} 
            dateRange={true} 
            showShortcuts={true}
            minDate={report?.parameters?.dateRange?.minDate || null} 
            maxDate={report?.parameters?.dateRange?.maxDate || null}
            currentState={{startDate: dateRange.startDate, endDate: dateRange.endDate}} 
            onDateChange={handleDateChange}
          />
        </div>
      </div>
    </header>
  )
}
