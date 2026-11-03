'use client';

import React, { useState, useEffect } from 'react';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { Toolbar, InfoChip, SearchPill, RoundIconButton, KpiCard, KpiGrid, EmptyState, PrimaryPill, SkeletonRows, Modal, ModalButton, Field, inputClass, table } from '@/components/ui';
import { Calendar, Clock, AlertCircle, CheckCircle2, RefreshCw, Trash2 } from '@/components/icons';

const STATUS_STYLE = {
  confirmed: 'bg-[#EAF7EE] text-[#16A34A]',
  pending: 'bg-[#FFF8E1] text-[#92400E]',
  rescheduled: 'bg-[#F0F0F0] text-[#333333]',
  completed: 'bg-[#F0F0F0] text-[#333333]',
  cancelled: 'bg-[#FFEDEF] text-[#FF4359]',
};

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
  const [updatingId, setUpdatingId] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [linkDraft, setLinkDraft] = useState({ booking: null, url: '' });

  const username = currentProfile?.username || authUser?.username || '';

  const fetchBookings = async () => {
    if (!username) return;
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
    if (!username) return undefined;
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

  // Confirm a request or attach the meeting link (PATCH /api/bookings/[id]).
  const handleUpdateBooking = async (id, patch) => {
    setUpdatingId(id);
    setBookingError('');
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not update the booking.');
      setBookings((prev) => prev.map((b) => (b._id === id ? data.booking : b)));
      return true;
    } catch (err) {
      setBookingError(err.message);
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveMeetingLink = async (e) => {
    e.preventDefault();
    if (!linkDraft.booking) return;
    const ok = await handleUpdateBooking(linkDraft.booking._id, { meetingUrl: linkDraft.url.trim() });
    if (ok) setLinkDraft({ booking: null, url: '' });
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

  const today = new Date().toISOString().slice(0, 10);
  const upcomingCount = bookings.filter((b) => b.date >= today && b.status !== 'cancelled').length;
  const statusCount = (status) => bookings.filter((b) => (b.status || 'pending') === status).length;

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

      <div className="lg:pl-[280px] h-screen overflow-hidden flex flex-col">

        {/* Main Workspace */}
        <main style={{ height: 'calc(100vh - 20px)' }} className="mt-[10px] mx-[10px] lg:ml-0 min-w-0 rounded-[10px] bg-white p-[15px] flex flex-col overflow-hidden">
        <AtelierHeader
          title="Bookings"
          mobileOpen={mobileOpen}
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
        <div className="customScrollBar mt-[15px] min-h-0 flex-1 overflow-y-auto pr-[6px] -mr-[9px] flex flex-col gap-[15px]">
        <Toolbar
          left={<InfoChip>{filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}</InfoChip>}
          right={
            <>
              <SearchPill value={searchQuery} onChange={setSearchQuery} placeholder="Search bookings" />
              <RoundIconButton icon={RefreshCw} title="Refresh" onClick={fetchBookings} iconClassName={loading ? 'animate-spin' : ''} />
            </>
          }
        />

        {bookingError && (
          <div className="flex items-center justify-between gap-[8px] rounded-[5px] border-[0.5px] border-[#FFC2CA] bg-[#FFEDEF] px-[12px] py-[8px] text-[11px] text-[#FF4359]">
            <span>{bookingError}</span>
            <button type="button" onClick={() => setBookingError('')} className="text-[#808080] hover:text-black">Dismiss</button>
          </div>
        )}

        <Modal
          open={Boolean(linkDraft.booking)}
          onClose={() => setLinkDraft({ booking: null, url: '' })}
          title="Add Meeting Link"
          footer={
            <>
              <ModalButton variant="secondary" className="w-[50%]" onClick={() => setLinkDraft({ booking: null, url: '' })}>Cancel</ModalButton>
              <ModalButton type="submit" form="meeting-link-form" className="w-[50%]" disabled={!linkDraft.url.trim() || updatingId === linkDraft.booking?._id}>
                Save
              </ModalButton>
            </>
          }
        >
          <form id="meeting-link-form" onSubmit={handleSaveMeetingLink} className="flex flex-col gap-[10px]">
            {linkDraft.booking && (
              <p className="text-[12px] text-[#808080]">{linkDraft.booking.clientName} · {linkDraft.booking.date} {linkDraft.booking.timeSlot}</p>
            )}
            <Field label="Meeting URL" hint="Shared with the attendee. Must start with https://">
              <input
                type="url"
                required
                autoFocus
                placeholder="https://meet.google.com/..."
                value={linkDraft.url}
                onChange={(e) => setLinkDraft((d) => ({ ...d, url: e.target.value }))}
                className={inputClass}
              />
            </Field>
          </form>
        </Modal>

        <KpiGrid>
          <KpiCard icon={Calendar} value={bookings.length} label="Bookings" />
          <KpiCard icon={Clock} value={upcomingCount} label="Upcoming" />
          <KpiCard icon={AlertCircle} value={statusCount('pending')} label="Pending" />
          <KpiCard icon={CheckCircle2} value={statusCount('confirmed')} label="Confirmed" />
        </KpiGrid>

        {loading && username && bookings.length === 0 ? (
          <div className={table.wrapper}><SkeletonRows rows={6} /></div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            action={username && <PrimaryPill as="a" href={`/${username}`} target="_blank" rel="noreferrer">Open Bio</PrimaryPill>}
          >
            Meetings booked from your bio page appear here.
          </EmptyState>
        ) : filteredBookings.length === 0 ? (
          <p className="mt-[15px] text-center text-[12px]">No results found. Please adjust your search.</p>
        ) : (
          <div className={table.wrapper}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Attendee</th>
                  <th className={table.th}>Date</th>
                  <th className={table.th}>Topic</th>
                  <th className={table.th}>Meeting</th>
                  <th className={table.th}>Status</th>
                  <th className={`${table.th} w-[50px]`} />
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b._id} className={table.row}>
                    <td className={table.td}>
                      <div className="flex items-center gap-[10px]">
                        <span className="flex size-[25px] shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-[11px] uppercase">
                          {(b.clientName || 'G').charAt(0)}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[180px] truncate" title={b.clientName}>{b.clientName}</span>
                          <span className="block max-w-[180px] truncate text-[10px] text-[#808080]" title={b.clientEmail}>{b.clientEmail}</span>
                        </span>
                      </div>
                    </td>
                    <td className={`${table.td} whitespace-nowrap`}>
                      <span className="block">{b.date}</span>
                      <span className="block text-[10px] text-[#808080]">{b.timeSlot} · {b.durationMinutes || 30} min</span>
                    </td>
                    <td className={table.td}>
                      {b.topic ? <span className="block max-w-[220px] truncate" title={b.topic}>{b.topic}</span> : <span className="text-[#AAAAAA]">—</span>}
                    </td>
                    <td className={`${table.td} whitespace-nowrap`}>
                      {b.meetingUrl ? (
                        <span className="flex items-center gap-[10px]">
                          <a href={b.meetingUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#16A34A] hover:underline">Join</a>
                          <button type="button" onClick={() => handleCopyLink(b.meetingUrl, b._id)} className="text-[12px] text-[#808080] hover:text-[#333333]">
                            {copiedId === b._id ? 'Copied' : 'Copy link'}
                          </button>
                        </span>
                      ) : b.status === 'cancelled' ? <span className="text-[#AAAAAA]">—</span> : (
                        <button type="button" onClick={() => setLinkDraft({ booking: b, url: '' })} className="text-[12px] text-[#16A34A] hover:underline">
                          Add link
                        </button>
                      )}
                    </td>
                    <td className={`${table.td} whitespace-nowrap`}>
                      <span className={`rounded-[4px] px-[6px] py-[2px] text-[10px] font-medium capitalize ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>
                        {b.status || 'pending'}
                      </span>
                      {(b.status || 'pending') === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBooking(b._id, { status: 'confirmed' })}
                          disabled={updatingId === b._id}
                          className="ml-[8px] text-[12px] text-[#16A34A] hover:underline disabled:opacity-50"
                        >
                          {updatingId === b._id ? 'Saving...' : 'Confirm'}
                        </button>
                      )}
                    </td>
                    <td className={table.td}>
                      <RoundIconButton
                        icon={Trash2}
                        tone="danger"
                        title="Cancel booking"
                        onClick={() => handleCancelBooking(b._id)}
                        disabled={cancellingId === b._id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
