import { useEffect, useState } from 'react';
import { cancelOrder, listOrders } from '../services/order.js';
import { getOrderStatusConfig, ORDER_STATUS_FLOW } from '../utils/orderStatus.js';
import { Link, useNavigate } from 'react-router-dom';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await listOrders();
        response.data.orders.forEach(order => console.log(`Order ${order.id} status: ${order.status}`));
        setOrders(response.data.orders);
      } catch (err) {
        setError('Unable to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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

  const isOrderCancellable = (status) => {
    const normalized = (status || '').toLowerCase();
    return normalized === 'placed' || normalized === 'confirmed' || normalized === 'payment_pending';
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this order? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setError('');
    try {
      const response = await cancelOrder(orderId);
      setOrders((prevOrders) => prevOrders.map((order) => {
        if (order.id === orderId) {
          return { ...order, ...response.data };
        }
        return order;
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to cancel the order.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-rose-50 p-6 text-center text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-12 shadow-sm text-center">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Orders Yet</h2>
        <p className="text-slate-600 mb-6">Start shopping and your orders will appear here</p>
        <Link
          to="/"
          className="inline-block rounded-full bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Your Orders</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Order History</h1>
          <p className="mt-3 text-slate-600">Track and manage all your orders in one place</p>
        </div>
        <div className="mt-4 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-[20px] bg-white shadow-sm overflow-hidden hover:shadow-md transition">
            {/* Order Header */}
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Your Order</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">#{order.user_order_index ?? order.id}</p>
                  <p className="mt-1 text-xs text-slate-500">Global reference: {order.order_number}</p>
                </div>
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

            {/* Actions */}
            <div className="border-t border-slate-200 px-6 py-4 bg-white flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Order Details
              </button>
              <button
                onClick={() => navigate(`/orders/${order.id}/tracking`)}
                className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Order Tracking
              </button>
              <button
                onClick={() => navigate(`/orders/${order.id}/help`)}
                className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Get Help
              </button>
              {isOrderCancellable(order.status) && order.status?.toLowerCase() !== 'cancelled' && (
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="flex-1 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Shopping CTA */}
      <div className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Find more products?</h2>
        <p className="mb-6 text-slate-200">Continue shopping and discover more items</p>
        <Link
          to="/"
          className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
}
