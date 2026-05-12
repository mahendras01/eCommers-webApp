import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProducts, listCategories } from '../services/product.js';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Get featured products (first 5)
  const featuredProducts = products.slice(0, 5);

  // Auto-scroll slider
  useEffect(() => {
    if (featuredProducts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(timer);
  }, [featuredProducts.length]);

  // Slider navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % (featuredProducts.length || 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? (featuredProducts.length || 1) - 1 : prev - 1
    );
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await listProducts({
        search: searchTerm || null,
        categoryId: selectedCategory || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      });
      setProducts(response.data || []);
      setFiltersApplied(!!(searchTerm || selectedCategory || minPrice || maxPrice));
    } catch (err) {
      setError('Unable to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await listCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleFilterChange = () => {
    fetchProducts();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setFiltersApplied(false);
    fetchProducts();
  };

  if (loading && !filtersApplied) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-600">Loading products...</p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* ======================== PROMOTIONAL BANNERS - 2 COLUMNS ======================== */}
      {featuredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Banner */}
          <div className="rounded-3xl overflow-hidden bg-white shadow-sm">
            <div className="relative aspect-video bg-slate-100">
              <div className="relative w-full h-full flex items-center justify-center">
                {featuredProducts[currentSlide]?.image_url && (
                  <img
                    src={featuredProducts[currentSlide].image_url}
                    alt={featuredProducts[currentSlide].name}
                    className="w-full h-full object-cover"
                  />
                )}
                
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white">
                  <h2 className="text-2xl font-bold mb-2 text-center px-2">{featuredProducts[currentSlide]?.name}</h2>
                  <p className="text-lg mb-3">₹{featuredProducts[currentSlide]?.price.toFixed(2)}</p>
                  <Link
                    to={`/product/${featuredProducts[currentSlide]?.id}`}
                    className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-100"
                  >
                    View Product
                  </Link>
                </div>

                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center transition z-10 text-xs"
                >
                  ❮
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center transition z-10 text-xs"
                >
                  ❯
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {featuredProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition ${
                        index === currentSlide ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Banner */}
          <div className="rounded-3xl overflow-hidden bg-white shadow-sm">
            <div className="relative aspect-video bg-slate-100">
              <div className="relative w-full h-full flex items-center justify-center">
                {featuredProducts[(currentSlide + 1) % featuredProducts.length]?.image_url && (
                  <img
                    src={featuredProducts[(currentSlide + 1) % featuredProducts.length].image_url}
                    alt={featuredProducts[(currentSlide + 1) % featuredProducts.length].name}
                    className="w-full h-full object-cover"
                  />
                )}
                
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white">
                  <h2 className="text-2xl font-bold mb-2 text-center px-2">{featuredProducts[(currentSlide + 1) % featuredProducts.length]?.name}</h2>
                  <p className="text-lg mb-3">₹{featuredProducts[(currentSlide + 1) % featuredProducts.length]?.price.toFixed(2)}</p>
                  <Link
                    to={`/product/${featuredProducts[(currentSlide + 1) % featuredProducts.length]?.id}`}
                    className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-100"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MAIN LAYOUT: SIDEBAR + PRODUCTS ======================== */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ======================== LEFT SIDEBAR - FILTERS ======================== */}
        <aside className="w-full lg:w-64 lg:flex-shrink-0">
          <div className="rounded-3xl bg-white p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Filters</h3>
            
            <form className="flex flex-col gap-4 items-start">
              {/* Search Bar */}
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  Search Products
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  Min Price
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    handleFilterChange();
                  }}
                  placeholder="₹0"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                />
              </div>

              {/* Max Price */}
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  Max Price
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    handleFilterChange();
                  }}
                  placeholder="₹10000"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                />
              </div>

              {/* Search & Clear Buttons */}
              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Search
                </button>
                {filtersApplied && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </form>
          </div>
        </aside>

        {/* ======================== RIGHT MAIN - PRODUCTS GRID ======================== */}
        <main className="flex-1 min-w-0">
          {error && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-rose-50 p-6 text-sm text-rose-700 mb-6">
              {error}
            </div>
          )}

          {loading && !filtersApplied ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <p className="text-slate-600">Loading products...</p>
            </div>
          ) : products.length === 0 && !error ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center">
              <p className="text-slate-600">
                {filtersApplied ? 'No products match your filters.' : 'No products available at the moment.'}
              </p>
              {filtersApplied && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Clear filters to see all products
                </button>
              )}
            </div>
          ) : (
            <>
              {filtersApplied && (
                <p className="mb-4 text-sm text-slate-600">
                  {products.length} product{products.length !== 1 ? 's' : ''} found
                </p>
              )}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <article key={product.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="aspect-square w-full rounded-2xl bg-slate-100 object-cover" />
                    )}
                    <h2 className="mt-4 text-xl font-semibold text-slate-900">{product.name}</h2>
                    <p className="mt-2 line-clamp-2 text-slate-600">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-900">₹{product.price.toFixed(2)}</span>
                      <Link to={`/product/${product.id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800">
                        View
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </section>
  );
}
