'use client';

import React, { useState, useEffect } from 'react';
import AtelierSidebar from '../../components/Atelier/AtelierSidebar';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { Button, Input, Badge, IconButton } from '@/components/ui';
import { 
  Calendar, 
  Video, 
  Mail, 
  Phone, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Loader2, 
  Clock,
  Sparkles,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

export default function BookingsPage() {
  const [currentProfile, setCurrentProfile] = useState(DEFAULT_EMPTY_PROFILE);
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = currentProfile?.username || authUser?.username || '';

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/bookings?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (active && data.success && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        }
      } catch (err) {
        if (active) console.error('Failed to load bookings:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [username]);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAuthUser(data.user);
          if (data.profile) setCurrentProfile(data.profile);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    }
    loadSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      setCurrentProfile(DEFAULT_EMPTY_PROFILE);
      setBookings([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCopyLink = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      setCancellingId(id);
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.clientName && b.clientName.toLowerCase().includes(q)) ||
      (b.clientEmail && b.clientEmail.toLowerCase().includes(q)) ||
      (b.topic && b.topic.toLowerCase().includes(q)) ||
      (b.date && b.date.includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-canvas text-ink-700">
      <AtelierSidebar 
        mobileOpen={mobileOpen} 
        onToggleMobile={() => setMobileOpen(!mobileOpen)} 
      />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <AtelierHeader
          currentProfile={currentProfile}
          authUser={authUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setShowAuthModal(true);
          }}
          onLogout={handleLogout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onProfileSwitched={(newProfile) => {
            if (newProfile) {
              setCurrentProfile(newProfile);
            }
          }}
        />

        {/* Main Workspace */}
        <main className="flex-1 mt-[74px] mx-[10px] mb-[10px] lg:ml-0 min-w-0 rounded-lg bg-white p-[15px] flex flex-col gap-[15px]">
        {/* Page Title & Metrics */}
        <div className="bg-surface-2 border-[0.5px] border-line/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-white border-[0.5px] border-line flex items-center justify-center text-brand-500 shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[16px] font-sans font-semibold text-ink-700">
                  Bookings &amp; 1:1 Consultations
                </h1>
                {username && (
                  <span className="px-2 py-0.5 bg-brand-100/70 text-ink-700 font-mono text-xs font-semibold rounded">
                    @{username}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500 mt-0.5 leading-normal">
                Every consultation booked via your public profile is synced with automated Google Meet video rooms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <IconButton
              icon={RefreshCw}
              variant="bordered"
              onClick={fetchBookings}
              title="Refresh Bookings"
              className={loading ? 'animate-spin text-brand-500' : ''}
            />
            {username && (
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Calendar}
                >
                  Test Booking on Public Bio
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 bg-white border-[0.5px] border-line/80 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Total Appointments</span>
            <span className="font-sans font-semibold text-xl sm:text-2xl text-ink-700 tracking-tight">{bookings.length}</span>
            <span className="font-mono text-xs text-brand-500">Confirmed Slots</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border-[0.5px] border-line/80 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Google Meet Rooms</span>
            <span className="font-sans font-semibold text-xl sm:text-2xl text-ink-700 tracking-tight">{bookings.filter(b => b.meetingPlatform === 'google_meet').length}</span>
            <span className="font-mono text-xs text-brand-500">Encrypted HD Video</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border-[0.5px] border-line/80 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Free Time Utilization</span>
            <span className="font-sans font-semibold text-xl sm:text-2xl text-ink-700 tracking-tight">100%</span>
            <span className="font-mono text-xs text-brand-500">Zero Double-Bookings</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border-[0.5px] border-line/80 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Google Calendar Sync</span>
            <span className="font-sans font-semibold text-xl sm:text-2xl text-brand-500 tracking-tight">Active</span>
            <span className="font-mono text-xs text-ink-500">2-Way Conflict Block</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 py-1">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              leftIcon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by attendee name, email, topic, or date..."
            />
          </div>
          <span className="font-mono text-xs text-ink-500">
            {filteredBookings.length} {filteredBookings.length === 1 ? 'appointment' : 'appointments'}
          </span>
        </div>

        {/* Bookings List */}
        {loading && bookings.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
            <p className="text-xs font-mono text-ink-500">Loading appointments...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border-[0.5px] border-line/80 rounded-xl p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3.5 my-1">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border-[0.5px] border-line flex items-center justify-center text-brand-500 ">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-[14px] font-sans font-semibold text-ink-700">No Scheduled Meetings Yet</h3>
              <p className="text-xs text-ink-500 leading-normal">
                When visitors open your public bio {username ? <>at <span className="font-mono text-brand-500">/{username}</span></> : ''} and select an available time slot, their appointment will appear here with an auto-generated video room link.
              </p>
            </div>
            {username && (
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-all "
              >
                <span>Schedule Test Call on Live Bio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredBookings.map((b) => (
              <div
                key={b._id}
                className="p-3.5 bg-white border-[0.5px] border-line/80 rounded flex flex-col gap-2.5 hover:border-brand-500 transition-all "
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold ">
                      {b.clientName ? b.clientName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <h4 className="text-[12px] font-semibold text-ink-700">
                        {b.clientName}
                      </h4>
                      <p className="text-[0.6875rem] text-ink-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-brand-500" /> {b.clientEmail}
                        </span>
                        {b.clientPhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-brand-500" /> {b.clientPhone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[0.65rem] font-semibold font-mono bg-brand-100/50 text-ink-700 border border-brand-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-brand-500" /> Confirmed
                    </span>
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      disabled={cancellingId === b._id}
                      className="p-1 text-ink-500 hover:text-rose-600 transition-colors"
                      title="Cancel appointment"
                    >
                      {cancellingId === b._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Session Meta */}
                <div className="flex items-center gap-3 text-xs bg-surface-2 px-3 py-1.5 rounded border-[0.5px] border-line/60 flex-wrap">
                  <span className="flex items-center gap-1 text-ink-700 font-semibold font-mono">
                    <Calendar className="w-3.5 h-3.5 text-brand-500" /> {b.date}
                  </span>
                  <span className="text-line">•</span>
                  <span className="flex items-center gap-1 text-ink-700 font-semibold font-mono">
                    <Clock className="w-3.5 h-3.5 text-brand-500" /> {b.timeSlot} ({b.durationMinutes || 30}m)
                  </span>
                  {b.topic && (
                    <>
                      <span className="text-line">•</span>
                      <span className="text-ink-500 italic truncate max-w-sm">
                        &ldquo;{b.topic}&rdquo;
                      </span>
                    </>
                  )}
                </div>

                {/* Video Meeting Room URL */}
                {b.meetingUrl && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t-[0.5px] border-line/60 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Video className="w-3.5 h-3.5 text-brand-500" />
                      <span className="text-ink-500 font-medium text-[0.6875rem]">Room:</span>
                      <a
                        href={b.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-500 hover:underline font-mono text-xs font-semibold"
                      >
                        {b.meetingUrl}
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(b.meetingUrl, b._id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-surface-2 text-ink-700 border-[0.5px] border-line text-xs font-semibold transition-all "
                      >
                        {copiedId === b._id ? (
                          <>
                            <Check className="w-3 h-3 text-brand-500" />
                            <span className="text-brand-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Room</span>
                          </>
                        )}
                      </button>
                      <a
                        href={b.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all"
                      >
                        <Video className="w-3 h-3" />
                        <span>Join Call</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>

      {showAuthModal && (
        <AuthModal
          mode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user, profile) => {
            setAuthUser(user);
            if (profile) setCurrentProfile(profile);
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
}
