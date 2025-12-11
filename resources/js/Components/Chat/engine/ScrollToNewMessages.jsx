import React from 'react'
import { ArrowDownIcon } from '@heroicons/react/24/outline'

export default function ScrollToNewMessages({ count, onClick }) {
  if (!count || count === 0) return null

    return (
        <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 -mb-2 bg-theme-500/75 text-white rounded-full shadow-lg hover:bg-theme-600/75 transition-colors animate-bounce">
            <span className="text-sm font-medium">
                {count === 1 ? 'New Message' : `${count} New Messages`}
            </span>
            <ArrowDownIcon className="w-4 h-4 stroke-[2.25]" />
        </button>
    )
}
