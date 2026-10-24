import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '@/api/axiosInstance';
import type { HomepageSection } from '@/store/slices/cmsSlice';
import { ScrollingTicker } from '@/components/cms';
import QuoteHero from '@/components/home/QuoteHero';
import HomeProductGrid from '@/components/home/HomeProductGrid';
import { CONTACT, whatsappLink, useContact } from '@/config/contact';
import DesignToggle from '@/components/home/DesignToggle';
import { useHomeDesign } from '@/components/home/useHomeDesign';
import StoreBand from '@/components/home/StoreBand';
import HomeHero from '@/components/home/HomeHero';
import LayeredPages from '@/components/home/LayeredPages';
import AudienceSplit from '@/components/home/AudienceSplit';
import HowItWorks from '@/components/home/HowItWorks';

/**
 * Home page: a photo hero, the two audiences (homes and trade), every product as a large
 * shop-style card, how ordering works, then the WhatsApp quote form and the Pune store.
 * Only the announcement ticker still comes from the CMS, so it can be edited from the admin panel.
 */
/** The API sends a section's config as a JSON string; older data may already be an object. */
function tickerConfig(section?: HomepageSection): Record<string, unknown> {
  const config: unknown = section?.config;
  if (typeof config === 'string') {
    try {
      return JSON.parse(config) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (config as Record<string, unknown> | undefined) ?? {};
}

export default function HomePage() {
  const [tickerSection, setTickerSection] = useState<HomepageSection | undefined>();
  const [tickerHidden, setTickerHidden] = useState(false);
  const [design, setDesign] = useHomeDesign();

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/cms/public/sections')
      .then((res) => {
        if (cancelled) return;
        const sections: HomepageSection[] = res.data?.data || res.data || [];
        const section = sections.find((s) => s.sectionType === 'SCROLLING_TICKER');
        setTickerSection(section);
        setTickerHidden(section?.isEnabled === false);
      })
      // The ticker falls back to its default text when the CMS can't be reached.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const ticker = tickerConfig(tickerSection);
  useContact();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#f3f5f6]"
    >
      {!tickerHidden && (
        <ScrollingTicker
          content={typeof ticker.content === 'string' ? ticker.content : undefined}
          speed={typeof ticker.speed === 'number' ? ticker.speed : undefined}
        />
      )}
      <DesignToggle value={design} onChange={setDesign} />
      {design === 'new' ? (
        <LayeredPages
          under={<HomeHero />}
          over={
            <>
              <AudienceSplit />
              {/* scroll-mt clears the sticky site header when "Shop all products" jumps here. */}
              <div id="products" className="scroll-mt-16 md:scroll-mt-[76px]">
                <HomeProductGrid />
              </div>
              <HowItWorks />
              <QuoteHero />
              <StoreBand />
            </>
          }
        />
      ) : (
        <>
          <div className="border-b border-[#dbe1e4] bg-white">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-3 py-4 md:px-8">
              <div>
                <h1 className="text-lg font-bold text-[#14232b] md:text-2xl">Curtain track hardware, factory direct from Pune</h1>
                <p className="text-sm text-[#4b5b63] md:text-base">Pick what you need, add it to the cart, and send the order on WhatsApp.</p>
              </div>
              <a
                href={whatsappLink('Hi Glyde, I would like a quote.')}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[#1a7f45] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#14663a]"
              >
                Quote on WhatsApp · {CONTACT.phoneDisplay}
              </a>
            </div>
          </div>
          <HomeProductGrid />
          <QuoteHero />
          <StoreBand />
        </>
      )}
    </motion.div>
  );
}
