import React, { useState, useEffect } from 'react';
import TwoFactorAuthForm from '../../Components/Authentication/TwoFactorAuthForm.jsx';

const Verify = () => {

    return (
        <div className="h-dvh">
            <div className="flex flex-row h-dvh w-full justify-center">
                <TwoFactorAuthForm></TwoFactorAuthForm>                         
            </div>
        </div>
      );
}

export default Verify