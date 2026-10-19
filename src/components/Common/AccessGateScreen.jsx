'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  EyeOff
} from 'lucide-react';

export default function AccessGateScreen({ accessGate, profileTitle, onUnlock }) {
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const gateType = accessGate?.type || 'sensitive'; // 'passcode' | 'age_18' | 'sensitive'
  const targetPasscode = accessGate?.passcode || '';

  const handleVerifyPasscode = (e) => {
    e.preventDefault();
    if (!enteredPasscode.trim()) {
      setErrorMsg('Please enter the profile passcode.');
      return;
    }

    if (enteredPasscode.trim() === targetPasscode.trim()) {
      setErrorMsg('');
      setIsUnlocked(true);
      setTimeout(() => onUnlock(), 400);
    } else {
      setErrorMsg('Incorrect passcode. Please try again.');
    }
  };

  const handleConfirmAgeOrSensitive = () => {
    setIsUnlocked(true);
    setTimeout(() => onUnlock(), 300);
  };

  return (
    <div className="min-h-[550px] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#FFFEFA] border border-[#CAD8CE] p-6 sm:p-7 shadow-xl text-center flex flex-col items-center gap-4 animate-fadeIn">
        {/* Security Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-[#52796F]/10 border border-[#52796F]/20 flex items-center justify-center text-[#52796F] shadow-xs">
          {gateType === 'passcode' ? (
            <KeyRound className="w-8 h-8 text-[#52796F]" />
          ) : gateType === 'age_18' ? (
            <span className="font-sans font-black text-2xl text-[#52796F]">18+</span>
          ) : (
            <ShieldAlert className="w-8 h-8 text-[#52796F]" />
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="font-sans font-extrabold text-lg sm:text-xl text-[#28352F]">
            {accessGate?.title || (
              gateType === 'passcode' 
                ? 'Passcode Protected Profile' 
                : gateType === 'age_18' 
                ? 'Age Verification Required' 
                : 'Sensitive Content Notice'
            )}
          </h2>
          <p className="text-xs sm:text-sm text-[#5C6B64] mt-1.5 leading-relaxed">
            {accessGate?.description || (
              gateType === 'passcode'
                ? `Enter the creator passcode to unlock @${profileTitle}'s bio.`
                : gateType === 'age_18'
                ? 'This profile contains content intended strictly for audiences aged 18 and older.'
                : 'The creator has flagged this profile as containing sensitive or restricted content.'
            )}
          </p>
        </div>

        {/* Form: Passcode Mode */}
        {gateType === 'passcode' ? (
          <form onSubmit={handleVerifyPasscode} className="w-full space-y-3 pt-1">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="relative">
              <input
                type="password"
                required
                placeholder="Enter profile passcode..."
                value={enteredPasscode}
                onChange={(e) => {
                  setEnteredPasscode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#CAD8CE] text-sm text-[#28352F] text-center font-mono placeholder-[#5C6B64]/50 focus:outline-none focus:border-[#52796F] focus:ring-2 focus:ring-[#52796F]/15 transition-all shadow-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#52796F] hover:bg-[#3D5C54] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Unlock Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          /* Confirmation: Age 18+ / Sensitive Mode */
          <div className="w-full space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleConfirmAgeOrSensitive}
              className="w-full py-2.5 rounded-xl bg-[#52796F] hover:bg-[#3D5C54] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {gateType === 'age_18' ? 'I am 18 or older • Continue' : 'I Understand • Continue'}
              </span>
            </button>
            <p className="text-[10px] text-[#5C6B64]">
              By continuing you acknowledge and accept the creator&apos;s content disclosure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
