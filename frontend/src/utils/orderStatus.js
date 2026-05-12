export const ORDER_STATUS_CONFIG = {
  placed: { label: 'Order placed', badge: 'bg-orange-100 text-orange-700', index: 0 },
  confirmed: { label: 'Confirmed', badge: 'bg-teal-100 text-teal-700', index: 1 },
  packed: { label: 'Packed', badge: 'bg-blue-100 text-blue-700', index: 2 },
  shipped: { label: 'Shipped', badge: 'bg-sky-100 text-sky-700', index: 3 },
  out_for_delivery: { label: 'Out for delivery', badge: 'bg-cyan-100 text-cyan-700', index: 4 },
  delivered: { label: 'Delivered', badge: 'bg-emerald-100 text-emerald-700', index: 5 },
  cancelled: { label: 'Cancelled', badge: 'bg-rose-100 text-rose-700', index: -1 },
  payment_pending: { label: 'Payment pending', badge: 'bg-amber-100 text-amber-700', index: 0 },
  failed: { label: 'Payment failed', badge: 'bg-red-100 text-red-700', index: -1 },
};

// Valid statuses from backend OrderStatus enum
export const VALID_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'payment_pending', 'failed'];

export const ORDER_STATUS_FLOW = [
  { key: 'placed', label: 'Order placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export function normalizeOrderStatus(status) {
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
}

export function getOrderStatusConfig(status) {
  const normalized = normalizeOrderStatus(status);
  
  // Validate that the status exists in valid statuses
  if (!VALID_STATUSES.includes(normalized)) {
    console.warn(`Invalid order status detected: "${status}". Expected one of: ${VALID_STATUSES.join(', ')}`);
    return {
      label: 'Unknown status',
      badge: 'bg-gray-100 text-gray-700',
      index: -2,
    };
  }
  
  return ORDER_STATUS_CONFIG[normalized] ?? {
    label: 'Unknown status',
    badge: 'bg-gray-100 text-gray-700',
    index: -2,
  };
}

export function getOrderStepSubtitle(stepKey, statusIndex) {
  if (statusIndex < 0) {
    return 'Status unavailable';
  }
  if (stepKey === 'delivered' && statusIndex === ORDER_STATUS_CONFIG.delivered.index) {
    return 'Completed';
  }
  if (ORDER_STATUS_FLOW.findIndex((step) => step.key === stepKey) < statusIndex) {
    return 'Completed';
  }
  if (ORDER_STATUS_FLOW.findIndex((step) => step.key === stepKey) === statusIndex) {
    return stepKey === 'delivered' ? 'Delivered' : 'In progress';
  }
  return 'Waiting for previous step';
}
