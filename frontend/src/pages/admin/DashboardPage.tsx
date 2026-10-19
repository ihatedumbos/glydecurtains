import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Skeleton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import axiosInstance from '@/api/axiosInstance';
import { useAppSelector } from '@/store/hooks';
import { EmptyState, PageHeader, Panel, Pill, StatTile } from '@/components/admin/AdminUi';
import { describeActivity, timeAgo } from '@/pages/admin/activityText';

interface ProductRow { id: number; name: string; status: string; basePrice: number; imageCount?: number; }
interface Enquiry { id: number; name: string; phone?: string; email?: string; subject?: string; message?: string; status: string; createdAt: string; }
interface Achievement { id: number; title: string; metricValue: string; }
interface Activity { id: number; userName?: string | null; actionType: string; entityType?: string | null; entityId?: number | null; details?: string | null; timestamp: string; }

/** Figures from the original demo data; real ones still need to come from the owner. */
const DEMO_ACHIEVEMENT_VALUES = new Set(['10000+', '50000+', '9+', '150+', '98%']);

/** wa.me link for a customer's phone number (Indian numbers without a country code get +91). */
function customerWhatsApp(phone?: string, name?: string): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const number = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hi ${name || ''}, this is Glyde Curtains replying to your enquiry.`)}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [enquiries, setEnquiries] = useState<{ total: number; items: Enquiry[] } | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activity, setActivity] = useState<Activity[] | null>(null);

  useEffect(() => {
    axiosInstance.get('/products', { params: { page: 0, size: 500 } })
      .then((res) => setProducts(res.data.data.content ?? []))
      .catch(() => setProducts([]));
    axiosInstance.get('/enquiries', { params: { status: 'NEW', page: 0, size: 5 } })
      .then((res) => setEnquiries({ total: res.data.data.totalElements ?? 0, items: res.data.data.content ?? [] }))
      .catch(() => setEnquiries({ total: 0, items: [] }));
    axiosInstance.get('/achievements')
      .then((res) => setAchievements(res.data.data ?? []))
      .catch(() => setAchievements([]));
    axiosInstance.get('/activity-logs', { params: { page: 0, size: 6, entityType: 'PRODUCT' } })
      .then((res) => setActivity(res.data.data.content ?? []))
      .catch(() => setActivity([]));
  }, []);

  const live = products?.filter((p) => p.status === 'ACTIVE').length ?? 0;
  const hidden = products ? products.length - live : 0;
  const noPhoto = products?.filter((p) => (p.imageCount ?? 0) === 0).length ?? 0;
  const noPrice = products?.filter((p) => !p.basePrice || p.basePrice <= 0).length ?? 0;
  const demoAchievements = achievements.filter((a) => DEMO_ACHIEVEMENT_VALUES.has(String(a.metricValue).replace(/,/g, ''))).length;

  const checklist = [
    {
      done: noPhoto === 0,
      title: noPhoto === 0 ? 'Every product has a photo' : `Add photos to ${noPhoto} product${noPhoto === 1 ? '' : 's'}`,
      hint: 'They show a “Photo coming soon” picture until you do.',
      to: '/admin/products?show=no-photo',
    },
    {
      done: noPrice === 0,
      title: noPrice === 0 ? 'Every product has a price' : `Set prices for ${noPrice} product${noPrice === 1 ? '' : 's'}`,
      hint: 'They show “Price on request” and customers ask on WhatsApp.',
      to: '/admin/products?show=no-price',
    },
    {
      done: demoAchievements === 0,
      title: demoAchievements === 0 ? 'Achievement numbers are your own' : 'Replace the sample achievement numbers',
      hint: 'Customers, cities and years figures still come from the demo data.',
      to: '/admin/achievements',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        subtitle="Here's what's on the website right now and what still needs doing."
        actions={
          <>
            <Button component={Link} to="/admin/cms" variant="outlined">Edit announcement</Button>
            <Button component={Link} to="/admin/products/new" variant="contained" startIcon={<AddIcon />}>Add a product</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="On the website" value={products ? live : '–'} hint={hidden ? `${hidden} hidden` : 'products listed'} to="/admin/products" />
        <StatTile label="New enquiries" value={enquiries ? enquiries.total : '–'} hint="waiting for a reply" tone={enquiries?.total ? 'accent' : 'neutral'} to="/admin/enquiries" />
        <StatTile label="Need photos" value={products ? noPhoto : '–'} hint="show “coming soon”" tone={noPhoto ? 'attention' : 'good'} to="/admin/products?show=no-photo" />
        <StatTile label="Price on request" value={products ? noPrice : '–'} hint="no price set" tone={noPrice ? 'attention' : 'good'} to="/admin/products?show=no-price" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title="New enquiries"
          description="Messages from the contact and quote forms. Reply on WhatsApp in one tap."
          actions={<Button component={Link} to="/admin/enquiries" size="small">See all</Button>}
        >
          {!enquiries ? (
            <Skeleton variant="rounded" height={120} />
          ) : enquiries.items.length === 0 ? (
            <EmptyState title="No new enquiries">Most customers message you on WhatsApp directly.</EmptyState>
          ) : (
            <ul className="-my-3 divide-y divide-[#14232b]/8">
              {enquiries.items.map((enquiry) => {
                const wa = customerWhatsApp(enquiry.phone, enquiry.name);
                return (
                  <li key={enquiry.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {enquiry.name}
                        <span className="text-xs font-normal text-[#4b5b63]">{timeAgo(enquiry.createdAt)}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-[#4b5b63]">{enquiry.subject ? `${enquiry.subject}: ` : ''}{enquiry.message}</p>
                    </div>
                    {wa ? (
                      <Button size="small" variant="outlined" color="success" href={wa} target="_blank" rel="noreferrer" startIcon={<WhatsAppIcon />}>Reply</Button>
                    ) : (
                      <Button size="small" component={Link} to="/admin/enquiries">Open</Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-2" title="Before customers see it" description="Things that still show sample or missing content.">
          <ul className="-my-1 space-y-1">
            {checklist.map((item) => (
              <li key={item.title}>
                <Link to={item.to} className="flex gap-3 rounded-lg p-2 hover:bg-[#14232b]/4">
                  {item.done ? (
                    <CheckCircleIcon sx={{ color: '#1a7f45', fontSize: 22 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ color: '#b45309', fontSize: 22 }} />
                  )}
                  <span className="min-w-0">
                    <span className={`block text-sm font-medium ${item.done ? 'text-[#4b5b63]' : ''}`}>{item.title}</span>
                    {!item.done && <span className="block text-xs text-[#4b5b63]">{item.hint}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Recent product changes"
        actions={<Button component={Link} to="/admin/activity-logs" size="small">Full activity</Button>}
      >
        {!activity ? (
          <Skeleton variant="rounded" height={80} />
        ) : activity.length === 0 ? (
          <EmptyState title="No changes yet">Edits to products will be listed here with who made them.</EmptyState>
        ) : (
          <ul className="-my-2 divide-y divide-[#14232b]/8">
            {activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium">{entry.userName || 'Someone'}</span> {describeActivity(entry)}
                </span>
                <Pill>{timeAgo(entry.timestamp)}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
