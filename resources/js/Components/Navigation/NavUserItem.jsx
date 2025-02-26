import { React } from 'react'
import { usePage } from '@inertiajs/react'
import {
  UserIcon,
} from '@heroicons/react/24/solid'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function NavButton ({ item }){
    const { auth } = usePage().props
  
    return(
      <a
        href="#"
        className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
      >
        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
          {auth.user.profile_photo ?
            <img src={`/images/profile/${auth.user.profile_photo}`} className="h-9 w-9 select-none rounded-full" />
          :
            <UserIcon className="h-7 w-7 text-gray-300" aria-hidden="true" />
          }
        </div>
        <span className="sr-only">Your profile</span>
        <span aria-hidden="true">{auth.user.name}</span>
      </a>
    )
}