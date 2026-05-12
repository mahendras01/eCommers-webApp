import api from './api.js';

export function listProducts({
  skip = 0, 
  limit = 100, 
  search = null,
  categoryId = null,
  minPrice = null,
  maxPrice = null
} = {}) {
  const params = new URLSearchParams();
  params.append('skip', skip);
  params.append('limit', limit);
  
  if (search) params.append('search', search);
  if (categoryId) params.append('category_id', categoryId);
  if (minPrice !== null) params.append('min_price', minPrice);
  if (maxPrice !== null) params.append('max_price', maxPrice);
  
  return api.get(`/products/?${params.toString()}`);
}

export function getProduct(productId) {
  return api.get(`/products/${productId}`);
}

export function createProduct(product) {
  return api.post('/products/', product);
}

export function updateProduct(productId, product) {
  return api.put(`/products/${productId}`, product);
}

export function deleteProduct(productId) {
  return api.delete(`/products/${productId}`);
}

export function listCategories() {
  return api.get('/products/categories/');
}

export function createCategory(category) {
  return api.post('/products/categories/', category);
}
