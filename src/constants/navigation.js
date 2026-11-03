import { 
  LayoutGrid, 
  UserCheck, 
  Calendar, 
  BarChart3, 
  Share2, 
  Zap, 
  Globe 
} from '@/components/icons';

export const SIDEBAR_NAV_ITEMS = [
  {
    href: '/',
    label: 'Studio',
    sub: 'Visual Bio Builder',
    icon: LayoutGrid,
    matchExact: true,
  },
  {
    href: '/leads',
    label: 'Leads',
    sub: 'Contacts & CRM',
    icon: UserCheck,
  },
  {
    href: '/bookings',
    label: 'Bookings',
    sub: '1:1 Consultations',
    icon: Calendar,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    sub: 'Real-time Visitor Stats',
    icon: BarChart3,
  },
  {
    href: '/connectors',
    label: 'Connectors',
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
