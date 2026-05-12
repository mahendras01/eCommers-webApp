import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddress } from '../contexts/AddressContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';

export default function DeliveryAddressPage() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const {
    addresses,
    selectedAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
    isAddingAddress,
    setIsAddingAddress,
    editingAddressId,
    setEditingAddressId,
    loading,
    refreshAddresses,
  } = useAddress();
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pincode: '',
    locality: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    landmark: '',
    is_default: false,
  });

  useEffect(() => {
    if (addresses.length === 0 && !loading) {
      refreshAddresses();
    }
  }, []); // Only run once on mount

  const fetchPincodeDetails = async (pincodeValue) => {
    if (pincodeValue.length !== 6 || !/^\d{6}$/.test(pincodeValue)) return;

    setPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeValue}`);
      const data = await response.json();

      if (data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        setFormData(prev => ({
          ...prev,
          locality: postOffice.Name || '',
          city: postOffice.District || '',
          state: postOffice.State || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch pincode details:', error);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handlePincodeChange = (value) => {
    setFormData(prev => ({ ...prev, pincode: value }));
    if (value.length === 6) {
      fetchPincodeDetails(value);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = async () => {
    if (!formData.name || !formData.phone || !formData.pincode || !formData.address_line1 || !formData.city || !formData.state) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await addAddress(formData);
      setFormData({
        name: '',
        phone: '',
        pincode: '',
        locality: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        landmark: '',
        is_default: false,
      });
      setIsAddingAddress(false);
    } catch (error) {
      alert('Failed to add address. Please try again.');
    }
  };

  const handleEditAddress = (addressId) => {
    const address = addresses.find(a => a.id === addressId);
    if (address) {
      setFormData(address);
      setEditingAddressId(addressId);
      setIsAddingAddress(true);
    }
  };

  const handleUpdateAddress = async () => {
    if (editingAddressId) {
      try {
        await updateAddress(editingAddressId, formData);
        setEditingAddressId(null);
        setFormData({
          name: '',
          phone: '',
          pincode: '',
          locality: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          landmark: '',
          is_default: false,
        });
        setIsAddingAddress(false);
      } catch (error) {
        alert('Failed to update address. Please try again.');
      }
    }
  };

  const handleContinue = () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
    navigate('/payment');
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Checkout</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Delivery Address</h1>
          <p className="mt-3 text-slate-600">Select or add a delivery address</p>
        </div>
        <div className="mt-4 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          Step 1 of 2
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Your Saved Addresses</h2>
              <div className="space-y-3">
                {addresses.map(address => (
                  <div
                    key={address.id}
                    onClick={() => selectAddress(address.id)}
                    className={`rounded-[20px] border-2 p-4 cursor-pointer transition ${
                      selectedAddress?.id === address.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{address.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}, {address.locality}
                        </p>
                        <p className="text-sm text-slate-600">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">📞 {address.phone}</p>
                        {address.is_default && (
                          <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-xs font-medium text-slate-700 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full border-2 border-slate-300 flex items-center justify-center">
                          {selectedAddress?.id === address.id && (
                            <div className="h-3 w-3 rounded-full bg-slate-900" />
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedAddress?.id === address.id && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditAddress(address.id); }}
                          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteAddress(address.id); }}
                          className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add/Edit Address Form */}
          {isAddingAddress && (
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Name</span>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Phone</span>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Pincode</span>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="Pincode"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Locality</span>
                    <input
                      type="text"
                      value={formData.locality}
                      onChange={(e) => handleFormChange('locality', e.target.value)}
                      placeholder="Area/Locality"
                      disabled={pincodeLoading}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none disabled:bg-slate-50"
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Address Line 1</span>
                  <input
                    type="text"
                    value={formData.address_line1}
                    onChange={(e) => handleFormChange('address_line1', e.target.value)}
                    placeholder="Building, house number"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Address Line 2 (optional)</span>
                  <input
                    type="text"
                    value={formData.address_line2}
                    onChange={(e) => handleFormChange('address_line2', e.target.value)}
                    placeholder="Road name, landmark"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">City</span>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleFormChange('city', e.target.value)}
                      placeholder="City"
                      disabled={pincodeLoading}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none disabled:bg-slate-50"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">State</span>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleFormChange('state', e.target.value)}
                      placeholder="State"
                      disabled={pincodeLoading}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none disabled:bg-slate-50"
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Landmark (optional)</span>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => handleFormChange('landmark', e.target.value)}
                    placeholder="Near metro station, etc."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 outline-none"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => handleFormChange('is_default', e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Set as default address</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setIsAddingAddress(false);
                      setEditingAddressId(null);
                      setFormData({
                        name: '',
                        phone: '',
                        pincode: '',
                        locality: '',
                        address_line1: '',
                        address_line2: '',
                        city: '',
                        state: '',
                        landmark: '',
                        is_default: false,
                      });
                    }}
                    className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingAddressId ? handleUpdateAddress : handleAddAddress}
                    className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
                  >
                    {editingAddressId ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add New Address Button */}
          {!isAddingAddress && (
            <button
              onClick={() => setIsAddingAddress(true)}
              className="w-full rounded-[20px] border-2 border-dashed border-slate-300 px-6 py-4 text-center font-semibold text-slate-700 hover:border-slate-400 transition"
            >
              + Add New Address
            </button>
          )}
        </div>

        {/* Cart Summary */}
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
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{cart?.total_price?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!selectedAddress}
        className="w-full rounded-full bg-slate-900 px-6 py-3 text-lg font-semibold text-white hover:bg-slate-800 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        Continue to Payment
      </button>
    </div>
  );
}
