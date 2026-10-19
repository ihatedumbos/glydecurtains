import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, FormControlLabel, IconButton, Skeleton, Switch, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import axiosInstance from '@/api/axiosInstance';
import { PageHeader, Panel } from '@/components/admin/AdminUi';
import ScrollingTicker, { DEFAULT_TICKER_CONTENT } from '@/components/cms/ScrollingTicker';

interface Section {
  id: number;
  sectionType: string;
  title: string;
  isEnabled: boolean;
  sortOrder: number;
  config?: Record<string, unknown> | string | null;
}

function readConfig(config: Section['config']): Record<string, unknown> {
  if (!config) return {};
  if (typeof config === 'string') {
    try { return JSON.parse(config); } catch { return {}; }
  }
  return config;
}

const splitMessages = (text: string) => text.split('|').map((m) => m.trim()).filter(Boolean);

/** The parts of the home page that fill themselves from other admin screens. */
const AUTOMATIC_PARTS = [
  { title: 'Quote form', text: 'Sends the customer straight to WhatsApp with their request filled in.', to: '/admin/settings', link: 'Change the WhatsApp number' },
  { title: 'Product table', text: 'Lists every product that is switched on, with its code and price.', to: '/admin/products', link: 'Manage products' },
  { title: 'Pune store', text: 'Shows the shop address, phone and directions.', to: '/admin/settings', link: 'Change contact details' },
];

export default function HomePageEditorPage() {
  const [ticker, setTicker] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [speed, setSpeed] = useState(50);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    axiosInstance.get('/cms/sections')
      .then((res) => {
        const sections: Section[] = res.data.data ?? [];
        const section = sections.find((s) => s.sectionType === 'SCROLLING_TICKER') ?? null;
        setTicker(section);
        const config = readConfig(section?.config ?? null);
        setMessages(splitMessages(typeof config.content === 'string' && config.content ? config.content : DEFAULT_TICKER_CONTENT));
        setSpeed(typeof config.speed === 'number' ? config.speed : 50);
        setEnabled(section?.isEnabled ?? true);
      })
      .catch(() => setNotice({ type: 'error', text: 'Could not load the home page settings.' }))
      .finally(() => setLoading(false));
  }, []);

  const content = messages.map((m) => m.trim()).filter(Boolean).join(' | ');

  const save = async () => {
    if (!ticker) return;
    setSaving(true);
    setNotice(null);
    try {
      const config = { ...readConfig(ticker.config ?? null), content, speed };
      await axiosInstance.put(`/cms/sections/${ticker.id}`, {
        title: ticker.title,
        isEnabled: enabled,
        sortOrder: ticker.sortOrder,
        config: JSON.stringify(config),
      });
      setTicker({ ...ticker, isEnabled: enabled, config });
      setNotice({ type: 'success', text: 'Saved. The website shows the new announcement now.' });
    } catch {
      setNotice({ type: 'error', text: 'Could not save. Nothing on the website has changed.' });
    } finally {
      setSaving(false);
    }
  };

  const move = (index: number, delta: number) => {
    const next = [...messages];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setMessages(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home page"
        subtitle="The scrolling announcement is the only part you write by hand. The rest of the home page fills itself from your products and contact details."
        actions={<Button href="/" target="_blank" rel="noreferrer">Open the home page</Button>}
      />

      {notice && <Alert severity={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Panel
        title="Scrolling announcement"
        description="The dark strip at the very top of the home page. Each line scrolls past one after another."
        actions={<FormControlLabel control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />} label={enabled ? 'Shown' : 'Hidden'} />}
      >
        {loading ? (
          <Skeleton variant="rounded" height={160} />
        ) : (
          <>
            <div className="mb-5 overflow-hidden rounded-lg border border-[#14232b]/10">
              <p className="bg-[#f7f8f9] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-[#4b5b63]">Preview</p>
              <div className={enabled ? '' : 'opacity-40'}>
                <ScrollingTicker content={content || ' '} speed={speed} />
              </div>
            </div>

            <ol className="space-y-2">
              {messages.map((message, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 text-right font-mono text-xs text-[#4b5b63]">{i + 1}</span>
                  <TextField size="small" fullWidth value={message} onChange={(e) => setMessages((m) => m.map((x, j) => (j === i ? e.target.value.replace(/\|/g, '') : x)))} inputProps={{ 'aria-label': `Line ${i + 1}` }} />
                  <IconButton size="small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUpwardIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => move(i, 1)} disabled={i === messages.length - 1} aria-label="Move down"><ArrowDownwardIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setMessages((m) => m.filter((_, j) => j !== i))} aria-label="Remove line"><CloseIcon fontSize="small" /></IconButton>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Button size="small" onClick={() => setMessages((m) => [...m, ''])}>Add a line</Button>
              <label className="flex items-center gap-3 text-sm text-[#4b5b63]">
                Speed
                <input type="range" min={20} max={120} step={10} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="accent-[#a8400f]" />
              </label>
            </div>
            <div className="mt-5 flex justify-end border-t border-[#14232b]/8 pt-4">
              <Button variant="contained" onClick={save} disabled={saving || !ticker}>{saving ? 'Saving…' : 'Save announcement'}</Button>
            </div>
          </>
        )}
      </Panel>

      <Panel title="The rest of the home page" description="These update on their own when you change products or contact details.">
        <ul className="grid gap-3 md:grid-cols-3">
          {AUTOMATIC_PARTS.map((part) => (
            <li key={part.title} className="flex flex-col rounded-lg border border-[#14232b]/10 p-4">
              <p className="font-medium">{part.title}</p>
              <p className="mt-1 flex-1 text-sm text-[#4b5b63]">{part.text}</p>
              <Link to={part.to} className="mt-3 inline-flex items-center text-sm font-medium text-[#a8400f] hover:underline">
                {part.link} <ChevronRightIcon sx={{ fontSize: 18 }} />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[#4b5b63]">
          The About, Privacy and Terms pages are edited under <Link to="/admin/pages" className="font-medium text-[#a8400f] hover:underline">Pages</Link>.
        </p>
      </Panel>
    </div>
  );
}
