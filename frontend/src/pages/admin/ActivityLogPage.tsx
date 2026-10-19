import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, MenuItem, Skeleton, TextField } from '@mui/material';
import axiosInstance from '@/api/axiosInstance';
import { EmptyState, PageHeader, Panel } from '@/components/admin/AdminUi';
import { describeActivity, parseServerTime } from '@/pages/admin/activityText';

interface Activity {
  id: number;
  userId?: number | null;
  userName?: string | null;
  actionType: string;
  entityType?: string | null;
  entityId?: number | null;
  details?: string | null;
  timestamp: string;
}

const FILTERS = [
  { value: 'PRODUCT', label: 'Product changes' },
  { value: 'USER', label: 'Sign-ins and accounts' },
  { value: '', label: 'Everything' },
];

const PAGE_SIZE = 30;

export default function ActivityLogPage() {
  const [entityType, setEntityType] = useState('PRODUCT');
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState<Activity[] | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setEntries(null);
    axiosInstance
      .get('/activity-logs', { params: { page, size: PAGE_SIZE, ...(entityType ? { entityType } : {}) } })
      .then((res) => {
        setEntries(res.data.data.content ?? []);
        setHasMore(!res.data.data.last);
      })
      .catch(() => setEntries([]));
  }, [entityType, page]);

  // Group by day so a long list stays readable.
  const days = new Map<string, Activity[]>();
  (entries ?? []).forEach((entry) => {
    const day = parseServerTime(entry.timestamp).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    days.set(day, [...(days.get(day) ?? []), entry]);
  });

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle="Who changed what in the admin panel, newest first."
        actions={
          <TextField select size="small" label="Show" value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(0); }} sx={{ minWidth: 220 }}>
            {FILTERS.map((filter) => <MenuItem key={filter.value} value={filter.value}>{filter.label}</MenuItem>)}
          </TextField>
        }
      />

      <Panel>
        {!entries ? (
          <Skeleton variant="rounded" height={200} />
        ) : entries.length === 0 ? (
          <EmptyState title="Nothing here yet">Changes will appear here as soon as someone makes them.</EmptyState>
        ) : (
          <div className="space-y-6">
            {[...days.entries()].map(([day, items]) => (
              <div key={day}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4b5b63]">{day}</h3>
                <ul className="divide-y divide-[#14232b]/8 rounded-lg border border-[#14232b]/8">
                  {items.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                      <span className="w-14 shrink-0 font-mono text-xs text-[#4b5b63]">
                        {parseServerTime(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{entry.userName || 'Someone'}</span> {describeActivity(entry)}
                      </span>
                      {entry.entityType === 'PRODUCT' && entry.entityId && entry.actionType !== 'PRODUCT_DELETED' && (
                        <Link to={`/admin/products/${entry.entityId}`} className="text-sm font-medium text-[#a8400f] hover:underline">Open</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {(page > 0 || hasMore) && (
          <div className="mt-5 flex justify-between">
            <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Newer</Button>
            <Button disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Older</Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
