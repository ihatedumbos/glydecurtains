import { CONTACT } from '@/config/contact';

const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`;

/** Dark band closing the home page: where the Pune store is, with directions and a call button. */
export default function StoreBand() {
  return (
    <section className="bg-[#14232b] text-[#eef2f4]">
      <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-12 md:grid-cols-2 md:px-8 md:py-14">
        <div>
          <h2 className="text-3xl font-bold text-white">Visit our Pune store</h2>
          <p className="mt-3 text-[17px] leading-7 text-[#c9d3d8]">{CONTACT.address}</p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-white px-5 py-3.5 font-bold text-[#14232b] hover:bg-[#eef2f4]"
          >
            Get directions
          </a>
          <a
            href={`tel:+${CONTACT.whatsappNumber}`}
            className="rounded-lg bg-[#25d366] px-5 py-3.5 font-bold text-[#0b2a17] hover:bg-[#1ebe5a]"
          >
            Call {CONTACT.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
