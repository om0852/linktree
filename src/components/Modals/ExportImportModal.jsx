'use client';

import React, { useState } from 'react';
import { FileCode, X, Copy, Check, Upload, Download, AlertTriangle } from 'lucide-react';

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
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-lg w-full relative border-[0.5px] border-line bg-white shadow-modal rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-ink-500 hover:text-ink-700 hover:bg-surface-2 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 border-b-[0.5px] border-line pb-4">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[14px] font-sans font-semibold text-ink-700">Production Profile Sync</h3>
            <p className="text-xs text-ink-500">Export or import full profile schema JSON</p>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-700 uppercase tracking-wider">Current Config JSON</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="text-[11px] font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="text-[11px] font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={jsonString}
            rows={5}
            className="tb-input font-mono text-[11px] text-ink-700 select-all"
          />
        </div>

        {/* Import Section */}
        <form onSubmit={handleApplyImport} className="mt-5 space-y-3 pt-4 border-t-[0.5px] border-line">
          <div className="flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-semibold text-ink-700 uppercase tracking-wider">Import Config JSON</span>
          </div>

          <textarea
            placeholder='Paste exported JSON here to load a custom creator profile...'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
            className="tb-input font-mono text-[11px]"
          />

          {importError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-xs text-brand-500 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Profile imported successfully! Loading...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!importText.trim()}
            className="w-full py-2.5 rounded-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs disabled:opacity-40 transition-all cursor-pointer"
          >
            Apply Imported Profile Configuration
          </button>
        </form>
      </div>
    </div>
  );
}
