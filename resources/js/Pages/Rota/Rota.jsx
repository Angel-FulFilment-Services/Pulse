import React, { useState, useEffect } from 'react';
import InformationDialog from '../../Components/Account/MissingInformationDialog.jsx';
import CalendarView from '../../Components/Calendar/CalendarView.jsx';
import MonthView from '../../Components/Calendar/MonthView.jsx';
import ListView from '../../Components/Calendar/ListView.jsx';

import { BarsArrowUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

const Rota = ({ token }) => {

    const [currentView, setCurrentView] = useState((window.innerWidth <= 768 ? 'Day' : 'Week'));    

    const renderView = () => {
      switch (currentView) {
        case 'Day':
        case 'Week':
          return <CalendarView setView={setCurrentView} viewType={currentView} />;
        case 'Month':
          return <MonthView setView={setCurrentView} />;
        case 'List':
          return <ListView setView={setCurrentView} viewType={currentView} />;
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