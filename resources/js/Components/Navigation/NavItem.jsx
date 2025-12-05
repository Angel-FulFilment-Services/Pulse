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
            ? 'text-theme-600 dark:text-theme-700 bg-gray-50 hover:bg-gray-50 dark:hover:bg-dark-800'
            : 'text-gray-700 hover:text-theme-600 hover:bg-gray-50 dark:hover:bg-dark-800 dark:hover:text-theme-700 dark:text-dark-200',
          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
        )}
      >
        <item.icon
          className={classNames(
            item.current ? 'text-theme-600 dark:text-theme-700' : 'text-gray-400 group-hover:text-theme-600 dark:group-hover:text-theme-700 dark:text-dark-400',
            'h-6 w-6 shrink-0'
          )}
          aria-hidden="false"
        />
        {item.name}
      </Link>
    </li>
    )
}