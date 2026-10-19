import { 
  LayoutGrid, 
  UserCheck, 
  Calendar, 
  BarChart3, 
  Share2, 
  Zap, 
  Globe 
} from 'lucide-react';

export const SIDEBAR_NAV_ITEMS = [
  {
    href: '/',
    label: 'Studio & Links',
    sub: 'Visual Bio Builder',
    icon: LayoutGrid,
    matchExact: true,
  },
  {
    href: '/leads',
    label: 'Lead Capture',
    sub: 'Contacts & CRM',
    icon: UserCheck,
  },
  {
    href: '/bookings',
    label: 'Bookings & Meetings',
    sub: '1:1 Consultations',
    icon: Calendar,
  },
  {
    href: '/analytics',
    label: 'Analytics & Traffic',
    sub: 'Real-time Visitor Stats',
    icon: BarChart3,
  },
  {
    href: '/connectors',
    label: 'Connectors Hub',
    sub: 'Google Drive, Calendar & Socials',
    icon: Share2,
  },
  {
    href: '/domains',
    label: 'Custom Domains',
    sub: 'Branded URLs & SSL',
    icon: Globe,
  },
];
