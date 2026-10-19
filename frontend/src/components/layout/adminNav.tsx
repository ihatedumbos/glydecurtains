import type { ReactNode } from 'react';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import WebOutlinedIcon from '@mui/icons-material/WebOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

export interface AdminNavItem {
  label: string;
  path: string;
  icon: ReactNode;
  /** One line shown under the page title. */
  description: string;
  roles?: AdminRole[];
  /** Entity whose "read" permission is needed to see the item. */
  permissionEntity?: string;
}

export interface AdminNavGroup {
  label?: string;
  items: AdminNavItem[];
}

const MANAGERS: AdminRole[] = ['SUPER_ADMIN', 'ADMIN'];

/**
 * The site is a catalogue with WhatsApp enquiries, so the menu is about products and website
 * content. Order, invoice, stock and sales screens still exist but are left out of the menu.
 */
export const adminNav: AdminNavGroup[] = [
  {
    items: [
      { label: 'Overview', path: '/admin/dashboard', icon: <SpaceDashboardOutlinedIcon />, description: 'What needs your attention today', permissionEntity: 'dashboard' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Products', path: '/admin/products', icon: <Inventory2OutlinedIcon />, description: 'Photos, sizes, colours and prices', permissionEntity: 'products' },
      { label: 'Categories', path: '/admin/categories', icon: <CategoryOutlinedIcon />, description: 'How products are grouped on the site', permissionEntity: 'categories' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Enquiries', path: '/admin/enquiries', icon: <ForumOutlinedIcon />, description: 'Messages sent from the contact and quote forms', permissionEntity: 'enquiries' },
      { label: 'Reviews', path: '/admin/feedback', icon: <RateReviewOutlinedIcon />, description: 'Approve or hide customer reviews', permissionEntity: 'feedback' },
    ],
  },
  {
    label: 'Website',
    items: [
      { label: 'Home page', path: '/admin/cms', icon: <WebOutlinedIcon />, description: 'Announcement ticker and home page sections', permissionEntity: 'cms' },
      { label: 'Pages', path: '/admin/pages', icon: <ArticleOutlinedIcon />, description: 'About, Privacy and Terms pages', permissionEntity: 'cms' },
      { label: 'Achievements', path: '/admin/achievements', icon: <EmojiEventsOutlinedIcon />, description: 'The numbers shown on the Achievements page', permissionEntity: 'achievements' },
      { label: 'Store location', path: '/admin/stores', icon: <StorefrontOutlinedIcon />, description: 'Address, phone and opening hours', permissionEntity: 'stores' },
      { label: 'Business details', path: '/admin/settings', icon: <ContactPhoneOutlinedIcon />, description: 'Logo, contact details and announcement bar', roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'Staff logins', path: '/admin/employees', icon: <BadgeOutlinedIcon />, description: 'People who can sign in to this admin panel', roles: MANAGERS, permissionEntity: 'employees' },
      { label: 'Customer accounts', path: '/admin/users', icon: <PeopleOutlineIcon />, description: 'Visitors who registered on the site', roles: MANAGERS, permissionEntity: 'users' },
      { label: 'Permissions', path: '/admin/permissions', icon: <AdminPanelSettingsOutlinedIcon />, description: 'What each role is allowed to change', roles: MANAGERS, permissionEntity: 'permissions' },
      { label: 'Activity', path: '/admin/activity-logs', icon: <HistoryOutlinedIcon />, description: 'Who changed what, and when', roles: MANAGERS },
    ],
  },
];

/** Pages reachable by URL but not in the menu. */
const hiddenPages: Array<Pick<AdminNavItem, 'label' | 'path' | 'description'>> = [
  { label: 'Orders', path: '/admin/orders', description: 'Orders placed on the old shop checkout' },
  { label: 'Invoices', path: '/admin/invoices', description: 'Invoices for shop orders' },
  { label: 'Reports', path: '/admin/reports', description: 'Sales reports' },
  { label: 'Inventory', path: '/admin/inventory', description: 'Stock levels' },
  { label: 'Business details', path: '/admin/site-settings', description: 'Logo, contact details and announcement bar' },
  { label: 'Home page sections', path: '/admin/cms/sections', description: 'Sections from the previous home page design' },
];

export function findAdminPage(pathname: string): { label: string; description: string } | undefined {
  if (pathname === '/admin/products/new') return { label: 'Add a product', description: '' };
  if (/^\/admin\/products\/\d+/.test(pathname)) return { label: 'Edit product', description: '' };
  const all = [...adminNav.flatMap((group) => group.items), ...hiddenPages];
  return all.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
}
