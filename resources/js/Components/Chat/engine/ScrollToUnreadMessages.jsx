import React from 'react'
import { ArrowUpIcon } from '@heroicons/react/24/outline'

export default function ScrollToUnreadMessages({ count, onClick, loading = false }) {
  if (!count || count === 0) return null

  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className="flex z-20 items-center gap-2 px-4 py-2 -mt-2 bg-theme-500/95 dark:bg-theme-600/95 text-white rounded-full shadow-lg hover:bg-theme-600/95 dark:hover:bg-theme-500/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ArrowUpIcon className="w-4 h-4 stroke-[2.25]" />
      <span className="text-sm font-medium">
        {loading ? 'Loading...' : count === 1 ? '1 Unread Message' : `${count} Unread Messages`}
      </span>
    </button>
  )
}
