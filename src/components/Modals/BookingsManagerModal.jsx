'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Copy, Check } from '@/components/icons';
import Modal from '@/components/ui/Modal';
import { SearchPill, RoundIconButton, InfoChip, EmptyState, SkeletonRows, table } from '@/components/ui/patterns';

const STATUS_PILL = {
  confirmed: 'bg-[#E8F7EE] text-[#16A34A]',
  pending: 'bg-[#FFF8E1] text-[#92400E]',
  rescheduled: 'bg-[#F8F8F9] text-[#333333]',
  cancelled: 'bg-[#FF43591A] text-[#FF4359]',
};

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
    <Modal
      onClose={onClose}
      title="Bookings"
      width="xl"
      headerExtra={<InfoChip>@{profile?.username}</InfoChip>}
    >
      <div className="flex flex-wrap items-center justify-between gap-[10px] border-b-[0.5px] border-[#DCDCDC] pb-[15px]">
        <SearchPill value={search} onChange={setSearch} placeholder="Search bookings" className="w-[260px] max-w-full" />
        <div className="flex items-center gap-[10px]">
          <InfoChip>
            {filtered.length} booking{filtered.length === 1 ? '' : 's'}
          </InfoChip>
          <RoundIconButton icon={RefreshCw} title="Refresh" onClick={fetchBookings} iconClassName={loading ? 'animate-spin' : ''} />
        </div>
      </div>

      <div className="mt-[15px]">
        {loading ? (
          <SkeletonRows rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No bookings yet">Booked time slots appear here.</EmptyState>
        ) : (
          <div className={table.wrapper}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Attendee</th>
                  <th className={table.th}>Date</th>
                  <th className={table.th}>Time</th>
                  <th className={table.th}>Topic</th>
                  <th className={table.th}>Room</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id} className={table.row}>
                    <td className={table.td}>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{b.clientName}</span>
                        <span className="truncate text-[10px] text-[#808080]">
                          {b.clientEmail}
                          {b.clientPhone && ` · ${b.clientPhone}`}
                        </span>
                      </div>
                    </td>
                    <td className={`${table.td} whitespace-nowrap`}>{b.date}</td>
                    <td className={`${table.td} whitespace-nowrap`}>
                      {b.timeSlot} ({b.durationMinutes}m)
                    </td>
                    <td className={table.td}>
                      <span className="line-clamp-2 max-w-[160px]" title={b.topic}>{b.topic || '-'}</span>
                    </td>
                    <td className={table.td}>
                      {b.meetingUrl ? (
                        <div className="flex items-center gap-[4px]">
                          <a
                            href={b.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="max-w-[140px] truncate text-[#16A34A] hover:underline"
                            title={b.meetingUrl}
                          >
                            {b.meetingUrl}
                          </a>
                          <RoundIconButton
                            icon={copiedId === b._id ? Check : Copy}
                            title={copiedId === b._id ? 'Copied' : 'Copy link'}
                            tone="brand"
                            onClick={() => handleCopy(b.meetingUrl, b._id)}
                          />
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={table.td}>
                      {b.status && (
                        <span className={`whitespace-nowrap rounded-[4px] px-[6px] py-[2px] text-[10px] font-medium capitalize ${STATUS_PILL[b.status] || STATUS_PILL.rescheduled}`}>
                          {b.status}
                        </span>
                      )}
                    </td>
                    <td className={table.td}>
                      <RoundIconButton
                        icon={Trash2}
                        title="Cancel booking"
                        tone="danger"
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
    </Modal>
  );
}
