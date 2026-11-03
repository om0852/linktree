'use client';

import React, { useState } from 'react';
import { Modal, ModalButton, Field, inputClass, PillTab } from '@/components/ui';

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
    <Modal
      open
      onClose={onClose}
      title={tipped ? 'Pledge Recorded' : profile.widgets?.tipJarTitle || 'Support Creator'}
      width="sm"
      footer={
        tipped ? null : (
          <>
            <ModalButton variant="secondary" className="w-[50%]" onClick={onClose}>
              Cancel
            </ModalButton>
            <ModalButton type="submit" form="tb-tip-form" variant="primary" className="w-[50%]">
              Record ${customAmount ? customAmount : selectedAmount} Pledge
            </ModalButton>
          </>
        )
      }
    >
      {tipped ? (
        <p className="py-[10px] text-center text-[12px] text-[#333333]">
          No payment was processed. Contact <span className="font-medium text-black">{profile.title}</span> to arrange support.
        </p>
      ) : (
        <form id="tb-tip-form" onSubmit={handleSendTip} className="flex flex-col gap-[15px]">
          <div className="grid grid-cols-4 gap-[10px]">
            {[2, 5, 10, 25].map((amt) => (
              <PillTab
                key={amt}
                active={selectedAmount === amt && !customAmount}
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount('');
                }}
                className="justify-center"
              >
                ${amt}
              </PillTab>
            ))}
          </div>

          <Field label="Custom Amount ($)">
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 50"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Your Name (optional)">
            <input
              type="text"
              placeholder="e.g. Fellow Creator"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Message">
            <textarea
              rows={2}
              placeholder="Love your work, keep inspiring!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </Field>

          {errorMessage && <p role="alert" className="text-[12px] text-[#FF4359]">{errorMessage}</p>}
        </form>
      )}
    </Modal>
  );
}
