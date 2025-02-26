import { Link } from '@inertiajs/react'

const steps = [
  { id: 'Step 1', name: 'About You', href: '/my-details/entry/about-you', status: 'upcoming' },
  { id: 'Step 2', name: 'Medical Conditions', href: '/my-details/entry/medical-conditions', status: 'upcoming' },
  { id: 'Step 3', name: 'Next of Kin', href: '/my-details/entry/next-of-kin', status: 'upcoming' },
  { id: 'Step 4', name: 'Your Bank Details', href: '/my-details/entry/your-bank-details', status: 'upcoming' },
  { id: 'Step 5', name: 'Student Loan Questionaire', href: '/my-details/entry/student-loan-questionaire', status: 'upcoming' },
]

function currentPage(page) {
  steps.map((element) => {
    element.status = 'upcoming'

    if (element.id.slice(-1) == page) {
      element.status = 'current'
    }

    if (element.id.slice(-1) < page) {
      element.status = 'complete'
    }
  });
}

export default function AccountFormSteps(props) {  
  const { page } = props;

  currentPage(page);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step) => (
          <li key={step.name} className="md:flex-1">
            {step.status === 'complete' ? (
              <Link
                href={step.href}
                className="group flex flex-col border-l-4 border-orange-500 py-2 pl-4 hover:border-orange-700 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-orange-600 group-hover:text-orange-800">{step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </Link>
            ) : step.status === 'current' ? (
              <Link
                href={step.href}
                className="flex flex-col border-l-4 border-orange-500 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                aria-current="step"
              >
                <span className="text-sm font-medium text-orange-500">{step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </Link>
            ) : (
              <Link
                href={step.href}
                className="group flex flex-col border-l-4 border-gray-200 py-2 pl-4 hover:border-gray-300 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">{step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
  