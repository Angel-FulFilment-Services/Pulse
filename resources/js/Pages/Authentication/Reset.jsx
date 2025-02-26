import React, { useState, useEffect } from 'react';
import ResetForm from '../../Components/Authentication/ResetForm.jsx';

const Activation = ({ token }) => {

    return (
        <div className="h-screen">
            <div className="flex flex-row h-screen w-full justify-center">
                <ResetForm token={token}></ResetForm>                         
            </div>
        </div>
      );
}

export default Activation