import { Link } from '@inertiajs/react'
import { CheckIcon } from '@heroicons/react/20/solid'

const steps = [
  { name: 'Step 1', description: 'About You', page: 1, status: 'upcoming' },
  { name: 'Step 2', description: 'Medical Conditions', page: 2, status: 'upcoming' },
  { name: 'Step 3', description: 'Next of Kin', page: 3, status: 'upcoming' },
  { name: 'Step 4', description: 'Your Bank Details', page: 4, status: 'upcoming' },
  { name: 'Step 5', description: 'Tax Information', page: 5, status: 'upcoming' },
  { name: 'Step 6', description: 'Student Loan Questionaire', page: 6, status: 'upcoming' },
  { name: 'Done', description: '', page: null, status: 'upcoming' },
]

function currentPage(page) {
  steps.map((element) => {
    element.status = 'upcoming'

    if (element.name.slice(-1) == page) {
      element.status = 'current'
    }

    if (element.name.slice(-1) < page) {
      element.status = 'complete'
    }
  });
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function AccountFormSteps(props) {  
  const { page, goToPage } = props;

  currentPage(page);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="overflow-hidden px-4">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={classNames(stepIdx !== steps.length - 1 ? 'pb-10' : '', 'relative')}>
            {step.status === 'complete' ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-theme-500" aria-hidden="true" />
                ) : null}
                <a onClick={ e => { goToPage(step.page);}} className="group relative flex items-start cursor-pointer">
                  <span className="flex h-9 items-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-theme-500 group-hover:bg-theme-600">
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{step.name}</span>
                    <span className="text-sm text-gray-500">{step.description}</span>
                  </span>
                </a>
              </>
            ) : step.status === 'current' ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                ) : null}
                <a onClick={ e => { goToPage(step.page);}} className="group relative flex items-start cursor-pointer" aria-current="step">
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-theme-500 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-theme-500" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-theme-600">{step.name}</span>
                    <span className="text-sm text-gray-500">{step.description}</span>
                  </span>
                </a>
              </>
            ) : (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                ) : null}
                {step.href !== null ? (
                  <a onClick={ e => { goToPage(step.page);}} className="group relative flex items-start cursor-pointer">
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                      </span>
                    </span>
                    <span className="ml-4 flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-gray-500">{step.name}</span>
                      <span className="text-sm text-gray-500">{step.description}</span>
                    </span>
                  </a>
                ) : (
                  <span className="group relative flex items-start">
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                      </span>
                    </span>
                    <span className="ml-4 flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-gray-500">{step.name}</span>
                      <span className="text-sm text-gray-500">{step.description}</span>
                    </span>
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
  