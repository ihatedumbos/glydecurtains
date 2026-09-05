import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';
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
  'RECENTLY_ADDED',
];

const PRIORITY_SECTION_TYPES: string[] = [
  'POPULAR_CATEGORIES',
  'FEATURED',
  'RECENTLY_ADDED',
];

export default function HomePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [tickerImages, setTickerImages] = useState<string[]>([]);
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
      }
    };

    const fetchTickerImages = async () => {
      try {
        const productsRes = await axiosInstance.get('/products/public', { params: { size: 3, page: 0 } });
        const products = productsRes.data?.data?.content || productsRes.data?.content || [];
        const images = products
          .map((product: { thumbnailUrl?: string }) => product.thumbnailUrl)
          .filter((url: string | undefined): url is string => Boolean(url));
        setTickerImages(images.slice(0, 3));
      } catch {
        setTickerImages([]);
      }
    };

    Promise.allSettled([fetchCmsData(), fetchTickerImages()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Keep the homepage concise and easier to browse.
  const enabledSections = sections
    .filter((s) => s.isEnabled && PRIORITY_SECTION_TYPES.includes(s.sectionType))
    .sort((a, b) => {
      const orderA = PRIORITY_SECTION_TYPES.indexOf(a.sectionType);
      const orderB = PRIORITY_SECTION_TYPES.indexOf(b.sectionType);
      return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB) || a.sortOrder - b.sortOrder;
    });

  // Get banners for a specific section
  const getBannersForSection = (sectionId: number) =>
    banners.filter((b) => b.sectionId === sectionId);

  // Get ticker section config
  const tickerSection = enabledSections.find((s) => s.sectionType === 'SCROLLING_TICKER');
  const fallbackTickerImages = tickerImages.length > 0
    ? tickerImages
    : ['/assets/logo/poster.png', '/assets/logo/poster.png', '/assets/logo/poster.png'];

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
      {(tickerSection || fallbackTickerImages.length > 0) && (
        <ScrollingTicker
          content={tickerSection?.config?.content as string | undefined}
          speed={tickerSection?.config?.speed as number | undefined}
          images={fallbackTickerImages}
        />
      )}

      {/* Render all sections in CMS sort order */}
      {enabledSections.map((section) => renderSection(section))}

      {/* Fallback: if no sections configured, show a compact royal-blue layout */}
      {enabledSections.length === 0 && (
        <>
          <section
            className="relative overflow-hidden px-4 py-14 text-white md:px-8 md:py-16"
            style={{
              background:
                'radial-gradient(circle at top, rgba(96,165,250,0.38), rgba(13,26,77,0.98) 38%, rgba(2,6,23,1) 100%)',
            }}
          >
            <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
                  Glyde Curtains • Premium Home Styling
                </p>
                <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  Beautiful curtains, hardware, and finishing touches for every room.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-blue-100 md:text-lg">
                  Discover elegant curtain styles, practical accessories, and designer-led essentials that blend function and comfort.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="/products"
                    className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-50"
                  >
                    Shop now
                  </a>
                  <a
                    href="/about"
                    className="inline-flex rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    About us
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-[28px] border border-white/15 bg-white/10 p-3 shadow-[0_35px_80px_rgba(37,99,235,0.35)] backdrop-blur-sm">
                  <img
                    src={resolveMediaUrl('/assets/logo/poster.png')}
                    alt="Glyde Curtains premium collection"
                    className="h-[330px] w-full rounded-[20px] object-cover"
                  />
                </div>
              </div>
            </div>
          </section>
          <ProductSection title="Featured Products" sectionType="FEATURED" />
          <ProductSection title="Recently Added" sectionType="RECENTLY_ADDED" />
        </>
      )}
    </motion.div>
  );
}
