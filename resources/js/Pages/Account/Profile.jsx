import { UserCircleIcon } from '@heroicons/react/24/solid'
import { EnvelopeIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline'
import AccountFormHeader from '../../Components/Account/AccountFormHeader'
import TextInput from '../../Components/Forms/TextInput'
import ComboInput from '../../Components/Forms/ComboInput'
import PostcodeInput from '../../Components/Forms/PostcodeInput'
import ClickedModal from '../../Components/Modals/ClickedModal'
import UploadProfilePhoto from '../../Components/Account/UploadProfilePhoto.jsx'
import { toast } from 'react-toastify'

import UKCounties from '../../Components/Forms/LocalAddress/UKCounties.jsx';

export default function Example({ employee, user }) {
    const counties = UKCounties();

    const setProfilePhoto = async (image) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const formData = new FormData();
            formData.append('profile_photo', image);

            const response = await fetch('/profile/account/photo/set', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 422) {
                    const errorData = await response.json();
                    setErrors(errorData.errors);
                    throw new Error('Validation failed');
                }
                throw new Error('Failed to set profile photo');
            }

            toast.success('Profile photo updated successfully!', {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        } catch (error) {
            console.error(error);
            if (error.message !== 'Validation failed') {
                toast.error('Profile photo could not be updated. Please try again.', {
                    position: 'top-center',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: 'light',
                });
            }
        }
    };

  return (
    <form>
        <AccountFormHeader employee={employee}></AccountFormHeader>
        <div className="mx-auto max-w-full w-11/12 py-6 space-y-6">
            <div className="border-b border-gray-900/10 dark:border-dark-100/10 pb-8">
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-dark-100">Profile</h2>
                <p className="mt-1 text-sm/6 text-gray-600 dark:text-dark-400">
                    This is the information that will be used to identify you on the system.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                        <TextInput 
                            id="username"
                            autoComplete="username"
                            currentState={user.name}
                            label="Username"
                            Icon={UserIcon}
                            placeholder="Enter your username"                    
                            disabled={true}
                        />
                    </div>

                    <div className="sm:col-span-1 row-start-2">
                        <TextInput 
                            id="email"
                            autoComplete="email"
                            currentState={user.email}
                            annotation="(This is the email address you use to log in.)"
                            label="Email"
                            Icon={EnvelopeIcon}
                            placeholder="Enter your email address"                    
                            disabled={true}
                        />
                    </div>

                    <div className="sm:col-span-1 row-start-3">
                        <label htmlFor="photo" className="block text-sm/6 font-medium text-gray-900 dark:text-dark-100">
                            Profile Photo
                        </label>
                        <div className="mt-2 flex items-center gap-x-3 bg-gray-100 dark:bg-dark-700 p-2.5 rounded-3xl ring-1 ring-gray-500/20 dark:ring-dark-100/30">
                            <div className="size-20 relative flex items-center justify-center">
                                <div className="size-16 ring-2 rounded-full absolute ring-gray-700/20 dark:ring-dark-300/50"></div>
                                {employee.profile_photo ?
                                    <img src={`/images/profile/${employee.profile_photo}`} className="size-16 select-none rounded-full dark:brightness-90" />
                                :
                                    <UserCircleIcon aria-hidden="true" className="size-20 text-gray-300 dark:text-dark-500 absolute" />
                                }
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <div className="text-sm/6 font-semibold text-gray-900 dark:text-dark-100">
                                    <div className="flex items-center gap-x-3 w-full">
                                        <div> File: {employee.profile_photo ? employee.profile_photo : "No profile photo set."} </div>
                                        <button
                                            onClick={() => {}}
                                        >
                                            <TrashIcon
                                                className="h-5 w-6 text-theme-600 hover:text-theme-700 dark:text-theme-700 dark:hover:text-theme-600 cursor-pointer transition-all ease-in-out"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                    <div className="text-sm/6 text-gray-500 dark:text-dark-400">
                                        {employee.profile_photo ? "Click to change your profile photo." : "Click to upload a profile photo."}
                                    </div>
                                </div>
                                <ClickedModal
                                    overlay={true}
                                    customSize={"max-w-fit max-h-fit px-8 py-4"}
                                    className={`rounded-md bg-white dark:bg-dark-900 px-2.5 py-1.5 text-sm font-semibold text-gray-900 dark:text-dark-100 shadow-xs ring-1 ring-gray-300 dark:ring-dark-500 ring-inset hover:bg-gray-50 dark:hover:bg-dark-800 text-center cursor-pointer`}
                                    onClose={() => {
                                        const iframe = document.querySelector('iframe');
                                        const videos = document.querySelectorAll('video');
                                        videos.forEach(video => {
                                            if (video.srcObject) {
                                                video.srcObject.getTracks().forEach(track => track.stop());
                                                video.srcObject = null;
                                            }
                                        });
                                    }}
                                    onSubmit={(image) => {
                                        setProfilePhoto(image);
                                    }}
                                    content={(handleSubmit, handleClose) => <UploadProfilePhoto handleSubmit={handleSubmit} handleClose={handleClose} />
                                    }
                                >
                                    Change
                                </ClickedModal>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-900/10 dark:border-dark-100/10 pb-8">
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-dark-100">Personal Information <span className="text-gray-400 dark:text-dark-400 font-normal text-sm"> (Disabled) </span></h2>
                <p className="mt-1 text-sm/6 text-gray-600 dark:text-dark-400">
                    This is the information that will be used for your payslips.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4">
                    <div className="sm:col-span-1">
                        <TextInput 
                            id="firstname"
                            disabled={true}
                            autoComplete="firstname"
                            currentState={employee.firstname}
                            label="First name"
                            placeholder="Enter your firstname"                    
                        />
                    </div>

                    <div className="sm:col-span-1">
                        <TextInput 
                            id="lastname"
                            disabled={true}
                            autoComplete="lastname"
                            currentState={employee.surname}
                            label="Last name"
                            placeholder="Enter your last name"                    
                        />
                    </div>

                    <div className="sm:col-span-1">
                        <TextInput 
                            id="email"
                            disabled={true}
                            autoComplete="email"
                            currentState={employee.contact_home_email}
                            annotation="(This is your personal email address. Used for payslips.)"
                            label="Email"
                            Icon={EnvelopeIcon}
                            placeholder="Enter your email address"                   
                        />
                    </div>

                    <div className="sm:col-span-1 row-start-2">
                        <PostcodeInput 
                            id={{postcode: "postcode", address1: "address1", address2: "address2", address3: "address3", town: "town", county: "county"}} label={"Postcode"} 
                            autoComplete={"postal-code"} 
                            placeholder={"Postcode"} 
                            currentState={employee.home_postcode}
                            disabled={true} 
                        />
                    </div>

                    <div className="sm:col-span-1 row-start-3">
                        <TextInput 
                            id={"address1"} 
                            label={"Address Line 1"} 
                            autoComplete={"address-line1"} 
                            placeholder={"Address Line 1"} 
                            currentState={employee.home_address1} 
                            disabled={true}
                        />
                    </div>

                    <div className="sm:col-span-1 row-start-3">
                        <TextInput 
                            id={"address2"} 
                            label={"Address Line 2"} 
                            autoComplete={"address-line2"} 
                            placeholder={"Address Line 2"} 
                            currentState={employee.home_address2} 
                            disabled={true}
                        />
                    </div>

                    <div className="sm:col-span-1 row-start-3">
                        <TextInput 
                            id={"address3"} 
                            label={"Address Line 3"} 
                            autoComplete={"address-line3"} 
                            placeholder={"Address Line 3"} 
                            currentState={employee.home_address3} 
                            disabled={true}
                        />
                    </div>

                    <div className="sm:col-span-1 row-start-4">
                        <TextInput 
                            id={"town"} 
                            label={"Town / City"} 
                            autoComplete={"town"} 
                            placeholder={"Town"} 
                            currentState={employee.home_town}
                            disabled={true}    
                        />
                    </div>

                    <div className="sm:col-span-1 row-start-4">
                        <ComboInput 
                            id={"county"} 
                            label={"County"} 
                            spellCheck={false} 
                            items={counties} 
                            placeholder={"County"} 
                            currentState={employee.home_county}
                            disabled={true}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="mx-auto mt-3 flex max-w-full w-11/12 items-center justify-end gap-x-6">
            <button type="button" className="text-sm/6 font-semibold text-gray-900 dark:text-dark-100 disabled:cursor-not-allowed" disabled>
                Cancel
            </button>
            <button
                type="submit"
                className="rounded-md bg-theme-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-theme-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600 disabled:cursor-not-allowed disabled:hover:bg-theme-600" disabled
            >
                Save
            </button>
        </div>
    </form>
  )
}