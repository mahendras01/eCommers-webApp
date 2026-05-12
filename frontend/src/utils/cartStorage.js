const GUEST_CART_KEY = 'guest_cart';
const PENDING_BUY_NOW_KEY = 'pending_buy_now';

export function getGuestCartItems() {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to parse guest cart from storage', error);
    return [];
  }
}

export function setGuestCartItems(items) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to persist guest cart to storage', error);
  }
}

export function clearGuestCartItems() {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Failed to clear guest cart storage', error);
  }
}

export function getPendingBuyNow() {
  try {
    const stored = localStorage.getItem(PENDING_BUY_NOW_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to parse pending buy now', error);
    return null;
  }
}

export function setPendingBuyNow(payload) {
  try {
    localStorage.setItem(PENDING_BUY_NOW_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist pending buy now', error);
  }
}

export function clearPendingBuyNow() {
  try {
    localStorage.removeItem(PENDING_BUY_NOW_KEY);
  } catch (error) {
    console.error('Failed to clear pending buy now', error);
  }
}
