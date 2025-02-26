import React, { useState, useEffect } from 'react';
import { DevicePhoneMobileIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';

import UKCounties from '../../Components/Forms/LocalAddress/UKCounties.jsx';

// Form Elements
import SelectInput from '../Forms/SelectInput.jsx';
import TextInput from '../Forms/TextInput.jsx';
import DateInput from '../Forms/DateInput.jsx';
import ComboInput from '../Forms/ComboInput.jsx';
import MaskedInput from '../Forms/MaskedInput.jsx';
import PostcodeInput from '../Forms/PostcodeInput.jsx';

export default function AccountForm({data, handleChange}) {
    const counties = UKCounties();

    return (
        <div className="rounded-xl w-11/12">
            <div className="px-4 py-6 sm:p-10 flex flex-col gap-y-8">
                <div className="pb-3 border-b">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">First Next of Kin</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Details of your first next of kin contact.</p>
                </div>
                <div className="grid max-w-full grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-10">
                        <div className="sm:col-span-3 sm:row-start-1">
                            <TextInput id={"kin1_fullname"} label={"Fullname"} placeholder={"Fullname"} currentState={data.kin1_fullname} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-1">
                            <TextInput id={"kin1_relation"} label={"Relation to Person"} placeholder={"Relation"} currentState={data.kin1_relation} onTextChange={handleChange} Icon={UserIcon}/>
                        </div>

                        <div className="sm:col-span-2 sm:row-start-2">
                            <MaskedInput id={"kin1_mobile_phone"} label={"Mobile Phone Number"} placeholder={"Mobile Phone Number"} currentState={data.kin1_mobile_phone} mask={"+44 9999 999 999"} maskChar={" "} onInputChange={handleChange} Icon={DevicePhoneMobileIcon}/>
                        </div>
                        
                        <div className="sm:col-span-2 sm:row-start-2">
                            <MaskedInput id={"kin1_home_phone"} label={"Home Phone Number"} autoComplete={""} placeholder={"Home Phone Number"} currentState={data.kin1_home_phone} mask={"01999 999999"} maskChar={" "} onInputChange={handleChange} Icon={PhoneIcon}/>
                        </div>

                        <div className="sm:col-span-2 sm:row-start-3">
                            <PostcodeInput id={{postcode: "kin1_postcode", address1: "kin1_address1", address2: "kin1_address2", address3: "kin1_address3", town: "kin1_town", county: "kin1_county"}} label={"Postcode"} autoComplete={"postal-code"} placeholder={"Postcode"} currentState={data.kin1_postcode} onComboChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-4">
                            <TextInput id={"kin1_address1"} label={"Address Line 1"} placeholder={"Address Line 1"} currentState={data.kin1_address1} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-4">
                            <TextInput id={"kin1_address2"} label={"Address Line 2"} placeholder={"Address Line 2"} currentState={data.kin1_address2} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-4">
                            <TextInput id={"kin1_address3"} label={"Address Line 3"} placeholder={"Address Line 3"} currentState={data.kin1_address3} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-5">
                            <TextInput id={"kin1_town"} label={"Town"} placeholder={"Town"} currentState={data.kin1_town} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-5">
                            <ComboInput id={"kin1_county"} label={"County"} items={counties} spellCheck={false} currentState={data.kin1_county} placeholder={"County"} onComboChange={handleChange}/>
                        </div>
                </div>
                <div className="pb-3 border-b">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Second Next of Kin</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Details of your second next of kin contact.</p>
                </div>
                <div className="grid max-w-full grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-10">
                        <div className="sm:col-span-3 sm:row-start-1">
                            <TextInput id={"kin2_fullname"} label={"Fullname"} placeholder={"Fullname"} currentState={data.kin2_fullname} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-1">
                            <TextInput id={"kin2_relation"} label={"Relation to Person"} placeholder={"Relation"} currentState={data.kin2_relation} onTextChange={handleChange} Icon={UserIcon}/>
                        </div>

                        <div className="sm:col-span-2 sm:row-start-2">
                            <MaskedInput id={"kin2_mobile_phone"} label={"Mobile Phone Number"} placeholder={"Mobile Phone Number"} currentState={data.kin2_mobile_phone} mask={"+44 9999 999 999"} maskChar={" "} onInputChange={handleChange} Icon={DevicePhoneMobileIcon}/>
                        </div>
                        
                        <div className="sm:col-span-2 sm:row-start-2">
                            <MaskedInput id={"kin2_home_phone"} label={"Home Phone Number"} autoComplete={""} placeholder={"Home Phone Number"} currentState={data.kin2_home_phone} mask={"01999 999999"} maskChar={" "} onInputChange={handleChange} Icon={PhoneIcon}/>
                        </div>

                        <div className="sm:col-span-2 sm:row-start-3">
                            <PostcodeInput id={{postcode: "kin2_postcode", address1: "kin2_address1", address2: "kin2_address2", address3: "kin2_address3", town: "kin2_town", county: "kin2_county"}} label={"Postcode"} autoComplete={"postal-code"} placeholder={"Postcode"} currentState={data.kin2_postcode} onComboChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-4">
                            <TextInput id={"kin2_address1"} label={"Address Line 1"} placeholder={"Address Line 1"} currentState={data.kin2_address1} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-4">
                            <TextInput id={"kin2_address2"} label={"Address Line 2"} placeholder={"Address Line 2"} currentState={data.kin2_address2} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-4">
                            <TextInput id={"kin2_address3"} label={"Address Line 3"} placeholder={"Address Line 3"} currentState={data.kin2_address3} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-5">
                            <TextInput id={"kin2_town"} label={"Town"} placeholder={"Town"} currentState={data.kin2_town} onTextChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-5">
                            <ComboInput id={"kin2_county"} label={"County"} items={counties} spellCheck={false} currentState={data.kin2_county} placeholder={"County"} onComboChange={handleChange}/>
                        </div>
                    </div>
            </div>
        </div>
    )
}
