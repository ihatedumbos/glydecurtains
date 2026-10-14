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
export default function HomePage() {
  const [tickerSection, setTickerSection] = useState<HomepageSection | undefined>();

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/cms/public/sections')
      .then((res) => {
        if (cancelled) return;
        const sections: HomepageSection[] = res.data?.data || res.data || [];
        setTickerSection(sections.find((s) => s.isEnabled && s.sectionType === 'SCROLLING_TICKER'));
      })
      // The ticker falls back to its default text when the CMS can't be reached.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#f3f5f6]"
    >
      <ScrollingTicker
        content={tickerSection?.config?.content as string | undefined}
        speed={tickerSection?.config?.speed as number | undefined}
      />
      <QuoteHero />
      <ProductTable />
      <StoreBand />
    </motion.div>
  );
}
