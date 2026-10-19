import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Building blocks shared by the admin pages, so every screen has the same header, panels and
 * tiles. Colours follow the storefront: slate #14232b, rust #a8400f, IBM Plex Sans.
 */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[#14232b] sm:text-[1.75rem]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-[#4b5b63]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className = '',
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-xl border border-[#14232b]/10 bg-white shadow-[0_1px_2px_rgba(20,35,43,0.04)] ${className}`}>
      {(title || actions) && (
        <header className="flex flex-col gap-2 border-b border-[#14232b]/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-[#14232b]">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-[#4b5b63]">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

type Tone = 'neutral' | 'good' | 'attention' | 'accent';

const toneStyles: Record<Tone, string> = {
  neutral: 'text-[#14232b]',
  good: 'text-[#1a7f45]',
  attention: 'text-[#b45309]',
  accent: 'text-[#a8400f]',
};

export function StatTile({ label, value, hint, tone = 'neutral', to }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; to?: string }) {
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#4b5b63]">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${toneStyles[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-sm text-[#4b5b63]">{hint}</p>}
    </>
  );
  const base = 'block rounded-xl border border-[#14232b]/10 bg-white p-5 shadow-[0_1px_2px_rgba(20,35,43,0.04)]';
  return to ? (
    <Link to={to} className={`${base} transition hover:border-[#a8400f]/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#a8400f]`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

const pillStyles: Record<Tone, string> = {
  neutral: 'bg-[#14232b]/6 text-[#14232b]',
  good: 'bg-[#1a7f45]/10 text-[#1a7f45]',
  attention: 'bg-[#b45309]/10 text-[#b45309]',
  accent: 'bg-[#a8400f]/10 text-[#a8400f]',
};

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${pillStyles[tone]}`}>{children}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[#14232b]/20 px-6 py-10 text-center">
      <p className="font-medium text-[#14232b]">{title}</p>
      {children && <div className="mt-1 text-sm text-[#4b5b63]">{children}</div>}
    </div>
  );
}
