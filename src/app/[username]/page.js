import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import Profile from '@/models/Profile';
import CustomDomain from '@/models/CustomDomain';
import PublicBioView from '@/components/PublicBio/PublicBioView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to resolve profile by username or custom domain
async function resolveProfile(identifier, customDomainHeader) {
  let profile = null;
  const normalized = identifier?.toLowerCase()?.trim();

  try {
    await connectToDatabase();

    // 1. First check if identifier matches a direct creator profile
    profile = await Profile.findOne({ username: normalized }).lean();

    // 2. If not found, check if identifier is a custom domain hostname
    if (!profile && normalized?.includes('.')) {
      const domainDoc = await CustomDomain.findOne({
        hostname: normalized,
        verified: true,
      }).lean();

      if (domainDoc && domainDoc.username) {
        profile = await Profile.findOne({ username: domainDoc.username }).lean();
      }
    }

    // 3. If header indicates a custom domain, check that as well
    if (!profile && customDomainHeader) {
      const cleanHeaderDomain = customDomainHeader
        .toLowerCase()
        .trim()
        .replace(/^https?:\/\//i, '')
        .split('/')[0]
        .split(':')[0];

      const domainDoc = await CustomDomain.findOne({
        hostname: cleanHeaderDomain,
        verified: true,
      }).lean();

      if (domainDoc && domainDoc.username) {
        profile = await Profile.findOne({ username: domainDoc.username }).lean();
      }
    }
  } catch (err) {
    console.error('Error resolving profile in DB:', err);
  }

  return profile;
}

// Dynamic SEO & OpenGraph Meta Tags for Creator Profiles
export async function generateMetadata({ params }) {
  const { username } = await params;
  let customDomainHeader = null;
  try {
    const reqHeaders = await headers();
    customDomainHeader = reqHeaders.get('x-custom-domain');
  } catch {
    // headers() might not be available in all static render phases
  }

  const profile = await resolveProfile(username, customDomainHeader);

  if (!profile) {
    return {
      title: 'Profile Not Found | TreeInBio',
      description: 'The requested link-in-bio profile could not be found.',
    };
  }

  const titlePrefix = customDomainHeader ? `${profile.name || profile.title}` : `${profile.name || profile.title} (@${profile.username})`;

  return {
    title: `${titlePrefix} | TreeInBio`,
    description: profile.bio || `Explore links, videos, and portfolio for ${profile.name}`,
    openGraph: {
      title: `${titlePrefix}`,
      description: profile.bio,
      images: profile.avatar ? [{ url: profile.avatar }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titlePrefix}`,
      description: profile.bio,
      images: profile.avatar ? [profile.avatar] : [],
    },
  };
}

// Server Component fetching creator data
export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  let customDomainHeader = null;
  try {
    const reqHeaders = await headers();
    customDomainHeader = reqHeaders.get('x-custom-domain');
  } catch {
    // fallback if headers unavailable
  }

  const profile = await resolveProfile(username, customDomainHeader);
  const profileData = profile ? JSON.parse(JSON.stringify(profile)) : null;

  if (!profileData) {
    const isDomain = username?.includes('.') || Boolean(customDomainHeader);
    return (
      <div className="min-h-screen bg-[#FFFEFA] flex flex-col items-center justify-center p-6 text-center text-[#28352F]">
        <div className="w-14 h-14 rounded-full bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-center text-2xl mb-4 shadow-sm">
          🌲
        </div>
        <h1 className="font-sans text-2xl font-bold text-[#28352F] tracking-tight">
          {isDomain ? `${username || customDomainHeader} is not configured` : `@${username} is available!`}
        </h1>
        <p className="text-[#5C6B64] text-sm max-w-sm mt-2 leading-relaxed">
          {isDomain
            ? 'This custom domain is pointed to TreeInBio but has not been linked or verified to a creator profile yet.'
            : 'Nobody has claimed this TreeInBio link yet. Claim your custom bio page and start sharing your links today.'}
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-sm bg-[#52796F] hover:bg-[#3D5C54] text-white font-semibold text-xs tracking-wide transition-all shadow-sm"
        >
          {isDomain ? 'Configure in TreeInBio Studio' : `Claim @${username} Now`}
        </Link>
      </div>
    );
  }

  return (
    <PublicBioView
      profile={profileData}
      onBackToEditor={null}
    />
  );
}
