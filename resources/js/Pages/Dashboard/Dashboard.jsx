import React, { useState, useEffect } from 'react';
import UserFlyoutLayout from '../../Components/User/UserFlyoutLayout.jsx';
import { usePage } from '@inertiajs/react'

const Dashboard = ({ token }) => {
    const { employee } = usePage().props;

    return (
        <div className="overflow-y-hidden">
            <div className="flex flex-row w-full justify-center bg-gray-100 ">                      
                {/* <InformationDialog /> */}
            </div>
            <div className="sm:flex sm:items-center sm:justify-between bg-white h-screen">
                <UserFlyoutLayout hrId={employee.hr_id} jobTitle={employee.job_title} handleClose={null}/>
            </div>
        </div>
      );
}

export default Dashboard