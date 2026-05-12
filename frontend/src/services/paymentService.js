import api from './api';

/**
 * Payment Service for Razorpay Integration
 * 
 * Handles all payment operations:
 * - Creating Razorpay orders on the backend
 * - Verifying payment signatures after successful payment
 * - Retrieving payment transaction details
 */

/**
 * Create a Razorpay order on the backend
 * 
 * This initiates a payment by:
 * 1. Calling backend to fetch the user's pending order
 * 2. Backend creates a Razorpay order with the order amount
 * 3. Returns Razorpay order_id to frontend
 * 
 * The amount is NOT sent from frontend - it's fetched from the database
 * for security (prevents user tampering with order amount)
 * 
 * @returns {Promise<Object>} { order_id, amount, currency, receipt }
 * @throws {Error} If order creation fails
 */
export const createOrder = async () => {
  try {
    if (import.meta.env.DEV) console.log('Creating payment order...');
    const response = await api.post('/payment/create-order');
    if (import.meta.env.DEV) console.log('Order creation successful');
    return response.data;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to create payment order:', error.message);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to create payment order. Please try again.'
    );
  }
};

/**
 * Verify payment signature with backend
 * 
 * Security Flow:
 * 1. After Razorpay checkout success, frontend receives payment_id, order_id, signature
 * 2. Frontend sends these to backend
 * 3. Backend verifies signature using HMAC-SHA256 (secret key never exposed)
 * 4. Backend validates order ownership
 * 5. Backend validates payment amount
 * 6. Backend updates order status to "confirmed"
 * 
 * Why signature verification is critical:
 * - Only backend with secret key can generate valid signatures
 * - Prevents frontend from faking successful payments
 * - Prevents payment amount tampering
 * 
 * @param {string} payment_id - Razorpay payment ID from checkout
 * @param {string} order_id - Razorpay order ID
 * @param {string} signature - Razorpay signature for verification
 * @returns {Promise<Object>} { status, message, transaction_id }
 * @throws {Error} If verification fails or order update fails
 */
export const verifyPayment = async (payment_id, order_id, signature) => {
  try {
    const response = await api.post('/payment/verify', {
      payment_id,
      order_id,
      signature,
    });

    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification failed:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      'Payment verification failed. Please contact support.'
    );
  }
};

/**
 * Get payment transaction details for an order
 * 
 * @param {number} order_id - Database order ID (not Razorpay order ID)
 * @returns {Promise<Object>} Transaction details
 * @throws {Error} If transaction retrieval fails
 */
export const getTransactionDetails = async (order_id) => {
  try {
    const response = await api.get(`/payment/transaction/${order_id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transaction details:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to fetch transaction details'
    );
  }
};
