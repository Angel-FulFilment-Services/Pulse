import { Fragment, useRef, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { Dialog, Transition } from '@headlessui/react'
import { Link } from '@inertiajs/react'
import { FingerPrintIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function Example() {
  const { employee } = usePage().props
  const [open, setOpen] = useState(!employee.complete)

  const cancelButtonRef = useRef(null)

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" initialFocus={cancelButtonRef} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-50 dark:bg-dark-9000 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto" ref={cancelButtonRef}>
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-100">
                    <UsersIcon className="h-6 w-6 text-theme-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Tell us a bit more about yourself.
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        It appears we don't have all of your employee information. To ensure timely processing of your payroll and that the information we hold on you is complete, please take a moment to fill out the required details.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <Link
                        href="/my-details/entry/about-you"
                        type="button"
                        className="cursor-pointer inline-flex w-full justify-center rounded-md bg-theme-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-theme-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 sm:col-start-1"
                        onClick={() => setOpen(false)}
                    >
                        Take me there
                    </Link>
                    <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-dark-900 border-none border-transparent sm:col-start-2 sm:mt-0"
                    onClick={() => setOpen(false)}
                  >
                    Not Now
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
