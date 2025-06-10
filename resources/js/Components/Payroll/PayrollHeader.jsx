import React, { useState } from 'react';
import SelectControl from '../../Components/Controls/SelectControl';
import ButtonControl from '../../Components/Controls/ButtonControl';
import PopoverFlyout from '../../Components/Flyouts/PopoverFlyout';
import DateInput from '../../Components/Forms/DateInput';
import { ArrowPathIcon, Cog8ToothIcon, CheckIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { RiFileExcel2Line } from "@remixicon/react";
import LastUpdated from '../Reporting/ReportLastUpdated';
import { toWords } from 'number-to-words';
import TabControls from './TabControls';
import { exportPayrollToCSV } from '../../Utils/Exports';
import ProgressDialog from '../Dialogs/ProgressDialog'; // <-- Import your dialog

const SageIcon = ({ className = '', ...props }) => (
  <div className="relative w-9 h-8">
    <svg 
      viewBox="0 0 250 141" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className ? className : "h-5 w-5 text-gray-400 dark:text-dark-500 flex-shrink-0"}`}
      {...props}
    >
      <path d="M27.6269 0C43.2682 0 55.9863 10.8171 56.2793 25.8724C56.4258 30.1107 53.3561 32.4512 49.9935 32.4512C46.7773 32.4512 44.0006 30.1139 43.8542 26.1654C43.7077 17.6855 36.5462 11.3997 27.4805 11.3997C19.0006 11.3997 12.5716 17.3926 12.5716 25.5794C12.5716 34.4954 18.5645 38.444 30.9896 42.9753C44.2904 47.7995 56.4258 53.4993 56.4258 70.4557C56.4258 85.2213 44.8763 97.0605 28.7988 97.0605C13.0111 97.0605 0 85.9505 0 70.8952C0 61.5397 4.53125 54.9609 8.91602 54.9609C12.7181 54.9609 15.0553 57.4447 15.0553 60.8073C15.0553 63.7305 12.5716 65.0456 12.5716 70.3092C12.5716 79.6647 20.1725 85.6576 28.7988 85.6576C37.8613 85.6576 43.8542 79.3717 43.8542 71.7708C43.8542 62.4154 37.8613 58.4701 25.4362 54.082C11.5495 49.1178 0 43.1217 0 26.6048C0 11.696 11.9857 0 27.6269 0Z" fill="currentColor"/>
      <path d="M91.4225 97.0636C75.6348 97.0636 62.4805 84.3455 62.4805 68.2648C62.4805 51.6014 75.7813 39.1763 91.862 39.1763C109.111 39.1763 121.243 52.0409 121.243 69.5832V90.9243C121.243 94.5799 118.32 97.0636 114.958 97.0636C111.449 97.0636 108.525 94.5799 108.525 90.9243V70.0194C108.525 58.4699 101.947 50.576 91.569 50.576C82.36 50.576 75.0521 58.3234 75.0521 68.2648C75.0521 77.4738 82.2135 85.3677 91.2793 85.3677C94.6419 85.3677 96.1035 84.492 98.151 84.492C100.928 84.492 103.851 86.8293 103.851 90.1919C103.848 94.7231 98.4375 97.0636 91.4225 97.0636Z" fill="currentColor"/>
      <path d="M157.262 140.625C140.889 140.625 127.295 128.929 127.295 113.727C127.295 108.61 130.218 106.273 133.581 106.273C136.943 106.273 139.72 108.467 139.867 112.705C140.013 122.207 147.614 129.222 157.116 129.222C167.204 129.222 173.779 122.79 173.779 114.456C173.779 104.954 166.471 101.009 154.046 97.0604C139.574 92.3826 127.295 85.9504 127.295 68.1183C127.295 51.7446 139.867 39.1763 156.237 39.1763C172.754 39.1763 186.351 51.1619 186.351 66.9497C186.351 76.5981 182.406 84.0526 176.995 84.0526C173.34 84.0526 170.856 81.4224 170.856 78.2062C170.856 74.8436 173.779 73.382 173.779 67.3892C173.779 57.3013 165.885 50.5793 156.383 50.5793C147.174 50.5793 139.867 57.5975 139.867 66.8065C139.867 77.1841 147.321 81.5721 159.6 85.6639C173.779 90.3416 186.351 96.188 186.351 113.291C186.351 128.639 174.219 140.625 157.262 140.625Z" fill="currentColor"/>
      <path d="M222.227 97.0638C205.853 97.0638 192.406 84.1992 192.406 68.1218C192.406 52.041 205.417 39.1797 221.494 39.1797C237.722 39.1797 250 50.4362 250 64.7624C250 70.3158 246.055 73.6784 239.623 73.6784H222.813C219.45 73.6784 216.966 71.3411 216.966 68.2682C216.966 65.345 219.45 63.0046 222.813 63.0046H235.384C236.553 63.0046 237.432 62.4186 237.432 61.25C237.432 57.0117 232.022 50.4329 221.937 50.4329C212.582 50.4329 204.981 58.4733 204.981 68.1218C204.981 77.9167 212.728 85.6641 222.376 85.6641C233.487 85.6641 237.142 79.0853 241.673 79.0853C245.475 79.0853 247.52 81.569 247.52 84.349C247.52 86.9792 245.765 89.3197 241.38 92.0964C236.989 94.8698 230.414 97.0638 222.227 97.0638Z" fill="currentColor"/>
    </svg>
  </div>
);

export default function PayrollHeader({ 
    dateRange, 
    tabs, 
    activeTab, 
    handleTabClick, 
    handleDateChange, 
    selectPlaceholder = "Select Report", 
    report = [], 
    reports = [],
    handleReportChange, 
    handleReportRegenerate, 
    handleReportEdit, 
    handleReportToExcel, 
    handleReportExport, 
    handleTogglePolling, 
    handleImport,
    isPolling, 
    isEditing, 
    isGenerating, 
    lastUpdated, 
  }) {

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // Handler for Sage export button
  const handleSageExport = async () => {
    setIsDialogOpen(true);
    setProgress(0);
    await exportPayrollToCSV(dateRange.startDate, dateRange.endDate, setProgress);
    setProgress(100);
    setTimeout(() => setIsDialogOpen(false), 800); // Give user a moment to see 100%
  };

  return (
    <>
      <header className="relative isolate bg-white dark:bg-dark-900 shadow-md z-20">
        <TabControls tabs={tabs} activeTab={activeTab} handleTabClick={handleTabClick} />
        <div className="mx-auto flex items-center justify-between max-w-full w-full px-6 py-5">
          <div className="w-full flex items-center gap-x-2">
            <div className="max-w-56 w-full relative h-9">
              {reports.length ? (
                <>
                  <SelectControl
                    id="view-select"
                    items={reports}
                    onSelectChange={handleReportChange}
                    defaultSelected={report ? reports.find(r => r.id === report.id) : null}
                    placeholder={selectPlaceholder}
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
              ) : null
              }
            </div>
            <div className="flex gap-x-2">
              {(Object.values(report).length) ? 
                <>
                    {handleReportRegenerate ? (
                      <ButtonControl id="refresh_button" disabled={isGenerating} Icon={ArrowPathIcon} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-gray-400 hover:text-gray-500 dark:text-dark-500 dark:hover:text-gray-400 transition-all ease-in-out" onButtonClick={handleReportRegenerate}/>
                    ) : null}
                    { handleReportEdit ? (
                      <ButtonControl id="settings_button" disabled={isGenerating} Icon={!isEditing ? Cog8ToothIcon : CheckIcon} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-gray-400 dark:text-dark-500 dark:hover:text-gray-400 hover:text-gray-500 transition-all ease-in-out" onButtonClick={handleReportEdit}/> 
                    ) : null}
                    { handleReportToExcel ? (
                      <ButtonControl id="excel_export_button" disabled={isGenerating} Icon={RiFileExcel2Line} customClass="w-6 h-6 px-1" iconClass="w-6 h-6 text-theme-500 hover:text-theme-600 dark:text-theme-700 dark:hover:text-theme-600 transition-all ease-in-out" onButtonClick={handleReportToExcel}/>
                    ) : null}
                    { handleReportExport ? (
                      <ButtonControl 
                        id="sage_export_button"
                        disabled={isGenerating}
                        Icon={SageIcon}
                        customClass="w-5 h-5 px-1.5 focus:outline-none"
                        iconClass="w-9 h-8 text-theme-500 hover:text-theme-600 dark:text-theme-700 dark:hover:text-theme-600 transition-all ease-in-out"
                        onButtonClick={handleSageExport}
                      />
                    ) : null} 
                    { handleImport ? (
                      <ButtonControl 
                        id="import_button"
                        disabled={isGenerating}
                        Icon={ArrowDownTrayIcon}
                        customClass="w-6 h-6 px-1"
                        iconClass="w-6 h-6 text-theme-500 hover:text-theme-600 dark:text-theme-700 dark:hover:text-theme-600 transition-all ease-in-out"
                        onButtonClick={handleImport}
                      />
                    ) : null}
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
      <ProgressDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        progress={progress}
        flavourTexts={[
          "Returning Kits . . .",
          "Chasing AWOL . . .",
          "Deducting Pay . . .",
          "Calculating Not Ready Minutes . . .",
        ]}
        title="Exporting Sage Payroll Import File"
        description="Please wait while we build your CSV export."
      />
    </>
  )
}
