import React, { useState, useEffect } from 'react';
import InformationDialog from '../../Components/Account/MissingInformationDialog.jsx';
import WeekView from '../../Components/Calendar/WeekView.jsx';
import DayView from '../../Components/Calendar/DayView.jsx';
import MonthView from '../../Components/Calendar/MonthView.jsx';

import { BarsArrowUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'


const Rota = ({ token }) => {

    const [currentView, setCurrentView] = useState('Week');

    const renderView = () => {
      switch (currentView) {
        case 'Day':
          return <DayView setView={setCurrentView} />;
        case 'Month':
          return <MonthView setView={setCurrentView} />;
        case 'Week':
        default:
          return <WeekView setView={setCurrentView} />;
      }
    };

    return (
        <div className="h-screen">
            {renderView()}
        </div>
      );
}

export default Rota