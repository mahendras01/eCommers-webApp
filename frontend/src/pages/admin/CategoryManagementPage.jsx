import { useEffect, useState } from 'react';
import {
  listAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
  listAdminSubCategories,
  createAdminSubCategory,
  deleteAdminSubCategory,
} from '../../services/admin.js';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', category_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        listAdminCategories(),
        listAdminSubCategories(),
      ]);
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

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    try {
      await createAdminCategory(categoryForm);
      setCategoryForm({ name: '' });
      setSuccessMessage('Category created successfully.');
      fetchData();
    } catch (err) {
      setError('Unable to create category.');
    }
  };

  const handleSubCategorySubmit = async (event) => {
    event.preventDefault();
    try {
      await createAdminSubCategory({
        name: subcategoryForm.name,
        category_id: Number(subcategoryForm.category_id),
      });
      setSubcategoryForm({ name: '', category_id: '' });
      setSuccessMessage('SubCategory created successfully.');
      fetchData();
    } catch (err) {
      setError('Unable to create subcategory.');
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    if (!window.confirm('Delete this category? This will also delete all its subcategories.')) return;
    try {
      await deleteAdminCategory(categoryId);
      setSuccessMessage('Category deleted successfully.');
      fetchData();
    } catch (err) {
      setError('Unable to delete category.');
    }
  };

  const handleSubCategoryDelete = async (subcategoryId) => {
    if (!window.confirm('Delete this subcategory?')) return;
    try {
      await deleteAdminSubCategory(subcategoryId);
      setSuccessMessage('SubCategory deleted successfully.');
      fetchData();
    } catch (err) {
      setError('Unable to delete subcategory.');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Category Management</h2>
          <p className="mt-2 text-slate-600">Manage product categories and subcategories.</p>
        </div>

        {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}
        {successMessage && <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">{successMessage}</div>}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Category Form */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Category</h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Category Name</label>
                <input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* SubCategory Form */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add SubCategory</h3>
            <form onSubmit={handleSubCategorySubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">SubCategory Name</label>
                <input
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Parent Category</label>
                <select
                  value={subcategoryForm.category_id}
                  onChange={(e) => setSubcategoryForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create SubCategory
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-[28px] bg-white p-6 shadow-sm overflow-x-auto">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Categories</h2>
        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">{category.name}</td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleCategoryDelete(category.id)}
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

      {/* SubCategories Table */}
      <div className="rounded-[28px] bg-white p-6 shadow-sm overflow-x-auto">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">SubCategories</h2>
        {loading ? (
          <p>Loading subcategories...</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Parent Category</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((subcategory) => (
                <tr key={subcategory.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">{subcategory.name}</td>
                  <td className="py-3 px-4">{getCategoryName(subcategory.category_id)}</td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSubCategoryDelete(subcategory.id)}
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
    </div>
  );
}