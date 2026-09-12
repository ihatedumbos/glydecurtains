import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCart } from '@/store/slices/cartSlice';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';

type CheckoutStep = 'confirm' | 'placing' | 'success';

interface PlacedOrder {
  orderNumber: string;
  id: number;
  grandTotal: number;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, grandTotal } = useAppSelector((state) => state.cart);
  const [step, setStep] = useState<CheckoutStep>('confirm');
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    setStep('placing');
    setError(null);
    try {
      const response = await axiosInstance.post('/orders/place');
      const order = response.data.data || response.data;
      setPlacedOrder({
        orderNumber: order.orderNumber,
        id: order.id,
        grandTotal: order.grandTotal,
      });
      dispatch(clearCart());
      setStep('success');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to place order. Please try again.');
      setStep('confirm');
    }
  };

  if (step === 'success' && placedOrder) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#2c2c2c] mb-2">Order Placed Successfully!</h1>
          <p className="text-lg text-[#6b5d52] mb-2">Thank you for your order.</p>
          <p className="text-[#6b5d52] mb-6">
            Order Number: <span className="font-semibold text-[#2c2c2c]">{placedOrder.orderNumber}</span>
          </p>
          <p className="text-[#6b5d52] mb-8">
            Total: <span className="font-semibold">₹{placedOrder.grandTotal.toLocaleString('en-IN')}</span>
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(`/orders/${placedOrder.id}`)}
              className="px-6 py-2 bg-[#a06b3a] text-white rounded-lg hover:bg-[#7a4f28] transition-colors"
            >
              View Order
            </button>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-2 border border-[#2c2c2c]/15 text-[#2c2c2c] rounded-lg hover:bg-[#f4ede1] transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="font-display text-2xl text-[#2c2c2c] mb-6">Confirm Your Order</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#6b5d52] mb-4">Your cart is empty.</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2 bg-[#a06b3a] text-white rounded-lg hover:bg-[#7a4f28]"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <>
          {/* Order Items */}
          <div className="bg-[#faf5ea] rounded-lg shadow divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4">
                {item.imageUrl && (
                  <img
                    src={resolveMediaUrl(item.imageUrl)}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-[#2c2c2c]">{item.productName}</p>
                  <p className="text-sm text-[#6b5d52]">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-[#2c2c2c]">
                  ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 bg-[#faf5ea] rounded-lg shadow p-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-4 justify-end">
            <button
              onClick={() => navigate('/cart')}
              className="px-6 py-2 border border-[#2c2c2c]/15 text-[#2c2c2c] rounded-lg hover:bg-[#f4ede1] transition-colors"
            >
              Back to Cart
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={step === 'placing'}
              className="px-6 py-2 bg-[#a06b3a] text-white rounded-lg hover:bg-[#7a4f28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 'placing' ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
