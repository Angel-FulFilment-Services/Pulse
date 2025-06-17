import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Scanner from '../../Components/Assets/Management/Scanner';
import ClickedModal from '../../Components/Modals/ClickedModal';
import Find from '../../Components/Assets/Management/Find';

export default function Scan() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-dark-800 -mt-8 lg:mt-0">
      <Find/>
    </div>
  );
}