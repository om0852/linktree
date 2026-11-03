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
} from '@/components/icons';

export default function AccessGateScreen({ accessGate, profileTitle, onUnlock, username }) {
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const gateType = accessGate?.type || 'sensitive'; // 'passcode' | 'age_18' | 'sensitive'
  const handleVerifyPasscode = async (e) => {
    e.preventDefault();
    if (!enteredPasscode.trim()) {
      setErrorMsg('Please enter the profile passcode.');
      return;
    }

    try {
      const response = await fetch('/api/profile/access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passcode: enteredPasscode }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Incorrect passcode.');
      setErrorMsg('');
      setIsUnlocked(true);
      setTimeout(() => onUnlock(result.profile), 400);
    } catch (error) {
      setErrorMsg(error.message || 'Incorrect passcode. Please try again.');
    }
  };

  const handleConfirmAgeOrSensitive = () => {
    setIsUnlocked(true);
    setTimeout(() => onUnlock(), 300);
  };

  return (
    <div className="min-h-[550px] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white border-[0.5px] border-line p-6 sm:p-7 shadow-modal text-center flex flex-col items-center gap-4 animate-fadeIn">
        {/* Security Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 ">
          {gateType === 'passcode' ? (
            <KeyRound className="w-8 h-8 text-brand-500" />
          ) : gateType === 'age_18' ? (
            <span className="font-sans font-semibold text-2xl text-brand-500">18+</span>
          ) : (
            <ShieldAlert className="w-8 h-8 text-brand-500" />
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-[16px] font-sans font-semibold text-ink-700">
            {accessGate?.title || (
              gateType === 'passcode' 
                ? 'Passcode Protected Profile' 
                : gateType === 'age_18' 
                ? 'Age Verification Required' 
                : 'Sensitive Content Notice'
            )}
          </h2>
          <p className="text-xs sm:text-sm text-ink-500 mt-1.5 leading-relaxed">
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
                className="w-full px-4 py-2.5 rounded-xl bg-white border-[0.5px] border-line text-sm text-ink-700 text-center font-mono placeholder-ink-500/50 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all "
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
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
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {gateType === 'age_18' ? 'I am 18 or older • Continue' : 'I Understand • Continue'}
              </span>
            </button>
            <p className="text-[10px] text-ink-500">
              By continuing you acknowledge and accept the creator&apos;s content disclosure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
