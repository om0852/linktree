'use client';

import React, { useState } from 'react';
import { Heart, X, Check, Coffee, DollarSign } from 'lucide-react';

export default function TipModal({ profile, onClose }) {
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [tipped, setTipped] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendTip = async (e) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) return;

    try {
      const response = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          amount: finalAmount,
          senderName: senderName || 'Generous Supporter',
          message: message || '',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || result.error || 'Unable to record your pledge.');
    } catch (err) {
      console.error('Failed to record tip:', err);
      setErrorMessage(err.message || 'Unable to record your pledge.');
      return;
    }

    setTipped(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-md w-full relative border-[0.5px] border-line bg-white shadow-modal rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-ink-500 hover:text-ink-700 hover:bg-surface-2 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {tipped ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/30 flex items-center justify-center mx-auto ">
              <Check className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-[14px] font-sans font-semibold text-ink-700">Pledge Recorded</h3>
            <p className="text-sm text-ink-500">
              No payment was processed. Contact <span className="font-semibold text-ink-700">{profile.title}</span> to arrange support.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendTip} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[14px] font-sans font-semibold text-ink-700">
                  {profile.widgets?.tipJarTitle || 'Support Creator'}
                </h3>
                <p className="text-xs text-ink-500">Send direct fan appreciation</p>
              </div>
            </div>

            {/* Predefined Amounts */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[2, 5, 10, 25].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-brand-500 text-white border-brand-500 '
                      : 'bg-surface-2 text-ink-700 border-line hover:bg-surface-3'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="text-[11px] font-semibold text-ink-700">Or Custom Amount ($)</label>
              <div className="relative mt-1">
                <DollarSign className="w-4 h-4 text-ink-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 50"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="tb-input pl-8"
                />
              </div>
            </div>

            {/* Sender Name */}
            <div>
              <label className="text-[11px] font-semibold text-ink-700">Your Name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Fellow Creator"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="tb-input mt-1"
              />
            </div>

            {/* Personal Message */}
            <div>
              <label className="text-[11px] font-semibold text-ink-700">Cheer Message</label>
              <textarea
                rows={2}
                placeholder="Love your work, keep inspiring!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="tb-input tb-textarea mt-1"
              />
            </div>

            {errorMessage && <p role="alert" className="text-xs text-red-700">{errorMessage}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" /> Record $
              {customAmount ? customAmount : selectedAmount} Tip Pledge
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
