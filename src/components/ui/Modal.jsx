'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const WIDTHS = { sm: 'w-[400px]', md: 'w-[480px]', lg: 'w-[640px]', xl: 'w-[820px]' };

function CloseIcon() {
  return (
    <svg width="18" height="19" viewBox="0 0 18 19" fill="none">
      <path d="M5.06885 13.4323L9.00082 9.50034M9.00082 9.50034L12.9328 5.56836M9.00082 9.50034L5.06885 5.56836M9.00082 9.50034L12.9328 13.4323" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Creatosaurus modal (PopupLayout overlay + AccountDeletePopup container):
 * 14px title, 18px close, 0.5px divider, 12px body, optional footer row.
 * Closes on backdrop pointer-down and on Escape.
 */
export default function Modal({ open = true, onClose, title, headerExtra, width = 'sm', footer, children, bodyClassName = '' }) {
  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#00000A73] p-[10px] backdrop-blur-[5px]"
      onPointerDown={(e) => e.target === e.currentTarget && onClose && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`flex max-h-[90vh] max-w-full flex-col rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white p-[15px] text-[#333333] animate-fade-in ${WIDTHS[width] || width}`}
      >
        {(title || onClose) && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-[10px] pb-[10px]">
              <div className="flex min-w-0 items-center gap-[8px]">
                <h3 className="truncate text-[14px] font-medium text-black">{title}</h3>
                {headerExtra}
              </div>
              {onClose && (
                <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 text-[#808080] hover:text-black">
                  <CloseIcon />
                </button>
              )}
            </div>
            <div className="h-[0.5px] w-full shrink-0 bg-[#DCDCDC]" />
          </>
        )}
        <div className={`customScrollBar mt-[15px] min-h-0 flex-1 overflow-y-auto text-[12px] ${bodyClassName}`}>{children}</div>
        {footer && <div className="mt-[15px] flex shrink-0 justify-between gap-[15px]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

const BUTTON = {
  primary: 'bg-[#16A34A] text-white border-[#16A34A] hover:bg-[#15803D]',
  secondary: 'bg-[#F8F8F9] text-[#333333] border-[#C4C4C4] hover:border-[#404040] hover:text-black',
  danger: 'bg-[#FF4359] text-white border-[#FF4359] hover:bg-[#E63C50] disabled:bg-[#FFA1AC] disabled:border-[#FFA1AC]',
  dark: 'bg-black text-white border-black hover:bg-[#222222]',
};

/** Footer button: footer buttons split the row (w-[50%] each when two). */
export function ModalButton({ variant = 'primary', className = 'w-full', children, ...props }) {
  return (
    <button
      type="button"
      className={`flex h-[34px] items-center justify-center rounded-[5px] border-[0.5px] text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Field block: 14px medium label over a #FAFAFA input (CreateBrandKit form). */
export function Field({ label, hint, children }) {
  return (
    <label className="flex w-full flex-col gap-[5px]">
      {label && <span className="text-[14px] font-medium text-black">{label}</span>}
      {children}
      {hint && <span className="text-[10px] text-[#808080]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[8px] text-[12px] font-normal outline-none placeholder:text-[12px] placeholder:text-[#808080] focus:border-[#404040]';
