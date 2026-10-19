'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Lock
} from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+?[0-9\s\-().]{7,20})$/;

export default function LeadCaptureModal({ profile, onClose, onLeadSubmitted }) {
  const config = profile?.leadCapture || {
    enabled: true,
    title: "Let's Connect",
    subtitle: "Drop your contact info to get in touch directly",
    buttonText: "Exchange Contact",
    fields: {
      name: { enabled: true, required: true, label: 'Full Name' },
      phone: { enabled: true, required: true, label: 'Phone Number' },
      email: { enabled: true, required: true, label: 'Email Address' },
      company: { enabled: false, required: false, label: 'Company / Brand' },
      note: { enabled: true, required: false, label: 'Message / Project Details' },
    },
    syncToGoogleContacts: true,
    successMessage: "Thank you! Your contact details have been sent.",
  };

  const fields = config.fields || {
    name: { enabled: true, required: true, label: 'Full Name' },
    phone: { enabled: true, required: true, label: 'Phone Number' },
    email: { enabled: true, required: true, label: 'Email Address' },
    company: { enabled: false, required: false, label: 'Company / Brand' },
    note: { enabled: true, required: false, label: 'Message / Project Details' },
  };

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    isWhatsApp: true,
    email: '',
    company: '',
    note: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validateField = (name, value) => {
    let err = null;
    const val = (value || '').trim();

    if (name === 'fullName' && fields.name?.enabled && fields.name?.required) {
      if (val.length < 2) err = 'Please enter your full name (at least 2 characters).';
    }

    if (name === 'phone' && fields.phone?.enabled) {
      if (fields.phone?.required && !val) {
        err = 'Contact / Phone number is required.';
      } else if (val && !PHONE_REGEX.test(val)) {
        err = 'Please enter a valid phone number (at least 7 digits, e.g. +1 555-0199).';
      }
    }

    if (name === 'email' && fields.email?.enabled) {
      if (fields.email?.required && !val) {
        err = 'Email address is required.';
      } else if (val && !EMAIL_REGEX.test(val)) {
        err = 'Please enter a valid email address (e.g. name@example.com).';
      }
    }

    if (name === 'company' && fields.company?.enabled && fields.company?.required && !val) {
      err = 'Company name is required.';
    }

    if (name === 'note' && fields.note?.enabled && fields.note?.required && !val) {
      err = 'Please leave a brief note or message.';
    }

    return err;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run complete validation
    const newErrors = {};
    if (fields.name?.enabled) {
      const err = validateField('fullName', formData.fullName);
      if (err) newErrors.fullName = err;
    }
    if (fields.phone?.enabled) {
      const err = validateField('phone', formData.phone);
      if (err) newErrors.phone = err;
    }
    if (fields.email?.enabled) {
      const err = validateField('email', formData.email);
      if (err) newErrors.email = err;
    }
    if (fields.company?.enabled) {
      const err = validateField('company', formData.company);
      if (err) newErrors.company = err;
    }
    if (fields.note?.enabled) {
      const err = validateField('note', formData.note);
      if (err) newErrors.note = err;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUsername: profile.username,
          ...formData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas not supported
        }

        if (onLeadSubmitted) {
          onLeadSubmitted(data.lead);
        }

        setTimeout(() => {
          onClose();
        }, 3200);
      } else {
        setServerError(data.error || 'Failed to submit contact information.');
      }
    } catch (err) {
      console.error('Lead submission error:', err);
      setServerError('Network error while sending contact details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content p-6 sm:p-7 max-w-md w-full relative border border-[#CAD8CE] bg-[#FFFEFA] shadow-xl rounded-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          /* Success Screen */
          <div className="text-center py-6 space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/30 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-[#52796F]" />
            </div>
            <h3 className="font-sans text-xl font-bold text-[#28352F]">Contact Info Sent!</h3>
            <p className="text-xs text-[#5C6B64] max-w-xs mx-auto leading-relaxed">
              {config.successMessage || 'Thank you! Your details have been delivered to @' + profile.username + '.'}
            </p>
            {config.syncToGoogleContacts && (
              <p className="text-[11px] font-mono text-[#52796F] flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#52796F]" /> Synced to Gmail Contacts
              </p>
            )}
          </div>
        ) : (
          /* Form Screen */
          <div>
            {/* Header with Creator Avatar */}
            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#E0DCD3]">
              <div className="w-12 h-12 rounded-full p-0.5 border border-[#CAD8CE] shrink-0 shadow-xs">
                <img
                  src={
                    profile?.avatar && typeof profile.avatar === 'string' && profile.avatar.trim() !== ''
                      ? profile.avatar.trim()
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || profile?.title || 'Creator')}&background=52796F&color=FFFEFA&bold=true&size=256`
                  }
                  alt={profile?.title || profile?.name || 'Creator'}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || profile?.title || 'Creator')}&background=52796F&color=FFFEFA&bold=true&size=256`;
                  }}
                />
              </div>
              <div className="flex-1 pr-4">
                <h3 className="font-sans text-base font-semibold text-[#28352F] leading-tight">
                  {config.title || "Let's Connect"}
                </h3>
                <p className="text-xs text-[#5C6B64] mt-0.5 line-clamp-2">
                  {config.subtitle || `Drop your contact details to reach ${profile.name || profile.title}`}
                </p>
              </div>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="p-3 rounded-lg mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              {fields.name?.enabled && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1.5">
                      <User className="w-3 h-3 text-[#52796F]" />
                      {fields.name.label || 'Full Name'}
                    </label>
                    {fields.name.required && (
                      <span className="text-[10px] text-amber-700 font-mono">*required</span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    required={fields.name.required}
                    className={`tb-input w-full text-xs ${errors.fullName ? 'border-rose-400 focus:border-rose-500' : ''}`}
                  />
                  {errors.fullName && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.fullName}</p>
                  )}
                </div>
              )}

              {/* Phone Number */}
              {fields.phone?.enabled && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#52796F]" />
                      {(fields.phone.label && !fields.phone.label.toLowerCase().includes('contact') && !fields.phone.label.toLowerCase().includes('whatsapp')) ? fields.phone.label : 'Phone Number'}
                    </label>
                    {fields.phone.required && (
                      <span className="text-[10px] text-amber-700 font-mono">*required</span>
                    )}
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +1 (555) 234-5678"
                    required={fields.phone.required}
                    className={`tb-input w-full text-xs font-mono ${errors.phone ? 'border-rose-400 focus:border-rose-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.phone}</p>
                  )}
                  <label className="flex items-center gap-2 mt-2 text-xs text-[#5C6B64] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="isWhatsApp"
                      checked={Boolean(formData.isWhatsApp)}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isWhatsApp: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded border-[#CAD8CE] text-[#52796F] focus:ring-[#52796F] accent-[#52796F]"
                    />
                    <span className="text-[#28352F] text-[11px] font-medium">
                      This provided number is also available on WhatsApp
                    </span>
                  </label>
                </div>
              )}

              {/* Email Address */}
              {fields.email?.enabled && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-[#52796F]" />
                      {fields.email.label || 'Email Address'}
                    </label>
                    {fields.email.required && (
                      <span className="text-[10px] text-amber-700 font-mono">*required</span>
                    )}
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. john@company.com"
                    required={fields.email.required}
                    className={`tb-input w-full text-xs ${errors.email ? 'border-rose-400 focus:border-rose-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.email}</p>
                  )}
                </div>
              )}

              {/* Company / Brand (Optional) */}
              {fields.company?.enabled && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-[#52796F]" />
                      {fields.company.label || 'Company / Brand'}
                    </label>
                    {fields.company.required && (
                      <span className="text-[10px] text-amber-700 font-mono">*required</span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. Acme Studio / Google"
                    required={fields.company.required}
                    className="tb-input w-full text-xs"
                  />
                </div>
              )}

              {/* Message / Note */}
              {fields.note?.enabled && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#28352F] flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-[#52796F]" />
                      {fields.note.label || 'Message / Reason for Contact'}
                    </label>
                    {fields.note.required && (
                      <span className="text-[10px] text-amber-700 font-mono">*required</span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="e.g. Interested in sponsorship, collaboration, or booking..."
                    required={fields.note.required}
                    className="tb-input tb-textarea w-full text-xs"
                  />
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="tb-btn tb-btn-primary w-full py-2.5 justify-center text-xs font-semibold rounded-sm shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> {config.buttonText || 'Exchange Contact'}
                    </>
                  )}
                </button>
              </div>

              {/* Privacy Notice */}
              <p className="text-[10px] text-[#5C6B64] text-center flex items-center justify-center gap-1">
                <Lock className="w-2.5 h-2.5 text-[#52796F]" /> Your information is privately shared with @{profile.username}
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
