'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-[#FFFEFA] border border-[#CAD8CE] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E0DCD3] flex items-center justify-between bg-[#F5F3ED]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#52796F] flex items-center justify-center text-[#FFFEFA] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-[#FFFEFA]" />
            </div>
            <span className="font-sans font-semibold text-sm text-[#28352F]">
              {mode === 'login' ? `Sign In to ${PLATFORM_NAME}` : `Claim Your ${PLATFORM_NAME}`}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#5C6B64] hover:text-[#28352F] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-[0.6875rem] font-bold uppercase text-[#5C6B64]">Full Name</label>
                  <div className="relative mt-1">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6B64]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F5F3ED] border border-[#CAD8CE] rounded text-xs text-[#28352F] focus:outline-none focus:border-[#52796F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[0.6875rem] font-bold uppercase text-[#5C6B64]">Choose Your Bio Username</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#5C6B64]">/</span>
                    <input
                      type="text"
                      required
                      placeholder="sarahjenkins"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="w-full pl-6 pr-3 py-1.5 bg-[#F5F3ED] border border-[#CAD8CE] rounded text-xs font-mono text-[#28352F] focus:outline-none focus:border-[#52796F]"
                    />
                  </div>
                  <span className="text-[0.62rem] font-mono text-[#5C6B64]">Your public URL: treeinbio.com/{username || 'yourname'}</span>
                </div>

                <div>
                  <label className="text-[0.6875rem] font-bold uppercase text-[#5C6B64]">Email Address</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6B64]" />
                    <input
                      type="email"
                      required
                      placeholder="sarah@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F5F3ED] border border-[#CAD8CE] rounded text-xs text-[#28352F] focus:outline-none focus:border-[#52796F]"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'login' && (
              <div>
                <label className="text-[0.6875rem] font-bold uppercase text-[#5C6B64]">Email or Username</label>
                <div className="relative mt-1">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6B64]" />
                  <input
                    id="tb-auth-email-or-username"
                    type="text"
                    required
                    placeholder="Enter your email or username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F5F3ED] border border-[#CAD8CE] rounded text-xs text-[#28352F] focus:outline-none focus:border-[#52796F]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[0.6875rem] font-bold uppercase text-[#5C6B64]">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C6B64]" />
                <input
                  id="tb-auth-password"
                  type="password"
                  required
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F5F3ED] border border-[#CAD8CE] rounded text-xs text-[#28352F] focus:outline-none focus:border-[#52796F]"
                />
              </div>
            </div>

            <button
              id="tb-auth-submit-btn"
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2 bg-[#52796F] hover:bg-[#3D5C54] text-white text-xs font-semibold rounded shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="pt-3 border-t border-[#E0DCD3] flex items-center justify-between text-xs text-[#5C6B64]">
            <span>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              id="tb-auth-toggle-mode-btn"
              type="button"
              onClick={() => {
                setError(null);
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-[#52796F] font-bold hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Create one now' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
