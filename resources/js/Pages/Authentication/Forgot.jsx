import React, { useState, useEffect } from 'react';
import ForgotForm from '../../Components/Authentication/ForgotForm.jsx';

const Authenticate = () => {

    return (
        <div className="h-screen">
            <div className="flex flex-row h-screen w-full justify-center">
                <ForgotForm></ForgotForm>                         
            </div>
        </div>
      );
}

export default Authenticate