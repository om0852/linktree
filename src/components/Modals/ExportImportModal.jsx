'use client';

import React, { useState } from 'react';
import { Copy, Check, Download } from '@/components/icons';
import { Modal, ModalButton, Field, inputClass, RoundIconButton } from '@/components/ui';

export default function ExportImportModal({ profile, onImportProfile, onClose }) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const jsonString = JSON.stringify(profile, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.username || 'treeinbio'}-profile-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyImport = (e) => {
    e.preventDefault();
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.title || !Array.isArray(parsed.links)) {
        setImportError('Invalid format: Config must include at least "title" and an array of "links".');
        return;
      }
      onImportProfile(parsed);
      setImportSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setImportError('Invalid JSON format. Please verify and paste valid JSON syntax.');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Export / Import"
      width="md"
      footer={
        <>
          <ModalButton variant="secondary" className="w-[50%]" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton type="submit" form="tb-import-form" variant="primary" className="w-[50%]" disabled={!importText.trim()}>
            Import
          </ModalButton>
        </>
      }
    >
      <div className="flex flex-col gap-[15px]">
        <div className="flex flex-col gap-[5px]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-black">Export</span>
            <div className="flex items-center gap-[4px]">
              <RoundIconButton
                icon={copied ? Check : Copy}
                title={copied ? 'Copied' : 'Copy'}
                tone="brand"
                iconClassName={copied ? 'text-[#16A34A]' : ''}
                onClick={handleCopy}
              />
              <RoundIconButton icon={Download} title="Download" tone="brand" onClick={handleDownload} />
            </div>
          </div>
          <textarea
            readOnly
            value={jsonString}
            rows={5}
            className={`${inputClass} resize-none select-all font-mono text-[11px]`}
          />
        </div>

        <form id="tb-import-form" onSubmit={handleApplyImport} className="flex flex-col gap-[10px] border-t-[0.5px] border-[#EBEBEB] pt-[15px]">
          <Field label="Import">
            <textarea
              placeholder="Paste exported JSON"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={4}
              className={`${inputClass} resize-none font-mono text-[11px]`}
            />
          </Field>

          {importError && (
            <div role="alert" className="rounded-[5px] border-[0.5px] border-[#FF4359] bg-[#FF43591A] px-[10px] py-[8px] text-[12px] text-[#FF4359]">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="rounded-[5px] border-[0.5px] border-[#16A34A] bg-[#E8F7EE] px-[10px] py-[8px] text-[12px] text-[#16A34A]">
              Profile imported. Loading...
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}
