import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/product.js';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext.jsx';
import { setPendingBuyNow, clearPendingBuyNow } from '../utils/cartStorage.js';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProduct(id);
        setProduct(response.data);
        setSelectedImage(response.data.image_url);
        
        // Load variants if available
        if (response.data.variants && response.data.variants.length > 0) {
          setVariants(response.data.variants);
          setSelectedVariant(response.data.variants[0]);
        }
      } catch (err) {
        setError('Product not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-3xl bg-rose-50 p-6 text-center text-sm text-rose-700">
        {error}
      </div>
    );
  }

  const productImages = product.images 
    ? JSON.parse(product.images).filter(img => img)
    : (product.image_url ? [product.image_url] : []);

  const features = product.features
    ? (Array.isArray(product.features) ? product.features : JSON.parse(product.features))
    : [];

  const variantLabel = (variant) => {
    if (!variant) return '';
    switch (product.product_type) {
      case 'CLOTHING':
        return variant.size || `SKU ${variant.sku}`;
      case 'GROCERY': {
        const parts = [];
        if (variant.weight) parts.push(`${variant.weight}kg`);
        if (variant.volume) parts.push(`${variant.volume}L`);
        return parts.length > 0 ? parts.join(' • ') : `SKU ${variant.sku}`;
      }
      case 'ELECTRONICS':
        return variant.weight ? `${variant.weight}kg` : `SKU ${variant.sku}`;
      default: {
        const parts = [];
        if (variant.size) parts.push(variant.size);
        if (variant.weight) parts.push(`${variant.weight}kg`);
        return parts.length > 0 ? parts.join(' • ') : `SKU ${variant.sku}`;
      }
    }
  };

  const productTypeLabel = product.product_type ? product.product_type.replace('_', ' ') : null;

  return (
    <div className="space-y-8">
      {/* Main Product Section */}
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-100 overflow-hidden aspect-square flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-400">No image available</div>
              )}
            </div>

            {productImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {productImages.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(image)}
                    className={`rounded-lg overflow-hidden flex-shrink-0 w-16 h-16 border-2 transition ${
                      selectedImage === image
                        ? 'border-slate-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Product</p>
              <h1 className="mt-2 text-4xl font-semibold text-slate-900">{product.name}</h1>
            </div>

            {/* Product Type Badge */}
            {productTypeLabel && (
              <div className="inline-block">
                <span className="inline-block rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                  {productTypeLabel}
                </span>
              </div>
            )}

            {/* Rating and Reviews */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < Math.floor(product.rating) ? 'text-amber-400' : 'text-slate-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="font-semibold text-slate-900">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-slate-600">({product.review_count} reviews)</span>
            </div>

            {/* Price and Stock */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">
                  ₹{(selectedVariant?.price || product.price).toFixed(2)}
                </span>
                {selectedVariant?.price !== product.price && selectedVariant && (
                  <span className="line-through text-lg text-slate-500">₹{product.price.toFixed(2)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    (selectedVariant?.stock || product.stock) > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {(selectedVariant?.stock || product.stock) > 0 
                    ? `${selectedVariant?.stock || product.stock} in stock` 
                    : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Variant Selector */}
            {variants.length > 0 && (
              <div className="space-y-3 border-t border-b border-slate-200 py-4">
                <h3 className="text-sm font-semibold text-slate-900">Select Option</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`rounded-lg border-2 p-3 text-sm font-medium transition ${
                        selectedVariant?.id === variant.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-900 hover:border-slate-300'
                      } ${variant.stock === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                      disabled={variant.stock === 0}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{variantLabel(variant)}</span>
                        <span className="text-xs">₹{variant.price.toFixed(0)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product Highlights */}
            {(product.color || product.material) && (
              <div className="space-y-3 border-t border-b border-slate-200 py-4">
                <h3 className="text-sm font-semibold text-slate-900">Highlights</h3>
                <div className="grid grid-cols-2 gap-4">
                  {product.color && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Color</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{product.color}</p>
                    </div>
                  )}
                  {product.material && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Material</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{product.material}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tax and Shipping Information */}
            <div className="rounded-lg bg-blue-50 p-4 space-y-2 border border-blue-200">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">ℹ</span>
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Additional costs at checkout:</p>
                  <p className="mt-1">• Tax ({product.tax_percent || 18}%) will be added</p>
                  <p>• Shipping: ₹100 flat rate</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Description</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Cart Message */}
            {cartMessage && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {cartMessage}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Quantity</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="rounded border border-slate-300 px-3 py-2 text-slate-900 hover:bg-slate-100"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedVariant?.stock || product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border border-slate-300 rounded px-3 py-2"
                />
                <button
                  onClick={() => setQuantity(q => Math.min(selectedVariant?.stock || product.stock, q + 1))}
                  className="rounded border border-slate-300 px-3 py-2 text-slate-900 hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={(selectedVariant?.stock || product.stock) === 0 || isAddingToCart}
                onClick={async () => {
                  setIsAddingToCart(true);
                  try {
                    const cartItem = {
                      ...product,
                      price: selectedVariant?.price || product.price,
                      stock: selectedVariant?.stock || product.stock,
                    };
                    if (selectedVariant) {
                      cartItem.variant_id = selectedVariant.id;
                      cartItem.sku = selectedVariant.sku;
                    }
                    await addToCart(product.id, quantity, cartItem);
                    setCartMessage(`✓ Added ${quantity} item(s) to cart`);
                    setQuantity(1);
                    setTimeout(() => setCartMessage(''), 3000);
                  } catch (err) {
                    setCartMessage('Failed to add to cart. Please try again.');
                  } finally {
                    setIsAddingToCart(false);
                  }
                }}
                className="rounded-full bg-slate-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {(selectedVariant?.stock || product.stock) > 0 ? 'Add to Cart' : 'Out of stock'}
              </button>

              <button
                type="button"
                disabled={(selectedVariant?.stock || product.stock) === 0 || isAddingToCart}
                onClick={async () => {
                  setIsAddingToCart(true);
                  try {
                    const cartItem = {
                      ...product,
                      price: selectedVariant?.price || product.price,
                      stock: selectedVariant?.stock || product.stock,
                    };
                    if (selectedVariant) {
                      cartItem.variant_id = selectedVariant.id;
                      cartItem.sku = selectedVariant.sku;
                    }
                    await addToCart(product.id, quantity, cartItem);
                    if (isAuthenticated) {
                      navigate('/delivery');
                    } else {
                      setPendingBuyNow({ redirectTo: '/delivery', productId: product.id, quantity });
                      navigate('/login', { state: { from: '/delivery', buyNow: true } });
                    }
                  } catch (err) {
                    setCartMessage('Failed to process buy now. Please try again.');
                  } finally {
                    setIsAddingToCart(false);
                  }
                }}
                className="rounded-full border border-slate-900 bg-white px-6 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
              >
                {(selectedVariant?.stock || product.stock) > 0 
                  ? `Buy at ₹${(selectedVariant?.price || product.price).toFixed(2)}` 
                  : 'Out of stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      {features.length > 0 && (
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Features</h2>
          <ul className="mt-4 space-y-3">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-600">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-900 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Details Section */}
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">All Details</h2>
        <div className="mt-6 space-y-4 text-sm">
          <div className="flex justify-between border-b border-slate-200 py-3">
            <span className="text-slate-600">Product ID</span>
            <span className="font-medium text-slate-900">{product.id}</span>
          </div>
          {product.color && (
            <div className="flex justify-between border-b border-slate-200 py-3">
              <span className="text-slate-600">Color</span>
              <span className="font-medium text-slate-900">{product.color}</span>
            </div>
          )}
          {product.material && (
            <div className="flex justify-between border-b border-slate-200 py-3">
              <span className="text-slate-600">Material</span>
              <span className="font-medium text-slate-900">{product.material}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-slate-200 py-3">
            <span className="text-slate-600">Price</span>
            <span className="font-medium text-slate-900">₹{product.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 py-3">
            <span className="text-slate-600">Stock Available</span>
            <span className="font-medium text-slate-900">{product.stock}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 py-3">
            <span className="text-slate-600">Rating</span>
            <span className="font-medium text-slate-900">{product.rating.toFixed(1)} ★</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-slate-600">Customer Reviews</span>
            <span className="font-medium text-slate-900">{product.review_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
