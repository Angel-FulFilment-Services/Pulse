import React, { useState, useEffect } from 'react';
import TwoFactorAuthForm from '../../Components/Authentication/TwoFactorAuthForm.jsx';

const Verify = () => {

    return (
        <div className="h-screen">
            <div className="flex flex-row h-screen w-full justify-center">
                <TwoFactorAuthForm></TwoFactorAuthForm>                         
            </div>
        </div>
      );
}

export default Verify