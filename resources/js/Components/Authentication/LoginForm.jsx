import React from 'react';
import { useForm } from '@inertiajs/react'
import { ThreeDots } from 'react-loader-spinner'
import Logo from '../Branding/Logo.jsx';
import { router } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { toast } from 'react-toastify';

export default function LoginForm () {
    
    const { data, setData, post, processing, errors, reset, clearErrors, wasSuccessful, hasErrors} = useForm({
        email: '',
        password: '',
        remember: false,
      })

    function submit(e) {
        e.preventDefault();

        clearErrors();

        post('/login',{
            preserveScroll: true,
            onError: (e) => {
                toast.error(e.error, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                
                reset('password');
            },
        });
    }

    function button_colour(){
        switch(true){
            case hasErrors: 
                return "bg-red-500 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500";
            case wasSuccessful:
                return "bg-green-500 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500";
            default: 
                return "bg-theme-400 hover:bg-theme-500 dark:bg-theme-600 dark:hover:bg-theme-500";
        }
    }

    return (
        <div className="w-full lg:w-1/2 xl:w-1/3 h-screen flex flex-col items-center justify-center z-40">
            <form className='flex flex-row rounded-xl items-center justify-center w-4/5 shadow-2xl bg-gray-100 dark:bg-dark-800 overflow-y-auto' onSubmit={submit}>
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="h-full flex flex-col justify-between pt-10">
                        <Logo></Logo>
                        <div className="pt-4">
                            <h2 className="text-base font-semibold leading-7 text-theme-500">Login</h2>
                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-300">
                                Please login using your email and password.
                            </p>
                        </div>
                        <div className="mt-6 gap-x-6 gap-y-8">
                            <div className="sm:col-span-4">
                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100">
                                    Email
                                </label>
                                <div className="mt-2">
                                    <div className={`flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 focus-within:ring-2 focus-within:ring-inset focus-within:ring-theme-600 dark:focus-within:ring-theme-700 sm:max-w-md ${errors.email && "ring-red-600 dark:ring-red-700"}`}>
                                        <input
                                            type="text"
                                            name="email"
                                            value={data.email}
                                            onChange={e => {setData('email', e.target.value); clearErrors();}}
                                            id="email"
                                            autoComplete="email"
                                            className="block flex-1 border-0 bg-transparent py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 dark:text-dark-100 dark:placeholder:text-dark-500 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none"
                                            placeholder="Email"
                                        />
                                    </div>
                                    {errors.email && <div className="text-red-600 dark:text-red-700 text-sm pt-1">{errors.email}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 gap-x-6 gap-y-8">
                            <div className="sm:col-span-4">
                                <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100">
                                    Password
                                </label>
                                <div className="mt-2">
                                <div className={`flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 focus-within:ring-2 focus-within:ring-inset focus-within:ring-theme-600 sm:max-w-md dark:focus-within:ring-theme-700 ${errors.password && "ring-red-600 dark:ring-red-700"}`}>
                                        <input
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            onChange={e => {setData('password', e.target.value); clearErrors();}}
                                            id="password"
                                            autoComplete="password"
                                            className="block flex-1 border-0 bg-transparent py-1.5 pl-3 text-gray-900 placeholder:text-gray-400 dark:text-dark-100 dark:placeholder:text-dark-500 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none"
                                            placeholder="**********"
                                        />
                                    </div>
                                    {errors.password && <div className="text-red-600 text-sm pt-1">{errors.password}</div>}
                                </div>
                            </div>
                        </div>
                            
                        <div className="mt-5 gap-x-6 gap-y-8">
                            <div className="flex flex-row justify-between sm:col-span-4">
                                <div className="flex items-center">
                                    <input 
                                        id="remember" 
                                        name="remember" 
                                        className="focus:outline-none w-3 h-3 mr-2 accent-theme-500 dark:accent-theme-600" 
                                        type="checkbox"
                                        value={data.remember}
                                        onChange={e => setData('remember', e.target.value)}
                                    />
                                    <label htmlFor="remember" className="text-xs text-gray-900 dark:text-dark-100">Remember Me</label>
                                </div>
                                {/* <Link href="/forgot" className="cursor-pointer text-xs text-theme-500 focus:outline-none focus:underline focus:text-theme-600 hover:text-theme-600">Forgot Password?</Link> */}
                            </div>
                        </div>

                        <div className="gap-x-6 gap-y-8 pb-10 pt-5">
                            <div className="sm:col-span-4">
                                <div className="mt-2">
                                    <button disabled={processing || wasSuccessful || hasErrors} className={`${button_colour()} transition-all duration-500 w-full rounded-md py-1.5 text-gray-100 dark:text-dark-100 text-base font-semibold flex flex-row justify-center items-center gap-1.5`}>
                                        {processing ? 
                                            <ThreeDots
                                            visible={true}
                                            height="24"
                                            width="40"
                                            color="#FFFFFF"
                                            radius="12.5"
                                            ariaLabel="three-dots-loading"
                                            wrapperStyle={{}}
                                            wrapperClass=""
                                            /> : !wasSuccessful && !hasErrors && <p>Login</p>
                                        }
                                        {hasErrors &&
                                            <div className='w-5 h-5 checkmark__check'>
                                                <svg viewBox="-2 -2 56 56" class="crossmark__icon" width="" height="">
                                                    <circle class="crossmark__circle" strokeWidth={4} strokeMiterlimit={10} stroke="currentColor" cx="26" cy="26" r="25" fill="none"/>
                                                    <path class="crossmark__cross" strokeWidth={4} strokeMiterlimit={10} strokeLinecap={"round"} stroke="currentColor" fill="none" d="M16 16 36 36M36 16 16 36"/>
                                                </svg>
                                            </div>
                                        }
                                        {wasSuccessful &&
                                            <div className='w-5 h-5 checkmark__check'>
                                                <svg viewBox="-2 -2 56 56" class="checkmark__icon">
                                                    <circle class="checkmark__circle" strokeWidth={4} strokeMiterlimit={10} stroke="currentColor" cx="26" cy="26" r="25" fill="none"/>
                                                    <path class="checkmark__cross" strokeWidth={4} strokeMiterlimit={10} strokeLinecap={"round"} stroke="currentColor" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                                </svg>
                                            </div>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
      );
}