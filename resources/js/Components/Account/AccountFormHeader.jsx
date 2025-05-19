import { 
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  CurrencyPoundIcon,
  MapPinIcon,
 } from '@heroicons/react/24/solid'

import { NumericFormat } from 'react-number-format';
import { format } from 'date-fns';

export default function AccountHeader({ employee }) {
  return (
    <header className="relative isolate bg-white dark:bg-dark-900 shadow-md">
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
          <div className="absolute inset-x-0 bottom-0 h-px bg-gray-900/5" />
      </div>
      <div className="mx-auto max-w-full w-11/12 py-5">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-x-8 lg:mx-0 lg:max-w-none">
              <div>
                <div className="flex items-center gap-x-6">
                  <div className="h-24 w-24 rounded-full bg-gray-100  flex items-center justify-center">
                      {employee.profile_photo ?
                        <img src={`/images/profile/${employee.profile_photo}`} className="h-24 w-24 select-none rounded-full brightness-95" />
                      :
                        <UserIcon className="h-16 w-16 text-gray-300" aria-hidden="true" />
                      }
                  </div>
                  <h1>
                      <div className="mt-1 text-base font-semibold leading-6 text-theme-600 dark:text-theme-700">{employee.firstname}{" "}{employee.surname}</div>
                      <div className="text-sm leading-6 text-gray-500 dark:text-dark-400">
                        {employee.job_title}
                      </div>
                      <div className="flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-3">
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-dark-400">
                          <BriefcaseIcon className="mr-1 h-5 w-5 flex-shrink-0 text-gray-300 dark:text-dark-500" aria-hidden="true" />
                          {employee?.location ? employee.employment_category : "N/A"}
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-dark-400">
                          <MapPinIcon className="mr-1 h-5 w-5 flex-shrink-0 text-gray-300 dark:text-dark-500" aria-hidden="true" />
                          {employee?.location ? employee.location : "N/A"}
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-dark-400">
                          <CurrencyPoundIcon className="mr-1 w-[1.35rem] h-[1.35rem] flex-shrink-0 text-gray-300 dark:text-dark-500" aria-hidden="true" />
                          {employee.pay_rate ? <NumericFormat value={employee.pay_rate.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'£'} /> : "N/A" }
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-dark-400">
                          <CalendarIcon className="mr-1 h-5 w-6 flex-shrink-0 text-gray-300 dark:text-dark-500" aria-hidden="true" />
                          Started on {employee.start_date ? format(new Date(employee.start_date), 'do MMMM yyyy') : "N/A"}
                        </div>
                      </div>
                  </h1>
                </div>
              </div>
          </div>
      </div>
    </header>
  )
}
