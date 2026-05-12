import React, { useState } from 'react';
import { loadRazorpayScript } from '../utils/razorpayLoader';
import { createOrder, verifyPayment } from '../services/paymentService';

/**
 * Razorpay Payment Modal Component
 * 
 * Handles the complete Razorpay payment flow:
 * 1. Loads Razorpay script from CDN
 * 2. Creates order on backend
 * 3. Opens Razorpay checkout modal
 * 4. Handles payment success/failure
 * 5. Verifies payment signature on backend
 * 6. Updates order status
 * 7. Navigates to success/failure pages
 */
const RazorpayPaymentModal = ({ 
  isOpen, 
  onSuccess, 
  onError, 
  onClose,
  userName = '',
  userEmail = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Handlers for Razorpay payment flow
  const handlePaymentSuccess = async (response) => {
    try {
      setIsProcessing(true);
      setError(null);

      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

      // ✅ Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Payment successful, verifying with backend...');
      }

      // Verify signature with backend
      // This is CRITICAL for security - backend validates the payment
      const verificationResult = await verifyPayment(
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      );

      if (import.meta.env.DEV) {
        console.log('Payment verified successfully');
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(verificationResult);
      }
    } catch (err) {
      console.error('Payment verification failed:', err);
      setError(err.message || 'Payment verification failed. Please contact support.');
      
      if (onError) {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error) => {
    if (import.meta.env.DEV) console.error('Razorpay payment error');
    setError(error.description || 'Payment failed. Please try again.');
    
    if (onError) {
      onError(error);
    }
  };

  const handlePaymentCancel = () => {
    if (import.meta.env.DEV) console.log('Payment cancelled by user');
    setError('Payment cancelled. Please try again.');
    
    if (onError) {
      onError(new Error('Payment cancelled by user'));
    }
  };

  /**
   * Initialize and open Razorpay checkout
   * 
   * Security considerations:
   * 1. Script is loaded from Razorpay CDN only (verified domain)
   * 2. Key ID is provided (public key, safe to expose)
   * 3. Order ID comes from backend (backend validates amount)
   * 4. All payment validation happens on backend
   */
  const openRazorpayCheckout = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Step 1: Load Razorpay script
      if (import.meta.env.DEV) console.log('Loading Razorpay script...');
      await loadRazorpayScript();
      
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not available');
      }

      // Step 2: Create Razorpay order (not the cart order - that's already created)
      if (import.meta.env.DEV) console.log('Creating Razorpay payment order...');
      const orderResponse = await createOrder();
      
      const { order_id, amount, currency } = orderResponse;
      if (import.meta.env.DEV) console.log('Razorpay order created successfully');

      // Step 3: Prepare Razorpay options
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      // ✅ Never log the actual key, only in dev and masked
      if (import.meta.env.DEV && razorpayKey) {
        console.log('Razorpay Key configured (masked)');
      }
      
      if (!razorpayKey || razorpayKey === 'your_razorpay_key_id_here') {
        throw new Error('Razorpay Key ID is not configured. Please set VITE_RAZORPAY_KEY_ID in your .env file with your actual Razorpay Key ID from the dashboard.');
      }
      
      const options = {
        key: razorpayKey,
        amount: amount, // Amount in paise (already converted by backend)
        currency: currency,
        name: 'E-Commerce Store',
        description: 'Order Payment',
        order_id: order_id, // Razorpay order ID from backend
        
        // Customer details (optional but recommended)
        prefill: {
          name: userName,
          email: userEmail,
        },

        // Payment configuration for Indian cards
        config: {
          display: {
            language: 'en',
            hide: [
              {
                method: 'paylater'
              },
              {
                method: 'wallet'
              },
              {
                method: 'bank_transfer'
              }
            ]
          }
        },

        // Payment method preferences for Indian market
        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: false
        },

        // Callbacks
        handler: handlePaymentSuccess,

        // Retry configuration
        retry: {
          enabled: true,
          max_count: 3
        },

        // Theme
        theme: {
          color: '#2563eb'
        }
      };

      // Step 4: Open Razorpay checkout
      if (import.meta.env.DEV) console.log('Opening Razorpay checkout...');
      const rzp = new window.Razorpay(options);
      
      // Handle payment errors
      rzp.on('payment.failed', handlePaymentError);
      
      rzp.open();
    } catch (err) {
      console.error('Failed to open payment modal:', err);
      setError(err.message || 'Failed to open payment portal. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Complete Payment</h2>
          <p className="mt-2 text-slate-600">
            You will be redirected to Razorpay to complete your payment securely
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            <p className="font-semibold">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Payment info */}
        <div className="mb-6 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Payment Information</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li className="flex justify-between">
              <span>Payment Gateway:</span>
              <span className="font-medium">Razorpay</span>
            </li>
            <li className="flex justify-between">
              <span>Security:</span>
              <span className="font-medium">HMAC-SHA256 Verified</span>
            </li>
            <li className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium">
                {isProcessing ? 'Processing...' : 'Ready'}
              </span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={openRazorpayCheckout}
            disabled={isProcessing}
            className="flex-1 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </button>
        </div>

        {/* Security info */}
        <p className="mt-4 text-center text-xs text-slate-500">
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
};

export default RazorpayPaymentModal;
