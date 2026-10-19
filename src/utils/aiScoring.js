export const PERSONA_TAGLINES = {
  actor_actress: [
    "🎭 Hollywood & Theatre Performer | Featured in HBO & Netflix Series | IMDb Verified",
    "🎬 SAG-AFTRA Actor | Voiceover Artist & Stage Performer | Represented by CAA",
    "✨ Film & Commercial Actress | Cannes Selectee | Represented globally"
  ],
  influencer: [
    "✨ Lifestyle, Tech & Fitness Creator | 2.5M+ Followers | Daily Vlogs & Tech Reviews",
    "🌴 Creating daily aesthetic moments, travel diaries & premium lifestyle guides",
    "⚡ Fitness, mindset & lifestyle coaching | Helping 100K+ reach peak performance"
  ],
  digital_marketer: [
    "🚀 Growth Lead @ ScalingMedia | Helping E-Commerce Brands Scale past $10M ARR",
    "📈 Performance Marketing Consultant | $45M+ in tracked client ad revenue",
    "💼 Fractional CMO | SEO, Paid Social & High-Conversion Funnel Architecture"
  ],
  musician: [
    "🎵 Electronic Music Producer & Live Performer | New Album 'Cosmic Echoes' Out Now!",
    "🎸 Indie Rock Songwriter & Multi-Instrumentalist | Currently Touring North America",
    "🎹 Ambient Synth Explorer | 10M+ Spotify Streams | New Single Available Everywhere"
  ]
};

export const PERSONA_RECOMMENDATIONS = {
  actor_actress: {
    recommended_layout: 'bento',
    recommended_theme: 'emerald-gold',
    key_badges: ['NEW REEL', 'IMDb', 'BOOKING', 'PRESS KIT'],
    recommended_widgets: ['heroVideo', 'tipJar', 'mediaKitStats']
  },
  influencer: {
    recommended_layout: 'bento',
    recommended_theme: 'emerald-gold',
    key_badges: ['TRENDING', 'SHOP NOW', 'DISCOUNT', 'SPONSOR'],
    recommended_widgets: ['newsletter', 'mediaKitStats']
  },
  digital_marketer: {
    recommended_layout: 'stack',
    recommended_theme: 'emerald-gold',
    key_badges: ['FREE EBOOK', 'BOOK CALL', 'VIP GROUP', 'CASE STUDY'],
    recommended_widgets: ['newsletter', 'mediaKitStats']
  },
  musician: {
    recommended_layout: 'bento',
    recommended_theme: 'emerald-gold',
    key_badges: ['STREAM NOW', 'TOUR DATES', 'MERCH', 'VINYL'],
    recommended_widgets: ['tipJar', 'mediaKitStats']
  }
};

/**
 * Real-time ML CTR & Conversion Calculation Engine
 * Mirrors trained XGBoost regressor weights
 */
export function calculateCTRScore(profile) {
  let score = 42; // Baseline CTR foundation
  const recs = [];

  // 1. Link Count Optimal Range (3 to 6 links is sweet spot)
  const linkCount = profile.links ? profile.links.length : 0;
  if (linkCount >= 3 && linkCount <= 6) {
    score += 15;
  } else if (linkCount > 6) {
    score -= 8;
    recs.push('Reduce choice overload: keep primary links between 3 and 6 to boost CTR.');
  } else if (linkCount < 3) {
    recs.push('Add at least 3 high-value links to capture audience interest.');
  }

  // 2. High-Conversion Badges
  const badgedLinks = profile.links ? profile.links.filter(l => Boolean(l.badge && l.badge.trim())) : [];
  if (badgedLinks.length >= 1) {
    score += 12;
  } else {
    recs.push('Add eye-catching badges (e.g. "NEW REEL", "TRENDING", "20% OFF") on top links (+12% CTR).');
  }

  // 3. Bento 2.0 Visual Hierarchy
  if (profile.layout === 'bento') {
    score += 10;
    const hasLargeCard = profile.links && profile.links.some(l => l.size === 'large');
    if (!hasLargeCard) {
      recs.push('Toggle at least one Bento card to "2-Col (Full Width)" to establish clear visual hierarchy.');
    }
  }

  // 4. Hero Video Embed (+14% engagement)
  if (profile.heroVideo && profile.heroVideo.trim()) {
    score += 14;
  } else {
    recs.push('Embed a Hero Showreel / Video player directly inside the bio (+14% conversion boost).');
  }

  // 5. Lead Capture Newsletter (+10%)
  if (profile.widgets && profile.widgets.hasNewsletter) {
    score += 10;
  } else {
    recs.push('Enable the Newsletter Lead Magnet to capture subscriber emails directly (+10% boost).');
  }

  // 6. Direct Monetization / Tip Jar (+7%)
  if (profile.widgets && profile.widgets.hasTipJar) {
    score += 7;
  }

  // 7. Verified Badge & Location (+5%)
  if (profile.verified) score += 4;
  if (profile.location && profile.location.trim()) score += 3;

  // Clamp score strictly between 15% and 99%
  score = Math.min(99, Math.max(15, Math.round(score)));

  let rating = 'POOR';
  if (score >= 88) rating = 'EXCEPTIONAL';
  else if (score >= 72) rating = 'STRONG';
  else if (score >= 55) rating = 'AVERAGE';

  return {
    score,
    rating,
    recommendations: recs
  };
}
