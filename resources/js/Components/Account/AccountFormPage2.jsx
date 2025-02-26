import React, { useState, useEffect } from 'react';

// Form Elements
import SelectInput from '../Forms/SelectInput.jsx';
import TextAreaInput from '../Forms/TextAreaInput.jsx';

export default function AccountFormPage2({data, handleChange}) {
    const handleSelectChange = (updates) => {
        if (updates[0].id === 'disability' && (updates[0].value === 'No' || updates[0].value === 'Prefer Not to Say')) {
            updates.push({"id": 'disability_desc', "value": ''});
        }

        handleChange(updates);
    };

    return (
        <div className="rounded-xl w-11/12">
            <div className="px-4 py-6 sm:p-10 flex flex-col gap-y-8">
                <div className="pb-3 border-b">
                    <h3 className="text-base font-semibold leading-7 text-gray-900">Medical Conditions</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Please tell us about any registered medical condtions / disabilities you may have.</p>
                </div>
                <div className="grid max-w-full grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-8">
                    <div className="sm:col-span-2 row-start-1">
                        <SelectInput id={"disability"} label={"Do you have any registered disabilities?"} placeholder="..." items={[
                            { id: 1, value: 'Yes' },
                            { id: 2, value: 'No' },
                            { id: 3, value: 'Prefer Not to Say' }
                        ]} currentState={data.disability} onSelectChange={handleSelectChange}/>
                    </div>
                    
                    <div className="sm:col-span-8 sm:row-span-4 sm:row-start-2">
                        <TextAreaInput id={"disability_desc"} label={"Description of disabilities"} annotation="(Optional)" isDisabled={data.disability !== 'Yes' ? true : false} placeholder={"Please give us a brief description of any disabilities you may have."} row={5} col={null} currentState={data.disability_desc} onTextChange={handleChange}/>
                    </div>
                </div>
            </div>
        </div>
    )
}
