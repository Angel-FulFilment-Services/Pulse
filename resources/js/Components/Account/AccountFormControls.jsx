import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/react/20/solid'

export default function AccountFormControls(props) {
  const { page, shouldAllowPreviousPage, shouldAllowNextPage, previousPage, nextPage } = props
  const allowPreviousPage = shouldAllowPreviousPage(page)
  const allowNextPage = shouldAllowNextPage(page)

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px flex w-0 flex-1">
        { allowPreviousPage ?
          <a 
            onClick={ e => { previousPage();}}
            className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 cursor-pointer"
          >
            <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            Previous
          </a>
        :
          <div className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-300">
            <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-gray-300" aria-hidden="true" />
            Previous
          </div>
        }
      </div>
      <div className="-mt-px flex w-0 flex-1 justify-end">
        { allowNextPage ? 
          <a 
            onClick={ e => { nextPage();}}
            className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 cursor-pointer"
          >
            Next
            <ArrowLongRightIcon className="ml-3 h-5 w-5 text-gray-400" aria-hidden="true" />
          </a>
        :
          <div className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-300">
            Next
            <ArrowLongRightIcon className="ml-3 h-5 w-5 text-gray-300" aria-hidden="true" />
          </div>
        }
      </div>
    </nav>
  )
}
