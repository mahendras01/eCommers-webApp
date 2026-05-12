import api from './api.js';

export function listAdminProducts({ skip = 0, limit = 100, search = null } = {}) {
  const params = new URLSearchParams();
  params.append('skip', skip);
  params.append('limit', limit);
  if (search) params.append('search', search);
  return api.get(`/admin/products?${params.toString()}`);
}

export function createAdminProduct(product) {
  return api.post('/admin/products', product);
}

export function updateAdminProduct(productId, product) {
  return api.put(`/admin/products/${productId}`, product);
}

export function deleteAdminProduct(productId) {
  return api.delete(`/admin/products/${productId}`);
}

export function listAdminOrders({ skip = 0, limit = 100, userId = null } = {}) {
  const params = { skip, limit };
  if (userId) params.user_id = userId;
  return api.get('/admin/orders', { params });
}

export function getAdminDashboard() {
  return api.get('/admin/dashboard');
}

export function getAdminUserDetails(userId) {
  return api.get(`/admin/users/${userId}`);
}

export function listAdminUserOrders(userId) {
  return api.get(`/admin/users/${userId}/orders`);
}

export function updateAdminOrderStatus(orderId, status) {
  return api.put(`/admin/orders/${orderId}/status`, { status });
}

export function listAdminUsers({ skip = 0, limit = 100 } = {}) {
  return api.get('/admin/users', { params: { skip, limit } });
}

export function updateAdminUserRole(userId, role) {
  return api.put(`/admin/users/${userId}/role`, { role });
}

export function listAdminCategories() {
  return api.get('/admin/categories');
}

export function createAdminCategory(category) {
  return api.post('/admin/categories', category);
}

export function deleteAdminCategory(categoryId) {
  return api.delete(`/admin/categories/${categoryId}`);
}

export function listAdminSubCategories(categoryId = null) {
  const params = {};
  if (categoryId !== null && categoryId !== undefined) {
    params.category_id = categoryId;
  }
  return api.get('/admin/subcategories', { params });
}

export function createAdminSubCategory(subcategory) {
  return api.post('/admin/subcategories', subcategory);
}

export function deleteAdminSubCategory(subcategoryId) {
  return api.delete(`/admin/subcategories/${subcategoryId}`);
}

export function listProductVariants(productId) {
  return api.get(`/admin/products/${productId}/variants`);
}

export function createProductVariant(productId, variant) {
  return api.post(`/admin/products/${productId}/variants`, variant);
}

export function updateProductVariant(variantId, variant) {
  return api.put(`/admin/variants/${variantId}`, variant);
}

export function deleteProductVariant(variantId) {
  return api.delete(`/admin/variants/${variantId}`);
}
