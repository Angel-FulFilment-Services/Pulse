import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Scanner from '../../Components/Assets/Management/Scanner';
import ClickedModal from '../../Components/Modals/ClickedModal';
import Find from '../../Components/Assets/Management/Find';

export default function Scan() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-800 gap-y-8">

      <ClickedModal
          overlay={true}
          customSize={"max-w-full w-[90%] max-h-screen h-[90%]"}
          className={`rounded-md bg-white dark:bg-dark-900 px-2.5 py-1.5 text-sm font-semibold text-gray-900 dark:text-dark-100 shadow-xs ring-1 ring-gray-300 dark:ring-dark-500 ring-inset hover:bg-gray-50 dark:hover:bg-dark-800 text-center cursor-pointer`}
          onClose={() => {

          }}
          onSubmit={() => {
              console.log('Done')
          }}
          content={(handleSubmit, handleClose) => <Find handleClose={handleClose}/>
          }
      >
          Launch
      </ClickedModal>
    </div>
  );
}