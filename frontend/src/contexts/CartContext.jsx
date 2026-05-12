import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext.jsx';
import { getGuestCartItems, setGuestCartItems, clearGuestCartItems } from '../utils/cartStorage.js';

const CartContext = createContext();

const FLAT_SHIPPING_COST = 100; // ₹100
const DEFAULT_TAX_PERCENT = 18; // 18% default GST

function buildCartSummary(items) {
  const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
  const total_price = items.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0);
  return { items, total_items, total_price };
}

function calculateGuestCartPricing(items) {
  /**
   * Calculate pricing for guest cart (local calculation).
   * Uses same logic as backend.
   */
  let subtotal = 0;
  let totalTax = 0;
  let taxBreakdown = {};
  let itemsCount = 0;

  for (const item of items) {
    const price = Number(item.product.price);
    const quantity = item.quantity;
    const taxPercent = item.product.tax_percent || DEFAULT_TAX_PERCENT;

    const lineSubtotal = price * quantity;
    subtotal += lineSubtotal;
    itemsCount += quantity;

    const lineTax = lineSubtotal * (taxPercent / 100);
    totalTax += lineTax;

    if (!taxBreakdown[taxPercent]) {
      taxBreakdown[taxPercent] = 0;
    }
    taxBreakdown[taxPercent] += lineTax;
  }

  const shipping = FLAT_SHIPPING_COST;
  const total = subtotal + totalTax + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(totalTax * 100) / 100,
    tax_breakdown: Object.fromEntries(
      Object.entries(taxBreakdown).map(([rate, amount]) => [
        rate,
        Math.round(amount * 100) / 100,
      ])
    ),
    shipping,
    total: Math.round(total * 100) / 100,
    items_count: itemsCount,
  };
}

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState({ items: [], total_items: 0, total_price: 0 });
  const [pricing, setPricing] = useState({
    subtotal: 0,
    tax: 0,
    tax_breakdown: {},
    shipping: FLAT_SHIPPING_COST,
    total: FLAT_SHIPPING_COST,
    items_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const previousAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    // Wait for authentication to initialize before setting up cart
    if (authLoading) return;

    const initialize = async () => {
      const guestItems = getGuestCartItems();

      if (isAuthenticated) {
        if (!previousAuthRef.current && guestItems.length > 0) {
          await mergeGuestCart(guestItems);
          previousAuthRef.current = true;
          return;
        }
        await refreshCart();
      } else {
        if (previousAuthRef.current) {
          clearGuestCartItems();
        }
        const cartSummary = buildCartSummary(guestItems);
        setCart(cartSummary);
        setPricing(calculateGuestCartPricing(guestItems));
        setLoading(false);
      }

      setLoading(false);
      previousAuthRef.current = isAuthenticated;
    };

    initialize();
  }, [isAuthenticated, authLoading]);

  const mergeGuestCart = async (guestItems) => {
    setLoading(true);
    try {
      for (const item of guestItems) {
        await api.post('/cart/', {
          product_id: item.product.id,
          quantity: item.quantity,
        });
      }
      clearGuestCartItems();
      await refreshCart();
    } catch (error) {
      console.error('Failed to merge guest cart:', error);
      const cartSummary = buildCartSummary(guestItems);
      setCart(cartSummary);
      setPricing(calculateGuestCartPricing(guestItems));
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product_id, quantity = 1, product = null) => {
    if (isAuthenticated) {
      try {
        await api.post('/cart/', { product_id, quantity });
        await refreshCart();
      } catch (error) {
        console.error('Failed to add to cart:', error);
        throw error;
      }
      return;
    }

    const guestItems = getGuestCartItems();
    const existingItem = guestItems.find((item) => item.product.id === product_id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      guestItems.push({
        id: `guest-${Date.now()}-${product_id}`,
        product: product || { id: product_id, price: 0, name: 'Product', image_url: '', tax_percent: DEFAULT_TAX_PERCENT },
        quantity,
      });
    }

    setGuestCartItems(guestItems);
    const cartSummary = buildCartSummary(guestItems);
    setCart(cartSummary);
    setPricing(calculateGuestCartPricing(guestItems));
  };

  const refreshCart = async () => {
    try {
      const response = await api.get('/cart/');
      if (import.meta.env.DEV) console.log('Cart refreshed from server');
      setCart(response.data);
      
      // Fetch pricing calculation from backend
      try {
        const pricingResponse = await api.post('/cart/calculate/pricing');
        console.log('DEBUG: Pricing response:', pricingResponse.data);
        setPricing(pricingResponse.data);
      } catch (pricingError) {
        console.error('Failed to fetch pricing:', pricingError);
        // Fallback to basic calculation
        setPricing({
          subtotal: response.data.total_price,
          tax: 0,
          tax_breakdown: {},
          shipping: FLAT_SHIPPING_COST,
          total: response.data.total_price + FLAT_SHIPPING_COST,
          items_count: response.data.total_items,
        });
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      setCart({ items: [], total_items: 0, total_price: 0 });
      setPricing({
        subtotal: 0,
        tax: 0,
        tax_breakdown: {},
        shipping: FLAT_SHIPPING_COST,
        total: FLAT_SHIPPING_COST,
        items_count: 0,
      });
    }
  };

  const removeFromCart = async (item_id) => {
    if (!isAuthenticated) {
      const guestItems = getGuestCartItems().filter((item) => item.id !== item_id);
      setGuestCartItems(guestItems);
      const cartSummary = buildCartSummary(guestItems);
      setCart(cartSummary);
      setPricing(calculateGuestCartPricing(guestItems));
      return;
    }

    try {
      await api.delete(`/cart/${item_id}`);
      await refreshCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (item_id, quantity) => {
    if (!isAuthenticated) {
      const guestItems = getGuestCartItems().map((item) =>
        item.id === item_id ? { ...item, quantity } : item
      );
      setGuestCartItems(guestItems);
      const cartSummary = buildCartSummary(guestItems);
      setCart(cartSummary);
      setPricing(calculateGuestCartPricing(guestItems));
      return;
    }

    try {
      await api.put(`/cart/${item_id}`, { quantity });
      await refreshCart();
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    }
  };

  const clearCart = () => {
    clearGuestCartItems();
    setCart({ items: [], total_items: 0, total_price: 0 });
    setPricing({
      subtotal: 0,
      tax: 0,
      tax_breakdown: {},
      shipping: FLAT_SHIPPING_COST,
      total: FLAT_SHIPPING_COST,
      items_count: 0,
    });
  };

  const createOrder = async (orderData) => {
    const response = await api.post('/orders/', orderData);
    await refreshCart();
    return response.data;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        pricing,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        createOrder,
        refreshCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
