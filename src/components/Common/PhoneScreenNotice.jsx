'use client';

import React from 'react';

/**
 * The platform (Studio and dashboards) is built for tablets and larger. On a
 * phone-sized screen (< 768px) this covers the page with a short notice.
 * Public profile pages and the landing page do not render it.
 */
export default function PhoneScreenNotice({ username }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-notice-title"
      className="platform-phone-notice fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#E8F7EE] px-[24px] text-center md:hidden"
    >
      <div className="w-full max-w-[340px] rounded-[10px] bg-white px-[20px] py-[28px]">
        <svg className="mx-auto h-[28px] w-auto" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.5V17.5M10 7L6 3.5M10 7L14 3.5M10 12L5 8M10 12L15 8" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 id="phone-notice-title" className="mt-[14px] text-[16px] font-semibold text-black">
          This screen isn’t available on phones
        </h2>
        <p className="mt-[8px] text-[12px] leading-[1.6] text-[#404040]">
          The TreeInBio Studio and dashboards need a tablet or computer. Open this page on a screen at least 768px wide.
        </p>
        <p className="mt-[8px] text-[12px] leading-[1.6] text-[#808080]">
          Your public page works on every phone.
        </p>
        {username && (
          <a
            href={`/${username}`}
            className="mt-[18px] inline-flex h-[34px] items-center justify-center rounded-[50px] bg-[#16A34A] px-[16px] text-[12px] font-medium text-white hover:bg-[#15803D]"
          >
            View my page
          </a>
        )}
      </div>
    </div>
  );
}
