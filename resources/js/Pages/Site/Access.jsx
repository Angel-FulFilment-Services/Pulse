import React, { useState } from 'react';
import SplashScreen from '../../Components/Site/SplashScreen';
import ModeSelector from '../../Components/Site/ModeSelector';
import QRScannerPanel from '../../Components/Site/QRScannerPanel';
import SignInTypeSelector from '../../Components/Site/SignInTypeSelector';
import SignInEmployeeForm from '../../Components/Site/SignInEmployeeForm';
import SignInVisitorForm from '../../Components/Site/SignInVisitorForm';
import SignInContractorForm from '../../Components/Site/SignInContractorForm';
import SignOutList from '../../Components/Site/SignOutList';
import WelcomeMessage from '../../Components/Site/WelcomeMessage';
import GoodbyeMessage from '../../Components/Site/GoodbyeMessage';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Access() {
  const [step, setStep] = useState('splash'); // splash, mode, scan, signin-type, signin-employee, signin-visitor, signin-contractor, signout, welcome, goodbye
  const [signInType, setSignInType] = useState(null);
  const [scannedQR, setScannedQR] = useState(null);


  console.log(step);

  // ...other state for form data

  // Example handlers
  const handleSplashContinue = () => setStep('mode');
  const handleModeSelect = (mode) => {setStep(mode === 'signin' ? 'scan' : 'signout')};
  const handleScan = (qr) => {
    setScannedQR(qr);
    setStep('signin-type');
  };
  const handleSignInType = (type) => {
    setSignInType(type);
    setStep(`signin-${type}`);
  };
  const handleSignInComplete = () => setStep('welcome');
  const handleSignOutComplete = () => setStep('goodbye');

  // Render logic
  if (step === 'splash') return <SplashScreen onContinue={handleSplashContinue} />;
  if (step === 'mode') return  (
      <div className="fixed inset-0 bg-white z-40 p-12 pt-10 h-screen w-screen">
        <div className="flex items-center justify-between w-full h-16">
          <img
            src="/images/angel-logo.png"
            alt="Logo"
            className="w-32 h-auto"
          />
          <XMarkIcon className="h-16 w-16 text-black stroke-[2.5] cursor-pointer" onClick={() => setStep('splash')} />
        </div>
        <div className="flex h-full w-full gap-x-10 pt-14 pb-16">
          <div className="w-1/2 flex justify-center items-center">
            <ModeSelector onSelect={handleModeSelect} />
          </div>
          <div className="w-1/2">
            <QRScannerPanel handleScan={handleScan} />
          </div>
        </div>
      </div>
  );
  if (step === 'scan') return <SignInTypeSelector onSelect={handleSignInType} setStep={setStep} />;
  if (step === 'signin-type') return <SignInTypeSelector onSelect={handleSignInType} setStep={setStep} />;
  if (step === 'signin-employee') return <SignInEmployeeForm onComplete={handleSignInComplete} setStep={setStep} />;
  if (step === 'signin-visitor') return <SignInVisitorForm onComplete={handleSignInComplete} setStep={setStep} />;
  if (step === 'signin-contractor') return <SignInContractorForm onComplete={handleSignInComplete} setStep={setStep} />;
  if (step === 'signout') return <SignOutList onComplete={handleSignOutComplete} setStep={setStep} />;
  if (step === 'welcome') return <WelcomeMessage />;
  if (step === 'goodbye') return <GoodbyeMessage />;
  return null;
}