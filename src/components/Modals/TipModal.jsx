'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, X, Check, Coffee, DollarSign } from 'lucide-react';

export default function TipModal({ profile, onClose }) {
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [tipped, setTipped] = useState(false);

  const handleSendTip = async (e) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) return;

    try {
      await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          amount: finalAmount,
          senderName: senderName || 'Generous Supporter',
          message: message || '',
        }),
      });
    } catch (err) {
      console.error('Failed to record tip:', err);
    }

    // Trigger celebratory confetti cannon
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981']
    });

    setTipped(true);
    setTimeout(() => {
      onClose();
    }, 2800);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-md w-full relative border border-[#CAD8CE] bg-[#FFFEFA] shadow-2xl rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {tipped ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/30 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8 text-[#52796F]" />
            </div>
            <h3 className="font-sans text-xl font-bold text-[#28352F]">Thank You for Supporting!</h3>
            <p className="text-sm text-[#5C6B64]">
              Your contribution goes directly to supporting <span className="font-bold text-[#28352F]">{profile.title}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendTip} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#52796F]/10 border border-[#52796F]/20 flex items-center justify-center text-[#52796F]">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans text-base font-semibold text-[#28352F]">
                  {profile.widgets?.tipJarTitle || 'Support Creator'}
                </h3>
                <p className="text-xs text-[#5C6B64]">Send direct fan appreciation</p>
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
                  className={`py-2 rounded-lg text-sm font-bold transition-all cursor-pointer border ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-[#52796F] text-white border-[#52796F] shadow-sm'
                      : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-[#EAE7DE]'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="text-[11px] font-semibold text-[#28352F]">Or Custom Amount ($)</label>
              <div className="relative mt-1">
                <DollarSign className="w-4 h-4 text-[#5C6B64] absolute left-3 top-2.5" />
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
              <label className="text-[11px] font-semibold text-[#28352F]">Your Name (optional)</label>
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
              <label className="text-[11px] font-semibold text-[#28352F]">Cheer Message</label>
              <textarea
                rows={2}
                placeholder="Love your work, keep inspiring!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="tb-input tb-textarea mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-sm bg-[#52796F] hover:bg-[#3D5C54] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" /> Send $
              {customAmount ? customAmount : selectedAmount} Tip with Confetti ✨
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
