import LandingPage from '@/components/Landing/LandingPage';

// Shown at "/" to visitors who are not signed in (src/proxy.js rewrites to it).
export const metadata = {
  title: 'TreeInBio: one link for everything you create',
  description: 'Build a link-in-bio page with designer themes, live device previews, bookings, lead capture and analytics.',
};

export default async function WelcomePage({ searchParams }) {
  const params = await searchParams;
  const auth = typeof params?.auth === 'string' ? params.auth : '';
  const next = typeof params?.next === 'string' ? params.next : '';
  return <LandingPage initialAuth={auth} next={next} />;
}
