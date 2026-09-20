import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Image as ImageIcon,
  Sparkles,
  Tag,
  Clock,
  Eye,
  CheckCircle2,
  FolderTree
} from 'lucide-react';
import { Article, Category } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { ContentEditor } from './ContentEditor';

const PRESET_IMAGES = [
  {
    label: 'شروق وأمل',
    url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'طبيعة هادئة وسكينة',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'كتاب وقهوة ونور',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'تأمل وبحر دافئ',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'أشجار خضراء',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'سماء ونجوم',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
  }
];

interface ArticleEditModalProps {
  isOpen: boolean;
  article: Article;
  onClose: () => void;
  onSaved: (updatedArticle: Article) => void;
}

export function ArticleEditModal({
  isOpen,
  article,
  onClose,
  onSaved
}: ArticleEditModalProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState(article.title || '');
  const [slug, setSlug] = useState(article.slug || '');
  const [categoryId, setCategoryId] = useState<number>(article.category_id || 1);
  const [excerpt, setExcerpt] = useState(article.excerpt || '');
  const [content, setContent] = useState(article.content || '');
  const [featuredImage, setFeaturedImage] = useState(article.featured_image || '');
  const [readingTime, setReadingTime] = useState<number>(article.reading_time || 5);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived' | 'scheduled'>(article.status || 'published');
  const [isFeatured, setIsFeatured] = useState<number>(article.is_featured || 0);
  const [tagsInput, setTagsInput] = useState(
    Array.isArray(article.tags) ? article.tags.join(', ') : ''
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(article.title || '');
      setSlug(article.slug || '');
      setCategoryId(article.category_id || 1);
      setExcerpt(article.excerpt || '');
      setContent(article.content || '');
      setFeaturedImage(article.featured_image || '');
      setReadingTime(article.reading_time || 5);
      setStatus(article.status || 'published');
      setIsFeatured(article.is_featured || 0);
      setTagsInput(Array.isArray(article.tags) ? article.tags.join(', ') : '');

      api.getCategories().then((res) => {
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      });
    }
  }, [isOpen, article]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('يرجى كتابة عنوان الموضوع', 'error');
      return;
    }
    if (!content.trim()) {
      showToast('يرجى كتابة محتوى الموضوع', 'error');
      return;
    }

    setSaving(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<Article> = {
        title: title.trim(),
        slug: slug.trim() || title.trim().toLowerCase().replace(/[\s\W-]+/g, '-'),
        category_id: categoryId,
        excerpt: excerpt.trim(),
        content: content.trim(),
        featured_image: featuredImage.trim(),
        reading_time: Number(readingTime) || 5,
        status,
        is_featured: isFeatured,
        tags: parsedTags
      };

      await api.admin.updateArticle(article.id, payload);

      const matchedCat = categories.find((c) => c.id === categoryId);
      const updated: Article = {
        ...article,
        ...payload,
        category_name: matchedCat ? matchedCat.name : article.category_name,
        category_slug: matchedCat ? matchedCat.slug : article.category_slug,
        tags: parsedTags
      };

      showToast('تم حفظ التعديلات بنجاح! التحديثات ظاهرة أمامكِ الآن مباشرة في الموضوع ✨', 'success');
      onSaved(updated);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ التعديلات', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="article-edit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div
        id="article-edit-modal-container"
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#36533D] via-[#2A4230] to-stone-900 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-sm shadow-sm">
              ✏️
            </span>
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-white">
                تعديل هذا الموضوع مباشرة من الداخل
              </h2>
              <p className="text-[11px] text-amber-200">
                أي تعديل تقومين به هنا سيُحفظ ويظهر فوراً في هذه الصفحة أمامك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-stone-800">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                عنوان الموضوع <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الموضوع..."
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#36533D] font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700">
                  الرابط الدائم (Slug)
                </label>
                <button
                  type="button"
                  onClick={() => setSlug(title.toLowerCase().replace(/[\s\W-]+/g, '-'))}
                  className="text-[10px] text-[#36533D] font-bold hover:underline"
                >
                  توليد من العنوان
                </button>
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* Category, Status, Featured, Reading Time */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">التصنيف</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">حالة النشر</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium"
              >
                <option value="published">منشور للجمهور 🟢</option>
                <option value="draft">مسودة خاصة 📝</option>
                <option value="archived">مؤرشف 📦</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">تمييز في الرئيسية</label>
              <select
                value={isFeatured}
                onChange={(e) => setIsFeatured(Number(e.target.value))}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium"
              >
                <option value={0}>عادي</option>
                <option value={1}>نعم، مميز في الرئيسية ⭐</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">وقت القراءة (دقائق)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={readingTime}
                onChange={(e) => setReadingTime(Number(e.target.value) || 5)}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              مقدمة / ملخص الموضوع
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="فقرة تعريفية سريعة تظهر أعلى الموضوع وفي بطاقات العرض..."
              className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#36533D]"
            />
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              صورة الغلاف (Featured Image)
            </label>
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
            />

            {/* Presets */}
            <div>
              <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                أو اختاري صورة دافئة بنقرة واحدة:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {PRESET_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFeaturedImage(img.url)}
                    className={`relative rounded-xl overflow-hidden aspect-[16/10] border-2 transition-all cursor-pointer ${
                      featuredImage === img.url
                        ? 'border-emerald-600 ring-2 ring-emerald-400/50'
                        : 'border-transparent hover:opacity-80'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-stone-900/70 text-white text-[9px] py-0.5 text-center truncate px-1">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              محتوى الموضوع الكامل <span className="text-rose-500">*</span>
            </label>
            <ContentEditor
              value={content}
              onChange={setContent}
              placeholder="اكتبي نص الموضوع هنا... يمكنكِ استخدام التنسيقات والعناوين والاقتباسات من الشريط أعلاه."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              الوسوم والكلمات الدلالية (مفصولة بفاصلة)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="تعافي, وعي ذاتي, سكينة, علاقات صحية"
              className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#E7E2D8] hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              id="btn-submit-article-edit-modal"
              className="px-6 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{saving ? 'جارٍ الحفظ وتحديث الموضوع...' : 'حفظ وتحديث الموضوع الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
