'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Download, Copy, Check } from 'lucide-react';

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
      <div className="modal-content p-6 max-w-sm w-full text-center relative border border-[#CAD8CE] bg-[#FFFEFA] shadow-2xl rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/20 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="font-sans text-base font-semibold text-[#28352F]">Direct Scan QR Code</h3>
        <p className="text-xs text-[#5C6B64] mt-0.5">Share with in-person audiences, print on merch or business cards</p>

        {/* QR Canvas Box */}
        <div className="my-5 p-4 rounded-xl bg-white shadow-md inline-block mx-auto border-2 border-[#CAD8CE]">
          {qrUrl && typeof qrUrl === 'string' && qrUrl.trim() !== '' ? (
            <img src={qrUrl} alt="Bio QR Code" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-[#5C6B64]">
              Generating...
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={handleDownload}
            className="w-full py-2.5 rounded-sm bg-[#52796F] hover:bg-[#3D5C54] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download High-Res PNG
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-sm bg-[#F5F3ED] border border-[#CAD8CE] hover:bg-[#EAE7DE] text-[#28352F] font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#52796F]" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Profile Link Copied!' : 'Copy Bio URL'}
          </button>
        </div>
      </div>
    </div>
  );
}
