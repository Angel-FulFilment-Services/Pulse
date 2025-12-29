import React, { useState, useEffect } from 'react';
import ResetForm from '../../Components/Authentication/ResetForm.jsx';

const Activation = ({ token }) => {

    return (
        <div className="h-dvh">
            <div className="flex flex-row h-dvh w-full justify-center">
                <ResetForm token={token}></ResetForm>                         
            </div>
        </div>
      );
}

export default Activation