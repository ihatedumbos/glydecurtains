import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';

interface ProductItem {
  id: number;
  name: string;
  basePrice: number;
  offerPrice?: number;
  discountPercentage?: number;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPremium?: boolean;
}

type SectionType =
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

interface ProductSectionProps {
  title?: string;
  sectionType: SectionType;
}

function getQueryParams(sectionType: SectionType): Record<string, string> {
  switch (sectionType) {
    case 'FEATURED':
      return { isFeatured: 'true', size: '8' };
    case 'LATEST':
      return { sortBy: 'createdAt', sortDirection: 'desc', size: '8' };
    case 'NEW_ARRIVALS':
      return { isNewArrival: 'true', size: '8' };
    case 'BEST_SELLING':
      return { isBestSeller: 'true', size: '8' };
    case 'TRENDING':
      return { isTrending: 'true', size: '8' };
    case 'RECENTLY_ADDED':
      return { sortBy: 'createdAt', sortDirection: 'desc', size: '8' };
    case 'RECOMMENDED':
      return { isFeatured: 'true', size: '8' };
    case 'FEATURED_ACCESSORIES':
      return { categoryId: '4', size: '8' }; // Accessories category
    case 'SEASONAL':
      return { isFeatured: 'true', size: '8' };
    case 'PREMIUM_COLLECTIONS':
      return { isPremium: 'true', size: '8' };
    default:
      return { size: '8' };
  }
}

export default function ProductSection({ title, sectionType }: ProductSectionProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = getQueryParams(sectionType);
    axiosInstance
     .get('/products/public', { params })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data?.content || res.data?.content || [];
        setProducts(data);
        setFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sectionType, retryToken]);

  const displayTitle = title || sectionType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <section className="bg-[#f4ede1] px-4 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center font-display text-2xl text-[#2c2c2c] md:text-3xl">{displayTitle}</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 rounded-sm bg-[#e8dfcd]" />
                <div className="mt-3 h-4 w-3/4 rounded bg-[#e8dfcd]" />
                <div className="mt-2 h-4 w-1/2 rounded bg-[#e8dfcd]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (failed) {
    return (
      <section className="bg-[#f4ede1] px-4 py-12 text-center md:px-8">
        <p className="text-sm text-[#6b5d52]">Couldn&apos;t load {displayTitle.toLowerCase()} right now.</p>
        <button
          type="button"
          onClick={() => setRetryToken((n) => n + 1)}
          className="mt-2 text-sm font-semibold text-[#a06b3a] underline underline-offset-2 hover:text-[#7a4f28]"
        >
          Try again
        </button>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-[#f4ede1] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between border-b border-[#2c2c2c]/15 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b5d52]">Glyde accessories</p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-1 font-display text-2xl text-[#2c2c2c] md:text-3xl"
            >
              {displayTitle}
            </motion.h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-[#6b5544] hover:text-[#2c2c2c]">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <Link
                to={`/products/${product.id}`}
                className="group block overflow-hidden rounded-sm border border-[#2c2c2c]/12 bg-[#faf5ea] shadow-[0_1px_2px_rgba(44,34,24,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(44,34,24,0.14)]"
              >
                <div className="relative h-60 overflow-hidden bg-[#efe6d4] p-3">
                  {product.thumbnailUrl ? (
                    <img
                      src={resolveMediaUrl(product.thumbnailUrl) || '/assets/logo/poster.png'}
                      alt={product.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src="/assets/logo/poster.png"
                      alt={product.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <span className="absolute left-2 top-2 rounded-sm bg-[#a13a2e] px-2 py-1 text-xs font-bold text-white">
                      -{product.discountPercentage}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate text-sm font-semibold text-[#2c2c2c]">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-[#2c2c2c]">
                      ₹{product.offerPrice || product.basePrice}
                    </span>
                    {product.offerPrice && product.offerPrice < product.basePrice && (
                      <span className="text-sm text-[#a08b78] line-through">₹{product.basePrice}</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
