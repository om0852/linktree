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
} from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#28352F]/65 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-[#FFFEFA] border border-[#CAD8CE] shadow-2xl p-6 sm:p-7 text-[#28352F] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED] transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {!unlockedData ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shrink-0">
                <Lock size={22} className="text-[#52796F]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#52796F] bg-[#E8EFEA] px-2.5 py-0.5 rounded-full border border-[#CAD8CE]">
                  {getAssetBadge()}
                </span>
                <h3 className="text-lg font-bold text-[#28352F] mt-1 leading-snug">
                  {link.title || 'Lock-to-Unlock Resource'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#5C6B64] mb-5 leading-relaxed">
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
                <label className="block text-[11px] font-medium text-[#28352F] mb-1">
                  Full Name <span className="text-[#5C6B64] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#CAD8CE] rounded-xl text-[#28352F] placeholder-[#5C6B64]/50 focus:outline-none focus:border-[#52796F] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#28352F] mb-1">
                  Email Address <span className="text-[#52796F]">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6B64]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#CAD8CE] rounded-xl text-[#28352F] placeholder-[#5C6B64]/50 focus:outline-none focus:border-[#52796F] transition-all"
                  />
                </div>
              </div>

              {leadMagnet.requireWhatsApp && (
                <div>
                  <label className="block text-[11px] font-medium text-[#28352F] mb-1">
                    WhatsApp / Phone Number <span className="text-[#52796F]">*</span>
                  </label>
                  <div className="relative">
                    <Smartphone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6B64]" />
                    <input
                      type="tel"
                      required
                      value={whatsApp}
                      onChange={(e) => setWhatsApp(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#CAD8CE] rounded-xl text-[#28352F] placeholder-[#5C6B64]/50 focus:outline-none focus:border-[#52796F] transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#52796F] hover:bg-[#3D5C54] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
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

              <p className="text-[10px] text-center text-[#5C6B64] pt-1">
                🔒 Zero spam. Unsubscribe at any time with 1-click.
              </p>
            </form>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#E8EFEA] border border-[#CAD8CE] text-[#52796F] flex items-center justify-center shadow-sm">
              <CheckCircle2 size={32} />
            </div>

            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52796F] bg-[#E8EFEA] px-2.5 py-0.5 rounded-full border border-[#CAD8CE]">
              Unlocked & Ready
            </span>

            <h3 className="text-lg font-bold text-[#28352F] mt-2 mb-1">
              {unlockedData.assetTitle}
            </h3>

            <p className="text-xs text-[#5C6B64] mb-6 max-w-xs mx-auto">
              Your access link has been verified and registered. Click below to download or open your asset.
            </p>

            <div className="space-y-3">
              <a
                href={unlockedData.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full py-3 px-4 rounded-xl bg-[#52796F] hover:bg-[#3D5C54] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
              >
                <Download size={16} />
                <span>Download Asset Now</span>
                <ExternalLink size={13} className="opacity-80" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-[#5C6B64] hover:text-[#28352F] transition-colors cursor-pointer"
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
