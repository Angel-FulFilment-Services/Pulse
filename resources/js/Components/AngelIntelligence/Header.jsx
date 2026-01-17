import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import TextInput from '../../Components/Forms/TextInput';
import React from 'react';

// AI Gradient Sparkles Icon
const AISparklesIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="ai-header-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="50%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#f472b6" />
      </linearGradient>
    </defs>
    <path 
      fill="url(#ai-header-gradient)" 
      fillRule="evenodd" 
      d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" 
      clipRule="evenodd" 
    />
  </svg>
)

export default function Header({ 
  tabs, 
  activeTab, 
  handleTabClick, 
  search, 
  setSearch, 
  setRefreshTrigger
}) {    

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <>
      <header className="relative isolate bg-white dark:bg-dark-900 shadow-md z-20">
        <div className="border-b border-gray-200 bg-white/40 dark:border-dark-700 dark:bg-dark-900/40 px-6 pt-4">
          <div className="flex items-center gap-2">
            <AISparklesIcon className="h-6 w-6" />
            <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-dark-100">Angel Intelligence</h3>
          </div>
          <h1 className="text-gray-400 dark:text-dark-100 mt-1 text-sm">
            AI-powered analytics and insights
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
              className="aspect-[1154/678] w-[72.125rem]"
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
                clipPath:
                  'polygon(100% 38.5%, 82.6% 100%, 60.2% 37.7%, 52.4% 32.1%, 47.5% 41.8%, 45.2% 65.6%, 27.5% 23.4%, 0.1% 35.3%, 17.9% 0%, 27.7% 23.4%, 76.2% 2.5%, 74.2% 56%, 100% 38.5%)',
              }}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gray-900/5 dark:bg-dark-100/5" />
        </div>
        <div className="mx-auto flex items-center justify-between max-w-full w-full px-6 py-5">
          <div className="w-full flex items-center gap-x-4">
            {activeTab && (
              <>
                <div className="max-w-96 w-full relative">
                  <TextInput
                    id="view-select"
                    Icon={MagnifyingGlassIcon}
                    onTextChange={setSearch}
                    placeholder={`Search ${tabs.find(tab => tab.id === activeTab)?.label || ''}...`}
                    currentState={search}
                    returnRaw={true}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
