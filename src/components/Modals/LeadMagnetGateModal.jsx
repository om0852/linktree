'use client';

import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Download, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Smartphone,
  Mail
} from '@/components/icons';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00000A73] backdrop-blur-[5px] animate-fadeIn">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white border-[0.5px] border-line shadow-modal p-6 sm:p-7 text-ink-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-ink-500 hover:text-ink-700 hover:bg-surface-2 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {!unlockedData ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-surface-2 border-[0.5px] border-line flex items-center justify-center text-brand-500 shrink-0">
                <Lock size={22} className="text-brand-500" />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-500 bg-brand-50 px-2.5 py-0.5 rounded-full border-[0.5px] border-line">
                  {getAssetBadge()}
                </span>
                <h3 className="text-[14px] font-semibold text-ink-700 mt-1 leading-snug">
                  {link.title || 'Lock-to-Unlock Resource'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-ink-500 mb-5 leading-relaxed">
              {leadMagnet.previewText || 'Enter your details below to instantly unlock and download this exclusive asset.'}
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-ink-700 mb-1">
                  Full Name <span className="text-ink-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border-[0.5px] border-line rounded-xl text-ink-700 placeholder-ink-500/50 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ink-700 mb-1">
                  Email Address <span className="text-brand-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border-[0.5px] border-line rounded-xl text-ink-700 placeholder-ink-500/50 focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              {leadMagnet.requireWhatsApp && (
                <div>
                  <label className="block text-[11px] font-medium text-ink-700 mb-1">
                    WhatsApp / Phone Number <span className="text-brand-500">*</span>
                  </label>
                  <div className="relative">
                    <Smartphone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                    <input
                      type="tel"
                      required
                      value={whatsApp}
                      onChange={(e) => setWhatsApp(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border-[0.5px] border-line rounded-xl text-ink-700 placeholder-ink-500/50 focus:outline-none focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Unlocking Resource...</span>
                  </>
                ) : (
                  <>
                    <Unlock size={16} />
                    <span>Unlock Free Download</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-ink-500 pt-1">
                🔒 Zero spam. Unsubscribe at any time with 1-click.
              </p>
            </form>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-50 border-[0.5px] border-line text-brand-500 flex items-center justify-center ">
              <CheckCircle2 size={32} />
            </div>

            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-500 bg-brand-50 px-2.5 py-0.5 rounded-full border-[0.5px] border-line">
              Unlocked & Ready
            </span>

            <h3 className="text-[14px] font-semibold text-ink-700 mt-2 mb-1">
              {unlockedData.assetTitle}
            </h3>

            <p className="text-xs text-ink-500 mb-6 max-w-xs mx-auto">
              Your access link has been verified and registered. Click below to download or open your asset.
            </p>

            <div className="space-y-3">
              <a
                href={unlockedData.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              >
                <Download size={16} />
                <span>Download Asset Now</span>
                <ExternalLink size={13} className="opacity-80" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-ink-500 hover:text-ink-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
