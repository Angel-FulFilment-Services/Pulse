import React, { useState, useEffect } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline'

import UKCounties from '../../Components/Forms/LocalAddress/UKCounties.jsx';

// Form Elements
import TextInput from '../Forms/TextInput.jsx';
import MaskedInput from '../Forms/MaskedInput.jsx';

export default function AccountForm({data, handleChange}) {
    const counties = UKCounties();

    return (
        <div className="rounded-xl w-11/12">
            <div className="px-4 py-6 sm:p-10 flex flex-col gap-y-8">
                <div className="pb-3 border-b">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Bank Details</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Personal details.</p>
                </div>
                <div className="grid max-w-full grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-8">                    
                    <div className="sm:col-span-2 sm:row-start-1">
                        <TextInput id={"firstname"} label={"Account In Name Of"} autoComplete={"name"} placeholder={"Account In Name Of"} currentState={data.firstname} onTextChange={handleChange}/>
                    </div>

                    <div className="sm:col-span-2 sm:row-start-2">
                        <MaskedInput id={"account_number"} label={"Account Number"} placeholder={"Account Number"} currentState={data.account_number} onInputChange={handleChange} mask={"99999999"} maskChar={""} Icon={CreditCardIcon}/>
                    </div>

                    <div className="sm:col-span-1 sm:row-start-2">
                        <MaskedInput id={"sort_code"} label={"Sort Code"} placeholder={"  -  -"} currentState={data.sort_code} onInputChange={handleChange} mask={"99-99-99"} maskChar={" "}/>
                    </div>

                    <div className="sm:col-span-2 sm:row-start-3">
                        <TextInput id={"branch"} label={"Branch"} autoComplete={"name"} placeholder={"Branch"} currentState={data.firstname} onTextChange={handleChange}/>
                    </div>

                    <div className="sm:col-span-3 sm:row-start-3">
                        <TextInput id={"firstname"} label={"Account In Name Of"} autoComplete={"name"} placeholder={"Account In Name Of"} currentState={data.firstname} onTextChange={handleChange}/>
                    </div>
                </div>
            </div>
        </div>
    )
}
