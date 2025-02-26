import React, { useState } from 'react';
import { usePage } from '@inertiajs/react'
import { useForm } from '@inertiajs/react'
import { useNavigate } from 'react-router-dom';

import AccountHeader from '../../Components/Account/AccountFormHeader.jsx';
import AccountFormSteps from '../../Components/Account/AccountFormSteps.jsx';
import AccountFormControls from '../../Components/Account/AccountFormControls.jsx';

import AccountFormPage1 from '../../Components/Account/AccountFormPage1.jsx';
import AccountFormPage2 from '../../Components/Account/AccountFormPage2.jsx';
import AccountFormPage3 from '../../Components/Account/AccountFormPage3.jsx';
import AccountFormPage4 from '../../Components/Account/AccountFormPage4.jsx';
import AccountFormPage5 from '../../Components/Account/AccountFormPage5.jsx';
import AccountFormPage6 from '../../Components/Account/AccountFormPage6.jsx';

const AccountForm = ({ employee, initialPage }) => {
    const { auth } = usePage().props
    const [page, setPage] = useState(initialPage);
    const navigate = useNavigate();
    
    const { data, setData, post, processing, errors, setError, clearErrors, reset, wasSuccessful, hasErrors} = useForm('accountForm', {
        1: {
            title: '',
            firstname: '',
            lastname: '',
            gender: '',
            email: '',
            mobile_phone: '',
            home_phone: '',
            nin: '',
            dob: '',
            postcode: '',
            address1: '',
            address2: '',
            address3: '',
            town: '',
            county: '',
        },
        2: {
            disability: 'No',
            disability_desc: '',
        },
        3: {
            kin1_fullname: '',
            kin1_relation: '',
            kin1_mobile_phone: '',
            kin1_home_phone: '',
            kin1_address1: '',
            kin1_address2: '',
            kin1_address3: '',
            kin1_town: '',
            kin1_county: '',
            kin1_postcode: '',
            kin2_fullname: '',
            kin2_relation: '',
            kin2_mobile_phone: '',
            kin2_home_phone: '',
            kin2_address1: '',
            kin2_address2: '',
            kin2_address3: '',
            kin2_town: '',
            kin2_county: '',
            kin2_postcode: '',
        }
    })

    const handleChange = (updated) => {
        setData({
            ...data,
            [page]: {
                ...data[page],
                ...updated.reduce((item, { id, value }) => {
                    item[id] = value;
                    return item;
                }, {}),
            },
        });
    };

    const clearError = (field) => {
        setError((prevErrors) => ({
            ...prevErrors,
            [field]: null,
        }));

        console.log(errors);
        console.log(field);
    };

    function submit(e) {
        e.preventDefault();

        clearErrors();

        // post('/login',{
        //     preserveScroll: true,
        //     onSuccess: () => {
        //     },
        //     onError: (e) => {
        //     },
        // });
    }

    const steps = [
        { id: 1, href: '/my-details/entry/about-you' },
        { id: 2, href: '/my-details/entry/medical-conditions' },
        { id: 3, href: '/my-details/entry/next-of-kin' },
        { id: 4, href: '/my-details/entry/your-bank-details', },
        { id: 5, href: '/my-details/entry/tax-information' },
        { id: 6, href: '/my-details/entry/student-loan-questionaire' },
      ]
      
    const nextPage = () => {
        setPage(page + 1);
        navigate(steps.find(step => step.id === page + 1).href, { replace: true });
    }

    const previousPage = () => {
        setPage(page - 1);
        navigate(steps.find(step => step.id === page - 1).href, { replace: true });
    }

    const goToPage = (page) => {
        setPage(page);
        navigate(steps.find(step => step.id === page).href, { replace: true });
    }

    const shouldAllowPreviousPage = (page) => {
        const previousStep = steps.find(step => step.id === page - 1);
        return previousStep ? previousStep.href : false;
    };

    const shouldAllowNextPage = (page) => {
        const nextStep = steps.find(step => step.id === page + 1);
        return nextStep ? nextStep.href : false;
    };

    function getPage(page){
        switch (page) {
            case 1:
                return <AccountFormPage1 data={data[1]} handleChange={handleChange} errors={errors} setError={setError} clearError={clearError}/>;
                break;
            case 2:
                return <AccountFormPage2 data={data[2]} handleChange={handleChange} errors={errors} />;
                break;
            case 3:
                return <AccountFormPage3 data={data[3]} handleChange={handleChange} errors={errors} />;
                break;
            case 4:
                return <AccountFormPage4 data={data} handleChange={handleChange} errors={errors} />;
                break;
            case 5:
                return <AccountFormPage5 data={data} handleChange={handleChange} errors={errors} />;
                break;
            case 6:
                return <AccountFormPage6 data={data} handleChange={handleChange} errors={errors} />;
                break;
        }        
    }

    return (
        <form onSubmit={submit} id="account-form">
            <div className="h-full">
                <div className="flex flex-col items-center justify-start space-y-7 w-full h-full">
                    <div className="w-full">
                        <AccountHeader auth={auth} employee={employee}/>
                    </div>
                    <div className="w-full flex flex-row h-full">
                        <div className="w-1/5 flex justify-center ring-1 ring-gray-900/5 rounded-lg rounded-r-none bg-white/50 ml-10 py-10">
                            <AccountFormSteps page={page} goToPage={goToPage} />
                        </div>
                        <div className="w-full items-start justify-center flex ring-1 ring-gray-900/5 rounded-lg rounded-l-none bg-white mr-10">
                            { getPage(page) }
                        </div>
                    </div>
                    <div className="shadow-none rounded-xl w-full px-10 h-3/5">
                        <AccountFormControls page={page} shouldAllowPreviousPage={shouldAllowPreviousPage} shouldAllowNextPage={shouldAllowNextPage} nextPage={nextPage} previousPage={previousPage} />
                    </div>
                </div>
            </div>
        </form>
    );
}

export default AccountForm