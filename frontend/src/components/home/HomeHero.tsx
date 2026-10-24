import { CONTACT, whatsappLink, useContact } from '@/config/contact';
import HomePhoto from '@/components/home/HomePhoto';
import { scrollToProducts } from '@/components/home/scrollToProducts';

const highlights = ['Factory direct', 'Bulk pricing for trade', 'Custom sizes on request'];

/** Top of the home page: the promise, two clear actions, and a photo of the work. */
export default function HomeHero() {
  useContact();

  return (
    <section className="border-b border-[#dbe1e4] bg-white">
      <div className="mx-auto grid max-w-[1280px] items-center gap-6 px-4 py-6 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:px-8 md:py-14">
        <div>
          <p className="font-mono text-xs tracking-wide text-[#a8400f] sm:text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
            MANUFACTURER · PUNE · PAN INDIA
          </p>
          <h1 className="mt-3 text-[clamp(30px,4.6vw,56px)] font-bold leading-[1.07] text-[#14232b]">
            Curtain track hardware, factory direct from Pune.
          </h1>
          <p className="mt-4 max-w-[560px] text-base leading-relaxed text-[#3c4c54] md:text-lg">
            Runners, brackets, end caps and tapes at manufacturer prices, for homes, dealers and installers. Pick what
            you need, add it to the cart, and send the order on WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#products"
              onClick={scrollToProducts}
              className="inline-flex min-h-[48px] items-center rounded-lg bg-[#a8400f] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#8a340c]"
            >
              Shop all products
            </a>
            <a
              href={whatsappLink('Hi Glyde, I would like a quote.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center rounded-lg bg-[#1a7f45] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#14663a]"
            >
              Quote on WhatsApp · {CONTACT.phoneDisplay}
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#14232b]">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="text-[#1a7f45]">
                  <path fill="currentColor" d="M10 1.7a8.3 8.3 0 1 0 0 16.6 8.3 8.3 0 0 0 0-16.6Zm3.9 6.2-4.6 4.9a.8.8 0 0 1-1.2 0L6 10.6a.8.8 0 1 1 1.2-1.1l1.5 1.6 4-4.3a.8.8 0 0 1 1.2 1.1Z" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative order-first md:order-none">
          <HomePhoto
            src="/home-photos/hero.jpg"
            alt="A curtain track being fitted in a bright living room"
            priority
            className="aspect-[16/11] w-full rounded-2xl shadow-[0_18px_44px_rgba(20,35,43,0.18)] md:aspect-[4/3.4]"
          />
          <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 px-4 py-3 shadow-[0_6px_20px_rgba(20,35,43,0.15)] backdrop-blur sm:right-auto sm:max-w-[320px] md:bottom-5 md:left-5">
            <p className="text-sm font-bold text-[#14232b]">Tell us what you need</p>
            <p className="text-[13px] text-[#4b5b63]">Get a quote on WhatsApp, usually the same day.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
