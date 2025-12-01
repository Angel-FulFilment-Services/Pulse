import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import DocumentDialog from '../Dialogs/DocumentDialog';
import './Styles.css'; // Assuming you have a CSS file for styles

export default function TermsAndConditions({ onComplete, location, setStep }) {
  const [isProcessing, setIsProcessing] = useState(false); // Flag to prevent multiple submissions
  const [animationClass, setAnimationClass] = useState('fade-in'); // Tracks the animation class for transitions
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDoc, setDialogDoc] = useState({ title: '', url: '' });

  const docs = [
    {
      title: 'Fire Evacuation Plan',
      url: '/documents/fire_evacuation_plan.pdf',
    },
    {
      title: 'Fire Evacuation Route (Ground Floor)',
      url: '/documents/fire_evacuation_route_ground_floor.pdf',
    },
    {
      title: 'Fire Evacuation Route (First Floor)',
      url: '/documents/fire_evacuation_route_first_floor.pdf',
    },
    {
      title: 'Fire Evacuation Route (Bunker)',
      url: '/documents/fire_evacuation_route_bunker.pdf', 
    },
    {
      title: 'Liability Insurance',
      url: '/documents/liability_insurance.pdf',
    },
  ];

  const openDialog = (doc) => {
    setDialogDoc(doc);
    setDialogOpen(true);
  };

  const handleComplete = () => {
    setIsProcessing(true); // Set processing state to true
    setAnimationClass('fade-out');
    onComplete(); // Call the onComplete function passed as a prop
  };

  return (
    <div
      className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 pb-16 h-screen min-h-dvh w-full"
    >
      <div className="flex items-center justify-end w-full h-10">
        <XMarkIcon
          className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer"
          onClick={() => setStep('splash')}
        />
      </div>
      <div className="flex flex-col items-start justify-start bg-white dark:bg-dark-900 h-full w-full pt-10">
        <div className="flex flex-col gap-4 w-full h-full">
          {/* Input Field for Current Input */}
          <div className={`px-36 flex flex-col gap-y-1`}>
            <h1 className="text-4xl text-gray-800 dark:text-dark-100">
              Terms and Conditions
            </h1>
            <p className="text-lg text-gray-600 dark:text-dark-300 pt-2">
              By signing in you confirm that you fully agree to and will abide by the terms and conditions set out below.
            </p>
          </div>

          <div className="mx-36 flex flex-col gap-y-1 max-h-[90rem] h-[90rem] overflow-y-auto bg-gray-100 rounded-xl mt-4">
            <h1 className="text-xl text-gray-800 dark:text-dark-100 p-4 px-4 pr-6 font-semibold text-left">
                Angel Fulfilment Services Limited - Lostwithiel Office T&C's
            </h1>
            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                Visitor and Contractor Terms and Conditions
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                By entering these premises, you acknowledge and agree to the following terms.
            </p>

            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                Insurance Responsibility
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                If you are attending the premises in your capacity as a contractor, supplier, or delivery driver, you confirm that you hold adequate insurance to cover your actions and liabilities while on site. You agree not to rely on the Company’s insurance policies, except where strictly required by law.
            </p>
            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                Fire Safety and Evacuation
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                In the event you discover a fire, you will immediately activate the nearest fire alarm call point. If the fire alarm sounds, you will evacuate the building immediately via the nearest safe exit and proceed to the designated assembly point. The fire alarm will be a loud continuous high-pitched siren sound.
            </p>

            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                Access and Sign-In Procedures
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                All visitors must sign in and out upon entry and exit. You must not allow any unauthorised person to access the premises unless explicitly authorised by the Company in advance. If you are given access codes/keys to the premises for access you will treat them with strictest confidence.
            </p>

            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                CCTV Monitoring
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                You acknowledge and consent to the use of CCTV surveillance on the premises for security and safety purposes, and the Company archiving footage.
            </p>

            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                Personal Emergency Evacuation
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                If you have any mobility, hearing, visual, or other impairments that may affect your ability to evacuate safely during an emergency, it is your responsibility to inform the Company upon arrival. The Company will work with you to establish a suitable Personal Emergency Evacuation Plan (PEEP) where appropriate.
            </p>
            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                Responsibility for Damage
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                Beyond reasonable wear and tear, any damage to the premises, fixtures, or Company property caused during your visit will be your responsibility. You agree to repair or replace such damage at your own cost.
            </p>
            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                Parking at Own Risk
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                If you choose to park on or near the premises, you do so entirely at your own risk. The Company accepts no responsibility or liability for any loss, damage, or theft to vehicles or their contents while on or adjacent to Company property.
            </p>
            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
                Accidents, Slips, Trips and Falls
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                If you experience or witness an accident, including but not limited to a slip, trip or fall, you confirm you will report it to a Senior Manager of the Company immediately, and complete an incident report. If you cannot locate a Senior Manager, you must immediately notify the Company via email: hello@angelfs.co.uk
            </p>

            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                Save for any legal rights, you confirm that the Company cannot and will not be held responsible for any accident, slip, trip or fall that you allege to have experienced or witnessed if you did not immediately notify the Company as per the procedure set out above.
            </p>

            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
              Smoking and Vaping
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1">
                Smoking and vaping inside is strictly prohibited. Smoking is only permitted at the designated smoking area. Cigarette butts must be safely and securely disposed of.
            </p>

            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
              General Behaviour and Principles
            </h2>
            <p className="text-md text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 pb-4">
                You confirm that you will conduct yourself in a polite and professional manner at all times, always making consideration for the safety of yourself and others as a priority. You will report any concerns or issues to the Company immediately.
            </p>

            <h2 className="text-lg text-gray-800 dark:text-dark-100 px-4 pr-6 py-1 font-semibold">
              Additional Documentation
            </h2>
            <div className="flex flex-row gap-4 px-4 pb-4">
              {docs.map((doc, idx) => (
                <button
                  key={idx}
                  className="bg-theme-500 hover:bg-theme-600 text-white rounded-xl px-6 py-3 text-lg font-semibold shadow transition"
                  onClick={() => openDialog(doc)}
                  type="button"
                >
                  {doc.title}
                </button>
              ))}
            </div>
          </div>

          <div className={`px-36 flex flex-col gap-y-1`}>
            <p className="text-md text-gray-800 dark:text-dark-100">
              Full documentation of our terms and conditions can be found on our website at: <span className="text-theme-600 dark:text-theme-600">www.helloangel.co.uk/lostwithiel-terms</span>
            </p>
          </div>

          {/* Continue Button */}
          <div className={`flex flex-row items-end justify-end w-full h-full z-10 relative ${animationClass}`}>
            <div className="flex-shrink-0">
              <button
                disabled={isProcessing}
                className="mt-4 px-5 py-4 bg-theme-500 text-white rounded-2xl text-3xl z-20 shadow hover:bg-theme-600 focus:outline-none flex items-center justify-center fade-in disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {handleComplete();}}
              >
                <ChevronRightIcon className="h-8 w-8 inline-block stroke-[7] flex-shrink-0 mr-2" />
                <p className="mb-1">Continue</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <DocumentDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
        <div className="flex flex-col items-center justify-center">
          <div className="absolute top-4 right-4">
            <XMarkIcon
              className="h-7 w-7 stroke-2 text-gray-800 dark:text-dark-300 cursor-pointer"
              onClick={() => setDialogOpen(false)}
            />
          </div>
          <h3 className="text-2xl font-semibold mb-6">{dialogDoc.title}</h3>
          <iframe
            src={dialogDoc.url}
            title={dialogDoc.title}
            className="w-full h-[70vh] rounded border"
          />
        </div>
      </DocumentDialog>
    </div>
  );
}