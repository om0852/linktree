'use client';

import React from 'react';

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const bgClass = variant === 'muted' ? 'bg-surface-1' : 'bg-white';

  return (
    <div
      className={`border-[0.5px] border-line rounded-lg p-[15px] flex flex-col gap-[15px] ${bgClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}) {
  return (
    <div
      className={`flex items-center justify-between pb-[10px] border-b-[0.5px] border-line gap-[10px] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className={`flex items-center gap-[8px] ${className}`} {...props}>
      {Icon && <Icon className="size-[16px] text-ink-500 shrink-0" strokeWidth={1.5} />}
      <h3 className="font-sans text-[14px] font-semibold text-ink-700">
        {children}
      </h3>
    </div>
  );
}

export function CardDescription({
  children,
  className = '',
  ...props
}) {
  return (
    <p className={`text-[12px] text-ink-500 mt-[2px] leading-[18px] ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-[10px] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}) {
  return (
    <div
      className={`pt-[10px] border-t-[0.5px] border-line flex items-center justify-between gap-[10px] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
