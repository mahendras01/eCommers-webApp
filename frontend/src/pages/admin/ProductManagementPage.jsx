import { useEffect, useState } from 'react';
import {
  listAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  listAdminCategories,
  listAdminSubCategories,
} from '../../services/admin.js';
import VariantManagementModal from '../../components/admin/VariantManagementModal.jsx';


const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  image_url: '',
  color: '',
  material: '',
  features: '',
  category_id: '',
  subcategory_id: '',
  product_type: '',
};

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
        listAdminProducts({ limit: 100 }),
        listAdminCategories(),
        listAdminSubCategories(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setSubcategories(subcategoriesRes.data);
    } catch (err) {
      setError('Unable to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const loadSubcategories = async () => {
      try {
        const categoryId = form.category_id ? Number(form.category_id) : null;
        const response = await listAdminSubCategories(categoryId);
        setSubcategories(response.data);
      } catch (err) {
        setError('Unable to load subcategories.');
      }
    };

    loadSubcategories();
  }, [form.category_id]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProductId(null);
    setSuccessMessage('');
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      if (field === 'category_id' && prev.category_id !== value) {
        return { ...prev, category_id: value, subcategory_id: '' };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        image_url: form.image_url || undefined,
        color: form.color || undefined,
        material: form.material || undefined,
        features: form.features || undefined,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : undefined,
        product_type: form.product_type || undefined,
      };

      if (editingProductId) {
        await updateAdminProduct(editingProductId, payload);
        setSuccessMessage('Product updated successfully.');
      } else {
        await createAdminProduct(payload);
        setSuccessMessage('Product created successfully.');
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError('Unable to save product.');
    }
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || '',
      color: product.color || '',
      material: product.material || '',
      features: product.features || '',
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
      product_type: product.product_type || '',
    });
    setSuccessMessage('');
    setError('');
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteAdminProduct(productId);
      fetchData();
    } catch (err) {
      setError('Unable to delete product.');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
  };

  const getSubCategoryName = (subcategoryId) => {
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    return subcategory ? subcategory.name : 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Product Management</h2>
            <p className="mt-2 text-slate-600">Add, edit, and delete products from the catalog.</p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            New Product
          </button>
        </div>

        {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}
        {successMessage && <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Price</label>
            <input
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Stock</label>
            <input
              value={form.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              type="number"
              min="0"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Image URL</label>
            <input
              value={form.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">SubCategory</label>
            <select
              value={form.subcategory_id}
              onChange={(e) => handleChange('subcategory_id', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Select SubCategory</option>
              {subcategories
                .filter((sub) => !form.category_id || sub.category_id === Number(form.category_id))
                .map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Product Type</label>
            <select
              value={form.product_type}
              onChange={(e) => handleChange('product_type', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Select Type</option>
              <option value="CLOTHING">Clothing</option>
              <option value="GROCERY">Grocery</option>
              <option value="ELECTRONICS">Electronics</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              rows={4}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Color</label>
            <input
              value={form.color}
              onChange={(e) => handleChange('color', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Material</label>
            <input
              value={form.material}
              onChange={(e) => handleChange('material', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Features</label>
            <input
              value={form.features}
              onChange={(e) => handleChange('features', e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>
          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {editingProductId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[28px] bg-white p-6 shadow-sm overflow-x-auto">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Catalog</h2>
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SubCategory</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">{product.name}</td>
                  <td className="py-3 px-4">{product.product_type || 'N/A'}</td>
                  <td className="py-3 px-4">₹{product.price.toFixed(2)}</td>
                  <td className="py-3 px-4">{product.stock}</td>
                  <td className="py-3 px-4">{getCategoryName(product.category_id)}</td>
                  <td className="py-3 px-4">{getSubCategoryName(product.subcategory_id)}</td>
                  <td className="py-3 px-4 space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductForVariants(product);
                        setVariantModalOpen(true);
                      }}
                      className="rounded-full bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      Variants
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <VariantManagementModal
        productId={selectedProductForVariants?.id}
        productType={selectedProductForVariants?.product_type}
        isOpen={variantModalOpen}
        onClose={() => {
          setVariantModalOpen(false);
          setSelectedProductForVariants(null);
        }}
        onSuccess={fetchData}
      />
    </div>
  );
}
