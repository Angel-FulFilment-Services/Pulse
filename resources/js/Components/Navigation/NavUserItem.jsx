import { React } from 'react'
import { usePage } from '@inertiajs/react'
import UserItemFull from '../User/UserItemFull';

export default function NavButton ({ item }){
    const { auth, employee } = usePage().props
  
    return(
      <a
        href="#"
        className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
      >
        {/* <UserItemSelf 
          agent={{hr_id: 2506, agent: auth.user.name}} 
          allowClickInto={false} 
          iconSize='large'
        /> */}
      </a>
    )
}