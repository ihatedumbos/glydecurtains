import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { Banner } from '@/store/slices/cmsSlice';
import { resolveMediaUrl } from '@/utils/mediaUrl';

interface HeroBannerSliderProps {
  banners: Banner[];
}

/** Resolve a banner's image: a real path (seeded catalogue photos) or literal base64/data URI. */
function resolveBannerImage(banner?: Banner): string | undefined {
  if (!banner?.imageBase64) return undefined;
  if (banner.imageBase64.startsWith('/')) return resolveMediaUrl(banner.imageBase64);
  if (banner.imageBase64.startsWith('data:')) return banner.imageBase64;
  return `data:image/jpeg;base64,${banner.imageBase64}`;
}

/** Hand-drawn chalk leader-line callouts pointing from the headline toward the product photo -
 * the raise that keeps the workshop world honestly about hardware, not fabric. */
function ChalkCallouts() {
  return (
    <svg
      viewBox="0 0 800 500"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <path
        d="M 60 120 C 140 100, 180 160, 250 150"
        fill="none"
        stroke="#2c2c2c"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="250" cy="150" r="4" fill="#2c2c2c" opacity="0.55" />
      <path
        d="M 90 340 C 160 360, 190 300, 260 300"
        fill="none"
        stroke="#2c2c2c"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="260" cy="300" r="4" fill="#2c2c2c" opacity="0.55" />
    </svg>
  );
}

export default function HeroBannerSlider({ banners }: HeroBannerSliderProps) {
  const [current, setCurrent] = useState(0);
  const activeBanners = banners.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  const next = useCallback(() => {
    if (activeBanners.length === 0) return;
    setCurrent((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const prev = useCallback(() => {
    if (activeBanners.length === 0) return;
    setCurrent((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next, activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const banner = activeBanners[current];
  const imageUrl = resolveBannerImage(banner);

  return (
    <div className="relative w-full overflow-hidden bg-[#f4ede1] group">
      {/* Pattern-paper grain */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.17  0 0 0 0 0.17  0 0 0 0 0.17  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:py-20 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-24"
        >
          <div>
            <p className="mb-4 font-annotation text-2xl text-[#a06b3a]" style={{ fontFamily: 'var(--font-annotation)' }}>
              Cut to fit, since day one.
            </p>
            <h1 className="max-w-xl font-display text-4xl leading-[1.08] text-[#2c2c2c] sm:text-5xl lg:text-6xl">
              {banner.title || 'Precision hardware, cut to fit your window'}
            </h1>
            {banner.subtitle && (
              <p className="mt-5 max-w-lg text-base leading-7 text-[#6b5d52] sm:text-lg">
                {banner.subtitle}
              </p>
            )}
            {banner.buttonText && banner.buttonLink && (
              <a
                href={banner.buttonLink}
                className="relative mt-8 inline-flex items-center gap-2 rounded-sm bg-[#a06b3a] px-6 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(44,34,24,0.15)] transition-colors hover:bg-[#7a4f28]"
              >
                {/* swing-tag notch */}
                <span
                  aria-hidden="true"
                  className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-[2px] border-l border-t border-[#f4ede1] bg-[#a06b3a]"
                />
                {banner.buttonText}
              </a>
            )}
          </div>

          <div className="relative">
            <ChalkCallouts />
            <div className="relative rounded-sm border border-[#2c2c2c]/15 bg-[#faf5ea] p-3 shadow-[0_2px_10px_rgba(44,34,24,0.12)]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={banner.title || 'Glyde curtain hardware, laid out for inspection'}
                  className="h-[280px] w-full rounded-[2px] object-cover sm:h-[340px]"
                />
              ) : (
                <div className="flex h-[280px] w-full items-center justify-center rounded-[2px] bg-[#efe6d4] text-sm text-[#6b5d52] sm:h-[340px]">
                  Glyde hardware
                </div>
              )}
            </div>
            <p
              className="absolute -bottom-3 right-6 rotate-[-2deg] text-lg text-[#2c2c2c]/70"
              style={{ fontFamily: 'var(--font-annotation)' }}
            >
              precision-fit runner
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[#2c2c2c]/15 bg-[#faf5ea]/90 p-2 text-[#2c2c2c] opacity-0 shadow-sm transition hover:bg-[#faf5ea] group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon fontSize="small" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[#2c2c2c]/15 bg-[#faf5ea]/90 p-2 text-[#2c2c2c] opacity-0 shadow-sm transition hover:bg-[#faf5ea] group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRightIcon fontSize="small" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === current ? 'w-6 bg-[#a06b3a]' : 'w-1.5 bg-[#2c2c2c]/25'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
