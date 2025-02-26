import React, { useState, useEffect } from 'react';
import ActivateForm from '../../Components/Authentication/ActivateForm.jsx';

const Activation = ({ token }) => {

    return (
        <div className="h-screen">
            <div className="flex flex-row h-screen w-full justify-center">
                <ActivateForm token={token}></ActivateForm>                         
            </div>
        </div>
      );
}

export default Activation