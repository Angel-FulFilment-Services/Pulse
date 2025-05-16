import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CalendarIcon, CalendarDaysIcon, XMarkIcon, UserIcon, WrenchIcon, PaperAirplaneIcon } from '@heroicons/react/20/solid';
import { exportHTMLToImage } from '../../Utils/Exports.jsx'
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { hasPermission } from '../../Utils/Permissions';
import UserFlyoutContentShifts from './UserFlyoutContentShifts';
import UserFlyoutContentEmployee from './UserFlyoutContentEmployee';
import UserFlyoutContentEvents from './UserFlyoutContentEvents';
import UserFlyoutContentTechnicalSupport from './UserFlyoutContentTechnicalSupport';
import UserItemFull from './UserItemFull.jsx';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function UserFlyoutLayout({hrId, handleClose, jobTitle}) {
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [activeTab, setActiveTab] = useState('shifts');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange ] = useState({startDate: format(startOfDay(subDays(currentDate, 7)), 'yyyy-MM-dd'), endDate: format(endOfDay(currentDate), 'yyyy-MM-dd')});
  const divRef = useRef();

  const allowViewEvents = () => {
    // Check if the user has permission to view events
    if(!jobTitle) return true;
    switch (jobTitle) {
      case 'Team Manager':
        return hasPermission('pulse_view_tm_events');
      default:
        return true;
    }
  };

  const tabs = [
      { id: 'shifts', name: 'Shifts', icon: CalendarIcon, current: true, visible: () => true },
      { id: 'events', name: 'Events', icon: CalendarDaysIcon, current: false, visible: allowViewEvents },
      // { id: 'performance', name: 'Performance', icon: ChartBarIcon, current: false },
      // { id: 'meetings', name: 'Meetings', icon: UsersIcon, current: false },
      { id: 'employee', name: 'Employee', icon: UserIcon, current: false, visible: () => true },
      { id: 'technical support', name: 'Technical Support', icon: WrenchIcon, current: false, visible: () => hasPermission('pulse_view_technical_support') && hasPermission('pulse_view_assets') },
  ]

  const handleDateChange = (item) => {   
    setDateRange({startDate: item[0].value, endDate: item[1].value});
    setIsTransitioning(true);
  }

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  }

  const handleExport = () => {
    if (divRef.current) {
      const start = format(new Date(dateRange.startDate), 'dd.MM.yyyy');
      const end = format(new Date(dateRange.endDate), 'dd.MM.yyyy');
      const filename = `Shifts - ${start} - ${end}.png`;
      exportHTMLToImage(divRef, filename);
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shifts':
        return <UserFlyoutContentShifts 
                  hrId={hrId} handleDateChange={handleDateChange} 
                  handleExport={handleExport} 
                  dateRange={dateRange} 
                  isTransitioning={isTransitioning}
                  setIsTransitioning={setIsTransitioning}
                />;
      case 'performance':
        return <div className="p-4">Performance content goes here.</div>;
      case 'employee':
        return <UserFlyoutContentEmployee hrId={hrId} />;
      case 'events':
        return <UserFlyoutContentEvents hrId={hrId} handleDateChange={handleDateChange} dateRange={dateRange}  />;
      case 'technical support':
        return <UserFlyoutContentTechnicalSupport hrId={hrId} handleDateChange={handleDateChange} dateRange={dateRange}  />;
      case 'meetings':
        return <div className="p-4">Meetings content goes here.</div>;
      default:
        return <div className="p-4">No content available.</div>;
    }
  };

  return (
    <div className="h-full w-full grid grid-cols-1 grid-rows-[auto,auto,1fr] justify-between divide-gray-300 cursor-auto overflow-hidden" ref={divRef}>
      <div className="h-auto">
        <nav className="isolate flex divide-x divide-gray-200 rounded-t-lg shadow" aria-label="Tabs">
          {tabs.filter(tab => tab.visible() !== false).map((tab, tabIdx, arr) => (
            <a
              key={tab.name}
              onClick={() => handleTabClick(tab.id)}
              className={classNames(
                activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                tabIdx === 0 ? 'rounded-tl-lg' : '',
                tabIdx === arr.length - 1 ? 'rounded-tr-lg' : '',
                'group relative min-w-0 flex-1 overflow-hidden bg-gray-50  py-3 px-4 text-center text-sm font-medium cursor-pointer hover:bg-gray-100  focus:z-10 w-full'
              )}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <div className="flex items-center justify-center">
                <tab.icon
                  className={classNames(
                    activeTab === tab.id ? 'text-theme-500' : 'text-gray-400 group-hover:text-gray-500',
                    '-ml-0.5 mr-2 h-4 w-4'
                  )}
                  aria-hidden="true"
                />
                <span>{tab.name}</span>
              </div>
              <span
                aria-hidden="true"
                className={classNames(
                  activeTab === tab.id ? 'bg-theme-500' : 'bg-transparent',
                  'absolute inset-x-0 bottom-0 h-0.5'
                )}
              />
            </a>
          ))}
        </nav>
      </div>

      <div className="w-full px-4">
        <div className="flex items-center justify-between py-4 w-full border-b border-gray-200">
          <div className="">
            <UserItemFull 
              agent={{hr_id: hrId}} 
              allowClickInto={false} 
              iconSize='extra-large'
              headingClass={"text-base font-semibold text-gray-900"}
              subHeadingClass={"text-sm text-gray-500"}
            />
          </div>
          <div className="z-10">
            <button
              type="button"
              className="relative rounded-xl text-gray-500 hover:text-gray-600 focus:outline-none"
              onClick={handleClose}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 overflow-auto">
        {renderTabContent()}
      </div>

      {/* <div className="border-t border-gray-50">
        <div className="isolate relative items-center flex rounded-b-lg bg-gray-50  py-3 px-3">
          <input
            type="text"
            className="bg-white w-full h-9 rounded-full ring-1 focus:ring-2 ring-gray-200 focus:ring-theme-500 flex items-center justify-between py-1 outline-none px-4 pr-20 text-gray-700"
            placeholder="Compose your message..."
          />
          <div className="absolute h-7 w-16 right-4 bg-gray-100  hover:bg-gray-200 cursor-pointer rounded-full ring-1 ring-gray-200 flex justify-center items-center p-1">
            <PaperAirplaneIcon className="w-5 h-5 pl-0.5 text-gray-400"></PaperAirplaneIcon>
          </div>
        </div>
      </div> */}
    </div>
  );
}