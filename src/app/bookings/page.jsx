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

  const username = authUser?.username || currentProfile?.username || '';

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
    <div className="min-h-screen bg-[#FFFEFA] text-[#28352F]">
      <AtelierSidebar 
        mobileOpen={mobileOpen} 
        onToggleMobile={() => setMobileOpen(!mobileOpen)} 
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AtelierHeader
          currentProfile={currentProfile}
          authUser={authUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setShowAuthModal(true);
          }}
          onLogout={handleLogout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {/* Main Workspace */}
        <main className="flex-1 pt-16 sm:pt-20 px-5 sm:px-8 lg:px-10 pb-12 w-full max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
        {/* Page Title & Metrics */}
        <div className="bg-[#F5F3ED] border border-[#CAD8CE]/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shadow-xs shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-sans font-bold text-lg sm:text-xl text-[#28352F] tracking-tight">
                  Bookings &amp; 1:1 Consultations
                </h1>
                {username && (
                  <span className="px-2 py-0.5 bg-[#CAD8CE]/70 text-[#28352F] font-mono text-xs font-semibold rounded">
                    @{username}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5C6B64] mt-0.5 leading-normal">
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
              className={loading ? 'animate-spin text-[#52796F]' : ''}
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
          <div className="p-3.5 sm:p-4 bg-white border border-[#CAD8CE]/80 rounded-xl shadow-xs flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">Total Appointments</span>
            <span className="font-sans font-bold text-xl sm:text-2xl text-[#28352F] tracking-tight">{bookings.length}</span>
            <span className="font-mono text-xs text-[#52796F]">Confirmed Slots</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border border-[#CAD8CE]/80 rounded-xl shadow-xs flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">Google Meet Rooms</span>
            <span className="font-sans font-bold text-xl sm:text-2xl text-[#28352F] tracking-tight">{bookings.filter(b => b.meetingPlatform === 'google_meet').length}</span>
            <span className="font-mono text-xs text-[#52796F]">Encrypted HD Video</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border border-[#CAD8CE]/80 rounded-xl shadow-xs flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">Free Time Utilization</span>
            <span className="font-sans font-bold text-xl sm:text-2xl text-[#28352F] tracking-tight">100%</span>
            <span className="font-mono text-xs text-[#52796F]">Zero Double-Bookings</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border border-[#CAD8CE]/80 rounded-xl shadow-xs flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">Google Calendar Sync</span>
            <span className="font-sans font-bold text-xl sm:text-2xl text-[#52796F] tracking-tight">Active</span>
            <span className="font-mono text-xs text-[#5C6B64]">2-Way Conflict Block</span>
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
          <span className="font-mono text-xs text-[#5C6B64]">
            {filteredBookings.length} {filteredBookings.length === 1 ? 'appointment' : 'appointments'}
          </span>
        </div>

        {/* Bookings List */}
        {loading && bookings.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#52796F]" />
            <p className="text-xs font-mono text-[#5C6B64]">Loading appointments...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-[#CAD8CE]/80 rounded-xl p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3.5 shadow-xs my-1">
            <div className="w-12 h-12 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-sans font-semibold text-base text-[#28352F]">No Scheduled Meetings Yet</h3>
              <p className="text-xs text-[#5C6B64] leading-normal">
                When visitors open your public bio {username ? <>at <span className="font-mono text-[#52796F]">/{username}</span></> : ''} and select an available time slot, their appointment will appear here with an auto-generated video room link.
              </p>
            </div>
            {username && (
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#52796F] text-white text-xs font-medium rounded-lg hover:bg-[#3D5C54] transition-all shadow-xs"
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
                className="p-3.5 bg-white border border-[#CAD8CE]/80 rounded flex flex-col gap-2.5 hover:border-[#52796F] transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#52796F] text-white flex items-center justify-center text-sm font-bold shadow-xs">
                      {b.clientName ? b.clientName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#28352F]">
                        {b.clientName}
                      </h4>
                      <p className="text-[0.6875rem] text-[#5C6B64] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-[#52796F]" /> {b.clientEmail}
                        </span>
                        {b.clientPhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-[#52796F]" /> {b.clientPhone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold font-mono bg-[#CAD8CE]/50 text-[#28352F] border border-[#52796F]/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#52796F]" /> Confirmed
                    </span>
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      disabled={cancellingId === b._id}
                      className="p-1 text-[#5C6B64] hover:text-rose-600 transition-colors"
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
                <div className="flex items-center gap-3 text-xs bg-[#F5F3ED] px-3 py-1.5 rounded border border-[#CAD8CE]/60 flex-wrap">
                  <span className="flex items-center gap-1 text-[#28352F] font-bold font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#52796F]" /> {b.date}
                  </span>
                  <span className="text-[#CAD8CE]">•</span>
                  <span className="flex items-center gap-1 text-[#28352F] font-bold font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#52796F]" /> {b.timeSlot} ({b.durationMinutes || 30}m)
                  </span>
                  {b.topic && (
                    <>
                      <span className="text-[#CAD8CE]">•</span>
                      <span className="text-[#5C6B64] italic truncate max-w-sm">
                        &ldquo;{b.topic}&rdquo;
                      </span>
                    </>
                  )}
                </div>

                {/* Video Meeting Room URL */}
                {b.meetingUrl && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E0DCD3]/60 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Video className="w-3.5 h-3.5 text-[#52796F]" />
                      <span className="text-[#5C6B64] font-medium text-[0.6875rem]">Room:</span>
                      <a
                        href={b.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#52796F] hover:underline font-mono text-xs font-semibold"
                      >
                        {b.meetingUrl}
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(b.meetingUrl, b._id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-[#F5F3ED] text-[#28352F] border border-[#CAD8CE] text-xs font-semibold transition-all shadow-xs"
                      >
                        {copiedId === b._id ? (
                          <>
                            <Check className="w-3 h-3 text-[#52796F]" />
                            <span className="text-[#52796F]">Copied</span>
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
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#52796F] hover:bg-[#3D5C54] text-white text-xs font-semibold shadow-xs transition-all"
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
