import { whatsappLink, useContact } from '@/config/contact';
import HomePhoto from '@/components/home/HomePhoto';
import { scrollToProducts } from '@/components/home/scrollToProducts';

/** Two doors in: homeowners shopping the catalogue, and trade buyers asking for volume pricing. */
export default function AudienceSplit() {
  useContact();

  const cardClass =
    'group relative isolate flex min-h-[260px] flex-col justify-end overflow-hidden rounded-2xl text-white md:min-h-[320px]';

  return (
    <section aria-label="Who we supply" className="mx-auto grid max-w-[1440px] gap-4 px-3 py-6 md:grid-cols-2 md:gap-6 md:px-8 md:py-10">
      <article className={cardClass}>
        <HomePhoto
          src="/home-photos/homeowner.jpg"
          alt="A family relaxing in a living room with freshly hung curtains"
          className="absolute inset-0 -z-20 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d1a20]/90 via-[#0d1a20]/45 to-transparent" />
        <div className="p-5 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#ffb48a]">For your home</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Smooth, quiet curtains in every room</h2>
          <p className="mt-2 max-w-[460px] text-[15px] leading-relaxed text-[#e3eaed]">
            Runners, brackets and tapes to fit out the rooms you&apos;re working on.
          </p>
          <a
            href="#products"
            onClick={scrollToProducts}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-white px-5 py-2.5 font-bold text-[#14232b] hover:bg-[#eef2f4]"
          >
            Browse products
          </a>
        </div>
      </article>

      <article className={cardClass}>
        <HomePhoto
          src="/home-photos/trade.jpg"
          alt="An installer measuring a window for a curtain track"
          className="absolute inset-0 -z-20 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d1a20]/90 via-[#0d1a20]/45 to-transparent" />
        <div className="p-5 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8fe0b0]">For dealers and installers</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Buying in volume? Deal with the factory</h2>
          <p className="mt-2 max-w-[460px] text-[15px] leading-relaxed text-[#e3eaed]">
            Bulk pricing and custom sizes, straight from the manufacturer.
          </p>
          <a
            href={whatsappLink('Hi Glyde, I am a dealer/installer and would like bulk pricing.')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-[#25d366] px-5 py-2.5 font-bold text-[#0b2a17] hover:bg-[#1ebe5a]"
          >
            Ask for a trade quote
          </a>
        </div>
      </article>
    </section>
  );
}
