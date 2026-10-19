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
    <div className="fixed inset-0 z-50 bg-[#28352F]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-[#FFFEFA] border border-[#CAD8CE] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0DCD3] flex items-center justify-between bg-[#F5F3ED]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#52796F]/10 border border-[#52796F]/20 flex items-center justify-center text-[#52796F]">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-semibold text-[#28352F]">Scheduled Meetings &amp; Consultations</h3>
              <p className="text-xs text-[#5C6B64]">
                Manage upcoming 1:1 sessions booked via @{profile?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              className="p-2 rounded-sm bg-[#F5F3ED] hover:bg-[#EAE7DE] text-[#28352F] border border-[#CAD8CE] transition-all cursor-pointer"
              title="Refresh Bookings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#EAE7DE] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#E0DCD3] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5C6B64] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by attendee name, email, topic, or date..."
              className="tb-input text-xs w-full pl-9"
            />
          </div>
          <span className="text-xs text-[#5C6B64] font-mono shrink-0">
            {filtered.length} appointment{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Bookings List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-[#5C6B64] text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#52796F] mb-2" />
              Loading your scheduled meetings...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[#5C6B64] text-xs space-y-2">
              <Calendar className="w-10 h-10 text-[#CAD8CE] mx-auto" />
              <p className="font-bold text-[#28352F]">No scheduled meetings found</p>
              <p className="text-[11px] text-[#5C6B64]">
                When visitors or clients schedule a time slot on your profile, it will appear here.
              </p>
            </div>
          ) : (
            filtered.map((b) => (
              <div 
                key={b._id}
                className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] hover:border-[#52796F] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#52796F]/10 border border-[#52796F]/20 text-[#52796F] flex items-center justify-center font-bold text-xs shrink-0">
                      {b.clientName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#28352F] leading-tight">{b.clientName}</h4>
                      <p className="text-xs text-[#5C6B64] mt-0.5 flex items-center gap-2">
                        <span>{b.clientEmail}</span>
                        {b.clientPhone && <span>• {b.clientPhone}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-sm text-[10px] font-semibold bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#52796F]" /> Confirmed
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
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#28352F] bg-[#FFFEFA] p-2.5 rounded-lg border border-[#CAD8CE]">
                  <span className="flex items-center gap-1 font-bold text-[#28352F]">
                    <Calendar className="w-3.5 h-3.5 text-[#52796F]" /> {b.date}
                  </span>
                  <span className="text-[#CAD8CE]">•</span>
                  <span className="flex items-center gap-1 font-semibold text-[#52796F]">
                    <Clock className="w-3.5 h-3.5 text-[#52796F]" /> {b.timeSlot} ({b.durationMinutes}m)
                  </span>
                  {b.topic && (
                    <>
                      <span className="text-[#CAD8CE]">•</span>
                      <span className="text-[#5C6B64] truncate max-w-xs italic">
                        &ldquo;{b.topic}&rdquo;
                      </span>
                    </>
                  )}
                </div>

                {/* Video Link */}
                {b.meetingUrl && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5C6B64] text-[11px]">Room:</span>
                    <a
                      href={b.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#52796F] hover:underline flex items-center gap-1 truncate max-w-sm font-mono text-[11px]"
                    >
                      <Video className="w-3 h-3 text-[#52796F] shrink-0" />
                      <span className="truncate">{b.meetingUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(b.meetingUrl, b._id)}
                      className="ml-auto text-[10px] font-semibold text-[#28352F] hover:bg-[#EAE7DE] px-2 py-1 rounded-sm bg-[#FFFEFA] border border-[#CAD8CE] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedId === b._id ? <Check className="w-3 h-3 text-[#52796F]" /> : <Copy className="w-3 h-3" />}
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
