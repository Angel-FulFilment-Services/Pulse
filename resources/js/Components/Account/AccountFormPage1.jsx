import React, { useState, useEffect } from 'react';
import { DevicePhoneMobileIcon, AtSymbolIcon, PhoneIcon } from '@heroicons/react/24/outline';

import UKCounties from '../../Components/Forms/LocalAddress/UKCounties.jsx';

// Form Elements
import SelectInput from '../Forms/SelectInput.jsx';
import TextInput from '../Forms/TextInput.jsx';
import DateInput from '../Forms/DateInput.jsx';
import ComboInput from '../Forms/ComboInput.jsx';
import MaskedInput from '../Forms/MaskedInput.jsx';
import PostcodeInput from '../Forms/PostcodeInput.jsx';

import {validateEmail, validateRequired} from '../../Utils/Validation.jsx';
// import Sanitiser from '../Utils/Sanitiser.jsx';

export default function AccountFormPage1({data, handleChange, errors, setError, clearError}) {
    const counties = UKCounties();

    const validationRules = {
        title: [
            (value) => validateRequired(value, {})
        ],
        firstname: [
            (value) => validateRequired(value, 'Firstname', {
            })
        ],
        lastname: [
            (value) => validateRequired(value, 'Lastname', {})
        ],
        email: [
            (value) => validateRequired(value, 'Email', {}),
            (value, field, data) => validateEmail(value, {
                customMessage: 'Please enter a valid email address',
            })
        ],
        mobile_phone: [
            (value) => validateRequired(value, 'Mobile Phone', {}),
            (value, field, data) => validateIsMobilePhone(value, {})
        ],
        home_phone: [
            (value) => validateRequired(value, {
                logErrors: true
            })
        ],
        gender: [
            (value) => validateRequired(value, {
                logErrors: true
            })
        ],
    };

    const validate = (fieldsToValidate) => {
        const newErrors = {};
    
        // Iterate over the fields to validate
        fieldsToValidate.forEach((field) => {
            clearError(field);

            const value = data[field];
            const fieldRules = validationRules[field];
    
            // If there are validation rules for the field, apply them
            if (fieldRules) {
                for (const rule of fieldRules) {
                    const error = rule(value, field, data);
                    if (error) {
                        newErrors[field] = error;
                        break;
                    }
                }
            }
        });
    
        // Update the errors state using setError
        setError(newErrors);
    };
    
    return (
        <div className="rounded-xl w-11/12">
            <div className="px-4 py-6 sm:p-8 flex flex-col gap-y-8">
                <div className="pb-3 border-b">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Contact Information</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Personal details.</p>
                </div>
                <div className="grid max-w-full grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-8">
                    <div className="sm:col-span-1 row-start-1">
                        <SelectInput id={"title"} label={"Title"} placeholder={"Title"} items={[
                            { id: 1, value: 'Mr' },
                            { id: 2, value: 'Mrs' },
                            { id: 3, value: 'Miss' },
                            { id: 4, value: 'Ms' },
                        ]} currentState={data.title} onSelectChange={handleChange}/>
                    </div>
                    
                    <div className="sm:col-span-3 sm:row-start-1">
                        <TextInput id={"firstname"} label={"Firstname"} autoComplete={"given-name"} placeholder={"Firstname"} currentState={data.firstname} onTextChange={handleChange} onBlur={validate} error={errors.firstname}/>
                    </div>

                    <div className="sm:col-span-3 sm:row-start-1">
                        <TextInput id={"lastname"} label={"Lastname"} autoComplete={"family-name"} placeholder={"Surname"} currentState={data.lastname} onTextChange={handleChange} onBlur={validate} error={errors.lastname}/>
                    </div>

                    <div className="sm:col-span-2 sm:row-start-2">
                        <TextInput id={"email"} label={"Email"} annotation="(Personal, used for payslip)" autoComplete={"Email"} placeholder={"Email"} currentState={data.email} onTextChange={handleChange} Icon={AtSymbolIcon} onBlur={validate} error={errors.email}/>
                    </div>

                    <div className="sm:col-span-2 sm:row-start-2">
                        <MaskedInput id={"mobile_phone"} label={"Mobile Phone Number"} autoComplete={"tel"} placeholder={"Mobile Phone Number"} currentState={data.mobile_phone} mask={"+44 9999 999 999"} maskChar={" "} onInputChange={handleChange} Icon={DevicePhoneMobileIcon}/>
                    </div>

                    <div className="sm:col-span-2 sm:row-start-2">
                        <MaskedInput id={"home_phone"} label={"Home Phone Number"} autoComplete={""} placeholder={"Home Phone Number"} currentState={data.home_phone} mask={"01999 999999"} maskChar={" "} onInputChange={handleChange} Icon={PhoneIcon}/>
                    </div>

                    <div className="sm:col-span-1 sm:row-start-3">
                        <SelectInput id={"gender"} label={"Gender"} placeholder={"Gender"} items={[
                            { id: 1, value: 'Male' },
                            { id: 2, value: 'Female' }
                        ]} currentState={data.gender} onSelectChange={handleChange}/>
                    </div>

                    <div className="sm:col-span-2 sm:row-start-3">
                        <MaskedInput id={"nin"} label={"National Insurance No."} placeholder={"National Insurance No."} currentState={data.nin} onInputChange={handleChange} mask={"aa999999a"} maskChar={""} uppercase={true}/>
                    </div>

                    <div className="sm:col-span-2 sm:row-start-3">
                        <DateInput startDateId={"dob"} label={"Date of Birth"} placeholder={"Date of Birth"} dateRange={false} minDate={new Date().setFullYear(new Date().getFullYear() - 100)} maxDate={new Date()} currentState={{startDate: data.dob, endDate: data.dob}} onDateChange={handleChange}/>
                    </div>
                </div>
                <div className="pb-3 border-b">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Address</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Personal details and application.</p>
                </div>
                <div className="grid max-w-full grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-10">
                        <div className="sm:col-span-4 sm:row-start-1">
                            <PostcodeInput id={{postcode: "postcode", address1: "address1", address2: "address2", address3: "address3", town: "town", county: "county"}} label={"Postcode"} autoComplete={"postal-code"} placeholder={"Postcode"} currentState={data.postcode} onComboChange={handleChange}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-2">
                            <TextInput id={"address1"} label={"Address Line 1"} autoComplete={"address-line1"} placeholder={"Address Line 1"} currentState={data.address1} onTextChange={handleChange} onBlur={validate} error={errors.address1}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-2">
                            <TextInput id={"address2"} label={"Address Line 2"} autoComplete={"address-line2"} placeholder={"Address Line 2"} currentState={data.address2} onTextChange={handleChange} onBlur={validate} error={errors.address2}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-2">
                            <TextInput id={"address3"} label={"Address Line 3"} autoComplete={"address-line3"} placeholder={"Address Line 3"} currentState={data.address3} onTextChange={handleChange} onBlur={validate} error={errors.address3}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-3">
                            <TextInput id={"town"} label={"Town"} autoComplete={"town"} placeholder={"Town"} currentState={data.town} onTextChange={handleChange} onBlur={validate} error={errors.town}/>
                        </div>

                        <div className="sm:col-span-3 sm:row-start-3">
                            <ComboInput id={"county"} label={"County"} spellCheck={false} items={counties} placeholder={"County"} currentState={data.county} onComboChange={handleChange}/>
                        </div>
                    </div>
            </div>
        </div>
    )
}
