import React, { useState, useEffect } from 'react';
import LoginForm from '../../Components/Authentication/LoginForm.jsx';

const Authenticate = () => {

    return (
        <div className="h-dvh">
            <div className="flex flex-row h-dvh w-full justify-center">
                <LoginForm></LoginForm>                         
            </div>
        </div>
      );
}

export default Authenticate