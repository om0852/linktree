'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Check } from '@/components/icons';
import Modal, { ModalButton, Field, inputClass } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/patterns';

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

  const fieldClass = (hasError) => (hasError ? inputClass.replace('border-[#dcdcdc]', 'border-[#FF4359]') : inputClass);
  const fieldLabel = (text, required) => (
    <>
      {text}
      {required && <span className="text-[#FF4359]"> *</span>}
    </>
  );
  const fieldError = (msg) => msg && <span className="text-[10px] text-[#FF4359]">{msg}</span>;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || profile?.title || 'Creator')}&background=16A34A&color=FFFFFF&bold=true&size=256`;

  return (
    <Modal
      onClose={onClose}
      title={config.title || "Let's Connect"}
      width="sm"
      footer={
        isSuccess ? null : (
          <>
            <ModalButton variant="secondary" className="w-[50%]" onClick={onClose}>Cancel</ModalButton>
            <ModalButton type="submit" form="lead-capture-form" className="w-[50%]" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : config.buttonText || 'Exchange Contact'}
            </ModalButton>
          </>
        )
      }
    >
      {isSuccess ? (
        <EmptyState icon={Check} title="Contact Info Sent">
          {config.successMessage || 'Thank you! Your details have been delivered to @' + profile.username + '.'}
          {config.syncToGoogleContacts && (
            <span className="mt-[6px] block text-[10px] text-[#16A34A]">Synced to Gmail Contacts</span>
          )}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-[15px]">
          <div className="flex items-center gap-[10px]">
            <img
              src={
                profile?.avatar && typeof profile.avatar === 'string' && profile.avatar.trim() !== ''
                  ? profile.avatar.trim()
                  : fallbackAvatar
              }
              alt={profile?.title || profile?.name || 'Creator'}
              className="size-[34px] shrink-0 rounded-full border-[0.5px] border-[#DCDCDC] object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackAvatar;
              }}
            />
            <p className="line-clamp-2 text-[12px] text-[#808080]">
              {config.subtitle || `Share your details with ${profile.name || profile.title}`}
            </p>
          </div>

          {serverError && (
            <div className="rounded-[5px] border-[0.5px] border-[#FFC2CA] bg-[#FFEDEF] px-[12px] py-[8px] text-[11px] text-[#FF4359]">
              {serverError}
            </div>
          )}

          <form id="lead-capture-form" onSubmit={handleSubmit} className="flex flex-col gap-[15px]">
            {fields.name?.enabled && (
              <Field label={fieldLabel(fields.name.label || 'Full Name', fields.name.required)}>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required={fields.name.required}
                  className={fieldClass(errors.fullName)}
                />
                {fieldError(errors.fullName)}
              </Field>
            )}

            {fields.phone?.enabled && (
              <div className="flex flex-col gap-[8px]">
                <Field
                  label={fieldLabel(
                    (fields.phone.label && !fields.phone.label.toLowerCase().includes('contact') && !fields.phone.label.toLowerCase().includes('whatsapp')) ? fields.phone.label : 'Phone Number',
                    fields.phone.required
                  )}
                >
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +1 (555) 234-5678"
                    required={fields.phone.required}
                    className={fieldClass(errors.phone)}
                  />
                  {fieldError(errors.phone)}
                </Field>
                <label className="flex cursor-pointer select-none items-center gap-[8px] text-[12px]">
                  <input
                    type="checkbox"
                    name="isWhatsApp"
                    checked={Boolean(formData.isWhatsApp)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isWhatsApp: e.target.checked }))}
                    className="size-[14px] accent-[#16A34A]"
                  />
                  This number is on WhatsApp
                </label>
              </div>
            )}

            {fields.email?.enabled && (
              <Field label={fieldLabel(fields.email.label || 'Email Address', fields.email.required)}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@company.com"
                  required={fields.email.required}
                  className={fieldClass(errors.email)}
                />
                {fieldError(errors.email)}
              </Field>
            )}

            {fields.company?.enabled && (
              <Field label={fieldLabel(fields.company.label || 'Company / Brand', fields.company.required)}>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Acme Studio"
                  required={fields.company.required}
                  className={inputClass}
                />
              </Field>
            )}

            {fields.note?.enabled && (
              <Field label={fieldLabel(fields.note.label || 'Message / Reason for Contact', fields.note.required)}>
                <textarea
                  rows={2}
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="What would you like to discuss?"
                  required={fields.note.required}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            )}

            <p className="text-center text-[10px] text-[#808080]">Shared privately with @{profile.username}</p>
          </form>
        </div>
      )}
    </Modal>
  );
}
