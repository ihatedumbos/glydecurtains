import { useState } from 'react';
import { CONTACT, whatsappLink } from '@/config/contact';

const highlights = [
  { title: 'Factory direct', detail: 'No middlemen' },
  { title: 'Bulk pricing', detail: 'For trade orders' },
  { title: 'Custom sizes', detail: 'On request' },
];

const inputClass =
  'min-h-[44px] w-full rounded-lg border-[1.5px] border-[#c7d0d5] bg-white px-3 py-2.5 text-base text-[#14232b] outline-none focus:border-[#a8400f]';

/**
 * Home page opener: who Glyde is for, plus a quote form that hands the request to WhatsApp
 * (the site takes no orders, so the form just pre-fills a chat message).
 */
export default function QuoteHero() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [need, setNeed] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const intro = [name.trim() && `I'm ${name.trim()}`, city.trim() && `from ${city.trim()}`].filter(Boolean).join(' ');
    const message = `Hi Glyde${intro ? `, ${intro}` : ''}. I need: ${need.trim()}`;
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="mx-auto grid max-w-[1280px] items-start gap-10 px-4 py-10 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:py-14">
      <div>
        <p className="font-mono text-sm tracking-wide text-[#a8400f]" style={{ fontFamily: 'var(--font-mono)' }}>
          MANUFACTURER · PUNE · PAN INDIA
        </p>
        <h1 className="mt-4 text-[clamp(32px,4.4vw,54px)] font-bold leading-[1.08] text-[#14232b]">
          Curtain track hardware for dealers, installers and homes.
        </h1>
        <p className="mt-5 max-w-[560px] text-lg leading-relaxed text-[#3c4c54]">
          Runners, brackets, end caps and tapes at manufacturer prices. Tell us what you need and get a quote
          on WhatsApp, usually the same day.
        </p>
        <div className="mt-7 grid max-w-[560px] grid-cols-3 gap-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-[10px] border border-[#dbe1e4] bg-white p-3 sm:p-4">
              <div className="font-bold text-[#14232b]">{item.title}</div>
              <div className="mt-1 text-sm text-[#4b5b63]">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        aria-labelledby="quote-heading"
        className="flex flex-col gap-4 rounded-2xl border border-[#dbe1e4] bg-white p-6 shadow-[0_10px_30px_rgba(20,35,43,0.08)] md:p-7"
      >
        <h2 id="quote-heading" className="text-[22px] font-bold text-[#14232b]">
          Get a quote on WhatsApp
        </h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="quote-name" className="text-sm font-semibold text-[#14232b]">
            Your name
          </label>
          <input id="quote-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="quote-city" className="text-sm font-semibold text-[#14232b]">
            City
          </label>
          <input id="quote-city" type="text" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="quote-need" className="text-sm font-semibold text-[#14232b]">
            What do you need?
          </label>
          <textarea
            id="quote-need"
            rows={3}
            required
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            placeholder="e.g. 500 Silent Runners, 100 Double Wall brackets"
            className={`${inputClass} resize-y`}
          />
        </div>
        <button
          type="submit"
          className="min-h-[48px] rounded-lg bg-[#1a7f45] px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-[#14663a]"
        >
          Send on WhatsApp
        </button>
        <p className="text-[13px] text-[#4b5b63]">
          Opens WhatsApp with your message filled in, to {CONTACT.phoneDisplay}.
        </p>
      </form>
    </section>
  );
}
