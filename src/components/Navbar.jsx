'use client';

import React from 'react';
import { 
  Sparkles, 
  BarChart3, 
  Eye, 
  QrCode, 
  FileCode, 
  Save, 
  Check, 
  ExternalLink, 
  Loader2, 
  Globe, 
  Users, 
  CalendarCheck2 
} from 'lucide-react';
import Link from 'next/link';

export default function Navbar({ 
  currentProfile, 
  onTogglePreviewMode, 
  isPublicMode, 
  onOpenAnalytics, 
  onShowQRModal,
  onOpenExportImport,
  onOpenCustomDomain,
  onOpenLeadsManager,
  onOpenBookingsManager,
  onSaveProfile,
  isSaving,
  isSaved
}) {
  return (
    <header className="tb-navbar">
      {/* Brand Logo & Name */}
      <div className="tb-brand">
        <div className="tb-brand-icon">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="tb-brand-title flex items-center gap-2">
            TreeInBio
          </div>
          <p className="tb-brand-sub hidden sm:block">Bio-Link &amp; Digital Presence Studio</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="tb-nav-actions">
        {/* Save & Publish Button */}
        {onSaveProfile && (
          <button
            onClick={onSaveProfile}
            disabled={isSaving}
            className={`tb-btn font-bold cursor-pointer transition-all ${
              isSaved 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
            }`}
            title="Save changes to your public bio"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span className="hidden sm:inline">Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>
        )}

        {/* Live Public URL Shortcut */}
        {currentProfile?.username && (
          <a
            href={`/${currentProfile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tb-btn tb-btn-ghost text-emerald-300 hover:text-white hidden sm:flex items-center gap-1.5"
            title="Open Live Public Bio"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">/{currentProfile.username}</span>
          </a>
        )}

        {/* Connectors Hub */}
        <Link
          href="/connectors"
          className="tb-btn tb-btn-ghost text-stone-200 hover:text-white"
          title="Connect Google Drive, Calendar, and Social Tools"
        >
          <span className="hidden sm:inline">Connectors</span>
        </Link>

        {/* Analytics Dashboard */}
        {onOpenAnalytics && (
          <button
            onClick={onOpenAnalytics}
            className="tb-btn tb-btn-ghost"
            title="View Traffic & Click Analytics"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Analytics</span>
          </button>
        )}

        {/* Custom Domains */}
        {onOpenCustomDomain && (
          <button
            onClick={onOpenCustomDomain}
            className="tb-btn tb-btn-ghost text-teal-300 hover:text-white"
            title="Manage Custom Domains"
          >
            <Globe className="w-4 h-4 text-teal-400" />
            <span className="hidden md:inline">Domains</span>
          </button>
        )}

        {/* Leads Manager */}
        {onOpenLeadsManager && (
          <button
            onClick={onOpenLeadsManager}
            className="tb-btn tb-btn-ghost text-emerald-300 hover:text-white"
            title="View Captured Contacts"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Leads</span>
          </button>
        )}

        {/* Bookings Manager */}
        {onOpenBookingsManager && (
          <button
            onClick={onOpenBookingsManager}
            className="tb-btn tb-btn-ghost text-blue-300 hover:text-white"
            title="View Scheduled Consultations"
          >
            <CalendarCheck2 className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Bookings</span>
          </button>
        )}

        {/* QR Code */}
        {onShowQRModal && (
          <button
            onClick={onShowQRModal}
            className="tb-btn tb-btn-ghost"
            title="View QR Code"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">QR Code</span>
          </button>
        )}

        {/* Public Preview Mode */}
        {onTogglePreviewMode && (
          <button
            onClick={onTogglePreviewMode}
            className={`tb-btn ${isPublicMode ? 'tb-btn-primary' : 'tb-btn-public'}`}
            title="Toggle Live Bio Preview"
          >
            <Eye className="w-4 h-4" />
            <span>{isPublicMode ? 'Exit Preview' : 'Preview'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
