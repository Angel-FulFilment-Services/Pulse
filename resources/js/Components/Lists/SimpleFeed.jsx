import { format } from "date-fns"

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SimpleFeed({ timeline = [] }) {
  return (
    <div className="flow-root mt-2">
      <ul role="list" className="">
        {timeline.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-4">
              {eventIdx !== timeline.length - 1 ? (
                <span className="absolute left-3 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={classNames(
                      event.iconBackground,
                      'h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white'
                    )}
                  >
                    <event.icon className="h-4 w-4 text-white" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-0.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      {event.content}{' '}
                      <a href={event.href} className="font-medium text-gray-900">
                        {event.target}
                      </a>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={event.datetime}>{ format(event.datetime, "do, MMM yy") }</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
