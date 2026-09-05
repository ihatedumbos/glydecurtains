import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { Banner } from '@/store/slices/cmsSlice';

interface HeroBannerSliderProps {
  banners: Banner[];
}

const makeDefaultHeroBackground = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#081a3a"/>
          <stop offset="45%" stop-color="#123a8a"/>
          <stop offset="100%" stop-color="#020817"/>
        </linearGradient>
        <radialGradient id="glow" cx="70%" cy="30%" r="45%">
          <stop offset="0%" stop-color="rgba(96,165,250,0.72)"/>
          <stop offset="100%" stop-color="rgba(96,165,250,0)"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bg)"/>
      <circle cx="1240" cy="210" r="340" fill="url(#glow)"/>
      <path d="M0 620 C 320 500, 520 520, 760 620 S 1270 760, 1600 610 L1600 900 L0 900 Z" fill="rgba(255,255,255,0.08)"/>
      <path d="M260 330 L420 160 L580 330 L580 740 L420 800 L260 740 Z" fill="rgba(255,255,255,0.08)"/>
      <path d="M640 280 L820 150 L980 280 L980 760 L820 830 L640 760 Z" fill="rgba(255,255,255,0.10)"/>
      <path d="M1040 330 L1220 160 L1400 330 L1400 740 L1220 800 L1040 740 Z" fill="rgba(255,255,255,0.08)"/>
      <text x="50%" y="50%" text-anchor="middle" font-size="64" font-family="Arial, sans-serif" font-weight="700" fill="rgba(255,255,255,0.72)">GLYDE CURTAINS</text>
    </svg>
  `;

  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
};

const getBannerBackground = (banner?: Banner) => {
  if (!banner) return makeDefaultHeroBackground();
  if (banner.imageBase64?.startsWith('data:')) return `url("${banner.imageBase64}")`;
  if (banner.imageBase64) return `url("data:image/jpeg;base64,${banner.imageBase64}")`;
  return makeDefaultHeroBackground();
};

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
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, activeBanners.length]);

  if (activeBanners.length === 0) {
    const fallbackBanner: Banner = {
      id: 0,
      sectionId: 0,
      title: 'New Collection Arrived',
      subtitle: 'Discover our latest designer curtain range',
      imageBase64: '',
      buttonText: 'Shop now',
      buttonLink: '/products',
      sortOrder: 0,
      isActive: true,
    };

    return (
      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden group">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: getBannerBackground(fallbackBanner) }} />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-3xl font-bold md:text-5xl lg:text-6xl drop-shadow-lg"
          >
            {fallbackBanner.title}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="mb-8 max-w-2xl text-lg md:text-xl lg:text-2xl drop-shadow"
          >
            {fallbackBanner.subtitle}
          </motion.p>
          <motion.a
            href={fallbackBanner.buttonLink}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="rounded-full bg-white px-8 py-3 font-semibold text-gray-900 shadow-lg transition-colors hover:bg-gray-100"
          >
            {fallbackBanner.buttonText}
          </motion.a>
        </div>
      </div>
    );
  }

  const banner = activeBanners[current];

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: getBannerBackground(banner) }}
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
            {banner.title && (
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg"
              >
                {banner.title}
              </motion.h1>
            )}
            {banner.subtitle && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-lg md:text-xl lg:text-2xl mb-8 max-w-2xl drop-shadow"
              >
                {banner.subtitle}
              </motion.p>
            )}
            {banner.buttonText && banner.buttonLink && (
              <motion.a
                href={banner.buttonLink}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                {banner.buttonText}
              </motion.a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRightIcon />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-3 h-3 rounded-full transition-all ${idx === current ? 'bg-white scale-110' : 'bg-white/50'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
