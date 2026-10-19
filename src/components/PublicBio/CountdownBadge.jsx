'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';

export default function CountdownBadge({ expiresAt, startsAt }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [hasStarted, setHasStarted] = useState(true);

  useEffect(() => {
    if (!expiresAt && !startsAt) return;

    const calculate = () => {
      const now = new Date().getTime();
      const end = expiresAt ? new Date(expiresAt).getTime() : null;
      const start = startsAt ? new Date(startsAt).getTime() : null;

      if (start && now < start) {
        setHasStarted(false);
        const diff = start - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`Starts in ${hours}h ${minutes}m`);
        return;
      }

      setHasStarted(true);

      if (end) {
        const diff = end - now;
        if (diff <= 0) {
          setTimeLeft('Ended');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (diff < 1000 * 60 * 60) {
          // Less than 1 hour -> urgent
          setIsUrgent(true);
          setTimeLeft(`${minutes}m ${seconds}s left`);
        } else if (days > 0) {
          setIsUrgent(false);
          setTimeLeft(`${days}d ${hours}h left`);
        } else {
          setIsUrgent(false);
          setTimeLeft(`${hours}h ${minutes}m left`);
        }
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, startsAt]);

  if (!timeLeft || timeLeft === 'Ended') return null;

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-sm transition-all ${
        isUrgent
          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
      }`}
    >
      {isUrgent ? <Zap size={11} className="text-rose-400 fill-rose-400" /> : <Clock size={11} />}
      <span>{timeLeft}</span>
    </span>
  );
}
