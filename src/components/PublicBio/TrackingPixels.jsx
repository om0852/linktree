'use client';

import React from 'react';
import Script from 'next/script';

export default function TrackingPixels({ trackingPixels }) {
  if (!trackingPixels) return null;

  const valid = (value, pattern) => typeof value === 'string' && pattern.test(value.trim()) ? value.trim() : '';
  const metaPixelId = valid(trackingPixels.metaPixelId, /^\d{5,20}$/);
  const ga4MeasurementId = valid(trackingPixels.ga4MeasurementId, /^G-[A-Z0-9]{4,20}$/i);
  const tiktokPixelId = valid(trackingPixels.tiktokPixelId, /^[A-Z0-9]{10,40}$/i);
  const pinterestTagId = valid(trackingPixels.pinterestTagId, /^\d{5,20}$/);

  const hasAnyPixel = Boolean(
    metaPixelId?.trim() || 
    ga4MeasurementId?.trim() || 
    tiktokPixelId?.trim() || 
    pinterestTagId?.trim()
  );

  if (!hasAnyPixel) return null;

  return (
    <>
      {/* 1. Google Analytics (GA4) */}
      {ga4MeasurementId && ga4MeasurementId.trim() && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4MeasurementId.trim())}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4MeasurementId.trim()}');
            `}
          </Script>
        </>
      )}

      {/* 2. Meta (Facebook) Pixel */}
      {metaPixelId && metaPixelId.trim() && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId.trim()}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* 3. TikTok Pixel */}
      {tiktokPixelId && tiktokPixelId.trim() && (
        <Script id="tiktok-pixel-init" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktokPixelId.trim()}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* 4. Pinterest Tag */}
      {pinterestTagId && pinterestTagId.trim() && (
        <Script id="pinterest-tag-init" strategy="afterInteractive">
          {`
            !function(e){if(!window.pintrk){window.pintrk = function () {
            window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
              n=window.pintrk;n.queue=[],n.version="3.0";var
              t=document.createElement("script");t.async=!0,t.src=e;var
              r=document.getElementsByTagName("script")[0];
              r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
            pintrk('load', '${pinterestTagId.trim()}');
            pintrk('page');
          `}
        </Script>
      )}
    </>
  );
}
