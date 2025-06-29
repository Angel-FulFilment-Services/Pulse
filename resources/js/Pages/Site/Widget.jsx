import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { TruckIcon, UserIcon, ClipboardDocumentListIcon, BellAlertIcon, BuildingOffice2Icon as HomeIcon, BuildingStorefrontIcon as WarehouseIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollHint from '../../Components/Hints/ScrollHint';
import ProfileIcon from '../../Components/User/UserIcon';

export default function DeliveryAndVisitorWidget() {
    const [deliveries, setDeliveries] = useState([]); // Stores the list of deliveries
    const [visitors, setVisitors] = useState([]); // Stores the list of visitors
    const [employees, setEmployees] = useState([]); // Stores the list of employees (if needed)
    const [lastDeliveryId, setLastDeliveryId] = useState(null); // Tracks the ID of the last delivery
    const [lastVisitorId, setLastVisitorId] = useState(null); // Tracks the ID of the last visitor
    const [lastEmployeeId, setLastEmployeeId] = useState(null); // Tracks the ID of the last employee (if needed)
    const [containerHeight, setContainerHeight] = useState(0); // Dynamic height for the container
    const notificationSound = new Audio('/sounds/access-notification.mp3'); // Path to the notification sound file
    const deliveryScrollRef = useRef(null); // Reference for the scroll hint
    const visitorScrollRef = useRef(null); // Reference for the scroll hint
    const employeeScrollRef = useRef(null); // Reference for the scroll hint (if needed)

    useEffect(() => {
        const fetchAccess = async () => {
            try {
                let notify = false;
                const response = await axios.get('/api/onsite/access'); // Fetch deliveries from the backend
                const {deliveries: newDeliveries, visitors: newVisitors, employees: newEmployees} = response.data;

                // Check for new deliveries
                if (newDeliveries.length > 0) {
                    const latestDeliveryId = newDeliveries[0].id; // Get the ID of the latest delivery
                    if (lastDeliveryId !== latestDeliveryId) {
                        notify = true;
                        setLastDeliveryId(latestDeliveryId); // Update the last delivery ID
                    }
                }

                if (newVisitors.length > 0) {
                    const latestVisitorId = newVisitors[0].id; // Get the ID of the latest visitor
                    if (lastVisitorId !== latestVisitorId) {
                        notify = true;
                        setLastVisitorId(latestVisitorId); // Update the last visitor ID
                    }
                }

                if (newEmployees.length > 0) {
                    const latestEmployeeId = newEmployees[0].id; // Get the ID of the latest visitor
                    if (lastEmployeeId !== latestEmployeeId) {
                        setLastEmployeeId(latestEmployeeId); // Update the last visitor ID
                    }
                }

                if(notify) {
                    notificationSound.play(); // Play notification sound for new delivery
                }

                setDeliveries(newDeliveries); // Update the deliveries state
                setVisitors(newVisitors); // Update the visitors state
                setEmployees(newEmployees); // Update the employees state (if needed)
            } catch (err) {
                console.error('Error fetching deliveries:', err);
            }
        };

        // Fetch deliveries and visitors every 2.5 seconds
        const interval = setInterval(() => {
            fetchAccess();
        }, 2500);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [lastDeliveryId, lastVisitorId, lastEmployeeId]);

    useEffect(() => {
        const calculateHeights = () => {
            const windowHeight = window.innerHeight;
            const widgetPadding = 36; // Total padding for the widget container (py-2 + pb-9)
            const sectionMargins = 16; // Total margin between sections
            const headerHeight = 35.1; // Estimated height of each section header
            const totalGaps = widgetPadding + sectionMargins + headerHeight * 3; // Total gaps to subtract from window height

            const availableHeight = windowHeight - totalGaps;

            // Calculate heights based on proportions
            const employeeHeight = Math.floor(availableHeight * 0.55); // 55% of available height
            const visitorHeight = Math.floor(availableHeight * 0.225); // 22.5% of available height
            const deliveryHeight = Math.floor(availableHeight * 0.225); // 22.5% of available height

            setContainerHeight({
                employeeHeight,
                visitorHeight,
                deliveryHeight,
            });
        };

        // Initial calculation
        calculateHeights();

        // Recalculate on window resize
        window.addEventListener('resize', calculateHeights);
        return () => window.removeEventListener('resize', calculateHeights);
    }, []);

    const formatTimeSince = (timestamp) => {
        const time = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
        }
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

    const isNew = (timestamp) => {
        const time = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - time) / 1000);
        return diffInSeconds < 150; // Returns true if less than a minute old
    };

    return (
        <div className="bg-white">
            <div className="widget-container bg-gray-100 rounded-lg shadow-md py-2 pb-9 overflow-y-hidden">
                {/* Employees Section */}
                <div className="employee-widget mb-2 relative divide-y divide-gray-200 overflow-y-hidden">
                    <h2 className="text-base font-semibold text-gray-800 mb-2 px-6">Employees</h2>
                    {employees.length > 0 ? (
                        <>
                            <motion.ul 
                                ref={employeeScrollRef} 
                                className="divide-y divide-gray-200 bg-gray-900/10 overflow-y-auto no-scrollbar" 
                                style={{ height: `${containerHeight.employeeHeight}px` }}
                                layout
                            >
                                <AnimatePresence>
                                    {employees.map((employee, index) => (
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
                                                    
                                                </div>
                                            </div>
                                        </motion.li>
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
                            <ScrollHint scrollRef={employeeScrollRef} basic={true}></ScrollHint>
                        </>
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
                <div className="visitor-widget mb-2  relative divide-y divide-gray-200">
                    <h2 className="text-base font-semibold text-gray-800 mb-2 px-6">Visitors</h2>
                    {visitors.length > 0 ? (
                        <>
                            <motion.ul 
                                ref={visitorScrollRef} 
                                className="divide-y divide-gray-200 bg-gray-900/10 overflow-y-auto no-scrollbar" 
                                style={{ height: `${containerHeight.visitorHeight}px` }}
                                layout
                            >
                                <AnimatePresence>
                                    {visitors.map((visitor, index) => (
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
                                            <div className="shrink-0 flex flex-row items-end justify-between gap-x-6 w-40">
                                                <div>
                                                    <p className="text-sm text-gray-900 capitalize font-semibold">{visitor.category}</p>
                                                    <p className="mt-1 text-xs text-gray-500">{formatTimeSince(visitor.created_at)}</p>
                                                </div>
                                                <div className="w-10 h-10 flex items-center justify-center">
                                                    { isNew(visitor.created_at) && (
                                                        <span className="h-6 w-6 bg-white rounded-full animate-shake-bell flex items-center justify-center">
                                                            <BellAlertIcon className="w-6 h-6 text-yellow-500" aria-hidden="true" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.li>
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
                            <ScrollHint scrollRef={visitorScrollRef} basic={true}></ScrollHint>
                        </>
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

                {/* Deliveries Section */}
                <div className="delivery-widget relative divide-y divide-gray-200">
                    <h2 className="text-base font-semibold text-gray-800 mb-2 px-6">Deliveries</h2>
                    {deliveries.length > 0 ? (
                        <>
                            <motion.ul 
                                ref={deliveryScrollRef} 
                                className="divide-y divide-gray-200 bg-gray-900/10 overflow-y-auto no-scrollbar"
                                style={{ height: `${containerHeight.deliveryHeight}px` }} 
                                layout
                            >
                                <AnimatePresence>
                                    {deliveries.map((delivery, index) => (
                                        <motion.li
                                            key={delivery.id}
                                            layout
                                            initial={{ opacity: 0, y: -30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 30 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            className="flex justify-between gap-x-6 py-2 px-6 bg-white shadow-md relative"
                                        > 
                                            <div className="flex min-w-0 gap-x-4">
                                                <span className={`relative flex flex-shrink-0 flex-row items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-full h-10 w-10 p-0.5`}>
                                                    <TruckIcon className={`w-[80%] h-[80%] text-theme-300 dark:text-dark-600 ml-0.5`} aria-hidden="true" />
                                                </span>
                                                <div className="min-w-0 flex-col flex justify-center">
                                                    <p className="text-sm font-semibold text-gray-700 flex flex-row items-center">
                                                        { delivery.location && 
                                                            (delivery.location === 'Lostwithiel' ? (
                                                                <HomeIcon className="w-3.5 h-3.5 text-theme-300 inline-block mr-1" aria-hidden="true" />    
                                                            ) : (
                                                                <WarehouseIcon className="w-3.5 h-3.5 text-gray-400 inline-block mr-1" aria-hidden="true" />
                                                            ))
                                                        }
                                                        {delivery.location}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500 flex flex-row gap-x-2">
                                                        <span>New Delivery</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex flex-row items-end justify-between gap-x-6 w-40">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Delivery</p>
                                                    <p className="mt-1 text-xs text-gray-500">{formatTimeSince(delivery.created_at)}</p>
                                                </div>
                                                <div className="w-10 h-10 flex items-center justify-center">
                                                    { isNew(delivery.created_at) && (
                                                        <span className="h-6 w-6 rounded-full animate-shake-bell flex items-center justify-center z-20">
                                                            <BellAlertIcon className="w-6 h-6 text-yellow-500" aria-hidden="true" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.li>
                                    ))}
                                    {deliveries.length > 5 && (
                                        <motion.li
                                            key={'delivery-end'}
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
                            <ScrollHint scrollRef={deliveryScrollRef} basic={true}></ScrollHint>
                        </>
                    ) : (
                        <div 
                            className="flex flex-col items-center justify-center gap-x-2 bg-gray-900/10"
                            style={{ height: `${containerHeight.deliveryHeight}px` }}
                        >
                            <span className={`relative flex flex-shrink-0 flex-row items-center justify-center bg-gray-100 dark:bg-dark-800 rounded-full h-14 w-14 p-1 mb-2 ring-2 ring-theme-700/25`}>
                                <TruckIcon className="w-9 h-9 text-theme-300 ml-0.5" aria-hidden="true" />
                            </span>
                            <p className="text-gray-600 text-md font-semibold">No deliveries today</p>
                        </div>
                    )}
                    <div/>
                </div>
            </div>
        </div>
    );
}