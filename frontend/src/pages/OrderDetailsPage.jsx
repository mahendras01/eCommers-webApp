import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder } from '../services/order.js';
import { getOrderStatusConfig, ORDER_STATUS_FLOW } from '../utils/orderStatus.js';

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrder(orderId);
        console.log(`OrderDetailsPage loaded order ${orderId} status:`, response.data.status);
        setOrder(response.data);
      } catch (err) {
        setError('Unable to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusConfig = (order) => getOrderStatusConfig(order.status);

  const orderSteps = ORDER_STATUS_FLOW;

  const getStepSubtitle = (stepIndex, statusIndex, stepKey) => {
    if (statusIndex < 0) {
      return 'Status unavailable';
    }
    if (stepIndex < statusIndex) {
      return 'Completed';
    }
    if (stepIndex === statusIndex) {
      return stepKey === 'delivered' ? 'Delivered' : 'In progress';
    }
    return 'Waiting for previous step';
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-3xl bg-rose-50 p-6 text-center text-sm text-rose-700">
        {error || 'Order not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Order Details</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Order #{order.user_order_index ?? order.id}</h1>
          <p className="mt-3 text-slate-600">Global reference: {order.order_number}</p>
        </div>
        <Link
          to="/orders"
          className="mt-4 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          ← Back to Orders
        </Link>
      </div>

      {/* Order Details Card */}
      <div className="rounded-[20px] bg-white shadow-sm overflow-hidden">
        {/* Order Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Status</p>
              {(() => {
                const status = getStatusConfig(order);
                return (
                  <p className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${status.badge}`}>
                    {status.label}
                  </p>
                );
              })()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Payment</p>
              <p className="mt-1 text-sm font-semibold text-slate-700 capitalize">{order.payment_method?.replace('_', ' ') || 'Cash on Delivery'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Amount</p>
              <p className="mt-1 text-lg font-bold text-slate-900">₹{order.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Items</p>
              <p className="mt-1 text-lg font-semibold text-slate-700">{order.items.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Delivery</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">Standard (5-7 days)</p>
            </div>
          </div>
        </div>

        {/* Order Progress */}
        <div className="px-6 py-5">
          <p className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Order Progress</p>
          <div className="space-y-4">
            {orderSteps.map((step, index) => {
              const status = getStatusConfig(order);
              const completed = index < status.index;
              const active = index === status.index;
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${completed || active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-500'}`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${completed || active ? 'text-slate-900' : 'text-slate-500'}`}>{step.label}</p>
                    <p className="text-xs text-slate-500">
                      {getStepSubtitle(index, status.index, step.key)}
                    </p>
                  </div>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6">
          <p className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Order Items</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-[16px] border border-slate-200 bg-slate-50 p-4 hover:border-slate-300 transition">
                <div className="mb-3 h-40 w-full rounded-[12px] bg-slate-200 flex items-center justify-center overflow-hidden">
                  {item.product.image_url ? (
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 line-clamp-2">{item.product.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">Quantity</p>
                    <p className="text-lg font-bold text-slate-900">{item.quantity}x</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Price</p>
                    <p className="text-lg font-bold text-slate-900">₹{item.unit_price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-xs text-slate-600">Subtotal</p>
                  <p className="text-lg font-bold text-emerald-600">₹{(item.quantity * item.unit_price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-600">Subtotal</p>
              <p className="text-lg font-semibold text-slate-900">₹{order.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Shipping</p>
              <p className="text-lg font-semibold text-slate-900">Free</p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-4">
              <p className="text-sm text-slate-600">Final Total</p>
              <p className="text-2xl font-bold text-slate-900">₹{order.total_amount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}