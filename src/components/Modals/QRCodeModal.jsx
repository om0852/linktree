'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Download, Copy, Check } from '@/components/icons';

export default function QRCodeModal({ profile, onClose }) {
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const targetUrl = typeof window !== 'undefined' ? `${window.location.origin}/#${profile.username || profile.id}` : 'https://treeinbio.app';

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error(err));
  }, [targetUrl]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `${profile.username || 'treeinbio'}-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-sm w-full text-center relative border-[0.5px] border-line bg-white shadow-modal rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-ink-500 hover:text-ink-700 hover:bg-surface-2 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-[14px] font-sans font-semibold text-ink-700">Direct Scan QR Code</h3>
        <p className="text-xs text-ink-500 mt-0.5">Share with in-person audiences, print on merch or business cards</p>

        {/* QR Canvas Box */}
        <div className="my-5 p-4 rounded-xl bg-white inline-block mx-auto border-2 border-line">
          {qrUrl && typeof qrUrl === 'string' && qrUrl.trim() !== '' ? (
            <img src={qrUrl} alt="Bio QR Code" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-ink-500">
              Generating...
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={handleDownload}
            className="w-full py-2.5 rounded-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download High-Res PNG
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-sm bg-surface-2 border-[0.5px] border-line hover:bg-surface-3 text-ink-700 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-brand-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Profile Link Copied!' : 'Copy Bio URL'}
          </button>
        </div>
      </div>
    </div>
  );
}
