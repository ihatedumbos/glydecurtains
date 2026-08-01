import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  variantId?: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface StatusHistoryEntry {
  id: number;
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  notes?: string;
}

interface InvoiceSettings {
  enableCustomerDownload: boolean;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
}

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
  PACKED: 'bg-purple-100 text-purple-800 border-purple-300',
  DISPATCHED: 'bg-orange-100 text-orange-800 border-orange-300',
  DELIVERED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const [orderRes, settingsRes] = await Promise.all([
          axiosInstance.get(`/orders/${id}`),
          axiosInstance.get('/invoices/settings').catch(() => null),
        ]);
        const orderData = orderRes.data.data || orderRes.data;
        setOrder(orderData);
        if (settingsRes) {
          const settings = settingsRes.data.data || settingsRes.data;
          setInvoiceSettings(settings);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const response = await axiosInstance.put(`/orders/${order.id}/cancel`);
      const updated = response.data.data || response.data;
      setOrder((prev) => prev ? { ...prev, status: updated.status || 'CANCELLED' } : prev);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const response = await axiosInstance.get(`/invoices/orders/${order.id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancel = order && (order.status === 'PENDING' || order.status === 'CONFIRMED');

  const canDownloadInvoice =
    order &&
    invoiceSettings?.enableCustomerDownload === true &&
    order.status !== 'PENDING' &&
    order.status !== 'CANCELLED';

  const currentStatusIndex = order ? STATUS_ORDER.indexOf(order.status) : -1;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 text-indigo-600 hover:underline"
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="text-sm text-indigo-600 hover:underline mb-2 inline-block"
          >
            ← Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
          {order.status}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Status Timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Progress</h2>
          <div className="flex items-center justify-between">
            {STATUS_ORDER.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return (
                <div key={status} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {index > 0 && (
                      <div className={`flex-1 h-0.5 ${index <= currentStatusIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                        ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : isCompleted ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < STATUS_ORDER.length - 1 && (
                      <div className={`flex-1 h-0.5 ${index < currentStatusIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <span className={`text-xs mt-2 text-center ${isCurrent ? 'font-semibold text-indigo-600' : 'text-gray-500'}`}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Status History</h2>
          <div className="space-y-3">
            {order.statusHistory.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">
                    {entry.fromStatus ? `${entry.fromStatus} → ` : ''}{entry.toStatus}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(entry.changedAt)}</p>
                  {entry.notes && <p className="text-xs text-gray-500 mt-0.5">{entry.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Order Items</h2>
        </div>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-500">
                  Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                </p>
              </div>
              <p className="font-medium text-gray-900">
                ₹{item.subtotal.toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Subtotal</span>
            <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Grand Total</span>
            <span>₹{order.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {canDownloadInvoice && (
          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="px-5 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download Invoice'}
          </button>
        )}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>
    </div>
  );
}
