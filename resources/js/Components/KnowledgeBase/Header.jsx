import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import TextInput from '../../Components/Forms/TextInput';

export default function Header({ tabs, activeTab, handleTabClick, search, setSearch }) {
  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <header className="relative isolate bg-white dark:bg-dark-900 shadow-md z-20">
    <div className="border-b border-gray-200 bg-white/40 dark:border-dark-700 dark:bg-dark-900/40 px-6 pt-4">
      <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-dark-100">Knowledge Base</h3>
      <h1 className="text-gray-400 dark:text-dark-100 mt-1 text-sm">
        Explore our knowledge base to find guides, and FAQs that can help you with common issues and questions.
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
        <div className="w-full flex items-center gap-x-2">
          <div className="max-w-56 w-full relative">
            <TextInput
              id="view-select"
              Icon={MagnifyingGlassIcon}
              onTextChange={setSearch}
              placeholder={`Search Knowledge Base`}
              currentState={search}
              returnRaw={true}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
