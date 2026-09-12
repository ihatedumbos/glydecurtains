import { motion } from 'framer-motion';
import type { Banner } from '@/store/slices/cmsSlice';

interface PromotionalBannerProps {
  banners: Banner[];
}

export default function PromotionalBanner({ banners }: PromotionalBannerProps) {
  const activeBanners = banners.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  if (activeBanners.length === 0) return null;

  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeBanners.slice(0, 2).map((banner, idx) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2, duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(data:image/jpeg;base64,${banner.imageBase64})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="relative z-10 flex flex-col justify-end h-full p-6 text-white">
              {banner.title && <h3 className="text-xl font-bold mb-1">{banner.title}</h3>}
              {banner.subtitle && <p className="text-sm opacity-90 mb-3">{banner.subtitle}</p>}
              {banner.buttonText && banner.buttonLink && (
                <a
                  href={banner.buttonLink}
                  className="inline-block px-5 py-2 bg-[#faf5ea] text-[#2c2c2c] text-sm font-medium rounded-full hover:bg-[#f4ede1] transition-colors w-fit"
                >
                  {banner.buttonText}
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
