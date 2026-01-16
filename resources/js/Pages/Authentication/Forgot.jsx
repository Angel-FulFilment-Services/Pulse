import React, { useState, useEffect } from 'react';
import ForgotForm from '../../Components/Authentication/ForgotForm.jsx';

const Authenticate = () => {

    return (
        <div className="h-dvh">
            <div className="flex flex-row h-dvh w-full justify-center">
                <ForgotForm></ForgotForm>                         
            </div>
        </div>
      );
}

export default Authenticate