'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, TrendingUp, X } from 'lucide-react';

export default function SocialProofTicker({ username, enabled = true, initialIntervalMs = 8000 }) {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!username || !enabled || dismissed) return;

    let isMounted = true;
    fetch(`/api/v1/social-proof/${encodeURIComponent(username)}`)
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        if (isMounted && data.events && data.events.length > 0) {
          setEvents(data.events);
          // Delay initial display by 2 seconds so it doesn't distract immediately
          setTimeout(() => setIsVisible(true), 2000);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [username, enabled, dismissed]);

  useEffect(() => {
    if (events.length <= 1 || dismissed) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % events.length);
        setIsVisible(true);
      }, 500);
    }, initialIntervalMs);

    return () => clearInterval(interval);
  }, [events, initialIntervalMs, dismissed]);

  if (!enabled || dismissed || events.length === 0) return null;

  const currentEvent = events[currentIndex] || events[0];

  const renderIcon = () => {
    switch (currentEvent.icon) {
      case 'calendar':
        return <Calendar size={14} className="text-blue-400" />;
      case 'trending':
        return <TrendingUp size={14} className="text-amber-400" />;
      default:
        return <Sparkles size={14} className="text-emerald-400" />;
    }
  };

  return (
    <aside 
      aria-label="Live Activity Ticker"
      className={`fixed bottom-4 left-4 z-40 max-w-xs sm:max-w-sm transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 p-2.5 pr-8 rounded-2xl bg-[#FFFEFA]/95 backdrop-blur-md border border-[#CAD8CE] shadow-lg text-[#28352F] relative group">
        <div className="w-8 h-8 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-center shrink-0">
          {renderIcon()}
        </div>

        <div className="min-w-0 pr-1">
          <p className="text-[11px] font-semibold text-[#28352F] truncate leading-tight">
            {currentEvent.title}
          </p>
          <p className="text-[10px] text-[#5C6B64] truncate leading-tight mt-0.5">
            {currentEvent.subtitle} <span className="text-[#5C6B64]/70">· {currentEvent.timeAgo}</span>
          </p>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 text-[#5C6B64] hover:text-[#28352F] rounded-md transition-colors"
          title="Dismiss"
        >
          <X size={12} />
        </button>
      </div>
    </aside>
  );
}
