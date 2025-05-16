import { React } from 'react'
import { Link } from '@inertiajs/react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function NavButton ({ item }){
    return(
      <li key={item.name}>
        <Link
        href={item.href}
        className={classNames(
          item.current
            ? 'bg-gray-50 dark:bg-dark-900 text-theme-600'
            : 'text-gray-700 hover:text-theme-600 hover:bg-gray-50 dark:bg-dark-900',
          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
        )}
      >
        <item.icon
          className={classNames(
            item.current ? 'text-theme-600' : 'text-gray-400 group-hover:text-theme-600',
            'h-6 w-6 shrink-0'
          )}
          aria-hidden="false"
        />
        {item.name}
      </Link>
    </li>
    )
}