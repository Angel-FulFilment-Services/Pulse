import { React, Fragment, useState, useMemo, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { useLocation } from 'react-router-dom';
import { Dialog, Transition, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import Logo from '../Branding/Logo.jsx';
import NavItem from './NavItem.jsx';
import NavTeamItem from './NavTeamItem.jsx';
import NavTheme from './NavTheme';
import { router, Link } from '@inertiajs/react'
import UserItemSelf from '../User/UserItemSelf.jsx';
import UserItem from '../User/UserItem.jsx';
import { hasPermission } from '../../Utils/Permissions.jsx';
import FireEmergencyButton from '../Emergency/FireEmergencyButton.jsx';

import {
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  AcademicCapIcon,
  HomeIcon,
  ChatBubbleOvalLeftIcon,
  UsersIcon,
  UserIcon,
  UserGroupIcon,
  CubeIcon,
  BanknotesIcon,
  XMarkIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'

export default function NavBar({ page }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { auth, employee, isOnSite } = usePage().props;

  const teams = [
    { name: 'All Staff', href: '#', initial: 'A', current: false },
  ]

  const navigation = useMemo(() => [
    { name: 'Dashboard', href: '/', icon: HomeIcon, current: currentPath === '/', right: null },
    { name: 'Rota', href: '/rota', icon: CalendarIcon, current: currentPath.startsWith('/rota'), right: 'pulse_view_rota' },
    { name: 'Reports', href: '/reporting', icon: ChartPieIcon, current: currentPath.startsWith('/reporting'), right: 'pulse_view_reporting' },
    { name: 'Payroll', href: '/payroll', icon: BanknotesIcon, current: currentPath.startsWith('/payroll'), right: 'pulse_view_payroll' },
    { name: 'Assets', href: '/asset-management/assets/scan', icon: CubeIcon, current: currentPath.startsWith('/asset-management'), right: 'pulse_view_assets' },
    { name: 'Access Control', href: '/onsite/widgets/access-control', icon: BuildingOffice2Icon, current: currentPath.startsWith('/onsite'), right: 'pulse_view_access_control' },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: AcademicCapIcon, current: currentPath.startsWith('/knowledge-base'), right: null },
    { name: 'Chat', href: '/chat', icon: ChatBubbleOvalLeftIcon, current: currentPath.startsWith('/chat'), right: 'pulse_view_chat' },
    { name: 'Administration', href: '/administration', icon: Cog6ToothIcon, current: currentPath.startsWith('/admin'), right: 'pulse_view_administration' },
], [currentPath]);

  useEffect(() => {
    const handleRouteChange = (event) => {
      setCurrentPath(window.location.pathname);
    };

    // Listen for Inertia route changes
    router.on('navigate', handleRouteChange);

    // return () => {
    //   // Clean up the event listener
    //   router.off('navigate', handleRouteChange);
    // };
  }, []);
  
  if(!auth?.user) {
    return (
      <>
      <div>
        <main className="bg-gray-50 dark:bg-dark-800 h-screen overflow-hidden w-full fixed lg:relative">
          <div className="h-full" children={page}>{/* Your content */}</div>
        </main>
      </div>
    </>
    )
  }

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Collapsed Sidebar Component */}
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-dark-900 px-6 pb-2">
                    <div className="flex h-20 shrink-0 items-center">
                        <div className="h-10 w-auto">
                            <Logo/>
                        </div>
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-dark-500">Navigation</div>
                          <ul role="list" className="-mx-2 mt-2 space-y-1">
                            {navigation.map((item, i) => (
                                (hasPermission(item.right) || !item.right) && <NavItem item={item} key={i}></NavItem>
                            ))}
                          </ul>
                        </li>
                        <li>
                          <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-dark-500">Your teams</div>
                          <ul role="list" className="-mx-2 mt-2 space-y-1">
                            {teams.map((team, i) => (
                              <NavTeamItem team={team} key={i}></NavTeamItem>
                            ))}
                          </ul>
                        </li>
                        <li className="-mx-6 mt-auto">
                          {isOnSite && hasPermission('pulse_fire_warden') &&  (
                            <div className="px-2 flex items-center justify-start border-b border-gray-200 dark:border-dark-700 pb-2">
                              <FireEmergencyButton className="w-full"/>
                            </div>
                          )}
                        </li>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white dark:bg-dark-900 dark:border-dark-700 px-6">
            <div className="flex h-20 shrink-0 items-center">
                <div className="h-10 w-auto">
                    <Logo/>
                </div>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-dark-500">Navigation</div>
                  <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {navigation.map((item, i) => (
                      (hasPermission(item.right) || !item.right) && <NavItem item={item} key={i}></NavItem>
                    ))}
                  </ul>
                </li>
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-dark-500">Your teams</div>
                  <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {teams.map((team, i) => (
                        <NavTeamItem team={team} key={i}></NavTeamItem>
                    ))}
                  </ul>
                </li>
                <li className="-mx-6 mt-auto">
                  {isOnSite && hasPermission('pulse_fire_warden') &&  (
                    <div className="px-2 flex items-center justify-start border-b border-gray-200 dark:border-dark-700 pb-2">
                      <FireEmergencyButton className="w-full"/>
                    </div>
                  )}
                  <Menu as="div" className="relative">
                    <div>
                      <MenuButton className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50 dark:text-dark-50 dark:hover:bg-dark-800 w-full focus:outline-none">
                        <UserItemSelf></UserItemSelf>
                      </MenuButton>
                    </div>
                    <MenuItems
                      transition
                      className="absolute focus:outline-none bottom-full divide-y divide-gray-200 z-10 mb-2 w-11/12 mx-3 origin-bottom-right rounded-md bg-gray-50 dark:bg-dark-800 dark:divide-dark-700 shadow-lg ring-1 ring-black/5 dark:ring-dark-100/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                      <MenuItem key="theme" as="div" className="px-4 py-3 bg-white dark:bg-dark-900">
                        <NavTheme />
                      </MenuItem>
                      <MenuItem key="profile">
                        <Link
                          href={"/profile/account"}
                          className="block w-full text-left px-4 py-2 text-xs text-gray-500 data-focus:bg-gray-100  data-focus:outline-hidden hover:bg-gray-100 dark:hover:bg-dark-700 dark:text-dark-400"
                        >
                          My Profile
                        </Link>
                      </MenuItem>
                      <MenuItem key="signout">
                        <button
                          type="button"
                          onClick={() => router.post('/logout')}
                          className="block w-full text-left px-4 py-2 text-xs text-gray-500 data-focus:bg-gray-100 rounded-b-md data-focus:outline-hidden hover:bg-gray-100 dark:hover:bg-dark-700 dark:text-dark-400"
                        >
                          Sign out
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Collapsed Topbar Component */}
        <div className="relative w-full top-0 z-40 flex items-center gap-x-6 bg-white dark:bg-dark-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 dark:text-dark-200 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900"></div>
          <a href="#">
            <span className="sr-only">Your profile</span>
            <Menu as="div" className="relative w-64 flex items-end justify-end cursor-default">
              <div>
                <MenuButton className="flex items-center text-sm font-semibold leading-6 text-gray-900 dark:text-dark-50 w-full focus:outline-none">
                    <UserItem userId={employee.hr_id} size={"small"} allowClickInto={false} />
                </MenuButton>
              </div>
              <MenuItems
                transition
                className="absolute focus:outline-none top-full divide-y divide-gray-200 z-10 mt-2 w-full mx-3 origin-bottom-right rounded-md bg-gray-50 dark:bg-dark-800 dark:divide-dark-700 shadow-lg ring-1 ring-black/5 dark:ring-dark-100/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                <MenuItem key="theme" as="div" className="px-4 py-3 bg-white dark:bg-dark-900">
                  <NavTheme />
                </MenuItem>
                <MenuItem key="profile">
                  <Link
                    href={"/profile/account"}
                    className="block w-full text-left px-4 py-2 text-xs text-gray-500 data-focus:bg-gray-100  data-focus:outline-hidden hover:bg-gray-100 dark:hover:bg-dark-700 dark:text-dark-400"
                  >
                    My Profile
                  </Link>
                </MenuItem>
                <MenuItem key="signout">
                  <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="block w-full text-left px-4 py-2 text-xs text-gray-500 data-focus:bg-gray-100 rounded-b-md data-focus:outline-hidden hover:bg-gray-100 dark:hover:bg-dark-700 dark:text-dark-400"
                  >
                    Sign out
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </a>
        </div>

        <main className="lg:pl-72 bg-gray-50 dark:bg-dark-800 overflow-hidden w-full fixed lg:relative h-screen">
          <div className="h-full" children={page}>{/* Your content */}</div>
        </main>
      </div>
    </>
  )
}
