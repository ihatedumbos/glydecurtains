interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stockQuantity: number;
  thumbnailUrl?: string | null;
}

interface LowStockAlertsProps {
  products: LowStockProduct[];
  loading?: boolean;
}

function getStockLevel(qty: number): { label: string; color: string } {
  if (qty === 0) return { label: 'Out of stock', color: 'text-[#a13a2e] bg-[#a13a2e]/10' };
  if (qty <= 5) return { label: 'Critical', color: 'text-[#b5895a] bg-[#b5895a]/15' };
  return { label: 'Low', color: 'text-[#8a6d5a] bg-[#8a6d5a]/15' };
}

export default function LowStockAlerts({ products, loading = false }: LowStockAlertsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded bg-[#e8dfcd]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[#e8dfcd] rounded w-2/3" />
              <div className="h-2 bg-[#e8dfcd] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[#8a7a6b] text-sm">
        All products are well stocked
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {products.map((product) => {
        const level = getStockLevel(product.stockQuantity);
        return (
          <div
            key={product.id}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-[#2c2c2c]/10 hover:bg-[#f4ede1] transition-colors"
          >
            <div className="w-10 h-10 rounded bg-[#f4ede1] flex items-center justify-center text-lg">
              📦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2c2c2c] truncate">
                {product.name}
              </p>
              <p className="text-xs text-[#8a7a6b]">
                SKU: {product.sku}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-semibold text-[#2c2c2c]">
                {product.stockQuantity}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${level.color}`}>
                {level.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
