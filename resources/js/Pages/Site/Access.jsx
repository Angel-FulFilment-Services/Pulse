import React, { useState, useEffect } from 'react';
import SplashScreen from '../../Components/Site/SplashScreen';
import ModeSelector from '../../Components/Site/ModeSelector';
import QRScannerPanel from '../../Components/Site/QRScannerPanel';
import SignInTypeSelector from '../../Components/Site/SignInTypeSelector';
import SignInEmployeeForm from '../../Components/Site/SignInEmployeeForm';
import SignInVisitorForm from '../../Components/Site/SignInVisitorForm';
import SignInContractorForm from '../../Components/Site/SignInContractorForm';
import UpdateProfilePhoto from '../../Components/Site/UpdateProfilePhoto';
import SignOutList from '../../Components/Site/SignOutList';
import WelcomeMessage from '../../Components/Site/WelcomeMessage';
import GoodbyeMessage from '../../Components/Site/GoodbyeMessage';
import ThankYouMessage from '../../Components/Site/ThankYouMessage';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Access({ location }) {
  const [step, setStep] = useState('splash');
  const [userId, setUserId] = useState(null); // Stores the user ID after sign-in
  const [signInType, setSignInType] = useState(null); // Tracks the type of sign in (employee, visitor, contractor)
  const [signOutType, setSignOutType] = useState(null); // Tracks the type of sign out (employee, visitor, contractor)

  useEffect(() => {
    setUserId(null);
  }, [step])

  // Example handlers
  const handleSplashContinue = () => setStep('mode');
  const handleSignInType = (type) => {
    setSignInType(type);
    setStep(`signin-${type}`);
  }
  const handleSignOutType = (type) => {
    setSignOutType(type);
    setStep('signout');
  }
  const handleSignInComplete = async (userId) => {
    setUserId(userId); // Store userId for later use
    if (signInType === 'employee' && userId) {
      try {
        const response = await axios.get('/onsite/has-profile-photo', {
          params: { user_id: userId },
        });

        if (response.data.has_photo) {
          setStep('welcome');
        } else {
          setStep('update-profile-photo');
        }
      } catch (err) {
        setStep('welcome');
      }
    } else {
      setStep('welcome'); // Proceed directly to welcome for non-employee types
    }
  };
  const handleSignOutComplete = () => setStep('goodbye');

  // Render logic
  if (step === 'splash') return <SplashScreen onContinue={handleSplashContinue} />;
  if (step === 'mode') return  (
      <div className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 h-screen w-screen">
        <div className="flex items-center justify-between w-full h-10">
          <img
            src="/images/angel-logo.png"
            alt="Logo"
            className="w-28 h-auto"
          />
          <XMarkIcon className="h-10 w-10 text-black dark:text-dark-100 stroke-[2.5] cursor-pointer" onClick={() => setStep('splash')} />
        </div>
        <div className="flex h-full w-full gap-x-10 pt-14 pb-16">
          <div className="w-1/2 flex justify-center items-center">
            <ModeSelector setStep={setStep} location={location} />
          </div>
          <div className="w-1/2">
            <QRScannerPanel onComplete={(userId) => { setSignInType('employee'); handleSignInComplete(userId); }} setStep={setStep} location={location} />
          </div>
        </div>
      </div>
  );
  if (step === 'signin-type') return <SignInTypeSelector onSelect={handleSignInType} setStep={setStep} location={location} />;
  if (step === 'signout-type') return <SignInTypeSelector onSelect={handleSignOutType} setStep={setStep} location={location} />;
  if (step === 'signin-employee') return <SignInEmployeeForm onComplete={handleSignInComplete} setStep={setStep} location={location} />;
  if (step === 'signin-visitor') return <SignInVisitorForm onComplete={handleSignInComplete} setStep={setStep} location={location} />;
  if (step === 'signin-contractor') return <SignInContractorForm onComplete={handleSignInComplete} setStep={setStep} location={location} />;
  if (step === 'update-profile-photo') {
    return (
      <div className="fixed inset-0 bg-white dark:bg-dark-900 z-40 p-12 pt-10 h-screen w-full">
        <UpdateProfilePhoto onComplete={() => setStep('welcome')} userId={userId} />
      </div>
    );
  }
  if (step === 'signout') return <SignOutList onComplete={handleSignOutComplete} setStep={setStep} signOutType={signOutType} />;
  if (step === 'welcome') return <WelcomeMessage setStep={setStep} />;
  if (step === 'goodbye') return <GoodbyeMessage setStep={setStep} />;
  if (step === 'thank-you') return <ThankYouMessage setStep={setStep} />;
  return null;
}