import React, { useState, useEffect } from 'react';
import UserFlyoutLayout from '../../Components/User/UserFlyoutLayout.jsx';
import { usePage } from '@inertiajs/react'
import { format, startOfDay, endOfDay, subDays, addDays } from 'date-fns';

const Dashboard = ({ token }) => {
    const { employee } = usePage().props;

    return (
        <div className="overflow-y-hidden">
            <div className="flex flex-row w-full justify-center bg-gray-100 dark:bg-dark-800">                      
                {/* <InformationDialog /> */}
            </div>
            <div className="sm:flex sm:items-center sm:justify-between bg-white dark:bg-dark-900 h-screen">
                <UserFlyoutLayout hrId={employee.hr_id} jobTitle={employee.job_title} handleClose={null} startDate={format(startOfDay(subDays(new Date(), 7)), 'yyyy-MM-dd')} endDate={format(endOfDay(addDays(new Date(), 7)), 'yyyy-MM-dd')}/>
            </div>
        </div>
      );
}

export default Dashboard