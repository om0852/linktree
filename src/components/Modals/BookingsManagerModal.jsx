'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  Search, 
  X, 
  User, 
  Mail, 
  Phone, 
  ExternalLink, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw,
  CalendarCheck2,
  CheckCircle2
} from 'lucide-react';

export default function BookingsManagerModal({ profile, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    if (!profile?.username) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings?creator=${profile.username}`);
      const data = await res.json();
      if (data.success && data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to load creator bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!profile?.username) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/bookings?creator=${profile.username}`);
        const data = await res.json();
        if (!ignore && data.success && data.bookings) {
          setBookings(data.bookings);
        }
      } catch (err) {
        console.error('Failed to load creator bookings:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [profile?.username]);

  const handleCopy = (url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this scheduled meeting?')) return;
    try {
      setCancellingId(id);
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.filter(b => b._id !== id));
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    return (
      b.clientName?.toLowerCase().includes(q) ||
      b.clientEmail?.toLowerCase().includes(q) ||
      b.date?.includes(q) ||
      b.topic?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#00000A73] backdrop-blur-[5px] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-white border-[0.5px] border-line shadow-modal overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-[0.5px] border-line flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-sans font-semibold text-ink-700">Scheduled Meetings &amp; Consultations</h3>
              <p className="text-xs text-ink-500">
                Manage upcoming 1:1 sessions booked via @{profile?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              className="p-2 rounded-sm bg-surface-2 hover:bg-surface-3 text-ink-700 border-[0.5px] border-line transition-all cursor-pointer"
              title="Refresh Bookings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-ink-500 hover:text-ink-700 hover:bg-surface-3 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b-[0.5px] border-line flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by attendee name, email, topic, or date..."
              className="tb-input text-xs w-full pl-9"
            />
          </div>
          <span className="text-xs text-ink-500 font-mono shrink-0">
            {filtered.length} appointment{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Bookings List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-ink-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
              Loading your scheduled meetings...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-ink-500 text-xs space-y-2">
              <Calendar className="w-10 h-10 text-line mx-auto" />
              <p className="font-semibold text-ink-700">No scheduled meetings found</p>
              <p className="text-[11px] text-ink-500">
                When visitors or clients schedule a time slot on your profile, it will appear here.
              </p>
            </div>
          ) : (
            filtered.map((b) => (
              <div 
                key={b._id}
                className="p-4 rounded-xl bg-surface-2 border-[0.5px] border-line hover:border-brand-500 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center font-semibold text-xs shrink-0">
                      {b.clientName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-[12px] font-semibold text-ink-700">{b.clientName}</h4>
                      <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-2">
                        <span>{b.clientEmail}</span>
                        {b.clientPhone && <span>• {b.clientPhone}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-sm text-[10px] font-semibold bg-brand-500/10 text-brand-500 border border-brand-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-brand-500" /> Confirmed
                    </span>
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      disabled={cancellingId === b._id}
                      className="p-1.5 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition-colors cursor-pointer"
                      title="Cancel Booking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Date & Time Badge */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-700 bg-white p-2.5 rounded-lg border-[0.5px] border-line">
                  <span className="flex items-center gap-1 font-semibold text-ink-700">
                    <Calendar className="w-3.5 h-3.5 text-brand-500" /> {b.date}
                  </span>
                  <span className="text-line">•</span>
                  <span className="flex items-center gap-1 font-semibold text-brand-500">
                    <Clock className="w-3.5 h-3.5 text-brand-500" /> {b.timeSlot} ({b.durationMinutes}m)
                  </span>
                  {b.topic && (
                    <>
                      <span className="text-line">•</span>
                      <span className="text-ink-500 truncate max-w-xs italic">
                        &ldquo;{b.topic}&rdquo;
                      </span>
                    </>
                  )}
                </div>

                {/* Video Link */}
                {b.meetingUrl && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-500 text-[11px]">Room:</span>
                    <a
                      href={b.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:underline flex items-center gap-1 truncate max-w-sm font-mono text-[11px]"
                    >
                      <Video className="w-3 h-3 text-brand-500 shrink-0" />
                      <span className="truncate">{b.meetingUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(b.meetingUrl, b._id)}
                      className="ml-auto text-[10px] font-semibold text-ink-700 hover:bg-surface-3 px-2 py-1 rounded-sm bg-white border-[0.5px] border-line flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedId === b._id ? <Check className="w-3 h-3 text-brand-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === b._id ? 'Copied' : 'Copy Room'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
