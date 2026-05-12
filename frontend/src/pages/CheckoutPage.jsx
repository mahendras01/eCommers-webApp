import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';

export default function CheckoutPage() {
  const { cart, createOrder } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [locality, setLocality] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchPincodeDetails = async (pincodeValue) => {
    if (pincodeValue.length !== 6 || !/^\d{6}$/.test(pincodeValue)) return;

    setPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeValue}`);
      const data = await response.json();

      if (data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        setLocality(postOffice.Name || '');
        setCity(postOffice.District || '');
        setState(postOffice.State || '');
      }
    } catch (error) {
      console.error('Failed to fetch pincode details:', error);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value;
    setPincode(value);
    if (value.length === 6) {
      fetchPincodeDetails(value);
    }
  };

  if (!cart) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading checkout...</p>
      </div>
    );
  }

  const shippingAddress = `${name}, ${addressLine1}${addressLine2 ? `, ${addressLine2}` : ''}, ${locality}, ${city} - ${pincode}${state ? `, ${state}` : ''}${landmark ? `, Landmark: ${landmark}` : ''}`;

  const validateFields = () => {
    const errors = {};
    if (!name) errors.name = 'Name is required';
    if (!phone) errors.phone = 'Phone is required';
    if (!pincode) errors.pincode = 'Pincode is required';
    if (!locality) errors.locality = 'Locality is required';
    if (!addressLine1) errors.addressLine1 = 'Address is required';
    if (!city) errors.city = 'City is required';
    if (!state) errors.state = 'State is required';
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!cart.items.length) {
      setError('Cart is empty. Please add items before checkout.');
      return;
    }
    
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fill all required fields highlighted below.');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      await createOrder({ shipping_address: shippingAddress, payment_method: paymentMethod });
      navigate('/orders');
    } catch (err) {
      setError('Could not complete checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-[32px] bg-slate-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Secure checkout</p>
                <h1 className="mt-2 text-4xl font-bold text-slate-900">Delivery & Payment</h1>
              </div>
              <div className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                Step 1 of 2
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700 mb-6">
              {error}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Delivery address</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Enter your shipping details</h2>
                  </div>
                  <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    {cart.total_items} items
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Name</span>
                    <input
                      value={name}
                      onChange={(e) => { setName(e.target.value); setFieldErrors({...fieldErrors, name: ''})}}
                      placeholder="Recipient name"
                      className={`w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                        fieldErrors.name ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-slate-900'
                      }`}
                    />
                    {fieldErrors.name && <span className="text-xs text-rose-600">{fieldErrors.name}</span>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Phone</span>
                    <input
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldErrors({...fieldErrors, phone: ''})}}
                      placeholder="10-digit mobile"
                      className={`w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                        fieldErrors.phone ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-slate-900'
                      }`}
                    />
                    {fieldErrors.phone && <span className="text-xs text-rose-600">{fieldErrors.phone}</span>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Pincode</span>
                    <input
                      value={pincode}
                      onChange={(e) => { handlePincodeChange(e); setFieldErrors({...fieldErrors, pincode: ''})}}
                      placeholder="Pin code"
                      className={`w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                        fieldErrors.pincode ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-slate-900'
                      }`}
                    />
                    {fieldErrors.pincode && <span className="text-xs text-rose-600">{fieldErrors.pincode}</span>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Locality</span>
                    <input
                      value={locality}
                      onChange={(e) => { setLocality(e.target.value); setFieldErrors({...fieldErrors, locality: ''})}}
                      placeholder="Area / locality"
                      disabled={pincodeLoading}
                      className={`w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed ${
                        fieldErrors.locality ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-slate-900 disabled:bg-slate-50'
                      }`}
                    />
                    {fieldErrors.locality && <span className="text-xs text-rose-600">{fieldErrors.locality}</span>}
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Address line 1</span>
                    <input
                      value={addressLine1}
                      onChange={(e) => { setAddressLine1(e.target.value); setFieldErrors({...fieldErrors, addressLine1: ''})}}
                      placeholder="House number, building name"
                      className={`w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                        fieldErrors.addressLine1 ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-slate-900'
                      }`}
                    />
                    {fieldErrors.addressLine1 && <span className="text-xs text-rose-600">{fieldErrors.addressLine1}</span>}
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Address line 2</span>
                    <input
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Road name, landmark"
                      className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">City</span>
                    <input
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setFieldErrors({...fieldErrors, city: ''})}}
                      placeholder="City"
                      disabled={pincodeLoading}
                      className={`w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed ${
                        fieldErrors.city ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-slate-900 disabled:bg-slate-50'
                      }`}
                    />
                    {fieldErrors.city && <span className="text-xs text-rose-600">{fieldErrors.city}</span>}
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">State</span>
                    <input
                      value={state}
                      onChange={(e) => { setState(e.target.value); setFieldErrors({...fieldErrors, state: ''})}}
                      placeholder="State"
                      disabled={pincodeLoading}
                      className={`w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed ${
                        fieldErrors.state ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-slate-900 disabled:bg-slate-50'
                      }`}
                    />
                    {fieldErrors.state && <span className="text-xs text-rose-600">{fieldErrors.state}</span>}
                  </label>
                </div>

                <label className="space-y-2 mt-4">
                  <span className="text-sm font-medium text-slate-700">Landmark <span className="text-slate-400 font-normal">(optional)</span></span>
                  <input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="E.g. Near metro station"
                    className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </label>
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.24em]">Payment</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Choose payment method</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { value: 'cash_on_delivery', label: 'Cash on Delivery' },
                    { value: 'upi', label: 'UPI / Wallet' },
                    { value: 'card', label: 'Card Payment' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                        paymentMethod === option.value
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Secure Payment</p>
                  <p className="mt-2 leading-6">Your payment details are safe and encrypted. You can change payment method before placing order.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cart.items.length === 0}
              className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.24em]">Order Summary</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Review your items</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{cart.total_items} items</span>
              </div>

              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-semibold text-slate-900">{item.product.name}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600 space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{cart.total_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>Total</span>
                  <span>₹{cart.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.24em]">Need help?</p>
              <p className="mt-3 text-sm text-slate-600 leading-6">Contact our support team for help with delivery, payment, or order changes.</p>
              <button className="mt-4 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Contact Support
              </button>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}
