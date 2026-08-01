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
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Glyde Curtains</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
            Discover premium curtains, blinds, and accessories that transform your living spaces.
          </p>
        </div>
      )}
    </motion.div>
  );
}
