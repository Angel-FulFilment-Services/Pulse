import { useState, useEffect } from 'react';
import SelectControl from '../../Components/Controls/SelectControl';
import ButtonControl from '../../Components/Controls/ButtonControl';
import PopoverFlyout from '../../Components/Flyouts/PopoverFlyout';
import DateInput from '../../Components/Forms/DateInput';
import { ArrowPathIcon, Cog8ToothIcon, CogIcon } from '@heroicons/react/24/outline'
import { RiFileExcel2Line } from "@remixicon/react";
import LastUpdated from './ReportLastUpdated';
import { toWords } from 'number-to-words';

export default function ReportingHeader({ dateRange, tabs, activeTab, handleTabClick, handleDateChange, report, handleReportChange, handleReportRegenerate, handleReportToExcel, handleTogglePolling, isPolling, lastUpdated, reports }) {
  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  function formatPollingInterval(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
  
    const minutesText = minutes === 1 ? 'minute' : `${toWords(minutes)} minute${minutes > 1 ? 's' : ''}`;
    const secondsText = seconds === 1 ? 'second' : `${toWords(seconds)} second${seconds > 1 ? 's' : ''}`;
  
    if (minutes > 0 && seconds > 0) {
      return `Every ${minutes === 1 ? 'minute' : minutesText} and ${secondsText}`;
    } else if (minutes > 0) {
      return `Every ${minutes === 1 ? 'minute' : minutesText}`;
    } else {
      return `Every ${seconds === 1 ? 'second' : secondsText}`;
    }
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
        <div className="w-full flex items-center gap-x-2">
          <div className="max-w-56 w-full relative">
            {reports.length &&
              <>
                <SelectControl
                  id="view-select"
                  items={reports}
                  onSelectChange={handleReportChange}
                  placeholder={`Select Report`}
                />
                {isPolling &&
                  <div className="absolute top-[-0.200rem] right-[-0.200rem] w-2.5 h-2.5 rounded-full">
                    <PopoverFlyout
                      placement='top'
                      className=""
                      content={
                        <div className="w-full mx-auto p-2 flex flex-col cursor-default">
                            <p className="whitespace-nowrap text-xs pb-1.5 border-b border-gray-300 text-gray-800">This report is automatically refreshed {formatPollingInterval(report?.parameters?.polling).toLowerCase()}. </p>
                            <LastUpdated lastUpdated={lastUpdated} />
                            <div>
                              <p className="whitespace-nowrap text-left text-xs pt-1.5 text-orange-600 underline w-full">Click Icon to Disable </p>
                            </div>
                        </div>
                      }>
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-green-200"></div>
                        <div onClick={handleTogglePolling(true)} className="absolute w-2.5 h-2.5 rounded-full bg-green-500 hover:grayscale-[50%] hover:animate-none cursor-pointer animate-pulse"></div>
                      </PopoverFlyout>
                  </div>
                }
              </>
            }
          </div>
          <div className="flex gap-x-2">
            {Object.values(report).length ? 
              <ButtonControl id="refresh_button" Icon={ArrowPathIcon} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-gray-400 hover:text-gray-500 transition-all ease-in-out" onButtonClick={handleReportRegenerate}/> : null
            }
            {Object.values(report).length ? 
              <ButtonControl id="refresh_button" Icon={Cog8ToothIcon} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-gray-400 hover:text-gray-500 transition-all ease-in-out" onButtonClick={handleReportRegenerate}/> : null
            }
            {Object.values(report).length ? 
              <ButtonControl id="refresh_button" Icon={RiFileExcel2Line} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-orange-500 hover:text-orange-600 transition-all ease-in-out" onButtonClick={handleReportToExcel}/> : null
            }
          </div>
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
