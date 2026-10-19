'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  ChevronRight, 
  ExternalLink, 
  User, 
  Mail, 
  Phone, 
  FileText,
  Copy,
  Check,
  CalendarCheck
} from 'lucide-react';

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
        setErrorMsg(data.error || 'Failed to confirm booking. Please try another slot.');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-lg w-full rounded-2xl bg-[#FFFEFA] border border-[#CAD8CE] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#28352F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E0DCD3] flex items-center justify-between bg-[#F5F3ED]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#52796F]/10 border border-[#52796F]/20 flex items-center justify-center text-[#52796F] shrink-0">
              <Calendar className="w-5 h-5 text-[#52796F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-base font-bold text-[#28352F] leading-tight">
                  {meetingConfig.title || "Book a 1:1 Consultation"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8EFEA] text-[#28352F] border border-[#CAD8CE]">
                  {price}
                </span>
              </div>
              <p className="text-xs text-[#5C6B64] mt-1 flex items-center gap-2 font-medium">
                <span className="flex items-center gap-1 text-[#5C6B64]">
                  <Clock className="w-3.5 h-3.5 text-[#52796F]" /> {duration} Mins
                </span>
                <span className="text-[#CAD8CE]">•</span>
                <span className="flex items-center gap-1 capitalize text-[#5C6B64]">
                  <Video className="w-3.5 h-3.5 text-[#52796F]" /> {platform.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#EAE7DE] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-4 h-4 text-[#5C6B64]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Date & Time Slot Picker */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#28352F] flex items-center justify-between mb-2">
                  <span className="text-[#28352F]">1. Select Date</span>
                  <span className="text-[11px] text-[#5C6B64] font-normal">Next 14 Days</span>
                </label>

                {/* Horizontal Date Slider */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
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
                        className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#52796F] text-white font-bold shadow-sm scale-102'
                            : item.isAvailableDay
                            ? 'bg-[#F5F3ED] hover:bg-[#EAE7DE] text-[#28352F] border border-[#CAD8CE]'
                            : 'bg-[#F5F3ED]/40 text-[#5C6B64]/50 border border-[#E0DCD3] cursor-not-allowed opacity-50'
                        }`}
                      >
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-white' : 'text-[#5C6B64]'}`}>{item.dayName}</span>
                        <span className={`text-base font-extrabold my-0.5 ${isSelected ? 'text-white' : 'text-[#28352F]'}`}>{item.dayNumber}</span>
                        <span className={`text-[9px] font-medium ${isSelected ? 'text-white/80' : 'text-[#5C6B64]'}`}>{item.monthName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Section */}
              <div>
                <label className="text-xs font-bold text-[#28352F] flex items-center justify-between mb-2">
                  <span className="text-[#28352F]">2. Pick Available Free Time</span>
                  <span className="text-[11px] text-[#5C6B64] font-normal">
                    {loadingSlots ? 'Checking calendar...' : `${allSlots.length - bookedSlots.length} slots open`}
                  </span>
                </label>

                {allSlots.length === 0 ? (
                  <p className="text-xs text-[#5C6B64] py-4 text-center">No hours configured for this day.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {allSlots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = selectedSlot === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#52796F] text-white font-bold shadow-sm'
                              : isBooked
                              ? 'bg-[#F5F3ED]/40 text-[#5C6B64]/40 border border-[#E0DCD3] line-through cursor-not-allowed'
                              : 'bg-[#F5F3ED] hover:bg-[#EAE7DE] text-[#28352F] border border-[#CAD8CE]'
                          }`}
                        >
                          <Clock className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-[#52796F]'}`} />
                          <span className={isSelected ? 'text-white' : 'text-[#28352F]'}>{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={handleNextToInfo}
                disabled={!selectedSlot}
                className={`w-full py-2.5 rounded-sm font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                  selectedSlot
                    ? 'bg-[#52796F] hover:bg-[#3D5C54] text-white shadow-sm'
                    : 'bg-[#F5F3ED] text-[#5C6B64] border border-[#CAD8CE] cursor-not-allowed'
                }`}
              >
                <span>Continue with {selectedSlot || 'Selected Time'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Attendee Details Form */}
          {step === 2 && (
            <form onSubmit={handleConfirmBooking} className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-between text-xs text-[#28352F]">
                <div>
                  <span className="font-bold text-[#28352F] block text-sm">{selectedDate}</span>
                  <span className="text-[#5C6B64] font-medium">{selectedSlot} ({duration} mins)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#52796F] underline hover:text-[#3D5C54] cursor-pointer font-bold"
                >
                  Change Time
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-[#52796F]" /> Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="tb-input text-xs w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3 text-[#52796F]" /> Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@production.com"
                  className="tb-input text-xs w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3 text-[#52796F]" /> Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2831"
                  className="tb-input text-xs w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3 text-[#52796F]" /> Meeting Goal or Topic
                </label>
                <textarea
                  rows={2}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Discuss script read-through, brand campaign, or podcast interview..."
                  className="tb-input text-xs w-full resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-sm bg-[#F5F3ED] hover:bg-[#EAE7DE] text-[#28352F] border border-[#CAD8CE] font-semibold text-xs cursor-pointer transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 rounded-sm bg-[#52796F] hover:bg-[#3D5C54] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {submitting ? (
                    <span>Booking Call...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      <span>Confirm &amp; Book Meeting</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Booking Confirmation Screen */}
          {step === 3 && confirmedBooking && (
            <div className="py-2 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#52796F]/10 border border-[#52796F]/30 flex items-center justify-center mx-auto text-[#52796F] shadow-sm">
                <CheckCircle2 className="w-7 h-7 text-[#52796F]" />
              </div>

              <div>
                <h4 className="font-sans text-lg font-bold text-[#28352F]">Meeting Confirmed!</h4>
                <p className="text-xs text-[#5C6B64] mt-1">
                  A calendar invite and direct link have been generated for you and @{profile.username}.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] text-left space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E0DCD3] pb-2">
                  <span className="text-[11px] text-[#5C6B64]">Date &amp; Time</span>
                  <span className="text-xs font-bold text-[#28352F]">
                    {confirmedBooking.date} at {confirmedBooking.timeSlot}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E0DCD3] pb-2">
                  <span className="text-[11px] text-[#5C6B64]">Guest</span>
                  <span className="text-xs font-bold text-[#28352F]">{confirmedBooking.clientName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E0DCD3] pb-2">
                  <span className="text-[11px] text-[#5C6B64]">Duration &amp; Fee</span>
                  <span className="text-xs font-semibold text-[#52796F]">
                    {confirmedBooking.durationMinutes} mins • {confirmedBooking.price}
                  </span>
                </div>

                {/* Meeting Link Box */}
                <div className="pt-1">
                  <span className="text-[11px] text-[#5C6B64] block mb-1">Encrypted Video Room:</span>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FFFEFA] border border-[#CAD8CE]">
                    <Video className="w-4 h-4 text-[#52796F] shrink-0" />
                    <span className="text-xs text-[#28352F] font-mono truncate flex-1">
                      {confirmedBooking.meetingUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2 py-1 rounded-sm bg-[#F5F3ED] hover:bg-[#EAE7DE] text-[#28352F] border border-[#CAD8CE] text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-[#52796F]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-sm bg-[#28352F] hover:bg-[#1E2723] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Add to Google Calendar</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                {confirmedBooking.meetingUrl && confirmedBooking.meetingUrl.startsWith('http') && (
                  <a
                    href={confirmedBooking.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-sm bg-[#52796F] hover:bg-[#3D5C54] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Video Meeting Now</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 rounded-sm text-[#5C6B64] hover:text-[#28352F] text-xs font-medium cursor-pointer transition-colors"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
