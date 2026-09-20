import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  Check,
  X,
  AlertTriangle,
  Save,
  Globe,
  Layout,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Article, Category } from '../../types';
import { api } from '../../lib/api';
import { ContentEditor } from '../ContentEditor';

const PRESET_ARTICLE_IMAGES = [
  { label: 'هدوء وغيوم', url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=800&q=80' },
  { label: 'طبيعة خضراء', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80' },
  { label: 'قوة وعزيمة', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80' },
  { label: 'صفاء ذهني', url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80' },
  { label: 'كتاب وقهوة', url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80' },
  { label: 'شروق الشمس', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' }
];

interface AdminArticlesTabProps {
  articles: Article[];
  categories: Category[];
  onReload: () => void | Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (path: string) => void;
}

export function AdminArticlesTab({
  articles,
  categories,
  onReload,
  showToast,
  onNavigate
}: AdminArticlesTabProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit / Create state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  const [currentArticle, setCurrentArticle] = useState<Partial<Article>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: categories[0]?.id || 1,
    status: 'published',
    reading_time: 5,
    is_featured: 0,
    seo_title: '',
    seo_description: ''
  });

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (categoryFilter !== 'all' && String(a.category_id) !== String(categoryFilter)) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title?.toLowerCase().includes(q);
        const matchExcerpt = a.excerpt?.toLowerCase().includes(q);
        if (!matchTitle && !matchExcerpt) return false;
      }
      return true;
    });
  }, [articles, searchQuery, categoryFilter, statusFilter]);

  // Open Create
  const handleOpenCreate = () => {
    setCurrentArticle({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: PRESET_ARTICLE_IMAGES[0].url,
      category_id: categories[0]?.id || 1,
      status: 'published',
      reading_time: 5,
      is_featured: 0,
      seo_title: '',
      seo_description: ''
    });
    setIsEditing(true);
  };

  // Open Edit
  const handleOpenEdit = (article: Article) => {
    setCurrentArticle(article);
    setIsEditing(true);
  };

  // Save Article
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArticle.title?.trim() || !currentArticle.content?.trim()) {
      showToast('يرجى إكمال الحقول المطلوبة (العنوان والمحتوى)', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: currentArticle.title,
        slug: currentArticle.slug || currentArticle.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        excerpt: currentArticle.excerpt || '',
        content: currentArticle.content,
        featured_image: currentArticle.featured_image || PRESET_ARTICLE_IMAGES[0].url,
        category_id: currentArticle.category_id || 1,
        status: currentArticle.status || 'published',
        reading_time: currentArticle.reading_time || 5,
        is_featured: currentArticle.is_featured || 0,
        seo_title: currentArticle.seo_title || currentArticle.title,
        seo_description: currentArticle.seo_description || currentArticle.excerpt || ''
      };

      if (currentArticle.id) {
        await api.admin.updateArticle(currentArticle.id, payload);
        showToast('تم تحديث المقال بنجاح 🕊️', 'success');
      } else {
        await api.admin.createArticle(payload);
        showToast('تم نشر المقال الجديد بنجاح ✨', 'success');
      }

      setIsEditing(false);
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ المقال', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Article
  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    try {
      await api.admin.deleteArticle(articleToDelete.id);
      showToast(`تم حذف مقال "${articleToDelete.title}"`, 'info');
      setArticleToDelete(null);
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل الحذف', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#36533D]/10 text-[#36533D] rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="font-heading font-bold text-xl text-stone-900">
              إدارة المقالات والمحتوى المقروء
            </h2>
            <span className="px-2.5 py-0.5 bg-[#FAF7F2] text-[#36533D] text-xs font-bold rounded-full border border-[#E7E2D8]">
              {articles.length} مقال
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            اكتبي وشاركي المعرفة النفسية والقصص الملهمة التي تضيء دروب المتعافيات.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2b4231] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>كتابة مقال جديد</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث في عناوين المقالات وملخصاتها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs text-stone-800 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium text-stone-700"
          >
            <option value="all">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium text-stone-700"
          >
            <option value="all">جميع الحالات</option>
            <option value="published">منشور</option>
            <option value="draft">مسودة</option>
          </select>
        </div>
      </div>

      {/* Articles List Table */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-[#FAF7F2] text-stone-700 border-b border-[#E7E2D8]">
              <th className="p-3.5 font-bold">المقال</th>
              <th className="p-3.5 font-bold">التصنيف</th>
              <th className="p-3.5 font-bold text-center">المشاهدات</th>
              <th className="p-3.5 font-bold text-center">الحالة</th>
              <th className="p-3.5 font-bold text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E2D8]">
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-stone-400">
                  لا توجد مقالات مطابقة للبحث.
                </td>
              </tr>
            ) : (
              filteredArticles.map((a) => (
                <tr key={a.id} className="hover:bg-stone-50 transition-colors group">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E7E2D8] shrink-0">
                        <img src={a.featured_image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="font-bold text-stone-900">{a.title}</h4>
                          {a.is_featured === 1 && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 line-clamp-1">{a.excerpt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-stone-600 font-medium">
                    {a.category_name}
                  </td>
                  <td className="p-3.5 text-center text-stone-500">
                    <div className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{a.view_count || 0}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      a.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {a.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </td>
                  <td className="p-3.5 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onNavigate(`/articles/${a.slug}`)}
                        className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(a)}
                        className="p-1.5 text-[#36533D] hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setArticleToDelete(a)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL (Full Screen Overlay) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#E7E2D8] flex items-center justify-between bg-[#FAF7F2]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-stone-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
              <div>
                <h3 className="font-heading font-black text-lg text-stone-900 leading-none">
                  {currentArticle.id ? 'تعديل المقال' : 'كتابة مقال جديد ✨'}
                </h3>
                <p className="text-[10px] text-stone-400 mt-1">يتم الحفظ تلقائياً في قاعدة البيانات عند الضغط على زر الحفظ</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-stone-600 text-xs font-bold"
              >
                إلغاء التغييرات
              </button>
              <button
                onClick={handleSaveArticle}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#36533D] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ المقال ونشره'}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-stone-50/50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6 bg-white border border-[#E7E2D8] rounded-3xl p-6 sm:p-10 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">عنوان المقال</label>
                    <input
                      type="text"
                      required
                      value={currentArticle.title || ''}
                      onChange={(e) => {
                        const title = e.target.value;
                        setCurrentArticle({
                          ...currentArticle,
                          title,
                          slug: currentArticle.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                        });
                      }}
                      className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">الرابط المخصص (Slug)</label>
                    <input
                      type="text"
                      value={currentArticle.slug || ''}
                      onChange={(e) => setCurrentArticle({ ...currentArticle, slug: e.target.value })}
                      className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">التصنيف</label>
                      <select
                        value={currentArticle.category_id || 1}
                        onChange={(e) => setCurrentArticle({ ...currentArticle, category_id: Number(e.target.value) })}
                        className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">وقت القراءة (دقائق)</label>
                      <input
                        type="number"
                        min={1}
                        value={currentArticle.reading_time || 5}
                        onChange={(e) => setCurrentArticle({ ...currentArticle, reading_time: Number(e.target.value) })}
                        className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">الحالة</label>
                      <select
                        value={currentArticle.status || 'published'}
                        onChange={(e) => setCurrentArticle({ ...currentArticle, status: e.target.value as any })}
                        className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                      >
                        <option value="published">منشور</option>
                        <option value="draft">مسودة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">مقال مميز</label>
                      <select
                        value={currentArticle.is_featured || 0}
                        onChange={(e) => setCurrentArticle({ ...currentArticle, is_featured: Number(e.target.value) })}
                        className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                      >
                        <option value={0}>لا</option>
                        <option value={1}>نعم (يظهر في الرئيسية)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">رابط الصورة البارزة</label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-3">
                    <input
                      type="url"
                      value={currentArticle.featured_image || ''}
                      onChange={(e) => setCurrentArticle({ ...currentArticle, featured_image: e.target.value })}
                      className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                      placeholder="https://images.unsplash.com/..."
                    />
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESET_ARTICLE_IMAGES.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentArticle({ ...currentArticle, featured_image: img.url })}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            currentArticle.featured_image === img.url ? 'border-[#36533D]' : 'border-transparent'
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-32 aspect-square rounded-2xl border-2 border-[#E7E2D8] overflow-hidden bg-stone-100 hidden sm:block shrink-0">
                    <img src={currentArticle.featured_image} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">المقتطف التمهيدي (Excerpt)</label>
                <textarea
                  rows={2}
                  value={currentArticle.excerpt || ''}
                  onChange={(e) => setCurrentArticle({ ...currentArticle, excerpt: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                  placeholder="ملخص قصير يظهر في بطاقات المقالات..."
                />
              </div>

              <div className="border-t border-[#E7E2D8] pt-6">
                <label className="block text-xs font-bold text-stone-800 mb-3">محتوى المقال (Markdown)</label>
                <div className="min-h-[400px] border border-[#E7E2D8] rounded-2xl overflow-hidden">
                  <ContentEditor
                    value={currentArticle.content || ''}
                    onChange={(val) => setCurrentArticle({ ...currentArticle, content: val })}
                  />
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E7E2D8] space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-[#36533D]" />
                  <h4 className="font-bold text-xs text-stone-900">إعدادات محركات البحث (SEO)</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">عنوان الـ SEO</label>
                    <input
                      type="text"
                      value={currentArticle.seo_title || ''}
                      onChange={(e) => setCurrentArticle({ ...currentArticle, seo_title: e.target.value })}
                      className="w-full p-2.5 bg-white border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">وصف الـ SEO</label>
                    <textarea
                      rows={2}
                      value={currentArticle.seo_description || ''}
                      onChange={(e) => setCurrentArticle({ ...currentArticle, seo_description: e.target.value })}
                      className="w-full p-2.5 bg-white border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {articleToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <h3 className="font-heading font-bold text-stone-900">حذف المقال نهائياً؟</h3>
              <p className="text-xs text-stone-500">هل أنتِ متأكدة من حذف مقال "{articleToDelete.title}"؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setArticleToDelete(null)} className="flex-1 py-2 border rounded-xl text-xs font-bold">تراجع</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
