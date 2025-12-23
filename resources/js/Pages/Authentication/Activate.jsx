import React, { useState, useEffect } from 'react';
import ActivateForm from '../../Components/Authentication/ActivateForm.jsx';

const Activation = ({ token }) => {

    return (
        <div className="h-dvh">
            <div className="flex flex-row h-dvh w-full justify-center">
                <ActivateForm token={token}></ActivateForm>                         
            </div>
        </div>
      );
}

export default Activation