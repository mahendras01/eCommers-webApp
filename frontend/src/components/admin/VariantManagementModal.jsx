import { useState, useEffect } from 'react';
import {
  listProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from '../../services/admin.js';

export default function VariantManagementModal({ productId, productType, isOpen, onClose, onSuccess }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    sku: '',
    size: '',
    weight: '',
    volume: '',
    price: '',
    stock: '',
  });
  const [editingVariantId, setEditingVariantId] = useState(null);

  const variantFieldConfig = {
    CLOTHING: { size: true, weight: false, volume: false },
    GROCERY: { size: false, weight: true, volume: true },
    ELECTRONICS: { size: false, weight: true, volume: false },
  };

  const fieldConfig = productType
    ? variantFieldConfig[productType] ?? { size: true, weight: true, volume: true }
    : { size: true, weight: true, volume: true };

  useEffect(() => {
    if (isOpen && productId) {
      fetchVariants();
    }
  }, [isOpen, productId]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await listProductVariants(productId);
      setVariants(response.data);
    } catch (err) {
      setError('Unable to load variants.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      sku: '',
      size: '',
      weight: '',
      volume: '',
      price: '',
      stock: '',
    });
    setEditingVariantId(null);
    setSuccessMessage('');
    setError('');
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        sku: form.sku,
        size: fieldConfig.size ? form.size || undefined : undefined,
        weight: fieldConfig.weight ? (form.weight ? Number(form.weight) : undefined) : undefined,
        volume: fieldConfig.volume ? (form.volume ? Number(form.volume) : undefined) : undefined,
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (editingVariantId) {
        await updateProductVariant(editingVariantId, payload);
        setSuccessMessage('Variant updated successfully.');
      } else {
        await createProductVariant(productId, payload);
        setSuccessMessage('Variant created successfully.');
      }

      resetForm();
      fetchVariants();
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to save variant.');
    }
  };

  const handleEdit = (variant) => {
    setEditingVariantId(variant.id);
    setForm({
      sku: variant.sku,
      size: variant.size || '',
      weight: variant.weight || '',
      volume: variant.volume || '',
      price: variant.price,
      stock: variant.stock,
    });
  };

  const handleDelete = async (variantId) => {
    if (!window.confirm('Delete this variant?')) return;
    try {
      await deleteProductVariant(variantId);
      setSuccessMessage('Variant deleted successfully.');
      fetchVariants();
      onSuccess?.();
    } catch (err) {
      setError('Unable to delete variant.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-screen w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Manage Variants</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {error && <div className="mb-4 rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}
        {successMessage && <div className="mb-4 rounded-3xl bg-emerald-50 p-4 text-emerald-700">{successMessage}</div>}

        {/* Variant Form */}
        <div className="mb-6 rounded-[20px] bg-slate-50 p-4">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            {editingVariantId ? 'Edit Variant' : 'Add New Variant'}
          </h3>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">SKU *</label>
              <input
                value={form.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="e.g., SKU-001"
                required
              />
            </div>
            {fieldConfig.size && (
              <div>
                <label className="text-sm font-semibold text-slate-700">Size</label>
                <input
                  value={form.size}
                  onChange={(e) => handleChange('size', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="e.g., M, L, XL"
                />
              </div>
            )}
            {fieldConfig.weight && (
              <div>
                <label className="text-sm font-semibold text-slate-700">Weight (kg)</label>
                <input
                  value={form.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
            )}
            {fieldConfig.volume && (
              <div>
                <label className="text-sm font-semibold text-slate-700">Volume (L)</label>
                <input
                  value={form.volume}
                  onChange={(e) => handleChange('volume', e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-slate-700">Price (₹) *</label>
              <input
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Stock *</label>
              <input
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                type="number"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {editingVariantId ? 'Update' : 'Add'} Variant
              </button>
              {editingVariantId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Variants List */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Variants ({variants.length})</h3>
          {loading ? (
            <p className="text-slate-600">Loading variants...</p>
          ) : variants.length === 0 ? (
            <p className="text-slate-600">No variants yet. Add one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 px-3">SKU</th>
                {fieldConfig.size && <th className="py-2 px-3">Size</th>}
                {fieldConfig.weight && <th className="py-2 px-3">Weight</th>}
                {fieldConfig.volume && <th className="py-2 px-3">Volume</th>}
                <th className="py-2 px-3">Price</th>
                <th className="py-2 px-3">Stock</th>
                <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-xs">{variant.sku}</td>
                      {fieldConfig.size && <td className="py-2 px-3">{variant.size || '—'}</td>}
                      {fieldConfig.weight && <td className="py-2 px-3">{variant.weight ? `${variant.weight} kg` : '—'}</td>}
                      {fieldConfig.volume && <td className="py-2 px-3">{variant.volume ? `${variant.volume} L` : '—'}</td>}
                      <td className="py-2 px-3">₹{variant.price.toFixed(2)}</td>
                      <td className="py-2 px-3">{variant.stock}</td>
                      <td className="py-2 px-3 space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(variant)}
                          className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(variant.id)}
                          className="rounded bg-rose-500 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
