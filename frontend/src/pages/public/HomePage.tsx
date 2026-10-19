import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '@/api/axiosInstance';
import type { HomepageSection } from '@/store/slices/cmsSlice';
import { ScrollingTicker } from '@/components/cms';
import QuoteHero from '@/components/home/QuoteHero';
import ProductTable from '@/components/home/ProductTable';
import StoreBand from '@/components/home/StoreBand';

/**
 * Home page in the "dealer first" layout: a quote form up top, a filterable product table
 * with codes and prices, then the Pune store. Only the announcement ticker still comes from
 * the CMS, so it can be edited from the admin panel.
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
      <QuoteHero />
      <ProductTable />
      <StoreBand />
    </motion.div>
  );
}
