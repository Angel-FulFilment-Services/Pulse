import React, { useState, useEffect } from 'react';
import LoginForm from '../../Components/Authentication/LoginForm.jsx';

const Authenticate = () => {

    return (
        <div className="h-screen">
            <div className="flex flex-row h-screen w-full justify-center">
                <LoginForm></LoginForm>                         
            </div>
        </div>
      );
}

export default Authenticate