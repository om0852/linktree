'use client';

import React, { useState } from 'react';
import { Loader2 } from '@/components/icons';
import Modal, { ModalButton, Field, inputClass } from '@/components/ui/Modal';

export default function LeadMagnetGateModal({ 
  isOpen, 
  onClose, 
  link, 
  creatorUsername,
  onUnlocked
}) {
  const [email, setEmail] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [unlockedData, setUnlockedData] = useState(null);

  if (!isOpen || !link) return null;

  const leadMagnet = link.leadMagnet || {};
  const assetType = leadMagnet.assetType || 'pdf';

  const getAssetBadge = () => {
    switch (assetType) {
      case 'notion': return 'Notion Template';
      case 'preset': return 'Lightroom Preset';
      case 'pdf': return 'PDF Guide / E-Book';
      default: return 'Free Creator Asset';
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (leadMagnet.requireWhatsApp && !whatsApp.trim()) {
      setError('Please provide your WhatsApp / Phone number to receive updates.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/lead-magnet/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: creatorUsername,
          linkId: link.id,
          email: email.trim(),
          whatsApp: whatsApp.trim(),
          name: name.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlock download');
      }

      setUnlockedData(data);
      if (onUnlocked) onUnlocked(link.id, data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pill = (text) => (
    <span className="shrink-0 rounded-[4px] bg-[#E8F7EE] px-[6px] py-[2px] text-[10px] font-medium text-[#16A34A]">{text}</span>
  );

  if (unlockedData) {
    return (
      <Modal
        onClose={onClose}
        title={unlockedData.assetTitle}
        headerExtra={pill('Unlocked')}
        footer={
          <>
            <ModalButton variant="secondary" className="w-[50%]" onClick={onClose}>
              Done
            </ModalButton>
            <a
              href={unlockedData.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex h-[34px] w-[50%] items-center justify-center rounded-[5px] border-[0.5px] border-[#16A34A] bg-[#16A34A] text-[12px] font-medium text-white hover:bg-[#15803D]"
            >
              Download
            </a>
          </>
        }
      >
        <p className="text-[#333333]">Your download is ready.</p>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      title={link.title || 'Unlock Resource'}
      headerExtra={pill(getAssetBadge())}
      footer={
        <>
          <ModalButton variant="secondary" className="w-[50%]" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton type="submit" form="lead-magnet-unlock-form" variant="primary" className="w-[50%] gap-[6px]" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Unlocking...</span>
              </>
            ) : (
              'Unlock Download'
            )}
          </ModalButton>
        </>
      }
    >
      {leadMagnet.previewText && <p className="mb-[15px] leading-[1.6] text-[#333333]">{leadMagnet.previewText}</p>}

      {error && (
        <div className="mb-[15px] rounded-[5px] bg-[#FF43591A] px-[10px] py-[8px] text-[12px] text-[#FF4359]">{error}</div>
      )}

      <form id="lead-magnet-unlock-form" onSubmit={handleUnlock} className="flex flex-col gap-[15px]">
        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </Field>

        <Field label="Email *">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>

        {leadMagnet.requireWhatsApp && (
          <Field label="WhatsApp / Phone *">
            <input
              type="tel"
              required
              value={whatsApp}
              onChange={(e) => setWhatsApp(e.target.value)}
              placeholder="+1 (555) 019-2834"
              className={inputClass}
            />
          </Field>
        )}

        <p className="text-center text-[10px] text-[#808080]">Zero spam. Unsubscribe at any time with 1-click.</p>
      </form>
    </Modal>
  );
}
