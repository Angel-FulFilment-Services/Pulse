import { React } from 'react'
import { Link } from '@inertiajs/react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function NavButton ({ team }){
    return(
      <li key={team.name}>
        <Link
          href={team.href}
          className={classNames(
            team.current
              ? 'bg-gray-50 text-theme-600 dark:bg-dark-800 dark:text-theme-700'
              : 'text-gray-700 hover:text-theme-600 hover:bg-gray-50 dark:hover:bg-dark-800 dark:hover:text-theme-700 dark:text-dark-200',
            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
          )}
        >
          <span
            className={classNames(
              team.current
                ? 'text-theme-600 border-theme-600 dark:text-theme-700 dark:border-theme-700'
                : 'text-gray-400 border-gray-200 group-hover:border-theme-600 group-hover:text-theme-600 dark:group-hover:text-theme-700 dark:text-dark-400 dark:border-dark-600',
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white dark:bg-dark-900'
            )}
          >
            {team.initial}
          </span>
          <span className="truncate">{team.name}</span>
          {team.unread_count > 0 && (
            <span className="bg-theme-500 text-white text-xs font-bold rounded-full flex-shrink-0 flex items-center justify-center min-w-6 px-1.5 h-6 ml-auto">
              {team.unread_count > 99 ? '99+' : team.unread_count}
            </span>
          )}
        </Link>
      </li>
    )
}