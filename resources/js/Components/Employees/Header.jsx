import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import TextInput from '../../Components/Forms/TextInput';
import axios from 'axios';
import { toast } from 'react-toastify';
import React, { useState } from 'react';
import ConfirmationDialog from '../../Components/Dialogs/ConfirmationDialog';

export default function Header({ 
  tabs, 
  activeTab, 
  handleTabClick, 
  search, 
  setSearch, 
  setRefreshTrigger
}) {    

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  const handleCreateClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    toast.promise(
      axios.post('https://free-gifts.co.uk/api/template/generate-template-url', {}, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ANGEL_GIFT_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }),
      {
        pending: 'Opening template creator, please wait...',
        success: {
          render({ data }) {
            if (data?.data?.data?.signed_url) {
              setShowConfirmationDialog(true);
              window.open(data.data?.data.signed_url, '_blank', 'width=1400,height=900,left=100,top=50,scrollbars=yes,resizable=yes');
              return 'Template creator opened successfully in a window.';
            }
            return 'Failed to open template creator. Please try again.';
          }
        },
        error: {
          render({ data }) {
            console.error('Error message:', data?.message);
            return 'Failed to open template creator. Please try again.';
          }
        }
      },
      {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      }
    );
  };

  return (
    <>
      <header className="relative isolate bg-white dark:bg-dark-900 shadow-md z-20">
        <div className="border-b border-gray-200 bg-white/40 dark:border-dark-700 dark:bg-dark-900/40 px-6 pt-4">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-dark-100">Employees</h3>
          <h1 className="text-gray-400 dark:text-dark-100 mt-1 text-sm">
            Manage employee records, roles, and permissions.
          </h1>
          <div className="mt-4">
            <div className="block">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <a
                    key={tab.label}
                    onClick={(e => (handleTabClick(tab.path)))}
                    className={classNames(
                      activeTab === tab.id
                        ? 'border-theme-500 text-theme-600 dark:border-theme-700 dark:text-theme-700'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-dark-400 dark:hover:border-dark-700 dark:hover:text-dark-400',
                      'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium cursor-pointer'
                    )}
                  >
                    {tab.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute left-16 top-full -mt-16 transform-gpu opacity-50 blur-3xl xl:left-1/2 xl:-ml-80">
            <div
              className="aspect-[1154/678] w-[72.125rem] bg-gradient-to-br from-[rgb(var(--theme-300))] dark:from-[rgb(var(--theme-500))] to-[rgb(var(--theme-700))] dark:to-[rgb(var(--theme-900))]"
              style={{
                clipPath:
                  'polygon(100% 38.5%, 82.6% 100%, 60.2% 37.7%, 52.4% 32.1%, 47.5% 41.8%, 45.2% 65.6%, 27.5% 23.4%, 0.1% 35.3%, 17.9% 0%, 27.7% 23.4%, 76.2% 2.5%, 74.2% 56%, 100% 38.5%)',
              }}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gray-900/5 dark:bg-dark-100/5" />
        </div>
        <div className="mx-auto flex items-center justify-between max-w-full w-full px-6 py-5">
          <div className="w-full flex items-center gap-x-4">
            <div className="max-w-96 w-full relative">
              <TextInput
                id="view-select"
                Icon={MagnifyingGlassIcon}
                onTextChange={setSearch}
                placeholder={`Search ${tabs.find(tab => tab.id === activeTab)?.label}...`}
                currentState={search}
                returnRaw={true}
              />
            </div>
            
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-x-2 rounded-lg bg-theme-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-theme-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 transition-colors duration-200 dark:bg-theme-600 dark:hover:bg-theme-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Create Template
            </button>
          </div>
        </div>
      </header>
      <ConfirmationDialog
        isOpen={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        title="Creating Template"
        description={`The template creator has opened in a new window. When you're finished creating, click 'Done' to reload and see your changes.`}
        isYes={() => { setShowConfirmationDialog(false); setRefreshTrigger((prev) => prev + 1); }}
        type="info"
        yesText="Done"
        cancelText="Cancel"
      />
    </>
  )
}
