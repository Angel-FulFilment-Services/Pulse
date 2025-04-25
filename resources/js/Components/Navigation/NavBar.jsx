import { React, Fragment, useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react'
import Logo from '../Branding/Logo.jsx';
import NavItem from './NavItem.jsx';
import NavTeamItem from './NavTeamItem.jsx';
import NavUserItem from './NavUserItem.jsx';
import { router } from '@inertiajs/react'

import {
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const teams = [
  // { name: 'All Agents', href: '#', initial: 'A', current: false },
  // { name: 'Outbound Team', href: '#', initial: 'O', current: false },
]

export default function NavBar({ page }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navigation = useMemo(() => [
    // { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: window.location.pathname.startsWith('/dashboard') },
    // { name: 'My Details', href: '/my-details/entry/about-you', icon: UsersIcon, current: window.location.pathname.startsWith('/my-details') },
    { name: 'Rota', href: '/rota', icon: CalendarIcon, current: currentPath.includes('rota') },
    { name: 'Reports', href: '/reporting', icon: ChartPieIcon, current: currentPath.includes('reporting') },
    //   { name: 'Documents', href: '#', icon: DocumentDuplicateIcon, current: false },
  ], [location.pathname]);

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
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                    <div className="flex h-20 shrink-0 items-center">
                        <div className="h-10 w-auto">
                            <Logo/>
                        </div>
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item, i) => (
                                <NavItem item={item} key={i}></NavItem>
                            ))}
                          </ul>
                        </li>
                        <li>
                          <div className="text-xs font-semibold leading-6 text-gray-400">Your teams</div>
                          <ul role="list" className="-mx-2 mt-2 space-y-1">
                            {teams.map((team, i) => (
                              <NavTeamItem team={team} key={i}></NavTeamItem>
                            ))}
                          </ul>
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
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
            <div className="flex h-20 shrink-0 items-center">
                <div className="h-10 w-auto">
                    <Logo/>
                </div>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item, i) => (
                        <NavItem item={item} key={i}></NavItem>
                    ))}
                  </ul>
                </li>
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400">Your teams</div>
                  <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {teams.map((team, i) => (
                        <NavTeamItem team={team} key={i}></NavTeamItem>
                    ))}
                  </ul>
                </li>
                <li className="-mx-6 mt-auto">
                  <NavUserItem></NavUserItem>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Collapsed Topbar Component */}
        <div className="relative w-full top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Dashboard</div>
          <a href="#">
            <span className="sr-only">Your profile</span>
            <img
              className="h-8 w-8 rounded-full bg-gray-50"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt=""
            />
          </a>
        </div>

        <main className="lg:pl-72 bg-gray-50 h-screen overflow-hidden w-full fixed lg:relative">
          <div className="h-full" children={page}>{/* Your content */}</div>
        </main>
      </div>
    </>
  )
}
