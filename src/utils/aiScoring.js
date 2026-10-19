export const PERSONA_TAGLINES = {
  actor_actress: [
    "🎭 Film, television, and theatre performer",
    "🎬 Actor and voiceover artist",
    "✨ Film and commercial performer"
  ],
  influencer: [
    "✨ Lifestyle, technology, and fitness creator",
    "🌴 Creating daily aesthetic moments, travel diaries & premium lifestyle guides",
    "⚡ Fitness, mindset, and lifestyle coaching"
  ],
  digital_marketer: [
    "🚀 Growth strategy for ecommerce brands",
    "📈 Performance marketing consultant",
    "💼 Fractional CMO | SEO, Paid Social & High-Conversion Funnel Architecture"
  ],
  musician: [
    "🎵 Electronic Music Producer & Live Performer | New Album 'Cosmic Echoes' Out Now!",
    "🎸 Indie Rock Songwriter & Multi-Instrumentalist | Currently Touring North America",
    "🎹 Ambient synth composer and electronic producer"
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
 * Heuristic profile completeness and engagement potential score.
 * This is not a trained model and does not represent measured performance.
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
    recs.push('Add a clear badge to highlight a time-sensitive or important link.');
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
    recs.push('Add a showreel or video so visitors can quickly understand your work.');
  }

  // 5. Lead Capture Newsletter (+10%)
  if (profile.widgets && profile.widgets.hasNewsletter) {
    score += 10;
  } else {
    recs.push('Enable newsletter signup if you want to collect subscriber emails.');
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
