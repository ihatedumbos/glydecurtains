import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

type PageType = 'ABOUT_US' | 'CONTACT_US' | 'TERMS' | 'PRIVACY_POLICY' | 'CUSTOM';

interface LocalizedContent {
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}

interface CmsPage {
  id: number;
  slug: string;
  pageType: PageType;
  isVisible: boolean;
  sortOrder: number;
  content: Record<string, LocalizedContent>;
  createdAt: string;
  updatedAt: string;
}

interface PageFormData {
  slug: string;
  pageType: PageType;
  isVisible: boolean;
  content: Record<string, LocalizedContent>;
}

const PAGE_TYPES: { value: PageType; label: string }[] = [
  { value: 'ABOUT_US', label: 'About Us' },
  { value: 'CONTACT_US', label: 'Contact Us' },
  { value: 'TERMS', label: 'Terms & Conditions' },
  { value: 'PRIVACY_POLICY', label: 'Privacy Policy' },
  { value: 'CUSTOM', label: 'Custom' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'gu', label: 'Gujarati' },
];

const emptyLocalizedContent = (): LocalizedContent => ({
  title: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
});

const defaultFormData = (): PageFormData => ({
  slug: '',
  pageType: 'CUSTOM',
  isVisible: true,
  content: {
    en: emptyLocalizedContent(),
    hi: emptyLocalizedContent(),
    gu: emptyLocalizedContent(),
  },
});

// ─── Slug Generator ─────────────────────────────────────────────────────────

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Rich Text Editor Component ─────────────────────────────────────────────

