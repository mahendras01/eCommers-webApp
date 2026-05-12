import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { useAddress } from '../contexts/AddressContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import RazorpayPaymentModal from '../components/RazorpayPaymentModal.jsx';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱', description: 'Pay instantly with UPI' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳', description: 'Secure card payment' },
  { id: 'debit_card', label: 'Debit Card', icon: '💳', description: 'Direct debit payment' },
  { id: 'net_banking', label: 'Net Banking', icon: '🏦', description: 'Bank transfer' },
  { id: 'wallet', label: 'Wallet', icon: '👛', description: 'Digital wallet payment' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵', description: 'Pay at doorstep' },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const { cart, createOrder } = useCart();
  const { selectedAddress } = useAddress();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!selectedAddress) {
    return (
      <div className="rounded-[28px] bg-white p-12 shadow-sm text-center">
        <p className="text-lg text-slate-600 mb-4">Please select a delivery address first.</p>
        <button
          onClick={() => navigate('/delivery')}
          className="inline-block rounded-full bg-slate-900 px-8 py-3 font-semibold text-white hover:bg-slate-800 transition"
        >
          Go to Delivery Address
        </button>
      </div>
    );
  }

  const handlePaymentConfirm = async (method, formData) => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty. Please add items to cart first.');
      return;
    }
    setSelectedMethod(method);
    setLoading(true);

    try {
      const shippingAddress = `${selectedAddress.name}, ${selectedAddress.address_line1}${selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}, ${selectedAddress.locality}, ${selectedAddress.city} - ${selectedAddress.pincode}, ${selectedAddress.state}`;
      
      // Transform formData to match backend schema
      const paymentDetails = {};
      if (method === 'upi') {
        paymentDetails.upi_id = formData.upiId;
      } else if (method === 'credit_card' || method === 'debit_card') {
        paymentDetails.card_number = formData.cardNumber?.replace(/\s/g, '');
        const [month, year] = formData.expiry?.split('/') || [];
        paymentDetails.expiry_month = parseInt(month, 10);
        paymentDetails.expiry_year = year ? parseInt(`20${year}`, 10) : undefined;
        paymentDetails.cvv = formData.cvv;
        paymentDetails.card_holder_name = formData.cardholderName;
      } else if (method === 'net_banking') {
        paymentDetails.bank_name = formData.bank;
      } else if (method === 'wallet') {
        paymentDetails.wallet_provider = formData.walletProvider;
      }

      if (Object.keys(paymentDetails).length > 0) {
        paymentDetails.payment_method = method;
      }

      await createOrder({
        shipping_address: shippingAddress,
        payment_method: method,
        payment_details: Object.keys(paymentDetails).length > 0 ? paymentDetails : undefined,
      });
      
      navigate('/orders');
    } catch (err) {
      console.error('Failed to complete order:', err);
      alert('Could not complete order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Checkout</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Payment Method</h1>
          <p className="mt-3 text-slate-600">Select your preferred payment method</p>
        </div>
        <div className="mt-4 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          Step 2 of 2
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
        {/* Payment Methods */}
        <div className="space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">Available Payment Methods</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={async () => {
                    if (!cart || cart.items.length === 0) {
                      alert('Your cart is empty. Please add items to cart first.');
                      return;
                    }
                    // Use Razorpay for card payments and UPI
                    if (['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'].includes(method.id)) {
                      setLoading(true);
                      try {
                    // First create the order
                        const parts = [
                          selectedAddress.name || 'Customer',
                          selectedAddress.address_line1 || '',
                          selectedAddress.address_line2 || '',
                          selectedAddress.locality || '',
                          selectedAddress.city || '',
                          selectedAddress.state || '',
                          selectedAddress.pincode || ''
                        ].filter(part => part.trim() !== '');

                        const shippingAddress = parts.join(', ');

                        // Ensure shipping address is not empty
                        if (!shippingAddress.trim()) {
                          throw new Error('Invalid shipping address. Please update your address information.');
                        }
                        
                        // Ensure shipping address doesn't exceed backend limit (500 chars)
                        const truncatedShippingAddress = shippingAddress.length > 500 ? shippingAddress.substring(0, 497) + '...' : shippingAddress;
                        
                        console.log('DEBUG: selectedAddress:', selectedAddress);
                        console.log('DEBUG: constructed shippingAddress:', shippingAddress);
                        console.log('DEBUG: truncatedShippingAddress:', truncatedShippingAddress);
                        
                        const orderData = {
                          shipping_address: truncatedShippingAddress,
                          payment_method: method.id,
                        };
                        
                        console.log('DEBUG: Creating order with data:', orderData);
                        
                        await createOrder(orderData);
                        
                        // Then open Razorpay modal
                        setShowRazorpayModal(true);
                      } catch (err) {
                        console.error('Failed to create order:', err);
                        alert('Could not create order. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    } else {
                      // Use traditional payment modal for COD and other methods
                      setSelectedMethod(method.id);
                      setShowModal(true);
                    }
                  }}
                  disabled={loading}
                  className="rounded-[20px] border-2 border-slate-200 p-5 text-left transition hover:border-slate-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-3">{method.icon}</div>
                  <h3 className="font-semibold text-slate-900">{method.label}</h3>
                  <p className="mt-1 text-sm text-slate-600">{method.description}</p>
                  {['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'].includes(method.id) && (
                    <p className="mt-2 text-xs font-semibold text-green-700 bg-green-50 inline-block px-2 py-1 rounded">
                      Razorpay
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Summary */}
          <div className="rounded-[28px] bg-blue-50 border border-blue-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Delivery To:</h3>
            <p className="text-sm text-slate-700">
              <strong>{selectedAddress.name}</strong><br />
              {selectedAddress.address_line1}{selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}<br />
              {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
            </p>
            <button
              onClick={() => navigate('/delivery')}
              className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Change Address
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-[28px] bg-white p-6 shadow-sm h-fit sticky top-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4 border-b border-slate-200 pb-4">
            {cart?.items?.slice(0, 3).map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.product.name} × {item.quantity}</span>
                <span className="font-semibold text-slate-900">₹{(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            {cart?.items?.length > 3 && (
              <p className="text-sm text-slate-500">+{cart.items.length - 3} more items</p>
            )}
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-900">₹{cart?.total_price?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Shipping</span>
              <span className="text-slate-900">Free</span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-between font-semibold mb-4">
              <span>Total</span>
              <span>₹{cart?.total_price?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handlePaymentConfirm}
      />

      {/* Razorpay Payment Modal */}
      <RazorpayPaymentModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        onSuccess={(result) => {
          console.log('Payment successful:', result);
          // Redirect to success page or orders page
          navigate('/orders');
        }}
        onError={(error) => {
          console.error('Payment failed:', error);
          // User will see error message in modal
        }}
        userName={user?.name || 'Customer'}
        userEmail={user?.email || ''}
      />
    </div>
  );
}
