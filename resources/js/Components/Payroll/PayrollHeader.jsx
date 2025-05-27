import SelectControl from '../../Components/Controls/SelectControl';
import ButtonControl from '../../Components/Controls/ButtonControl';
import PopoverFlyout from '../../Components/Flyouts/PopoverFlyout';
import DateInput from '../../Components/Forms/DateInput';
import { ArrowPathIcon, Cog8ToothIcon, CogIcon, CheckIcon } from '@heroicons/react/24/outline'
import { RiFileExcel2Line } from "@remixicon/react";
import LastUpdated from '../Reporting/ReportLastUpdated';
import { toWords } from 'number-to-words';
import TabControls from './TabControls';

export default function PayrollHeader({ dateRange, tabs, activeTab, handleTabClick, handleDateChange, report, handleReportChange, handleReportRegenerate, handleReportEdit, handleReportToExcel, handleTogglePolling, isPolling, isEditing, lastUpdated, reports }) {
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
    <header className="relative isolate bg-white dark:bg-dark-900 shadow-md z-20">
      <TabControls tabs={tabs} activeTab={activeTab} handleTabClick={handleTabClick} />
      <div className="mx-auto flex items-center justify-between max-w-full w-full px-6 py-5">
        <div className="w-full flex items-center gap-x-2">
          <div className="max-w-56 w-full relative">
            {reports.length &&
              <>
                <SelectControl
                  id="view-select"
                  items={reports}
                  onSelectChange={handleReportChange}
                  defaultSelected={report ? reports.find(r => r.id === report.id) : null}
                  placeholder={`Select Report`}
                />
                  {report?.parameters?.polling &&
                    <div className="absolute top-[-0.200rem] right-[-0.200rem] w-2.5 h-2.5 rounded-full">
                      <PopoverFlyout
                        placement='top'
                        className=""
                        content={
                          <div className="w-full mx-auto p-2 flex flex-col cursor-default">
                              {isPolling ?
                                <>
                                  <p className="whitespace-nowrap text-xs pb-1.5 border-b border-gray-300 text-gray-800 dark:border-dark-600 dark:text-dark-200">This report is automatically refreshed {formatPollingInterval(report?.parameters?.polling).toLowerCase()}. </p>
                                  <LastUpdated lastUpdated={lastUpdated} />
                                  <div>
                                    <p className="whitespace-nowrap text-left text-xs pt-1.5 text-theme-600 dark:text-theme-700 underline w-full">Click Icon to Disable </p>
                                  </div>
                                </>
                              :
                                <>
                                  <p className="whitespace-nowrap text-xs pb-1.5 border-b border-gray-300 text-gray-800 dark:border-dark-600 dark:text-dark-200">This report is not automatically refreshed.</p>
                                  <LastUpdated lastUpdated={lastUpdated} />
                                  <div>
                                    <p className="whitespace-nowrap text-left text-xs pt-1.5 text-theme-600 dark:text-theme-700 underline w-full">Click Icon to Enable </p>
                                  </div>
                                </>
                              }
                          </div>
                        }>
                          <div className={`absolute w-2.5 h-2.5 rounded-full ${isPolling ? "bg-green-200 dark:bg-green-300" : "bg-red-200 dark:bg-red-300"}`}></div>
                          <button onClick={() => {handleTogglePolling()}} className={`absolute w-2.5 h-2.5 rounded-full ${isPolling ? "bg-green-500 dark:bg-green-600 animate-pulse" : "bg-red-400 dark:bg-red-500"} hover:grayscale-[50%] hover:animate-none cursor-pointer`}></button>
                        </PopoverFlyout>
                    </div>
                  }
              </>
            }
          </div>
          <div className="flex gap-x-2">
            {Object.values(report).length ? 
              <>
                <ButtonControl id="refresh_button" Icon={ArrowPathIcon} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400 transition-all ease-in-out" onButtonClick={handleReportRegenerate}/>
                <ButtonControl id="refresh_button" Icon={!isEditing ? Cog8ToothIcon : CheckIcon} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-gray-400 dark:text-dark-500 dark:hover:text-gray-400 hover:text-gray-500 transition-all ease-in-out" onButtonClick={handleReportEdit}/> 
                <ButtonControl id="refresh_button" Icon={RiFileExcel2Line} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-theme-500 hover:text-theme-600 dark:text-theme-700 dark:hover:text-theme-600 transition-all ease-in-out" onButtonClick={handleReportToExcel}/>
              </>
              : null
            }
          </div>
        </div>
        <div className="max-w-56 w-full">
          {(report?.parameters?.dateRange || report?.parameters?.date) && (
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
          )}
        </div>
      </div>
    </header>
  )
}
