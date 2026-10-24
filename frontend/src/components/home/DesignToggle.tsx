import type { HomeDesign } from '@/components/home/useHomeDesign';

const options: { value: HomeDesign; label: string }[] = [
  { value: 'classic', label: 'Classic design' },
  { value: 'new', label: 'New design' },
];

/** Slim bar at the top of the home page for switching between the classic (default) and the new layout. */
export default function DesignToggle({ value, onChange }: { value: HomeDesign; onChange: (next: HomeDesign) => void }) {
  return (
    <div className="border-b border-[#dbe1e4] bg-[#eef2f4]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-end gap-3 px-3 py-1.5 md:px-8">
        <span className="hidden text-xs font-semibold text-[#4b5b63] sm:inline">Home page view</span>
        <div role="group" aria-label="Home page design" className="flex rounded-full border border-[#c7d0d5] bg-white p-0.5">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={value === o.value}
              onClick={() => onChange(o.value)}
              className={`min-h-[32px] rounded-full px-3.5 text-xs font-bold transition-colors ${
                value === o.value ? 'bg-[#14232b] text-white' : 'text-[#14232b] hover:bg-[#eef2f4]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
