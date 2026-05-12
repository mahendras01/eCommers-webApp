import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, getOrderTracking } from '../services/order.js';
import { getOrderStatusConfig, ORDER_STATUS_FLOW } from '../utils/orderStatus.js';

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderTracking = async () => {
      try {
        // Fetch order details
        const orderResponse = await getOrder(orderId);
        // Fetch tracking data with full status history
        const trackingResponse = await getOrderTracking(orderId);
        
        console.log(`OrderTrackingPage loaded order ${orderId}:`, orderResponse.data);
        console.log('Tracking history:', trackingResponse.data);
        
        setOrder(orderResponse.data);
        setTrackingData(trackingResponse.data);
      } catch (err) {
        console.error('Error fetching tracking data:', err);
        setError('Unable to load order tracking details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderTracking();
  }, [orderId]);

  const getStatusConfig = (status) => getOrderStatusConfig(status);

  const getTimestampForStatus = (status) => {
    if (!trackingData?.status_history) return null;
    const history = trackingData.status_history.find(h => h.status === status);
    return history ? new Date(history.timestamp) : null;
  };

  const formatDateTime = (date) => {
    if (!date) return null;
    return date.toLocaleDateString('en-IN') + ' at ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStepSubtitle = (stepIndex, statusIndex, stepKey) => {
    if (statusIndex < 0) {
      return 'Status unavailable';
    }
    if (stepIndex < statusIndex) {
      return 'Completed';
    }
    if (stepIndex === statusIndex) {
      return stepKey === 'delivered' ? 'Delivered' : 'Currently at this stage';
    }
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading tracking details...</p>
      </div>
    );
  }

  if (error || !order || !trackingData) {
    return (
      <div className="rounded-3xl bg-rose-50 p-6 text-center text-sm text-rose-700">
        {error || 'Order not found.'}
      </div>
    );
  }

  const status = getOrderStatusConfig(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Order Tracking</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Track Order #{order.user_order_index ?? order.id}</h1>
          <p className="mt-3 text-slate-600">Order Reference: {trackingData.order_number}</p>
        </div>
        <Link
          to="/orders"
          className="mt-4 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          ← Back to Orders
        </Link>
      </div>

      {/* Tracking Card */}
      <div className="rounded-[20px] bg-white shadow-sm overflow-hidden">
        {/* Current Status Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Current Status</p>
              <p className={`mt-1 inline-block rounded-full px-4 py-2 text-sm font-semibold ${status.badge}`}>
                {status.label}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Order Date</p>
              <p className="font-semibold text-slate-900 text-right">{new Date(trackingData.created_at).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Order Progress Timeline */}
        <div className="px-6 py-5">
          <p className="mb-6 text-sm font-semibold text-slate-600 uppercase tracking-wider">Tracking Progress</p>
          <div className="space-y-4">
            {ORDER_STATUS_FLOW.map((step, index) => {
              const completed = index < status.index;
              const active = index === status.index;
              const timestamp = getTimestampForStatus(step.key);
              const displayTime = formatDateTime(timestamp);
              
              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold flex-shrink-0 mt-1 ${
                    completed || active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-500'
                  }`}>
                    {completed ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${completed || active ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                    <p className={`text-xs ${completed || active ? 'text-slate-600' : 'text-slate-400'}`}>
                      {displayTime || getStepSubtitle(index, status.index, step.key)}
                    </p>
                  </div>
                  {index < ORDER_STATUS_FLOW.length - 1 && (
                    <div className={`h-12 w-0.5 flex-shrink-0 my-2 ${completed ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipment Details */}
        <div className="border-t border-slate-200 px-6 py-5">
          <p className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Order Details</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Amount</p>
              <p className="mt-1 text-lg font-bold text-slate-900">₹{trackingData.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Shipping Address</p>
              <p className="mt-1 font-semibold text-slate-900 text-sm">{trackingData.shipping_address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Order Number</p>
              <p className="mt-1 font-semibold text-slate-900">{trackingData.order_number}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Status Updates</p>
              <p className="mt-1 font-semibold text-slate-900">{trackingData.status_history?.length || 0} updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}