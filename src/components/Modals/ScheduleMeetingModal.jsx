'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check } from '@/components/icons';
import Modal, { ModalButton, Field, inputClass } from '@/components/ui/Modal';
import { PillTab } from '@/components/ui/patterns';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate formatted time slots between start and end hours
function generateSlots(startHourStr = '09:00', endHourStr = '17:00', intervalMins = 30) {
  const [startH, startM] = (startHourStr || '09:00').split(':').map(Number);
  const [endH, endM] = (endHourStr || '17:00').split(':').map(Number);

  let startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  const slots = [];

  while (startMinutes + intervalMins <= endMinutes) {
    const h = Math.floor(startMinutes / 60);
    const m = startMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m.toString().padStart(2, '0');
    slots.push(`${displayH}:${displayM} ${ampm}`);
    startMinutes += intervalMins;
  }

  return slots;
}

export default function ScheduleMeetingModal({ profile, onClose, onBookingSuccess }) {
  const meetingConfig = profile?.scheduleMeeting || {};
  const duration = meetingConfig.durationMinutes || 30;
  const price = meetingConfig.price || 'Free';
  const platform = meetingConfig.platform || 'google_meet';
  const rawDays = meetingConfig.availableDays;
  const allowedDays = useMemo(() => rawDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], [rawDays]);

  // Generate 14 upcoming calendar days
  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = DAYS_OF_WEEK[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      const isAvailableDay = allowedDays.includes(dayName);
      dates.push({
        dateObj: d,
        dateStr,
        dayName,
        dayNumber: d.getDate(),
        monthName: d.toLocaleString('default', { month: 'short' }),
        isAvailableDay,
      });
    }
    return dates;
  }, [allowedDays]);

  // Find first available day
  const defaultDate = upcomingDates.find(d => d.isAvailableDay)?.dateStr || upcomingDates[0]?.dateStr;
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('');

  // Flow states
  const [step, setStep] = useState(1); // 1: Pick Date & Slot, 2: Attendee Info, 3: Confirmed
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const allSlots = useMemo(() => {
    return generateSlots(
      meetingConfig.startHour || '09:00',
      meetingConfig.endHour || '17:00',
      meetingConfig.slotIntervalMinutes || 30
    );
  }, [meetingConfig.startHour, meetingConfig.endHour, meetingConfig.slotIntervalMinutes]);

  // Fetch booked slots for the selected date
  useEffect(() => {
    if (!profile?.username || !selectedDate) return;
    let cancelled = false;
    async function fetchBooked() {
      try {
        setLoadingSlots(true);
        const res = await fetch(`/api/bookings?creator=${profile.username}&date=${selectedDate}`);
        const data = await res.json();
        if (!cancelled && data.success && data.bookings) {
          setBookedSlots(data.bookings.map(b => b.timeSlot));
        } else if (!cancelled) {
          setBookedSlots([]);
        }
      } catch (err) {
        console.error('Failed to load booked slots:', err);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    fetchBooked();
    return () => { cancelled = true; };
  }, [profile?.username, selectedDate]);

  const handleNextToInfo = () => {
    if (!selectedDate || !selectedSlot) {
      setErrorMsg('Please select a date and an available time slot.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full name and email address are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        creatorUsername: profile.username,
        clientName: fullName.trim(),
        clientEmail: email.trim(),
        clientPhone: phone.trim(),
        topic: topic.trim() || meetingConfig.title || '1:1 Video Consultation',
        date: selectedDate,
        timeSlot: selectedSlot,
        durationMinutes: duration,
        price,
        platform,
        timezone: meetingConfig.timezone || 'UTC',
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.booking) {
        setConfirmedBooking(data.booking);
        setStep(3);
        if (onBookingSuccess) onBookingSuccess(data.booking);
      } else {
        setErrorMsg(data.error || 'Failed to send booking request. Please try another slot.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!confirmedBooking?.meetingUrl) return;
    navigator.clipboard.writeText(confirmedBooking.meetingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Google Calendar Web Intent Link
  const googleCalendarUrl = useMemo(() => {
    if (!confirmedBooking) return '#';
    const title = encodeURIComponent(`${meetingConfig.title || '1:1 Call'} with ${profile.name || profile.title}`);
    const details = encodeURIComponent(
      `TreeInBio Scheduled Call\nHost: ${profile.name || profile.title}\nGuest: ${confirmedBooking.clientName}\nMeeting Link: ${confirmedBooking.meetingUrl}\nTopic: ${confirmedBooking.topic}`
    );
    const location = encodeURIComponent(confirmedBooking.meetingUrl || 'Google Meet');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  }, [confirmedBooking, meetingConfig.title, profile.name, profile.title]);

  const linkButton = 'flex h-[34px] flex-1 items-center justify-center rounded-[5px] border-[0.5px] text-[12px] font-medium';

  let footer = null;
  if (step === 1) {
    footer = (
      <>
        <ModalButton variant="secondary" className="w-[50%]" onClick={onClose}>Cancel</ModalButton>
        <ModalButton className="w-[50%]" onClick={handleNextToInfo} disabled={!selectedSlot}>
          {selectedSlot ? `Continue with ${selectedSlot}` : 'Continue'}
        </ModalButton>
      </>
    );
  } else if (step === 2) {
    footer = (
      <>
        <ModalButton variant="secondary" className="w-[50%]" onClick={() => setStep(1)}>Back</ModalButton>
        <ModalButton type="submit" form="schedule-meeting-form" className="w-[50%]" disabled={submitting}>
          {submitting ? 'Sending...' : 'Request Booking'}
        </ModalButton>
      </>
    );
  } else if (step === 3 && confirmedBooking) {
    footer = (
      <>
        <ModalButton variant="secondary" className="flex-1" onClick={onClose}>Done</ModalButton>
        {confirmedBooking.status === 'confirmed' && confirmedBooking.meetingUrl && (
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkButton} border-black bg-black text-white hover:bg-[#222222]`}
          >
            Add to Calendar
          </a>
        )}
        {confirmedBooking.status === 'confirmed' && confirmedBooking.meetingUrl && confirmedBooking.meetingUrl.startsWith('http') && (
          <a
            href={confirmedBooking.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkButton} border-[#16A34A] bg-[#16A34A] text-white hover:bg-[#15803D]`}
          >
            Join Meeting
          </a>
        )}
      </>
    );
  }

  return (
    <Modal
      onClose={onClose}
      title={meetingConfig.title || 'Book a Call'}
      headerExtra={
        <span className="shrink-0 rounded-[4px] bg-[#F8F8F9] px-[6px] py-[2px] text-[10px] capitalize text-[#333333]">
          {price} · {duration} min · {platform.replace('_', ' ')}
        </span>
      }
      width="md"
      footer={footer}
      bodyClassName="flex flex-col gap-[15px]"
    >
      {errorMsg && (
        <div className="rounded-[5px] border-[0.5px] border-[#FFC2CA] bg-[#FFEDEF] px-[12px] py-[8px] text-[11px] text-[#FF4359]">
          {errorMsg}
        </div>
      )}

      {step === 1 && (
        <>
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-black">Date</span>
              <span className="text-[10px] text-[#808080]">Next 14 days</span>
            </div>
            <div className="grid grid-cols-4 gap-[8px] sm:grid-cols-7">
              {upcomingDates.map((item) => {
                const isSelected = selectedDate === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    disabled={!item.isAvailableDay}
                    onClick={() => {
                      setSelectedDate(item.dateStr);
                      setSelectedSlot('');
                    }}
                    className={`flex flex-col items-center justify-center rounded-[5px] border-[0.5px] py-[6px] text-center disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? 'border-[#000] bg-[#F8F8F9BF] text-black'
                        : 'border-[#DCDCDC] bg-white text-[#333333] hover:bg-[#F8F8F9BF]'
                    }`}
                  >
                    <span className="text-[9px] text-[#808080]">{item.dayName}</span>
                    <span className="text-[14px] font-medium">{item.dayNumber}</span>
                    <span className="text-[9px] text-[#808080]">{item.monthName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-black">Time</span>
              <span className="text-[10px] text-[#808080]">
                {loadingSlots ? 'Checking...' : `${allSlots.length - bookedSlots.length} open`}
              </span>
            </div>
            {allSlots.length === 0 ? (
              <p className="py-[15px] text-center text-[12px] text-[#808080]">No hours set for this day.</p>
            ) : (
              <div className="customScrollBar grid max-h-[192px] grid-cols-3 gap-[8px] overflow-y-auto pr-[4px] sm:grid-cols-4">
                {allSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <PillTab
                      key={slot}
                      active={isSelected}
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className="justify-center disabled:cursor-not-allowed disabled:line-through disabled:opacity-40"
                    >
                      {slot}
                    </PillTab>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {step === 2 && (
        <form id="schedule-meeting-form" onSubmit={handleConfirmBooking} className="flex flex-col gap-[15px]">
          <div className="flex items-center justify-between rounded-[5px] border-[0.5px] border-[#DCDCDC] bg-[#FAFAFA] px-[10px] py-[8px]">
            <div className="flex flex-col">
              <span className="text-[12px] font-medium text-black">{selectedDate}</span>
              <span className="text-[10px] text-[#808080]">{selectedSlot} ({duration} min)</span>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-[12px] text-[#16A34A] hover:underline">
              Change
            </button>
          </div>

          <Field label="Name">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sarah Connor"
              className={inputClass}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@production.com"
              className={inputClass}
            />
          </Field>

          <Field label="Phone (optional)">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (555) 019-2831"
              className={inputClass}
            />
          </Field>

          <Field label="Topic">
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What would you like to discuss?"
              className={`${inputClass} resize-none`}
            />
          </Field>
        </form>
      )}

      {step === 3 && confirmedBooking && (
        <div className="flex flex-col gap-[15px]">
          <div className="text-center">
            <p className="text-[14px] font-semibold text-black">Request Sent</p>
            <p className="mt-[4px] text-[12px] text-[#808080]">@{profile.username} needs to confirm this time.</p>
          </div>

          <div className="flex flex-col rounded-[10px] border-[0.5px] border-[#dcdcdc] px-[12px]">
            <div className="flex items-center justify-between border-b-[0.5px] border-[#F0F0F0] py-[8px]">
              <span className="text-[#808080]">Date &amp; Time</span>
              <span className="font-medium">{confirmedBooking.date} at {confirmedBooking.timeSlot}</span>
            </div>
            <div className="flex items-center justify-between border-b-[0.5px] border-[#F0F0F0] py-[8px]">
              <span className="text-[#808080]">Guest</span>
              <span className="font-medium">{confirmedBooking.clientName}</span>
            </div>
            <div className={`flex items-center justify-between py-[8px] ${confirmedBooking.meetingUrl ? 'border-b-[0.5px] border-[#F0F0F0]' : ''}`}>
              <span className="text-[#808080]">Duration &amp; Fee</span>
              <span className="font-medium">{confirmedBooking.durationMinutes} min · {confirmedBooking.price}</span>
            </div>
            {confirmedBooking.meetingUrl && (
              <div className="flex items-center justify-between gap-[10px] py-[8px]">
                <span className="shrink-0 text-[#808080]">Meeting</span>
                <span className="flex min-w-0 items-center gap-[6px]">
                  <span className="truncate font-medium" title={confirmedBooking.meetingUrl}>{confirmedBooking.meetingUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title={copiedLink ? 'Copied' : 'Copy link'}
                    aria-label="Copy meeting link"
                    className="shrink-0 text-[#808080] hover:text-[#333333]"
                  >
                    {copiedLink ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
