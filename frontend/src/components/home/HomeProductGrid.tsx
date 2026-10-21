import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { productEnquiryLink, useContact } from '@/config/contact';
import { formatPrice, sizeNumber } from '@/utils/price';
import { addToOrderCart } from '@/store/slices/orderCartSlice';

interface ProductTile {
  id: number;
  name: string;
  sku?: string;
  categoryName?: string;
  subCategoryName?: string;
  colors?: string[];
  sizes?: string[];
  basePrice: number;
  offerPrice?: number | null;
  thumbnailUrl?: string;
  variantCount?: number;
}

const groupOf = (p: ProductTile) => p.subCategoryName || p.categoryName || 'Other';

/**
 * Every listed product on the home page as large shop-style cards (photos first, as the
 * "featured" sort returns them), each with its own Add to cart.
 */
export default function HomeProductGrid() {
  useContact();
  const [products, setProducts] = useState<ProductTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [group, setGroup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/products/public', { params: { sortBy: 'featured', size: '500' } })
      .then((res) => {
        if (cancelled) return;
        const page = res.data?.data || res.data || {};
        setProducts(page.content || []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Product types in the order their first product appears, so groups with photos lead.
  const groups = useMemo(() => {
    const map = new Map<string, ProductTile[]>();
    products.forEach((p) => {
      const key = groupOf(p);
      map.set(key, [...(map.get(key) || []), p]);
    });
    return [...map.entries()];
  }, [products]);

  const visible = group ? products.filter((p) => groupOf(p) === group) : products;

  const status = loading ? (
    <p className="py-16 text-center text-[#4b5b63]">Loading products…</p>
  ) : failed ? (
    <p className="py-16 text-center text-[#4b5b63]">
      Products couldn&apos;t load right now. Please refresh, or message us on WhatsApp.
    </p>
  ) : null;

  return (
    <section aria-labelledby="catalogue-heading" className="mx-auto max-w-[1440px] px-3 pb-14 pt-5 md:px-8 md:pt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="catalogue-heading" className="text-2xl font-bold text-[#14232b] md:text-3xl">
          Our products
        </h2>
        {!loading && !failed && (
          <span className="text-sm text-[#4b5b63]">{visible.length} products</span>
        )}
      </div>
      <div className="sticky top-16 md:top-[76px] z-10 -mx-3 mb-4 bg-[#f3f5f6]/95 px-3 py-2.5 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by product type">
          <Chip active={group === null} onClick={() => setGroup(null)} label="All" count={products.length} />
          {groups.map(([name, items]) => (
            <Chip key={name} active={group === name} onClick={() => setGroup(name)} label={name} count={items.length} />
          ))}
        </div>
      </div>
      {status}
      <div
        className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-5'
      >
        {visible.map((p) => (
          <Card key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-[#14232b] text-white' : 'border border-[#c7d0d5] bg-white text-[#14232b] hover:border-[#a8400f]'
      }`}
    >
      {label} <span className={active ? 'text-[#c9d3d8]' : 'text-[#6b7b83]'}>{count}</span>
    </button>
  );
}

function Card({ product }: { product: ProductTile }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);
  const price = product.offerPrice || product.basePrice;
  // The listed price is for the default option: smallest size, first colour.
  const size = [...(product.sizes || [])].sort((a, b) => sizeNumber(a) - sizeNumber(b))[0];
  const color = product.colors?.[0];
  const option = [size, color].filter(Boolean).join(' · ');
  // Products priced per size/colour variant need a choice on their page first.
  const needsChoice = (product.variantCount ?? 0) > 0;
  const href = `/products/${product.id}`;
  const image = resolveMediaUrl(product.thumbnailUrl) || '/assets/logo/poster.png';

  const add = () => {
    dispatch(
      addToOrderCart({
        productId: product.id,
        name: product.name,
        size: size ?? null,
        color: color ?? null,
        unitPrice: price || 0,
        quantity: 1,
        imageUrl: image.startsWith('data:') ? null : image,
      }),
    );
    setAdded(true);
  };

  const btn =
    'flex min-h-[42px] flex-1 items-center justify-center rounded-lg px-2 text-sm font-bold transition-colors';

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-xl border border-[#dbe1e4] bg-white shadow-[0_2px_10px_rgba(20,35,43,0.05)] transition-shadow hover:shadow-[0_10px_28px_rgba(20,35,43,0.12)]"
    >
      <Link to={href} className="block overflow-hidden bg-white">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className={`aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]`}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#a8400f]">{groupOf(product)}</span>
        <Link
          to={href}
          className={`line-clamp-2 font-bold leading-snug text-[#14232b] hover:text-[#a8400f] text-[15px] md:text-base`}
        >
          {product.name}
        </Link>
        {option && <span className="text-sm text-[#3c4c54]">{option}</span>}
        <span className={`mt-auto pt-1 font-bold text-[#14232b] text-base md:text-lg`}>
          {formatPrice(price)}
        </span>
        <div className="mt-2 flex gap-2">
          {needsChoice ? (
            <Link to={href} className={`${btn} border-[1.5px] border-[#14232b] text-[#14232b] hover:bg-[#14232b] hover:text-white`}>
              Choose size
            </Link>
          ) : added ? (
            <Link to="/cart" className={`${btn} bg-[#14232b] text-white`}>
              In cart · View
            </Link>
          ) : (
            <button type="button" onClick={add} className={`${btn} bg-[#a8400f] text-white hover:bg-[#8a340c]`}>
              Add to cart
            </button>
          )}
          <a
            href={productEnquiryLink(product, price)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ask about ${product.name} on WhatsApp`}
            className="flex min-h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#1a7f45] text-[#1a7f45] hover:bg-[#1a7f45] hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2C2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2C18.1 1.3 15.2.1 12 .1 5.5.1.1 5.5.1 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
