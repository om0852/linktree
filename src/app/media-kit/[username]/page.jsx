'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowUpRight, BarChart3, CalendarDays, Download, Eye, MousePointer2, Users, CalendarCheck } from '@/components/icons';

const number = (value) => Number(value || 0).toLocaleString();

export default function PerformanceMediaKitPage() {
  const { username } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    fetch(`/api/media-kit/${encodeURIComponent(username)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'This media kit is unavailable.');
        if (!cancelled) setReport(data);
      })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); });
    return () => { cancelled = true; };
  }, [username]);

  if (error) return <main className="min-h-screen grid place-items-center bg-[#f6f8f6] p-6 text-center"><div><h1 className="text-[16px] font-semibold text-ink-900">Media kit unavailable</h1><p className="mt-2 text-ink-600">{error}</p></div></main>;
  if (!report) return <main className="min-h-screen grid place-items-center bg-[#f6f8f6] text-ink-500">Loading performance report…</main>;

  const { creator, metrics, period, topLinks } = report;
  const cards = [
    { label: 'Profile views', value: metrics.profileViews, detail: `${number(metrics.uniqueViews)} unique`, icon: Eye },
    { label: 'Link clicks', value: metrics.linkClicks, detail: `${metrics.clickThroughRate}% click-through rate`, icon: MousePointer2 },
    { label: 'Leads', value: metrics.leads, detail: 'Contact inquiries received', icon: Users },
    { label: 'Subscribers', value: metrics.subscribers, detail: 'Newsletter and lead magnet signups', icon: Users },
    { label: 'Bookings', value: metrics.bookings, detail: 'Non-cancelled bookings', icon: CalendarCheck },
  ];

  return (
    <main className="min-h-screen bg-[#f6f8f6] px-4 py-8 text-ink-900 sm:px-8 sm:py-14 print:bg-white print:p-0">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-modal shadow-emerald-950/5 print:rounded-none print:border-0 print:shadow-none">
        <header className="bg-[#0f241d] px-6 py-8 text-white sm:px-10 sm:py-10 print:bg-white print:text-ink-900">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              {creator.avatar ? <Image src={creator.avatar} alt="" width={64} height={64} unoptimized className="h-16 w-16 rounded-2xl object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-xl font-semibold">{creator.name.slice(0, 1).toUpperCase()}</div>}
              <div className="min-w-0"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200 print:text-brand-800">TreeInBio Performance Report</p><h1 className="text-[16px] mt-1 truncate font-semibold">{creator.name}</h1><p className="mt-1 text-sm text-white/70 print:text-ink-600">treeinbio.com/{creator.username}</p></div>
            </div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 print:hidden"><Download size={16} /> Save as PDF</button>
          </div>
          {creator.bio && <p className="mt-6 max-w-2xl text-sm leading-6 text-white/75 print:text-ink-700">{creator.bio}</p>}
          <div className="mt-6 flex items-center gap-2 text-sm text-brand-100 print:text-ink-600"><CalendarDays size={16} /> {period.label}</div>
        </header>

        <section className="p-6 sm:p-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {cards.map(({ label, value, detail, icon: Icon }) => <div key={label} className="rounded-2xl border border-line bg-surface-1 p-4 sm:p-5"><div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500"><span>{label}</span><Icon size={16} /></div><div className="mt-3 text-3xl font-semibold tracking-tight">{number(value)}</div><p className="mt-1 text-xs text-ink-500">{detail}</p></div>)}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-900/10 bg-brand-50/60 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-950"><BarChart3 size={17} /> Total conversions</div><div className="mt-2 text-3xl font-semibold text-emerald-950">{number(metrics.conversions)}</div><p className="mt-1 text-sm text-brand-900/70">Leads, signups, and bookings recorded in this period</p></div>
            <div className="rounded-2xl border border-line p-5"><div className="flex items-center gap-2 text-sm font-semibold"><ArrowUpRight size={17} /> Top links</div>{topLinks.length ? <ol className="mt-3 space-y-2">{topLinks.map((link, index) => <li key={`${link.title}-${index}`} className="flex justify-between gap-4 text-sm"><span className="truncate text-ink-600">{index + 1}. {link.title}</span><span className="shrink-0 font-semibold">{number(link.clicks)}</span></li>)}</ol> : <p className="mt-3 text-sm text-ink-500">No link clicks recorded in this period.</p>}</div>
          </div>
          <footer className="mt-8 border-t border-line pt-4 text-xs text-ink-400">Generated {new Date(report.generatedAt).toLocaleDateString()} · Aggregated TreeInBio analytics</footer>
        </section>
      </article>
    </main>
  );
}
