import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserIcon, ClipboardDocumentListIcon, BuildingOffice2Icon as HomeIcon, BuildingStorefrontIcon as WarehouseIcon, FireIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileIcon from '../../Components/User/UserIcon';
import CheckBoxInput from '../../Components/Forms/CheckboxInput';

export default function FireRollCall({ initialVisitors = [], initialEmployees = [] }) {
    const [visitors, setVisitors] = useState(initialVisitors);
    const [employees, setEmployees] = useState(initialEmployees);
    const [containerHeight, setContainerHeight] = useState(0);
    const [rollCallData, setRollCallData] = useState([]);

    useEffect(() => {
        const calculateHeights = () => {
            const windowHeight = window.innerHeight;
            const widgetPadding = 8;
            const sectionMargins = 16;
            const headerHeight = 43.7;
            const totalGaps = widgetPadding + sectionMargins + headerHeight * 2;

            const availableHeight = windowHeight - totalGaps;

            const employeeHeight = Math.floor(availableHeight * 0.55);
            const visitorHeight = Math.floor(availableHeight * 0.45);

            setContainerHeight({
                employeeHeight,
                visitorHeight,
            });
        };

        calculateHeights();
        window.addEventListener('resize', calculateHeights);
        return () => window.removeEventListener('resize', calculateHeights);
    }, []);

    useEffect(() => {
        // Initialize roll call data from employees and visitors
        const updatedRollCallData = [...rollCallData];

        // Remove signed out users
        updatedRollCallData.forEach((item, index) => {
            const employee = employees.find(emp => emp.id === item.id);
            const visitor = visitors.find(vis => vis.id === item.id);
            if (employee && employee.signed_out) {
                updatedRollCallData[index].present = false;
            } else if (visitor && visitor.signed_out) {
                updatedRollCallData[index].present = false;
            }
        });

        // Add new employees to roll call
        employees.filter(employee => !employee.signed_out).forEach(employee => {
            if (!updatedRollCallData.some(item => item.id === employee.id)) {
                updatedRollCallData.push({
                    id: employee.id,
                    present: false,
                });
            }
        }); 

        // Add new visitors to roll call
        visitors.filter(visitor => !visitor.signed_out).forEach(visitor => {
            if (!updatedRollCallData.some(item => item.id === visitor.id)) {
                updatedRollCallData.push({
                    id: visitor.id,
                    present: false,
                });
            }
        });

        setRollCallData(updatedRollCallData);
    }, [employees, visitors]);

    const formatTimeSince = (timestamp) => {
        const time = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
        if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        }
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        }
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    };

    return (
        <div className="bg-white">
            { Object.values(rollCallData).every(item => item.present) && rollCallData.length > 0 && (
                <div className="bg-green-50 text-green-900 text-lg font-semibold px-4 rounded-t-lg w-full max-h-screen h-svh flex flex-col items-center justify-center animate-fade-in">
                    <div className="flex flex-col gap-y-6 items-center">
                        <FireIcon className="w-16 h-16 text-green-700 bg-green-200 ring-1 ring-green-600/20 rounded-full p-2" aria-hidden="true" />
                        <span>All employees and visitors are accounted for.</span>
                    </div>
                </div>
            )}

            { (!Object.values(rollCallData).every(item => item.present) || rollCallData.length === 0) && (
                <div className="widget-container bg-gray-100 rounded-lg shadow-md py-2 overflow-y-hidden">
                    {/* Employees Section */}
                    <div className="employee-widget mb-3 relative divide-y divide-gray-200 overflow-y-hidden">
                        <h2 className="text-base font-semibold text-gray-800 mb-2 px-6">Employees</h2>
                        {employees.length > 0 ? (
                            <motion.ul 
                                className="divide-y divide-gray-200 bg-gray-900/10 overflow-y-auto no-scrollbar" 
                                style={{ height: `${containerHeight.employeeHeight}px` }}
                                layout
                            >
                                    <AnimatePresence>
                                        {employees.map((employee, index) => (
                                            !employee.signed_out && (
                                                <motion.li
                                                    key={employee.id}
                                                    layout
                                                    initial={{ opacity: 0, y: -30 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 30 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    className="flex justify-between gap-x-6 py-2 px-6 bg-white shadow-md"
                                                >
                                                    <div className="flex min-w-0 gap-x-4">
                                                        <span className={`relative flex flex-shrink-0 flex-row items-center justify-center rounded-full h-10 w-10`}>
                                                            <ProfileIcon size="medium" profilePhoto={employee.profile_photo} />
                                                            { employee.signed_out ? (
                                                                <span className="absolute bottom-[14%] right-[14%] block translate-x-1/2 translate-y-1/2 transform rounded-full border-2 border-white dark:border-dark-900 z-50">
                                                                    <span className={`block h-2.5 w-2.5 rounded-full bg-red-500`} />
                                                                </span>
                                                            ) : (
                                                                <span className="absolute bottom-[14%] right-[14%] block translate-x-1/2 translate-y-1/2 transform rounded-full border-2 border-white dark:border-dark-900 z-50">
                                                                    <span className={`block h-2.5 w-2.5 rounded-full bg-green-500`} />
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div className="min-w-0 flex-col flex justify-center">
                                                            <p className="text-sm font-semibold text-gray-900 flex flex-row items-center">
                                                                {employee.fullname}
                                                                {employee.location && (
                                                                    <>
                                                                        <div className="w-1 h-1 shrink-0 mt-0.5 bg-gray-500 dark:bg-dark-500 rounded-full mx-2"></div>
                                                                        {employee.location === 'Lostwithiel' ? (
                                                                            <HomeIcon className="w-3.5 h-3.5 text-theme-300 inline-block mr-1" aria-hidden="true" />    
                                                                        ) : (
                                                                            <WarehouseIcon className="w-3.5 h-3.5 text-gray-400 inline-block mr-1" aria-hidden="true" />
                                                                        )}
                                                                        <span className="text-gray-700">
                                                                            {employee.location}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500 flex flex-row gap-x-2 items-center">
                                                                {employee.job_title &&
                                                                    <span>Job Title: <span className="font-semibold text-gray-600">{employee.job_title}</span></span>
                                                                }
                                                                {employee.shift_start &&
                                                                    <>
                                                                        <div className="w-1 h-1 shrink-0 mt-0.5 bg-gray-400 dark:bg-dark-500 rounded-full"></div>
                                                                        <span>Due: <span className="font-semibold text-gray-600">{employee.shift_start}</span></span>
                                                                    </>
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex flex-row items-end justify-between gap-x-6 w-40">
                                                        <div>
                                                            <p className="text-sm text-gray-900 capitalize font-semibold">{employee.category}</p>
                                                            <p className="mt-1 text-xs text-gray-500">{formatTimeSince(employee.created_at)}</p>
                                                        </div>
                                                        <div className="w-10 h-10 flex items-center justify-center">
                                                            <CheckBoxInput
                                                                    checked={rollCallData.some(rollCall => rollCall.id == employee.id && rollCall.present)}
                                                                    onChange={(checked) => {
                                                                        setRollCallData(prevData => {
                                                                            const updatedData = [...prevData];
                                                                            const index = updatedData.findIndex(data => data.id === employee.id);

                                                                            if (index !== -1) {
                                                                                updatedData[index].present = checked;
                                                                            } else {
                                                                                updatedData.push({ id: employee.id, present: checked });
                                                                            }

                                                                            return updatedData;
                                                                        });
                                                                    }}
                                                                    id={`roll-call-${employee.id}`}
                                                                    label=""
                                                                    disabled={employee.signed_out}
                                                                    size="large"
                                                                />
                                                        </div>
                                                    </div>
                                                </motion.li>
                                            )
                                        ))}
                                        {employees.length > 10 && (
                                            <motion.li
                                                key={'employee-end'}
                                                layout
                                                initial={{ opacity: 0, y: -30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 30 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                className="min-h-10 bg-white"
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.ul>
                        ) : (
                            <div 
                                className="flex flex-col items-center justify-center gap-x-2 bg-gray-900/10"
                                style={{ height: `${containerHeight.employeeHeight}px` }}
                            >
                                <span className={`relative flex flex-shrink-0 flex-row items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-full h-14 w-14 p-1 mb-2 ring-2 ring-cyan-700/25`}>
                                    <UserIcon className={`w-9 h-9 text-cyan-500 dark:text-dark-600`} aria-hidden="true" />
                                </span>
                                <p className="text-gray-600 text-md font-semibold">No employees onsite today</p>
                            </div>
                        )}
                        <div/>
                    </div>

                    {/* Visitors Section */}
                    <div className="visitor-widget mb-3 relative divide-y divide-gray-200">
                        <h2 className="text-base font-semibold text-gray-800 mb-3 px-6">Visitors</h2>
                        {visitors.length > 0 ? (
                                <motion.ul 
                                    className="divide-y divide-gray-200 bg-gray-900/10 overflow-y-auto no-scrollbar" 
                                    style={{ height: `${containerHeight.visitorHeight}px` }}
                                    layout
                                >
                                    <AnimatePresence>
                                        {visitors.map((visitor, index) => (
                                            !visitor.signed_out && (
                                                <motion.li
                                                    key={visitor.id}
                                                    layout
                                                    initial={{ opacity: 0, y: -30 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 30 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    className="flex justify-between gap-x-6 py-2 px-6 bg-white shadow-md relative"
                                                >
                                                    <div className="flex min-w-0 gap-x-4">
                                                        <span className={`relative flex flex-shrink-0 flex-row items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-full h-10 w-10`}>
                                                            { visitor.category === 'visitor' ? (
                                                                <UserIcon className={`w-[80%] h-[80%] text-cyan-500 dark:text-dark-600 ml-[0.035rem]`} aria-hidden="true" />
                                                            ) : (
                                                                <ClipboardDocumentListIcon className={`w-[75%] h-[75%] text-cyan-500 dark:text-dark-600 ml-[0.035rem]`} aria-hidden="true" />
                                                            )}
                                                            { visitor.signed_out ? (
                                                                <span className="absolute bottom-[14%] right-[14%] block translate-x-1/2 translate-y-1/2 transform rounded-full border-2 border-white dark:border-dark-900 z-50">
                                                                    <span className={`block h-2.5 w-2.5 rounded-full bg-red-500`} />
                                                                </span>
                                                            ) : (
                                                                <span className="absolute bottom-[14%] right-[14%] block translate-x-1/2 translate-y-1/2 transform rounded-full border-2 border-white dark:border-dark-900 z-50">
                                                                    <span className={`block h-2.5 w-2.5 rounded-full bg-green-500`} />
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div className="min-w-0 flex-col flex justify-center">
                                                            <p className="text-sm font-semibold text-gray-900 flex flex-row items-center">
                                                                {visitor.visitor_name}
                                                                {visitor.location && (
                                                                    <>
                                                                        <div className="w-1 h-1 shrink-0 mt-0.5 bg-gray-500 dark:bg-dark-500 rounded-full mx-2"></div>
                                                                        {visitor.location === 'Lostwithiel' ? (
                                                                            <HomeIcon className="w-3.5 h-3.5 text-theme-300 inline-block mr-1" aria-hidden="true" />    
                                                                        ) : (
                                                                            <WarehouseIcon className="w-3.5 h-3.5 text-gray-400 inline-block mr-1" aria-hidden="true" />
                                                                        )}
                                                                        <span className="text-gray-700">
                                                                            {visitor.location}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500 flex flex-row gap-x-2 items-center">
                                                                {visitor.visitor_company &&
                                                                    <span>Company: <span className="font-semibold text-gray-600">{visitor.visitor_company}</span></span>
                                                                }
                                                                {visitor.visitor_visiting &&
                                                                    <>
                                                                        <div className="w-1 h-1 shrink-0 mt-0.5 bg-gray-400 dark:bg-dark-500 rounded-full"></div>
                                                                        <span>To See: <span className="font-semibold text-gray-600">{visitor.visitor_visiting}</span></span>
                                                                    </>
                                                                }
                                                                {visitor.visitor_car_registration &&
                                                                    <>
                                                                        <div className="w-1 h-1 shrink-0 mt-0.5 bg-gray-400 dark:bg-dark-500 rounded-full"></div>
                                                                        <span>Car Registration: <span className="font-semibold text-gray-600">{visitor.visitor_car_registration}</span></span>
                                                                    </>
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex flex-row items-center justify-between gap-x-6 w-40">
                                                        <div>
                                                            <p className="text-sm text-gray-900 capitalize font-semibold">{visitor.category}</p>
                                                            <p className="mt-1 text-xs text-gray-500">{formatTimeSince(visitor.created_at)}</p>
                                                        </div>
                                                        <CheckBoxInput
                                                                checked={rollCallData.some(rollCall => rollCall.id == visitor.id && rollCall.present)}
                                                                onChange={(checked) => {
                                                                    setRollCallData(prevData => {
                                                                        const updatedData = [...prevData];
                                                                        const index = updatedData.findIndex(data => data.id === visitor.id);

                                                                        if (index !== -1) {
                                                                            updatedData[index].present = checked;
                                                                        } else {
                                                                            updatedData.push({ id: visitor.id, present: checked });
                                                                        }

                                                                        return updatedData;
                                                                    });
                                                                }}
                                                                id={`roll-call-${visitor.id}`}
                                                                label=""
                                                                disabled={visitor.signed_out}
                                                                size="large"
                                                            />
                                                    </div>
                                                </motion.li>
                                            )
                                        ))}
                                        {visitors.length > 5 && (
                                            <motion.li
                                                key={'visitor-end'}
                                                layout
                                                initial={{ opacity: 0, y: -30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 30 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                className="min-h-10 bg-white"
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.ul>
                        ) : (
                            <div 
                                className="flex flex-col items-center justify-center gap-x-2 bg-gray-900/10"
                                style={{ height: `${containerHeight.visitorHeight}px` }}
                            >
                                <span className={`relative flex flex-shrink-0 flex-row items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-full h-14 w-14 p-1 mb-2 ring-2 ring-cyan-700/25`}>
                                    <UserIcon className={`w-9 h-9 text-cyan-500 dark:text-dark-600`} aria-hidden="true" />
                                </span>
                                <p className="text-gray-600 text-md font-semibold">No visitors onsite today</p>
                            </div>
                        )}
                        <div/>
                    </div>
                </div>
            )}
        </div>
    );
}