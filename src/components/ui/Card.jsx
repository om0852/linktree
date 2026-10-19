'use client';

import React from 'react';

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const bgClass = variant === 'muted' 
    ? 'bg-[#F5F3ED]' 
    : variant === 'pure'
    ? 'bg-white'
    : 'bg-[#FFFEFA]';

  return (
    <div
      className={`border border-[#CAD8CE]/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5 ${bgClass} ${className}`}
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
      className={`flex items-center justify-between pb-2.5 border-b border-[#CAD8CE]/50 gap-3 ${className}`}
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
    <div className={`flex items-center gap-2 ${className}`} {...props}>
      {Icon && <Icon className="w-4 h-4 text-[#52796F] shrink-0" />}
      <h3 className="font-sans font-bold text-base sm:text-lg text-[#28352F] tracking-tight">
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
    <p className={`text-xs text-[#5C6B64] mt-0.5 leading-normal ${className}`} {...props}>
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
    <div className={`flex flex-col gap-3 ${className}`} {...props}>
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
      className={`pt-3 border-t border-[#CAD8CE]/50 flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
