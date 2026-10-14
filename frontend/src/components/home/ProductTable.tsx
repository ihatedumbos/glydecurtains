import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { productEnquiryLink } from '@/config/contact';

interface ProductRow {
  id: number;
  name: string;
  sku?: string;
  categoryName?: string;
  subCategoryId?: number | null;
  subCategoryName?: string;
  basePrice: number;
  offerPrice?: number | null;
  thumbnailUrl?: string;
}

interface SubCategory {
  id: number;
  name: string;
  isActive?: boolean;
}

interface CategoryNode {
  id: number;
  name: string;
  subCategories?: SubCategory[];
}

const ROW_LIMIT = 10;
const chipBase = 'rounded-full px-4 py-2.5 text-sm font-semibold transition-colors';

/**
 * Dealer-friendly product list for the home page: filter chips by product type and a
 * compact table with code, category and price, each row with its own WhatsApp enquiry.
 */
export default function ProductTable() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Only offer filters for product types that actually have products listed.
    Promise.all([
      axiosInstance.get('/categories/public/tree'),
      axiosInstance.get('/products/public', { params: { size: '200' } }),
    ])
      .then(([treeRes, productsRes]) => {
        const tree: CategoryNode[] = treeRes.data?.data || treeRes.data || [];
        const listed: ProductRow[] = (productsRes.data?.data || productsRes.data || {}).content || [];
        const listedIds = new Set(listed.map((p) => p.subCategoryId).filter((id) => id != null));
        const subs = tree
          .flatMap((c) => c.subCategories || [])
          .filter((sub) => sub.isActive !== false && listedIds.has(sub.id));
        setSubCategories(subs);
      })
      .catch(() => setSubCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string> = { sortBy: 'featured', size: String(ROW_LIMIT) };
    if (activeId !== null) params.subCategoryId = String(activeId);
    axiosInstance
      .get('/products/public', { params })
      .then((res) => {
        if (cancelled) return;
        const page = res.data?.data || res.data || {};
        setProducts(page.content || []);
        setTotal(page.totalElements ?? 0);
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
  }, [activeId]);

  const allLink = activeId !== null ? `/products?subCategoryId=${activeId}` : '/products';

  return (
    <section aria-labelledby="catalogue-heading" className="mx-auto max-w-[1280px] px-4 pb-14 md:px-8 md:pb-16">
      <h2 id="catalogue-heading" className="mb-4 text-2xl font-bold text-[#14232b]">
        Catalogue
      </h2>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by product type">
        <button
          type="button"
          aria-pressed={activeId === null}
          onClick={() => setActiveId(null)}
          className={`${chipBase} ${activeId === null ? 'bg-[#14232b] text-white' : 'border border-[#c7d0d5] bg-white text-[#14232b] hover:border-[#a8400f]'}`}
        >
          All
        </button>
        {subCategories.map((sub) => (
          <button
            key={sub.id}
            type="button"
            aria-pressed={activeId === sub.id}
            onClick={() => setActiveId(sub.id)}
            className={`${chipBase} ${activeId === sub.id ? 'bg-[#14232b] text-white' : 'border border-[#c7d0d5] bg-white text-[#14232b] hover:border-[#a8400f]'}`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#dbe1e4] bg-white">
        <div className="hidden grid-cols-[88px_2fr_1.2fr_1fr_140px] gap-4 border-b border-[#dbe1e4] px-5 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#4b5b63] md:grid">
          <span />
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span />
        </div>

        {loading && (
          <div className="px-5 py-10 text-center text-[#4b5b63]">Loading products…</div>
        )}
        {!loading && failed && (
          <div className="px-5 py-10 text-center text-[#4b5b63]">
            Products couldn&apos;t load right now. Please refresh, or message us on WhatsApp.
          </div>
        )}
        {!loading && !failed && products.length === 0 && (
          <div className="px-5 py-10 text-center text-[#4b5b63]">No products in this group yet.</div>
        )}

        {!loading &&
          products.map((product, idx) => {
            const price = product.offerPrice || product.basePrice;
            const category = product.subCategoryName || product.categoryName;
            return (
              <div
                key={product.id}
                className={`grid grid-cols-[64px_1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 md:grid-cols-[88px_2fr_1.2fr_1fr_140px] md:gap-4 md:px-5 ${idx < products.length - 1 ? 'border-b border-[#edf0f2]' : ''}`}
              >
                <Link to={`/products/${product.id}`} className="row-span-2 md:row-span-1" tabIndex={-1} aria-hidden="true">
                  <img
                    src={resolveMediaUrl(product.thumbnailUrl)}
                    alt=""
                    loading="lazy"
                    className="h-16 w-16 rounded-lg bg-[#edf0f2] object-cover md:h-[72px] md:w-[72px]"
                  />
                </Link>
                <div className="min-w-0">
                  <Link to={`/products/${product.id}`} className="block text-[17px] font-bold text-[#14232b] hover:text-[#a8400f]">
                    {product.name}
                  </Link>
                  {product.sku && (
                    <div className="truncate text-[13px] text-[#4b5b63]" style={{ fontFamily: 'var(--font-mono)' }}>
                      {product.sku}
                    </div>
                  )}
                  <div className="text-sm text-[#4b5b63] md:hidden">
                    {category} · <span className="font-bold text-[#14232b]">₹{price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <span className="hidden text-[#14232b] md:block">{category}</span>
                <span className="hidden font-bold text-[#14232b] md:block">₹{price.toLocaleString('en-IN')}</span>
                <a
                  href={productEnquiryLink(product, price)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="row-span-2 justify-self-end rounded-lg border-[1.5px] border-[#1a7f45] px-3.5 py-2.5 text-sm font-bold text-[#1a7f45] transition-colors hover:bg-[#1a7f45] hover:text-white md:row-span-1"
                >
                  Enquire
                </a>
              </div>
            );
          })}
      </div>

      {total > 0 && (
        <div className="mt-4 text-center">
          <Link to={allLink} className="font-bold text-[#a8400f] hover:text-[#7c2f0b]">
            See all {total} products
          </Link>
        </div>
      )}
    </section>
  );
}
