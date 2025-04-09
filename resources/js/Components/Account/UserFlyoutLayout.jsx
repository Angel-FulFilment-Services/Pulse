import React, { useState } from 'react';
import { CalendarIcon, ChartBarIcon, UserIcon, UsersIcon, PaperAirplaneIcon } from '@heroicons/react/20/solid';
import UserFlyoutContentShifts from './UserFlyoutContentShifts';
import UserFlyoutContentEmployee from './UserFlyoutContentEmployee';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
    { id: 'shifts', name: 'Shifts', icon: CalendarIcon, current: true },
    // { id: 'performance', name: 'Performance', icon: ChartBarIcon, current: false },
    { id: 'employee', name: 'Employee', icon: UserIcon, current: false },
    // { id: 'meetings', name: 'Meetings', icon: UsersIcon, current: false },
]

export default function UserFlyoutLayout({hrId}) {
  const [activeTab, setActiveTab] = useState('shifts');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shifts':
        return <UserFlyoutContentShifts hrId={hrId} />;
      case 'performance':
        return <div className="p-4">Performance content goes here.</div>;
      case 'employee':
        return <UserFlyoutContentEmployee hrId={hrId} />;
      case 'meetings':
        return <div className="p-4">Meetings content goes here.</div>;
      default:
        return <div className="p-4">No content available.</div>;
    }
  };

  return (
    <div className="w-full min-h-96 mx-auto flex flex-col justify-between divide-gray-300 cursor-auto">
      <div className="">
        <nav className="isolate flex divide-x divide-gray-200 rounded-t-lg shadow" aria-label="Tabs">
          {tabs.map((tab, tabIdx) => (
            <a
              key={tab.name}
              onClick={() => handleTabClick(tab.id)}
              className={classNames(
                activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                tabIdx === 0 ? 'rounded-tl-lg' : '',
                tabIdx === 4 ? 'rounded-tr-lg' : '',
                'group relative min-w-0 flex-1 overflow-hidden bg-gray-50 py-3 px-4 text-center text-sm font-medium cursor-pointer hover:bg-gray-100 focus:z-10 w-[30rem]'
              )}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <div className="flex items-center justify-center">
                <tab.icon
                  className={classNames(
                    activeTab === tab.id ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500',
                    '-ml-0.5 mr-2 h-4 w-4'
                  )}
                  aria-hidden="true"
                />
                <span>{tab.name}</span>
              </div>
              <span
                aria-hidden="true"
                className={classNames(
                  activeTab === tab.id ? 'bg-orange-500' : 'bg-transparent',
                  'absolute inset-x-0 bottom-0 h-0.5'
                )}
              />
            </a>
          ))}
        </nav>
      </div>

      {renderTabContent()}

      <div className="border-t border-gray-50">
        <div className="isolate relative items-center flex rounded-b-lg bg-gray-50 py-2 px-2">
          <input
            type="text"
            className="bg-white w-full h-9 rounded-full ring-1 focus:ring-2 ring-gray-200 focus:ring-orange-500 flex items-center justify-between py-1 outline-none px-4 pr-20 text-gray-700"
            placeholder="Compose your message..."
          />
          <div className="absolute h-7 w-16 right-3 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full ring-1 ring-gray-200 flex justify-center items-center p-1">
            <PaperAirplaneIcon className="w-5 h-5 pl-0.5 text-gray-400"></PaperAirplaneIcon>
          </div>
        </div>
      </div>
    </div>
  );
}