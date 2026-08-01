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
  if (qty === 0) return { label: 'Out of stock', color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' };
  if (qty <= 5) return { label: 'Critical', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400' };
  return { label: 'Low', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' };
}

export default function LowStockAlerts({ products, loading = false }: LowStockAlertsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
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
            className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
              📦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {product.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                SKU: {product.sku}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
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
