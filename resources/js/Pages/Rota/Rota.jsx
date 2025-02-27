import React, { useState, useEffect } from 'react';
import InformationDialog from '../../Components/Account/MissingInformationDialog.jsx';
import CalendarView from '../../Components/Calendar/CalendarView.jsx';
import MonthView from '../../Components/Calendar/MonthView.jsx';

import { BarsArrowUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

const Rota = ({ token }) => {

    const [currentView, setCurrentView] = useState('Week');

    const renderView = () => {
      switch (currentView) {
        case 'Day':
        case 'Week':
          return <CalendarView setView={setCurrentView} viewType={currentView} />;
        case 'Month':
          return <MonthView setView={setCurrentView} />;
        default:
          return <CalendarView setView={setCurrentView} viewType="Week" />;
      }
    };

    return (
        <div className="h-screen">
            {renderView()}
        </div>
      );
}

export default Rota