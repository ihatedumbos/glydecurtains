import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '@/api/axiosInstance';
import type { HomepageSection, Banner } from '@/store/slices/cmsSlice';
import {
  ScrollingTicker,
  HeroBannerSlider,
  PromotionalBanner,
  ProductSection,
  PopularCategories,
  CustomerTestimonials,
  BrandStory,
  AchievementsSection,
  NewsletterSection,
} from '@/components/cms';

type ProductSectionType =
  | 'FEATURED'
  | 'LATEST'
  | 'NEW_ARRIVALS'
  | 'BEST_SELLING'
  | 'TRENDING'
  | 'RECENTLY_ADDED'
  | 'RECOMMENDED'
  | 'FEATURED_ACCESSORIES'
  | 'SEASONAL'
  | 'PREMIUM_COLLECTIONS';

const PRODUCT_SECTION_TYPES: string[] = [
  'FEATURED',
  'LATEST',
  'NEW_ARRIVALS',
  'BEST_SELLING',
  'TRENDING',
  'RECENTLY_ADDED',
  'RECOMMENDED',
  'FEATURED_ACCESSORIES',
  'SEASONAL',
  'PREMIUM_COLLECTIONS',
];

export default function HomePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCmsData = async () => {
      try {
        const sectionsRes = await axiosInstance.get('/cms/public/sections');
        const sectionsData = sectionsRes.data?.data || sectionsRes.data || [];

        setSections(sectionsData);
        setBanners(sectionsData.flatMap((section: HomepageSection & { banners?: Banner[] }) => section.banners || []));
      } catch {
        // Graceful fallback — render with empty data
        setSections([]);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCmsData();
  }, []);

  // Sort enabled sections by sortOrder
  const enabledSections = sections
    .filter((s) => s.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Get banners for a specific section
  const getBannersForSection = (sectionId: number) =>
    banners.filter((b) => b.sectionId === sectionId);

  // Get ticker section config
  const tickerSection = enabledSections.find((s) => s.sectionType === 'SCROLLING_TICKER');

  const renderSection = (section: HomepageSection) => {
    const { sectionType, id, title, config } = section;

    switch (sectionType) {
      case 'SCROLLING_TICKER':
        // Rendered separately at the top
        return null;

      case 'HERO_BANNER':
        return <HeroBannerSlider key={id} banners={getBannersForSection(id)} />;

      case 'PROMO_BANNER':
        return <PromotionalBanner key={id} banners={getBannersForSection(id)} />;

      case 'POPULAR_CATEGORIES':
        return <PopularCategories key={id} title={title} />;

      case 'TESTIMONIALS':
        return <CustomerTestimonials key={id} title={title} />;

      case 'BRAND_STORY':
        return <BrandStory key={id} title={title} config={config} />;

      case 'ACHIEVEMENTS':
        return <AchievementsSection key={id} title={title} />;

      case 'NEWSLETTER':
        return <NewsletterSection key={id} title={title} />;

      default:
        if (PRODUCT_SECTION_TYPES.includes(sectionType)) {
          return (
            <ProductSection
              key={id}
              title={title}
              sectionType={sectionType as ProductSectionType}
            />
          );
        }
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* Scrolling Ticker at the very top */}
      {tickerSection && (
        <ScrollingTicker
          content={tickerSection.config?.content as string | undefined}
          speed={tickerSection.config?.speed as number | undefined}
        />
      )}

      {/* Render all sections in CMS sort order */}
      {enabledSections.map((section) => renderSection(section))}

      {/* Fallback: if no sections configured, show default layout */}
      {enabledSections.length === 0 && (
        <>
          <section className="border-b border-slate-200 bg-white px-4 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Glyde Curtains</p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Curtain hardware, made simple.</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Browse dependable runners, fittings, end caps and tapes for a clean, smooth curtain installation.
              </p>
              <a href="/products" className="mt-8 inline-flex rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
                Shop accessories
              </a>
            </div>
          </section>
          <PopularCategories title="Shop by category" />
          <ProductSection title="Popular accessories" sectionType="FEATURED" />
        </>
      )}
    </motion.div>
  );
}
