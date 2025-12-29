import React from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark-900">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserGroupIcon className="w-8 h-8 text-gray-400 dark:text-dark-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-50 mb-2">Welcome to Chat</h3>
        <p className="text-gray-500 dark:text-dark-400">Select a team or contact to start messaging</p>
      </div>
    </div>
  )
}
