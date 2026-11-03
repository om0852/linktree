'use client';

import React, { useState } from 'react';
import { Modal, ModalButton, Field, inputClass } from '@/components/ui';
import { PLATFORM_NAME } from '@/constants/app';

export default function AuthModal({ isOpen = true, onClose, onSuccess, initialMode = 'login', mode: propMode }) {
  const [mode, setMode] = useState(propMode || initialMode); // 'login' | 'register'
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (isOpen === false) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrUsername, password }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to log in');
        }

        if (onSuccess) onSuccess(data.user);
        if (onClose) onClose();
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, name, password }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to create account');
        }

        if (onSuccess) onSuccess(data.user);
        if (onClose) onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'login' ? `Sign In to ${PLATFORM_NAME}` : `Claim Your ${PLATFORM_NAME}`}
      width="sm"
      footer={
        <ModalButton id="tb-auth-submit-btn" type="submit" form="tb-auth-form" variant="primary" disabled={loading}>
          {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </ModalButton>
      }
    >
      <div className="flex flex-col gap-[15px]">
        {error && (
          <div role="alert" className="rounded-[5px] border-[0.5px] border-[#FF4359] bg-[#FF43591A] px-[10px] py-[8px] text-[12px] text-[#FF4359]">
            {error}
          </div>
        )}

        <form id="tb-auth-form" onSubmit={handleSubmit} className="flex flex-col gap-[15px]">
          {mode === 'register' && (
            <>
              <Field label="Full Name">
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Username" hint={`Your public URL: treeinbio.com/${username || 'yourname'}`}>
                <div className="relative">
                  <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[12px] text-[#808080]">/</span>
                  <input
                    type="text"
                    required
                    placeholder="sarahjenkins"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className={`${inputClass} pl-[20px]`}
                  />
                </div>
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  required
                  placeholder="sarah@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          )}

          {mode === 'login' && (
            <Field label="Email or Username">
              <input
                id="tb-auth-email-or-username"
                type="text"
                required
                placeholder="Enter your email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}

          <Field label="Password">
            <input
              id="tb-auth-password"
              type="password"
              required
              placeholder={mode === 'register' ? 'At least 12 characters' : 'Enter your password'}
              minLength={mode === 'register' ? 12 : undefined}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
        </form>

        <div className="flex items-center justify-between border-t-[0.5px] border-[#EBEBEB] pt-[10px] text-[12px] text-[#808080]">
          <span>{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
          <button
            id="tb-auth-toggle-mode-btn"
            type="button"
            onClick={() => {
              setError(null);
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            className="font-medium text-[#16A34A] hover:text-[#15803D]"
          >
            {mode === 'login' ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
