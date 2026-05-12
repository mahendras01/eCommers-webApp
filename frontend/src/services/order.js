import api from './api.js';

export function createOrder(orderData) {
  return api.post('/orders/', orderData);
}

export function listOrders() {
  return api.get('/orders/');
}

export function getOrder(orderId) {
  return api.get(`/orders/${orderId}`);
}

export function getOrderTracking(orderId) {
  return api.get(`/orders/${orderId}/status-history`);
}

export function cancelOrder(orderId, reason = null) {
  return api.put(`/orders/${orderId}/cancel`, { reason });
}
