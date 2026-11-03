'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal, ModalButton } from '@/components/ui';

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
    <Modal
      open
      onClose={onClose}
      title="QR Code"
      width="sm"
      footer={
        <>
          <ModalButton variant="secondary" className="w-[50%]" onClick={handleCopyLink}>
            {copied ? 'Link Copied' : 'Copy Link'}
          </ModalButton>
          <ModalButton variant="primary" className="w-[50%]" onClick={handleDownload}>
            Download PNG
          </ModalButton>
        </>
      }
    >
      <div className="flex justify-center">
        <div className="rounded-[10px] border-[0.5px] border-[#dcdcdc] p-[15px]">
          {qrUrl && typeof qrUrl === 'string' && qrUrl.trim() !== '' ? (
            <img src={qrUrl} alt="Bio QR Code" className="size-[192px]" />
          ) : (
            <div className="flex size-[192px] items-center justify-center text-[12px] text-[#808080]">Generating...</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
