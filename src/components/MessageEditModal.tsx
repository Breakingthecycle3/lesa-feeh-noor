import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  Save,
  Tag,
  FolderOpen,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Message, Category } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface MessageEditModalProps {
  isOpen: boolean;
  message: Message;
  onClose: () => void;
  onSaved: (updated: Message) => void;
}

const PRESET_MESSAGE_WALLPAPERS = [
  {
    name: 'أوراق زيتون وسكون',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'فجر الأمل والسكينة',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'شاي الصباح والهدوء',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'أزهار برية رقيقة',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80'
  }
];

export function MessageEditModal({
  isOpen,
  message,
  onClose,
  onSaved
}: MessageEditModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form states
  const [title, setTitle] = useState(message.title || '');
  const [slug, setSlug] = useState(message.slug || '');
  const [categoryId, setCategoryId] = useState<number>(message.category_id || 1);
  const [text, setText] = useState(message.text || '');
  const [backgroundImage, setBackgroundImage] = useState(message.background_image || '');
  const [status, setStatus] = useState<'published' | 'draft'>(message.status || 'published');
  const [isFeatured, setIsFeatured] = useState<number>(message.is_featured || 0);

  useEffect(() => {
    if (isOpen) {
      setTitle(message.title || '');
      setSlug(message.slug || '');
      setCategoryId(message.category_id || 1);
      setText(message.text || '');
      setBackgroundImage(message.background_image || '');
      setStatus(message.status || 'published');
      setIsFeatured(message.is_featured || 0);

      api.getCategories().then((res) => {
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      }).catch(console.error);
    }
  }, [isOpen, message]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('يرجى إدخال عنوان الرسالة', 'error');
      return;
    }
    if (!text.trim()) {
      showToast('يرجى كتابة نص الرسالة الملهمة', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Message> = {
        title: title.trim(),
        slug: slug.trim() || title.trim().toLowerCase().replace(/[\s\W-]+/g, '-'),
        category_id: categoryId,
        text: text.trim(),
        background_image: backgroundImage.trim(),
        status,
        is_featured: isFeatured
      };

      await api.admin.updateMessage(message.id, payload);

      const matchedCat = categories.find((c) => c.id === categoryId);
      const updated: Message = {
        ...message,
        ...payload,
        category_name: matchedCat ? matchedCat.name : message.category_name
      };

      showToast('تم حفظ تعديلات الرسالة بنجاح ✨', 'success');
      onSaved(updated);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الرسالة', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      dir="rtl"
    >
      {/* Soft Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#FCFAF6] rounded-3xl border-2 border-amber-400/80 shadow-2xl overflow-hidden my-auto z-10 max-h-[92vh] flex flex-col text-right">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50 via-emerald-50/50 to-stone-50 border-b border-[#E7E2D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-sm shadow-2xs">
              ✏️
            </div>
            <div>
              <h2 className="font-heading font-black text-base text-stone-900">
                تعديل الرسالة الملهمة مباشرة داخل الصفحة
              </h2>
              <p className="text-[11px] text-stone-500">
                المسؤول: فاطمة محمد • التعديل سيظهر فوراً أمامكِ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/80 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              عنوان الرسالة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CFC5] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#36533D] font-bold"
              placeholder="مثال: رسالة إلى روحك المرهقة اليوم..."
              required
            />
          </div>

          {/* Message Text */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              نص الرسالة الوجدانية والملهمة <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3.5 bg-white border border-[#D5CFC5] rounded-xl text-stone-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#36533D]"
              placeholder="اكتبي نص الرسالة هنا بحرية..."
              required
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                تصنيف الرسالة
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-white border border-[#D5CFC5] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#36533D]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                حالة النشر
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                className="w-full px-3 py-2.5 bg-white border border-[#D5CFC5] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#36533D]"
              >
                <option value="published">منشور للعامة 🟢</option>
                <option value="draft">مسودة خاصة 📝</option>
              </select>
            </div>
          </div>

          {/* Featured & Custom Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured === 1}
                  onChange={(e) => setIsFeatured(e.target.checked ? 1 : 0)}
                  className="w-4 h-4 rounded text-[#36533D] focus:ring-[#36533D] cursor-pointer"
                />
                <span>تثبيت كرسالة مميزة في الصفحة الرئيسية ⭐</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                الرابط المختصر (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D5CFC5] rounded-xl text-stone-900 text-xs dir-ltr text-right"
                placeholder="slug-name"
              />
            </div>
          </div>

          {/* Background Image / Preset selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#36533D]" />
                <span>صورة أو خلفية الرسالة (اختياري)</span>
              </label>
              <span className="text-[11px] text-stone-400">انقري لاختيار خلفية دافئة</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {PRESET_MESSAGE_WALLPAPERS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setBackgroundImage(preset.url)}
                  className={`text-[10px] p-1.5 rounded-lg border text-right transition-all cursor-pointer truncate ${
                    backgroundImage === preset.url
                      ? 'bg-amber-100 border-amber-500 font-bold text-stone-900'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <input
              type="url"
              value={backgroundImage}
              onChange={(e) => setBackgroundImage(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D5CFC5] rounded-xl text-stone-900 text-xs"
              placeholder="https://... رابط صورة مخصصة"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ وتحديث الرسالة الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
