import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  iconBase64: string | null;
  imageBase64: string | null;
  sortOrder: number;
  isVisible: boolean;
  isActive: boolean;
  subCategories?: SubCategory[];
  createdAt?: string;
  updatedAt?: string;
}

interface Collection {
  id: number;
  name: string;
  description: string;
  imageBase64: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  iconBase64: string;
  imageBase64: string;
}

interface SubCategoryFormData {
  name: string;
}

interface CollectionFormData {
  name: string;
  description: string;
  imageBase64: string;
}

// ─── Helper: file to base64 ─────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'collections'>('categories');

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '', description: '', iconBase64: '', imageBase64: '',
  });

  // Sub-category form state
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [subCategoryParentId, setSubCategoryParentId] = useState<number | null>(null);
  const [subCategoryForm, setSubCategoryForm] = useState<SubCategoryFormData>({ name: '' });

  // Collection form state
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [collectionForm, setCollectionForm] = useState<CollectionFormData>({
    name: '', description: '', imageBase64: '',
  });

  // Drag state
  const [draggedId, setDraggedId] = useState<number | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/categories/public/tree');
      setCategories(res.data.data ?? []);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/collections/public');
      setCollections(res.data.data ?? []);
    } catch { /* handled by interceptor */ }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchCollections();
  }, [fetchCategories, fetchCollections]);

  // ─── Category CRUD ──────────────────────────────────────────────────────────

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', iconBase64: '', imageBase64: '' });
    setShowCategoryForm(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      iconBase64: cat.iconBase64 || '',
      imageBase64: cat.imageBase64 || '',
    });
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axiosInstance.put(`/categories/${editingCategory.id}`, categoryForm);
      } else {
        await axiosInstance.post('/categories', categoryForm);
      }
      setShowCategoryForm(false);
      fetchCategories();
    } catch { /* handled by interceptor */ }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category? All sub-categories will also be removed.')) return;
    try {
      await axiosInstance.delete(`/categories/${id}`);
      fetchCategories();
    } catch { /* handled by interceptor */ }
  };

  // ─── Visibility & Active Toggles ───────────────────────────────────────────

  const toggleVisibility = async (cat: Category) => {
    try {
      await axiosInstance.put(`/categories/${cat.id}/visibility?visible=${!cat.isVisible}`);
      fetchCategories();
    } catch { /* handled by interceptor */ }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await axiosInstance.put(`/categories/${cat.id}/active?active=${!cat.isActive}`);
      fetchCategories();
    } catch { /* handled by interceptor */ }
  };

  // ─── Drag & Drop Reorder ───────────────────────────────────────────────────

  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: number) => {
    if (draggedId === null || draggedId === targetId) return;
    const draggedIndex = categories.findIndex((c) => c.id === draggedId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const updated = [...categories];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setCategories(updated);
    setDraggedId(null);

    try {
      await axiosInstance.put(`/categories/${draggedId}/sort-order?sortOrder=${targetIndex}`);
    } catch { fetchCategories(); }
  };

  // ─── Sub-Category CRUD ─────────────────────────────────────────────────────

  const openCreateSubCategory = (parentId: number) => {
    setEditingSubCategory(null);
    setSubCategoryParentId(parentId);
    setSubCategoryForm({ name: '' });
    setShowSubCategoryForm(true);
  };

  const openEditSubCategory = (sub: SubCategory) => {
    setEditingSubCategory(sub);
    setSubCategoryParentId(sub.categoryId);
    setSubCategoryForm({ name: sub.name });
    setShowSubCategoryForm(true);
  };

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubCategory) {
        await axiosInstance.put(
          `/categories/sub-categories/${editingSubCategory.id}`,
          subCategoryForm,
        );
      } else {
        await axiosInstance.post(
          `/categories/${subCategoryParentId}/sub-categories`,
          subCategoryForm,
        );
      }
      setShowSubCategoryForm(false);
      fetchCategories();
    } catch { /* handled by interceptor */ }
  };

  const handleDeleteSubCategory = async (id: number) => {
    if (!window.confirm('Delete this sub-category?')) return;
    try {
      await axiosInstance.delete(`/categories/sub-categories/${id}`);
      fetchCategories();
    } catch { /* handled by interceptor */ }
  };

  // ─── Collection CRUD ────────────────────────────────────────────────────────

  const openCreateCollection = () => {
    setEditingCollection(null);
    setCollectionForm({ name: '', description: '', imageBase64: '' });
    setShowCollectionForm(true);
  };

  const openEditCollection = (col: Collection) => {
    setEditingCollection(col);
    setCollectionForm({
      name: col.name,
      description: col.description || '',
      imageBase64: col.imageBase64 || '',
    });
    setShowCollectionForm(true);
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        await axiosInstance.put(`/collections/${editingCollection.id}`, collectionForm);
      } else {
        await axiosInstance.post('/collections', collectionForm);
      }
      setShowCollectionForm(false);
      fetchCollections();
    } catch { /* handled by interceptor */ }
  };

  const handleDeleteCollection = async (id: number) => {
    if (!window.confirm('Delete this collection?')) return;
    try {
      await axiosInstance.delete(`/collections/${id}`);
      fetchCollections();
    } catch { /* handled by interceptor */ }
  };

  // ─── File Handlers ──────────────────────────────────────────────────────────

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCategoryForm((prev) => ({ ...prev, iconBase64: base64 }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCategoryForm((prev) => ({ ...prev, imageBase64: base64 }));
  };

  const handleCollectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCollectionForm((prev) => ({ ...prev, imageBase64: base64 }));
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f4ede1] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-[#2c2c2c]/12 bg-[#faf5ea]/90 p-5 shadow-[0_10px_25px_rgba(160,107,58,0.08)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a06b3a]">Catalog</p>
              <h1 className="mt-1 text-3xl font-bold text-[#2c2c2c]">
                Category Management
              </h1>
              <p className="mt-1 text-sm text-[#6b5d52]">
                Manage categories, sub-categories, and collections
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-[#2c2c2c]/12 pb-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-[#a06b3a] text-white shadow-sm'
                : 'bg-transparent text-[#6b5d52] hover:text-[#6b5544]'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'collections'
                ? 'bg-[#a06b3a] text-white shadow-sm'
                : 'bg-transparent text-[#6b5d52] hover:text-[#6b5544]'
            }`}
          >
            Collections
          </button>
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCreateCategory}
              className="rounded-xl bg-gradient-to-r from-[#a06b3a] to-[#7a4f28] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#7a4f28] hover:to-[#7a4f28]"
            >
              + Add Category
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-[#a06b3a] border-t-transparent rounded-full" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-[#6b5d52]">
              No categories found. Create your first category.
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => handleDragStart(cat.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(cat.id)}
                  className={`rounded-2xl border border-[#2c2c2c]/12 bg-[#faf5ea] p-4 shadow-[0_8px_20px_rgba(160,107,58,0.06)] transition-all ${
                    draggedId === cat.id ? 'scale-[0.99] opacity-60' : ''
                  }`}
                >
                  {/* Category Header Row */}
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <span className="cursor-grab text-[#8a7a6b] hover:text-[#6b5d52] select-none text-lg">
                      ⠿
                    </span>

                    {/* Icon */}
                    {cat.iconBase64 && (
                      <img
                        src={cat.iconBase64}
                        alt={cat.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}

                    {/* Name & description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[#2c2c2c] truncate">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-[#6b5d52] truncate">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Badges */}
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        cat.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-[#f4ede1] text-[#6b5d52]'
                      }`}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        cat.isVisible
                          ? 'bg-[#f4ede1] text-[#a06b3a]'
                          : 'bg-[#f4ede1] text-[#6b5d52]'
                      }`}
                    >
                      {cat.isVisible ? 'Visible' : 'Hidden'}
                    </span>

                    {/* Toggle buttons */}
                    <button
                      onClick={() => toggleVisibility(cat)}
                      title={cat.isVisible ? 'Hide category' : 'Show category'}
                      className="p-1.5 rounded-md text-[#6b5d52] hover:bg-[#f4ede1] transition-colors"
                    >
                      {cat.isVisible ? '👁️' : '🙈'}
                    </button>
                    <button
                      onClick={() => toggleActive(cat)}
                      title={cat.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-md text-[#6b5d52] hover:bg-[#f4ede1] transition-colors"
                    >
                      {cat.isActive ? '✅' : '⭕'}
                    </button>

                    {/* Actions */}
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="p-1.5 rounded-md text-[#a06b3a] hover:bg-[#f4ede1] transition-colors"
                      title="Edit category"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Sub-categories */}
                  {cat.subCategories && cat.subCategories.length > 0 && (
                    <div className="mt-3 ml-10 space-y-2">
                      {cat.subCategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2 p-2 bg-[#f4ede1] rounded-lg"
                        >
                          <span className="text-xs text-[#8a7a6b]">└</span>
                          <span className="flex-1 text-sm text-[#6b5544]">
                            {sub.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                              sub.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-[#f4ede1] text-[#6b5d52]'
                            }`}
                          >
                            {sub.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => openEditSubCategory(sub)}
                            className="p-1 text-[#a06b3a] hover:bg-[#f4ede1] rounded"
                            title="Edit sub-category"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteSubCategory(sub.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete sub-category"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add sub-category button */}
                  <div className="mt-2 ml-10">
                    <button
                      onClick={() => openCreateSubCategory(cat.id)}
                      className="text-xs text-[#a06b3a] hover:text-[#7a4f28] font-medium"
                    >
                      + Add Sub-category
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCreateCollection}
              className="px-4 py-2 bg-[#a06b3a] text-white text-sm font-medium rounded-lg hover:bg-[#7a4f28] transition-colors"
            >
              + Add Collection
            </button>
          </div>

          {collections.length === 0 ? (
            <div className="text-center py-12 text-[#6b5d52]">
              No collections found. Create your first collection.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="bg-[#faf5ea] rounded-xl shadow-sm border border-[#2c2c2c]/12 overflow-hidden"
                >
                  {col.imageBase64 && (
                    <img
                      src={col.imageBase64}
                      alt={col.name}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[#2c2c2c] text-sm">
                        {col.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                          col.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-[#f4ede1] text-[#6b5d52]'
                        }`}
                      >
                        {col.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {col.description && (
                      <p className="text-xs text-[#6b5d52] mt-1 line-clamp-2">
                        {col.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openEditCollection(col)}
                        className="text-xs px-2 py-1 bg-[#f4ede1] text-[#a06b3a] rounded hover:bg-[#e8dfcd]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(col.id)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#faf5ea] rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-bold text-[#2c2c2c] mb-4">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b5544] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#2c2c2c]/15 rounded-lg bg-[#faf5ea] text-[#2c2c2c] text-sm focus:ring-2 focus:ring-[#a06b3a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b5544] mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#2c2c2c]/15 rounded-lg bg-[#faf5ea] text-[#2c2c2c] text-sm focus:ring-2 focus:ring-[#a06b3a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b5544] mb-1">
                  Icon
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="w-full text-sm text-[#6b5d52] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#f4ede1] file:text-[#a06b3a] hover:file:bg-[#e8dfcd]"
                />
                {categoryForm.iconBase64 && (
                  <img src={categoryForm.iconBase64} alt="Icon preview" className="mt-2 w-10 h-10 rounded object-cover" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6b5544] mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-[#6b5d52] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#f4ede1] file:text-[#a06b3a] hover:file:bg-[#e8dfcd]"
                />
                {categoryForm.imageBase64 && (
                  <img src={categoryForm.imageBase64} alt="Image preview" className="mt-2 w-full h-24 rounded-lg object-cover" />
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="px-4 py-2 text-sm font-medium text-[#6b5544] bg-[#f4ede1] rounded-lg hover:bg-[#e8dfcd] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#a06b3a] rounded-lg hover:bg-[#7a4f28] transition-colors"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Category Form Modal */}
      {showSubCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#faf5ea] rounded-xl shadow-xl w-full max-w-sm p-6 m-4">
            <h2 className="text-lg font-bold text-[#2c2c2c] mb-4">
              {editingSubCategory ? 'Edit Sub-category' : 'New Sub-category'}
            </h2>
            <form onSubmit={handleSubCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b5544] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={subCategoryForm.name}
                  onChange={(e) => setSubCategoryForm({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#2c2c2c]/15 rounded-lg bg-[#faf5ea] text-[#2c2c2c] text-sm focus:ring-2 focus:ring-[#a06b3a] focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubCategoryForm(false)}
                  className="px-4 py-2 text-sm font-medium text-[#6b5544] bg-[#f4ede1] rounded-lg hover:bg-[#e8dfcd] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#a06b3a] rounded-lg hover:bg-[#7a4f28] transition-colors"
                >
                  {editingSubCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collection Form Modal */}
      {showCollectionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#faf5ea] rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-bold text-[#2c2c2c] mb-4">
              {editingCollection ? 'Edit Collection' : 'New Collection'}
            </h2>
            <form onSubmit={handleCollectionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b5544] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={collectionForm.name}
                  onChange={(e) => setCollectionForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#2c2c2c]/15 rounded-lg bg-[#faf5ea] text-[#2c2c2c] text-sm focus:ring-2 focus:ring-[#a06b3a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b5544] mb-1">
                  Description
                </label>
                <textarea
                  value={collectionForm.description}
                  onChange={(e) => setCollectionForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#2c2c2c]/15 rounded-lg bg-[#faf5ea] text-[#2c2c2c] text-sm focus:ring-2 focus:ring-[#a06b3a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b5544] mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCollectionImageUpload}
                  className="w-full text-sm text-[#6b5d52] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#f4ede1] file:text-[#a06b3a] hover:file:bg-[#e8dfcd]"
                />
                {collectionForm.imageBase64 && (
                  <img src={collectionForm.imageBase64} alt="Preview" className="mt-2 w-full h-24 rounded-lg object-cover" />
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCollectionForm(false)}
                  className="px-4 py-2 text-sm font-medium text-[#6b5544] bg-[#f4ede1] rounded-lg hover:bg-[#e8dfcd] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#a06b3a] rounded-lg hover:bg-[#7a4f28] transition-colors"
                >
                  {editingCollection ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