function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-wrap">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 rounded text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 rounded text-sm italic hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 rounded text-sm underline hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Underline"
        >
          U
        </button>
        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-1.5 rounded text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h3>')}
          className="p-1.5 rounded text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          className="p-1.5 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Paragraph"
        >
          P
        </button>
        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Numbered List"
        >
          1. List
        </button>
        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) execCommand('createLink', url);
          }}
          className="p-1.5 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Insert Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="p-1.5 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          title="Clear Format"
        >
          ✕
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setMode(mode === 'visual' ? 'html' : 'visual')}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'html'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {mode === 'visual' ? '</>' : 'Visual'}
        </button>
      </div>

      {/* Editor Area */}
      {mode === 'visual' ? (
        <div
          contentEditable
          className="min-h-[200px] p-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: value }}
          onBlur={(e) => onChange(e.currentTarget.innerHTML)}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="w-full p-3 text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none resize-y min-h-[200px]"
        />
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function StaticPagesManagementPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [formData, setFormData] = useState<PageFormData>(defaultFormData());
  const [activeLang, setActiveLang] = useState('en');
  const [autoSlug, setAutoSlug] = useState(true);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/cms/pages');
      setPages(res.data.data ?? []);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // ─── Form Handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingPage(null);
    setFormData(defaultFormData());
    setActiveLang('en');
    setAutoSlug(true);
    setShowForm(true);
  };

  const openEdit = (page: CmsPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      pageType: page.pageType,
      isVisible: page.isVisible,
      content: {
        en: page.content?.en || emptyLocalizedContent(),
        hi: page.content?.hi || emptyLocalizedContent(),
        gu: page.content?.gu || emptyLocalizedContent(),
      },
    });
    setActiveLang('en');
    setAutoSlug(false);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await axiosInstance.put(`/cms/pages/${editingPage.id}`, formData);
      } else {
        await axiosInstance.post('/cms/pages', formData);
      }
      setShowForm(false);
      fetchPages();
    } catch {
      /* handled by interceptor */
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await axiosInstance.delete(`/cms/pages/${id}`);
      fetchPages();
    } catch {
      /* handled by interceptor */
    }
  };

  const toggleVisibility = async (page: CmsPage) => {
    try {
      await axiosInstance.put(`/cms/pages/${page.id}`, {
        ...page,
        isVisible: !page.isVisible,
      });
      fetchPages();
    } catch {
      /* handled by interceptor */
    }
  };

  // Auto-generate slug from English title
  const updateTitle = (lang: string, title: string) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: { ...prev.content[lang], title },
      },
      ...(autoSlug && lang === 'en' ? { slug: generateSlug(title) } : {}),
    }));
  };

  const updateContent = (lang: string, field: keyof LocalizedContent, value: string) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: { ...prev.content[lang], [field]: value },
      },
    }));
  };

  // ─── Helper ─────────────────────────────────────────────────────────────────

  const getPageTypeLabel = (type: PageType) =>
    PAGE_TYPES.find((pt) => pt.value === type)?.label || type;

  const getPageTitle = (page: CmsPage) =>
    page.content?.en?.title || page.content?.hi?.title || page.content?.gu?.title || 'Untitled';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Static Pages
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage static content pages (About, Terms, Privacy, etc.)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Page
        </button>
      </div>

      {/* Page List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No static pages found. Create your first page.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Slug
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Type
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Visible
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Updated
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pages.map((page) => (
                <tr
                  key={page.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {getPageTitle(page)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                    /{page.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">
                      {getPageTypeLabel(page.pageType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleVisibility(page)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        page.isVisible
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      }`}
                      title={page.isVisible ? 'Click to hide' : 'Click to show'}
                    >
                      {page.isVisible ? '👁️' : '🙈'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {page.updatedAt
                      ? new Date(page.updatedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(page)}
                        className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        title="Edit page"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete page"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Page Type & Visibility Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Page Type *
                  </label>
                  <select
                    value={formData.pageType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pageType: e.target.value as PageType,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {PAGE_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isVisible: e.target.checked }))
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Visible on website
                    </span>
                  </label>
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                    <span className="px-3 text-sm text-gray-400 bg-gray-50 dark:bg-gray-600 border-r border-gray-300 dark:border-gray-600 py-2">
                      /page/
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        setFormData((prev) => ({
                          ...prev,
                          slug: generateSlug(e.target.value),
                        }));
                      }}
                      placeholder="my-page-slug"
                      className="flex-1 px-3 py-2 text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none"
                    />
                  </div>
                  {!editingPage && (
                    <button
                      type="button"
                      onClick={() => setAutoSlug(!autoSlug)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        autoSlug
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                      title={autoSlug ? 'Auto-slug enabled' : 'Auto-slug disabled'}
                    >
                      {autoSlug ? '🔗 Auto' : '✋ Manual'}
                    </button>
                  )}
                </div>
              </div>

              {/* Language Tabs */}
              <div>
                <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setActiveLang(lang.code)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                        activeLang === lang.code
                          ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>

                {/* Localized Content Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title ({LANGUAGES.find((l) => l.code === activeLang)?.label}) *
                    </label>
                    <input
                      type="text"
                      required={activeLang === 'en'}
                      value={formData.content[activeLang]?.title || ''}
                      onChange={(e) => updateTitle(activeLang, e.target.value)}
                      placeholder={`Page title in ${LANGUAGES.find((l) => l.code === activeLang)?.label}`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content ({LANGUAGES.find((l) => l.code === activeLang)?.label})
                    </label>
                    <RichTextEditor
                      value={formData.content[activeLang]?.content || ''}
                      onChange={(val) => updateContent(activeLang, 'content', val)}
                      placeholder="Write your page content here..."
                    />
                  </div>

                  {/* SEO Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.content[activeLang]?.metaTitle || ''}
                        onChange={(e) =>
                          updateContent(activeLang, 'metaTitle', e.target.value)
                        }
                        placeholder="SEO title"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Meta Description
                      </label>
                      <input
                        type="text"
                        value={formData.content[activeLang]?.metaDescription || ''}
                        onChange={(e) =>
                          updateContent(activeLang, 'metaDescription', e.target.value)
                        }
                        placeholder="SEO description"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingPage ? 'Update Page' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
