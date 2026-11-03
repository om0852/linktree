'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal, ModalButton } from '@/components/ui';

/** QR code for a profile with share, copy and download. */
export default function QRCodeModal({ profile, onClose }) {
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [canShare] = useState(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  const username = profile.username || profile.id || '';
  // The profile lives at /<username>; the QR code must open exactly that page.
  const targetUrl = typeof window !== 'undefined' ? `${window.location.origin}/${username}` : `/${username}`;
  const displayUrl = targetUrl.replace(/^https?:\/\//, '');
  const shareText = encodeURIComponent(profile.name ? `${profile.name} on TreeInBio` : 'My TreeInBio page');
  const shareUrl = encodeURIComponent(targetUrl);
  // Share targets that work in every browser; the native share sheet is added where supported.
  const shareTargets = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${shareText}%20${shareUrl}` },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
    { name: 'Email', href: `mailto:?subject=${shareText}&body=${shareUrl}` },
  ];

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
    a.download = `${username || 'treeinbio'}-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: profile.name || username, url: targetUrl });
    } catch (err) {
      // Closing the share sheet rejects with AbortError; that is not a failure.
      if (err?.name !== 'AbortError') console.error('Share failed:', err);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Share this page"
      width="sm"
      footer={
        <>
          {canShare && (
            <ModalButton variant="secondary" className="flex-1" onClick={handleShare}>
              Share
            </ModalButton>
          )}
          <ModalButton variant="secondary" className="flex-1" onClick={handleCopyLink}>
            {copied ? 'Link copied' : 'Copy link'}
          </ModalButton>
          <ModalButton variant="primary" className="flex-1" onClick={handleDownload}>
            Download QR
          </ModalButton>
        </>
      }
    >
      <div className="flex flex-col items-center gap-[12px]">
        <div className="rounded-[10px] border-[0.5px] border-[#dcdcdc] p-[15px]">
          {qrUrl ? (
            <img src={qrUrl} alt={`QR code for ${displayUrl}`} className="size-[192px]" />
          ) : (
            <div className="flex size-[192px] items-center justify-center text-[12px] text-[#808080]">Generating...</div>
          )}
        </div>
        <span className="max-w-full truncate rounded-[50px] bg-[#F8F8F9] px-[12px] py-[5px] text-[12px] text-[#333333]">{displayUrl}</span>
        <div className="flex w-full flex-wrap justify-center gap-[6px] pt-[4px]">
          {shareTargets.map((target) => (
            <a
              key={target.name}
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[28px] items-center rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-white px-[12px] text-[11px] text-[#333333] hover:bg-[#F8F8F9]"
            >
              {target.name}
            </a>
          ))}
        </div>
      </div>
    </Modal>
  );
}
