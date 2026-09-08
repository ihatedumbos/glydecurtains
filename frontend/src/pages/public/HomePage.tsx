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
import TrustBar from '@/components/home/TrustBar';

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
  'HERO_BANNER',
  'POPULAR_CATEGORIES',
  'FEATURED',
  'RECENTLY_ADDED',
];

export default function HomePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [tickerImages, setTickerImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cmsLoadFailed, setCmsLoadFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchCmsData = async () => {
      try {
        const sectionsRes = await axiosInstance.get('/cms/public/sections');
        const sectionsData = sectionsRes.data?.data || sectionsRes.data || [];

        if (cancelled) return;
        setSections(sectionsData);
        setBanners(sectionsData.flatMap((section: HomepageSection & { banners?: Banner[] }) => section.banners || []));
        setCmsLoadFailed(false);
      } catch {
        // Genuine failure (network/server error) vs. a legitimately empty
        // configuration - tracked separately so we can offer a retry instead
        // of silently rendering a thinner page with no explanation.
        if (cancelled) return;
        setSections([]);
        setBanners([]);
        setCmsLoadFailed(true);
      }
    };

    const fetchTickerImages = async () => {
      try {
        const productsRes = await axiosInstance.get('/products/public', { params: { size: 3, page: 0 } });
        const products = productsRes.data?.data?.content || productsRes.data?.content || [];
        const images = products
          .map((product: { thumbnailUrl?: string }) => product.thumbnailUrl)
          .filter((url: string | undefined): url is string => Boolean(url));
        if (!cancelled) setTickerImages(images.slice(0, 3));
      } catch {
        if (!cancelled) setTickerImages([]);
      }
    };

    Promise.allSettled([fetchCmsData(), fetchTickerImages()]).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

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

  // Get ticker section config. Looked up from the unfiltered, enabled section
  // list rather than `enabledSections` (which only carries PRIORITY_SECTION_TYPES) -
  // the ticker renders separately at the top regardless of that priority filter.
  const tickerSection = sections.find((s) => s.isEnabled && s.sectionType === 'SCROLLING_TICKER');
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
      {cmsLoadFailed && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          <span>Some homepage content couldn&apos;t load.</span>
          <button
            type="button"
            onClick={() => setRetryToken((n) => n + 1)}
            className="font-semibold underline underline-offset-2 hover:text-amber-950"
          >
            Try again
          </button>
        </div>
      )}

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

      {/* Trust module: real store network + trade/bulk-buyer entry point */}
      {enabledSections.length > 0 && <TrustBar />}

      {/* Fallback: if no sections configured, show a compact version of the workshop world */}
      {enabledSections.length === 0 && (
        <>
          <section className="relative overflow-hidden bg-[#f4ede1] px-4 py-14 md:px-8 md:py-16">
            <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p
                  className="mb-3 text-2xl text-[#a06b3a]"
                  style={{ fontFamily: 'var(--font-annotation)' }}
                >
                  Cut to fit, since day one.
                </p>
                <h1 className="max-w-2xl font-display text-4xl leading-[1.08] text-[#2c2c2c] md:text-5xl">
                  Curtain track runners and fittings, made by us, backed by real stores.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#6b5d52] md:text-lg">
                  Precision hardware for every home, plus direct bulk pricing for installers and dealers.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="/products"
                    className="inline-flex rounded-sm bg-[#a06b3a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7a4f28]"
                  >
                    Shop now
                  </a>
                  <a
                    href="/about"
                    className="inline-flex rounded-sm border border-[#2c2c2c]/20 px-5 py-3 text-sm font-semibold text-[#2c2c2c] transition-colors hover:bg-[#2c2c2c]/5"
                  >
                    About us
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-sm border border-[#2c2c2c]/15 bg-[#faf5ea] p-3 shadow-[0_2px_10px_rgba(44,34,24,0.12)]">
                  <img
                    src={resolveMediaUrl('/assets/logo/poster.png')}
                    alt="Glyde Curtains hardware collection"
                    className="h-[330px] w-full rounded-[2px] object-cover"
                  />
                </div>
              </div>
            </div>
          </section>
          <ProductSection title="Featured Products" sectionType="FEATURED" />
          <ProductSection title="Recently Added" sectionType="RECENTLY_ADDED" />
          <TrustBar />
        </>
      )}
    </motion.div>
  );
}
