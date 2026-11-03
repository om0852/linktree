'use client';

import React, { useState } from 'react';
import AuthModal from '@/components/Auth/AuthModal';
import { THEME_PRESETS, CURATED_THEMES, parseTailwindGradient } from '@/constants/app';
import { getThemeAppearance } from '@/lib/theme-contrast';
import { ArrowRight, Check } from '@/components/icons';

const ALL_THEMES = [...THEME_PRESETS, ...CURATED_THEMES];
const themeById = (id) => ALL_THEMES.find((theme) => theme.id === id);

// Only same-site paths may be used as the post-sign-in destination.
function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function backgroundOf(look) {
  return look.wallpaper.type === 'gradient'
    ? { background: parseTailwindGradient(look.wallpaper.gradient) }
    : { backgroundColor: look.wallpaper.value };
}

/** A small profile page drawn in a real theme's colours. */
function PhonePreview({ themeId, name, handle, links, className = '' }) {
  const look = getThemeAppearance(themeById(themeId));
  return (
    <div className={`w-[200px] rounded-[30px] border-[6px] border-[#111111] bg-[#111111] shadow-[0_24px_60px_rgba(15,61,34,0.22)] ${className}`}>
      <div className="flex h-[400px] flex-col items-center gap-[10px] overflow-hidden rounded-[24px] px-[14px] pt-[30px]" style={backgroundOf(look)}>
        <div className="h-[56px] w-[56px] rounded-full border-2 border-white/60" style={{ background: `linear-gradient(135deg, ${look.button}, ${look.title})` }} />
        <div className="text-center">
          <p className="text-[13px] font-semibold leading-tight" style={{ color: look.title }}>{name}</p>
          <p className="mt-[2px] text-[9px]" style={{ color: look.body }}>{handle}</p>
        </div>
        <div className="mt-[6px] flex w-full flex-col gap-[7px]">
          {links.map((label) => (
            <span
              key={label}
              className="flex h-[30px] w-full items-center justify-center rounded-full text-[10px] font-medium"
              style={{ backgroundColor: look.button, color: look.buttonText }}
            >
              {label}
            </span>
          ))}
          <span
            className="mt-[2px] flex h-[46px] w-full items-center justify-center rounded-[12px] text-[9px]"
            style={{ backgroundColor: look.card || 'rgba(255,255,255,0.6)', color: look.body }}
          >
            Book a 1:1 call
          </span>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { title: 'Themes that always read well', text: '24 designer themes. Every one is checked so text, cards and buttons stay readable, on any background you pick.' },
  { title: 'See every device as you edit', text: 'Preview your page on mobile, tablet and laptop side by side, exactly as visitors will see it.' },
  { title: 'Collect leads and bookings', text: 'Contact forms, 1:1 call bookings and a newsletter sign-up live right on your page.' },
  { title: 'Know what works', text: 'Views, clicks and where your visitors come from, for every link and every page.' },
  { title: 'Links for the right audience', text: 'Show a link only in chosen countries, then check it with “View as” before you publish.' },
  { title: 'Your own domain', text: 'Point links.yourbrand.com at your page and keep your brand in the address bar.' },
];

const STEPS = [
  { title: 'Claim your link', text: 'Pick a username. Your page lives at treeinbio.com/yourname.' },
  { title: 'Make it yours', text: 'Add links, choose a theme, fonts and stickers. Shuffle until it feels right.' },
  { title: 'Share it everywhere', text: 'Put one link in every bio, QR code and email signature.' },
];

const FAQ = [
  { q: 'Do I need to know design or code?', a: 'No. Pick a theme and it styles your whole page; every colour and font can be changed with a click.' },
  { q: 'Can I run more than one page?', a: 'Yes. Each account can hold several workspaces, each with its own page, leads, bookings and domain.' },
  { q: 'Can I use my own domain?', a: 'Yes. Add it in Custom Domains, set one DNS record, and verify it from the same screen.' },
  { q: 'What do visitors see?', a: 'A fast page that looks the same as your Studio preview on phones, tablets and laptops.' },
];

function Logo() {
  return (
    <span className="flex items-center">
      <svg className="h-[20px] w-auto" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 2.5V17.5M10 7L6 3.5M10 7L14 3.5M10 12L5 8M10 12L15 8" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="ml-[7px] text-[16px] font-semibold text-black">TreeInBio</span>
    </span>
  );
}

export default function LandingPage({ initialAuth = '', next: requestedNext = '' }) {
  // ?auth=login|register opens the form (sent here from a platform page).
  const [auth, setAuth] = useState(initialAuth === 'login' || initialAuth === 'register' ? { mode: initialAuth, username: '' } : null);
  const [claim, setClaim] = useState('');
  const next = safeNext(requestedNext);

  const openAuth = (mode, username = '') => setAuth({ mode, username });
  const handleClaim = (e) => {
    e.preventDefault();
    openAuth('register', claim);
  };

  return (
    <div className="min-h-screen bg-white text-[#333333]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b-[0.5px] border-[#DCDCDC] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-[1160px] items-center justify-between px-[16px]">
          <Logo />
          <nav className="hidden items-center gap-[28px] text-[12px] text-[#404040] md:flex">
            <a href="#features" className="hover:text-black">Features</a>
            <a href="#themes" className="hover:text-black">Themes</a>
            <a href="#how" className="hover:text-black">How it works</a>
            <a href="#faq" className="hover:text-black">FAQ</a>
          </nav>
          <div className="flex items-center gap-[8px]">
            <button type="button" onClick={() => openAuth('login')} className="h-[30px] rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-white px-[14px] text-[12px] hover:bg-[#F8F8F9]">
              Sign in
            </button>
            <button type="button" onClick={() => openAuth('register')} className="h-[30px] rounded-[50px] bg-black px-[14px] text-[12px] text-white hover:bg-[#1A1A1A]">
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(1200px_520px_at_70%_-10%,#DCF3E4_0%,#E8F7EE_35%,#FFFFFF_75%)]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-[48px] px-[16px] pb-[72px] pt-[64px] lg:grid-cols-[1.05fr_1fr] lg:pt-[88px]">
          <div className="min-w-0">
            <span className="inline-flex h-[24px] items-center gap-[6px] rounded-[50px] border-[0.5px] border-[#BBE7CB] bg-white px-[10px] text-[10px] font-medium text-[#166534]">
              <span className="h-[6px] w-[6px] rounded-full bg-[#16A34A]" />
              The link-in-bio studio for creators
            </span>
            <h1 className="mt-[18px] text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-black sm:text-[56px]">
              One link.<br />
              Everything you <span className="text-[#16A34A]">create.</span>
            </h1>
            <p className="mt-[18px] max-w-[480px] text-[15px] font-light leading-[1.65] text-[#404040]">
              Build a page for your links, products, bookings and leads in minutes. Designer themes, live device previews and real analytics, all in one studio.
            </p>

            <form onSubmit={handleClaim} className="mt-[28px] flex w-full max-w-[460px] items-center rounded-[50px] border-[0.5px] border-[#C4C4C4] bg-white p-[5px] shadow-[0_8px_30px_rgba(15,61,34,0.08)]">
              <span className="pl-[14px] text-[13px] text-[#808080]">treeinbio.com/</span>
              <input
                aria-label="Choose your username"
                value={claim}
                onChange={(e) => setClaim(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="yourname"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-black outline-none placeholder:text-[#AAAAAA]"
              />
              <button type="submit" className="flex h-[38px] shrink-0 items-center gap-[6px] rounded-[50px] bg-[#16A34A] px-[16px] text-[12px] font-medium text-white hover:bg-[#15803D]">
                Claim it <ArrowRight className="h-[14px] w-[14px]" />
              </button>
            </form>
            <ul className="mt-[18px] flex flex-wrap gap-x-[18px] gap-y-[6px] text-[12px] text-[#404040]">
              {['Ready in minutes', 'Works on every device', 'No code needed'].map((item) => (
                <li key={item} className="flex items-center gap-[6px]">
                  <Check className="h-[13px] w-[13px] text-[#16A34A]" /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Three live theme previews */}
          <div className="relative mx-auto h-[440px] w-full max-w-[520px]" aria-hidden="true">
            <PhonePreview themeId="aura" name="Maya Rivera" handle="@maya.makes" links={['Shop prints', 'Latest video']} className="tib-float-slow absolute left-0 top-[34px] hidden -rotate-[8deg] sm:block" />
            <PhonePreview themeId="emerald-gold" name="Studio Noor" handle="@studionoor" links={['New collection', 'Lookbook', 'Wholesale']} className="tib-float absolute left-1/2 top-0 z-10 -translate-x-1/2" />
            <PhonePreview themeId="twilight" name="Leo Park" handle="@leo.beats" links={['Listen now', 'Tour dates']} className="tib-float-slow absolute right-0 top-[34px] hidden rotate-[8deg] sm:block" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1160px] px-[16px] py-[80px]">
        <div className="max-w-[560px]">
          <p className="text-[12px] font-medium text-[#16A34A]">Features</p>
          <h2 className="mt-[8px] text-[30px] font-semibold leading-tight tracking-[-0.01em] text-black sm:text-[36px]">Everything your page needs, nothing it doesn’t</h2>
        </div>
        <div className="mt-[36px] grid gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div key={feature.title} className="rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white p-[20px] transition-colors hover:border-[#86D3A3] hover:bg-[#F1FAF4]">
              <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[#E8F7EE] text-[12px] font-semibold text-[#166534]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-[14px] text-[14px] font-semibold text-black">{feature.title}</h3>
              <p className="mt-[6px] text-[12px] leading-[1.6] text-[#404040]">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Themes marquee */}
      <section id="themes" className="overflow-hidden border-y-[0.5px] border-[#DCDCDC] bg-[#FAFAFA] py-[64px]">
        <div className="mx-auto max-w-[1160px] px-[16px]">
          <p className="text-[12px] font-medium text-[#16A34A]">Themes</p>
          <h2 className="mt-[8px] text-[30px] font-semibold leading-tight tracking-[-0.01em] text-black sm:text-[36px]">24 looks, one click each</h2>
          <p className="mt-[10px] max-w-[520px] text-[13px] font-light text-[#404040]">Or press Shuffle and let the Studio surprise you. Fine-tune colours, fonts and buttons afterwards.</p>
        </div>
        <div className="tib-marquee mt-[32px] flex w-max gap-[12px]">
          {[...ALL_THEMES, ...ALL_THEMES].map((theme, index) => {
            const look = getThemeAppearance(theme);
            return (
              <div key={`${theme.id}-${index}`} className="w-[150px] shrink-0 rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white p-[6px]">
                <div className="flex h-[96px] flex-col items-center justify-center gap-[6px] rounded-[6px] px-[12px]" style={backgroundOf(look)}>
                  <span className="text-[14px] font-semibold" style={{ color: look.title }}>Aa</span>
                  <span className="flex h-[16px] w-full items-center justify-center rounded-full text-[8px] font-medium" style={{ backgroundColor: look.button, color: look.buttonText }}>Link</span>
                </div>
                <p className="mt-[6px] truncate px-[2px] text-[11px] font-medium text-black">{theme.name}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1160px] px-[16px] py-[80px]">
        <p className="text-[12px] font-medium text-[#16A34A]">How it works</p>
        <h2 className="mt-[8px] text-[30px] font-semibold leading-tight tracking-[-0.01em] text-black sm:text-[36px]">Live in three steps</h2>
        <ol className="mt-[36px] grid gap-[12px] md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white p-[20px]">
              <span className="text-[36px] font-semibold leading-none text-[#DCF3E4]">{index + 1}</span>
              <h3 className="mt-[10px] text-[14px] font-semibold text-black">{step.title}</h3>
              <p className="mt-[6px] text-[12px] leading-[1.6] text-[#404040]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[760px] px-[16px] pb-[80px]">
        <h2 className="text-center text-[30px] font-semibold tracking-[-0.01em] text-black">Questions</h2>
        <div className="mt-[28px] flex flex-col gap-[8px]">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white px-[18px] py-[14px] open:bg-[#FAFAFA]">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium text-black">
                {item.q}
                <span className="ml-[12px] text-[16px] text-[#808080] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-[8px] text-[12px] leading-[1.6] text-[#404040]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="px-[16px] pb-[64px]">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center rounded-[20px] bg-[#0F3D22] px-[20px] py-[56px] text-center">
          <h2 className="text-[28px] font-semibold leading-tight text-white sm:text-[36px]">Your audience is one link away</h2>
          <p className="mt-[10px] max-w-[460px] text-[13px] font-light text-[#BBE7CB]">Claim your page now and make it yours in minutes.</p>
          <button type="button" onClick={() => openAuth('register', claim)} className="mt-[24px] flex h-[40px] items-center gap-[6px] rounded-[50px] bg-[#16A34A] px-[20px] text-[13px] font-medium text-white hover:bg-[#15803D]">
            Get started <ArrowRight className="h-[14px] w-[14px]" />
          </button>
        </div>
      </section>

      <footer className="border-t-[0.5px] border-[#DCDCDC]">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-[10px] px-[16px] py-[20px] text-[11px] text-[#808080] sm:flex-row">
          <Logo />
          <span>© {new Date().getFullYear()} TreeInBio</span>
        </div>
      </footer>

      {auth && (
        <AuthModal
          key={`${auth.mode}-${auth.username}`}
          initialMode={auth.mode}
          initialUsername={auth.username}
          onClose={() => setAuth(null)}
          onSuccess={() => window.location.replace(next)}
        />
      )}
    </div>
  );
}
