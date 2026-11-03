'use client';

/*
 * Building blocks copied from the Creatosaurus app, see docs/design-system.md.
 * Class strings match the source; only the brand colour is green.
 */
import React from 'react';
import { Search, X } from '@/components/icons';
import Tooltip from './Tooltip';

/** Toolbar row under the page header: tabs left, controls right. */
export function Toolbar({ left, right, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-[10px] border-b-[0.5px] border-[#DCDCDC] pb-[15px] text-[12px] text-[#333333] ${className}`}>
      <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[8px]">{left}</div>
      <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[8px]">{right}</div>
    </div>
  );
}

/** 34px pill tab (Analytics tabs). Active is a black hairline, never brand colour. */
export function PillTab({ active, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex h-[34px] items-center whitespace-nowrap rounded-[50px] border-[0.5px] px-[10px] text-[12px] hover:bg-[#F8F8F9BF] ${active ? 'border-[#000] bg-[#F8F8F9BF] text-black' : 'border-[#DCDCDC] bg-white text-[#333333]'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** 34px white pill for dropdown triggers, date ranges and Export. */
export function ToolbarPill({ children, className = '', as: Tag = 'button', ...props }) {
  return (
    <Tag
      {...(Tag === 'button' ? { type: 'button' } : {})}
      className={`flex h-[34px] items-center justify-center gap-[6px] whitespace-nowrap rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-white px-[10px] text-[12px] text-[#333333] hover:bg-[#F8F8F9BF] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** 23px info / count chip. */
export function InfoChip({ children, className = '', ...props }) {
  return (
    <span className={`flex h-[23px] items-center rounded-[50px] bg-[#F8F8F9BF] px-[10px] text-[10px] text-[#333333] ${className}`} {...props}>
      {children}
    </span>
  );
}

/** Pill search input with a 16px search icon and clear button. */
export function SearchPill({ value, onChange, placeholder = 'Search', className = 'w-[220px]' }) {
  return (
    <div className={`relative flex h-[34px] items-center ${className}`}>
      <Search className="absolute left-[10px] text-[#808080]" size={16} strokeWidth={0.85} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[34px] w-full rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-[#FAFAFA] px-[30px] text-[12px] font-light outline-none placeholder:text-[#808080] focus:border-[#404040]"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-[10px] text-[#808080] hover:text-[#404040]">
          <X size={16} strokeWidth={0.85} />
        </button>
      )}
    </div>
  );
}

/** 30px round icon button; tone "brand" or "danger" tints the hover. */
export function RoundIconButton({ icon: Icon, title, tone = 'neutral', className = '', iconClassName = '', ...props }) {
  const tones = {
    neutral: 'text-[#808080] hover:bg-[#F8F8F9] hover:text-[#333333]',
    brand: 'text-[#333333] hover:bg-[#16A34A1A] hover:text-[#16A34A]',
    danger: 'text-[#FF4359] hover:bg-[#FF43591A]',
  };
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${tones[tone]} ${className}`}
      {...props}
    >
      <Icon size={16} className={iconClassName} />
    </button>
  );
}

function DeltaArrow({ value }) {
  const d = value > 0 ? 'M2 8L8 2M8 2H4M8 2V6' : value < 0 ? 'M2 2L8 8M8 8H4M8 8V4' : 'M2 5H8';
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Delta badge: arrow + unsigned percentage, colour carries direction. */
export function Delta({ value }) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  const v = Number(value);
  const colour = v > 0 ? 'text-[#16A34A]' : v < 0 ? 'text-[#DC2626]' : 'text-[#808080]';
  return (
    <span className={`inline-flex items-center gap-[2px] text-[11px] font-semibold tracking-wide ${colour}`}>
      <DeltaArrow value={v} />
      {Math.abs(v) > 999 ? '>999%' : `${Math.abs(v).toFixed(2)}%`}
    </span>
  );
}

/** KPI card (OverViewTopBar): 40px icon tile, value, delta, label. */
export function KpiCard({ icon: Icon, value, label, delta, tooltip }) {
  const card = (
    <div className="flex min-w-0 items-center rounded-[10px] border-[0.5px] border-[#dcdcdc] p-[12px] sm:p-[15px]">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[5px] bg-[#F8F8F9] sm:size-[40px]">
        {Icon && <Icon size={24} color="#333333" strokeWidth={1.25} />}
      </div>
      <div className="ml-[10px] flex min-w-0 flex-col">
        <div className="flex items-center gap-[6px]">
          <span className="text-[14px] font-semibold tabular-nums">{value}</span>
          <Delta value={delta} />
        </div>
        <span className="mt-[2px] truncate text-[12px] text-[#808080]">{label}</span>
      </div>
    </div>
  );
  return tooltip ? <Tooltip content={tooltip} position="bottom" width={200} className="block">{card}</Tooltip> : card;
}

const KPI_COLUMNS = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };

export function KpiGrid({ children, columns = 4 }) {
  return <div className={`grid grid-cols-2 gap-[10px] sm:gap-[15px] ${KPI_COLUMNS[columns] || KPI_COLUMNS[4]}`}>{children}</div>;
}

/** Settings row: title + one helper sentence left, control right. */
export function SettingRow({ title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-[15px]">
      <div className="flex w-[60%] flex-col justify-center gap-[3px]">
        <span className="text-[12px] font-medium">{title}</span>
        {description && <span className="text-[10px] font-normal text-[#808080]">{description}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-[10px]">{children}</div>
    </div>
  );
}

/** 40x22 toggle (AccountsSettings). */
export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-[#16A34A]' : 'bg-[#DCDCDC]'}`}
    >
      <span className={`inline-block size-[18px] rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

/** Centred empty state: optional 40px icon circle, 14px title, 12px muted text, action. */
export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-[20px] py-[40px] text-center">
      {Icon && (
        <div className="flex size-[40px] items-center justify-center rounded-full bg-[#E8F7EE]">
          <Icon size={20} color="#16A34A" strokeWidth={1.25} />
        </div>
      )}
      {title && <p className="mt-[12px] text-[14px] font-semibold">{title}</p>}
      {children && <p className="mt-[4px] max-w-[280px] text-[12px] leading-[1.6] text-[#808080]">{children}</p>}
      {action && <div className="mt-[10px]">{action}</div>}
    </div>
  );
}

/** Primary pill CTA used in empty states (NoAccountConnected). */
export function PrimaryPill({ children, className = '', as: Tag = 'button', ...props }) {
  return (
    <Tag
      {...(Tag === 'button' ? { type: 'button' } : {})}
      className={`inline-flex items-center justify-center rounded-[50px] bg-[#16A34A] px-[29px] py-[8px] text-[12px] font-medium text-white hover:bg-[#15803D] disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Pulse skeleton rows inside the real container shape. */
export function SkeletonRows({ rows = 5 }) {
  return (
    <div className="flex animate-pulse flex-col">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-[10px] border-b-[0.5px] border-[#f0f0f0] px-[12px] py-[12px]">
          <div className="size-[24px] rounded-full bg-gray-300" />
          <div className="h-[10px] w-[30%] rounded-[5px] bg-gray-300" />
          <div className="ml-auto h-[10px] w-[15%] rounded-[5px] bg-gray-300" />
        </div>
      ))}
    </div>
  );
}

/** Info icon with the dark tooltip, as used next to chart titles. */
export function InfoTip({ content, width = 220 }) {
  if (!content) return null;
  return (
    <Tooltip content={content} width={width} position="bottom" className="ml-[6px] flex">
      <span tabIndex={0} className="flex cursor-pointer text-[#aaa] transition-colors hover:text-black" aria-label="More information">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 11.5V16.5" />
          <path d="M12 7.51L12.01 7.49889" />
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        </svg>
      </span>
    </Tooltip>
  );
}

/** Chart card (LineGraphV2 shell): 14px title, optional (subtitle), info tip, actions. */
export function ChartCard({ title, subtitle, info, actions, children, className = '' }) {
  return (
    <div className={`relative flex flex-col rounded-[10px] border-[0.5px] border-[#dcdcdc] bg-white p-[15px] ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center">
          <span className="truncate text-[14px] font-semibold text-[#333]">{title}</span>
          {subtitle && <span className="whitespace-nowrap text-[10px] text-[#808080]">&nbsp;({subtitle})</span>}
          <InfoTip content={info} />
        </div>
        {actions && <div className="flex items-center gap-[10px]">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Legend/footer rows under a chart: marker, label, value, optional share. */
export function BreakdownRows({ rows, empty = 'No data yet.' }) {
  if (!rows.length) return <p className="mt-[10px] text-[12px] text-[#808080]">{empty}</p>;
  return (
    <div className="mt-[8px] flex flex-col border-t-[0.5px] border-[#f0f0f0] text-[12px] leading-[20px]">
      {rows.map((row) => (
        <div key={row.key ?? row.label} className="grid min-h-[32px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[6px] border-b-[0.5px] border-[#f0f0f0] px-[6px] py-[4px]">
          <span className="flex min-w-0 items-center">
            <span className="mr-[7px] text-[14px] leading-none" style={{ color: row.color || '#16A34A' }}>●</span>
            <span className="truncate text-[#333]" title={row.label}>{row.label}</span>
          </span>
          <span className="whitespace-nowrap">
            <span className="font-semibold text-[#333] tabular-nums">{row.value}</span>
            {row.share !== undefined && <span className="ml-[6px] text-[#808080]">{row.share}%</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Chart series colours, brand first (design-system.md). */
export const SERIES_COLORS = ['#16A34A', '#FF8A25', '#0EA5E9', '#EF4444', '#14B8A6', '#F59E0B', '#A855F7', '#6366F1'];

/** Data table classes (AnalyticsDataTable). */
export const table = {
  wrapper: 'overflow-x-auto rounded-[10px] border-[0.5px] border-[#dcdcdc] bg-white customScrollBar',
  table: 'w-full border-separate border-spacing-0',
  head: 'bg-[#fafafa]',
  th: 'whitespace-nowrap border-b-[0.5px] border-[#dcdcdc] px-[12px] py-[10px] text-left text-[12px] font-medium text-[#555]',
  row: 'transition-colors hover:bg-[#F8F8F9]',
  td: 'border-b-[0.5px] border-[#f0f0f0] px-[12px] py-[10px] text-[12px] text-[#333333]',
};
