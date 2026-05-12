import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

export default function CartPage() {
  const { cart, pricing, removeFromCart, updateQuantity } = useCart();
  const [error, setError] = useState('');

  if (!cart) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading cart...</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm text-center">
        <p className="text-lg text-slate-600 mb-4">Your cart is empty</p>
        <Link
          to="/"
          className="inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handleQuantityChange = async (item_id, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(item_id, newQuantity);
    } catch (err) {
      setError('Failed to update quantity');
    }
  };

  const handleRemove = async (item_id) => {
    try {
      await removeFromCart(item_id);
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  return (
    <div className="space-y-8">
      {/* Cart Items */}
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Shopping Cart</h1>

        {error && (
          <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700 mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 border-b border-slate-200 pb-4 last:border-b-0"
            >
              {/* Product Image */}
              <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    to={`/product/${item.product.id}`}
                    className="font-semibold text-slate-900 hover:text-slate-700"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-slate-600 text-sm mt-1">
                    ₹{item.product.price.toFixed(2)} each
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    className="rounded border border-slate-300 px-2 py-1 text-slate-900 hover:bg-slate-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                    }
                    className="w-12 text-center border border-slate-300 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    className="rounded border border-slate-300 px-2 py-1 text-slate-900 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>

                {/* Price and Remove */}
                <div className="text-right ml-4">
                  <p className="font-semibold text-slate-900">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="mt-2 text-sm text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className="rounded-3xl bg-slate-50 p-8 shadow-sm">
        <div className="space-y-4">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal ({pricing.items_count || 0} items)</span>
            <span>₹{(pricing.subtotal || 0).toFixed(2)}</span>
          </div>

          {/* Tax Breakdown */}
          {pricing.tax_breakdown && Object.keys(pricing.tax_breakdown).length > 0 && (
            <div className="space-y-2 text-sm">
              {Object.entries(pricing.tax_breakdown).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-slate-600">
                  <span>Tax ({rate}%)</span>
                  <span>₹{(amount || 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-slate-600 font-medium border-t border-slate-200 pt-2">
                <span>Total Tax</span>
                <span>₹{(pricing.tax || 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Shipping</span>
            <span>₹{(pricing.shipping || 100).toFixed(2)}</span>
          </div>

          <div className="border-t border-slate-200 pt-4 flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>₹{(pricing.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <Link
          to="/delivery"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
        >
          Continue to Delivery
        </Link>

        <Link
          to="/"
          className="mt-3 block text-center text-sm text-slate-600 hover:text-slate-900 font-medium"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
