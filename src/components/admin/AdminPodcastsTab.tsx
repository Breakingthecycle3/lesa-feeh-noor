import React, { useState, useMemo } from 'react';
import {
  Headphones,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  Play,
  Pause,
  Clock,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Save,
  Globe,
  Mic2
} from 'lucide-react';
import { Podcast, Category } from '../../types';
import { api } from '../../lib/api';

const PODCAST_THUMBNAIL_PRESETS = [
  { label: 'ميكروفون وهدوء', url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80' },
  { label: 'طبيعة وتأمل', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80' },
  { label: 'ألوان دافئة', url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80' },
  { label: 'كتاب وقهوة', url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80' }
];

interface AdminPodcastsTabProps {
  podcasts: Podcast[];
  categories: Category[];
  onReload: () => void | Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (path: string) => void;
}

export function AdminPodcastsTab({
  podcasts,
  categories,
  onReload,
  showToast,
  onNavigate
}: AdminPodcastsTabProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit / Create state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [podcastToDelete, setPodcastToDelete] = useState<Podcast | null>(null);

  const [currentPodcast, setCurrentPodcast] = useState<Partial<Podcast>>({
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    audio_url: '',
    duration: '00:00',
    category_id: categories[0]?.id || 1,
    status: 'published'
  });

  // Filtered podcasts
  const filteredPodcasts = useMemo(() => {
    return podcasts.filter((p) => {
      if (categoryFilter !== 'all' && String(p.category_id) !== String(categoryFilter)) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [podcasts, searchQuery, categoryFilter, statusFilter]);

  // Open Create
  const handleOpenCreate = () => {
    setCurrentPodcast({
      title: '',
      slug: '',
      description: '',
      cover_image: PODCAST_THUMBNAIL_PRESETS[0].url,
      audio_url: '',
      duration: '15:00',
      category_id: categories[0]?.id || 1,
      status: 'published'
    });
    setIsEditing(true);
  };

  // Open Edit
  const handleOpenEdit = (podcast: Podcast) => {
    setCurrentPodcast(podcast);
    setIsEditing(true);
  };

  // Save Podcast
  const handleSavePodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPodcast.title?.trim() || !currentPodcast.audio_url?.trim()) {
      showToast('يرجى إكمال الحقول المطلوبة (العنوان ورابط الملف الصوتي)', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: currentPodcast.title,
        slug: currentPodcast.slug || currentPodcast.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        description: currentPodcast.description || '',
        cover_image: currentPodcast.cover_image || PODCAST_THUMBNAIL_PRESETS[0].url,
        audio_url: currentPodcast.audio_url,
        duration: currentPodcast.duration || '10:00',
        category_id: currentPodcast.category_id || 1,
        status: currentPodcast.status || 'published'
      };

      if (currentPodcast.id) {
        await api.admin.updatePodcast(currentPodcast.id, payload);
        showToast('تم تحديث بيانات البودكاست بنجاح 🎙️', 'success');
      } else {
        await api.admin.createPodcast(payload);
        showToast('تمت إضافة حلقة بودكاست جديدة 🎧', 'success');
      }

      setIsEditing(false);
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ البودكاست', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Podcast
  const handleDeleteConfirm = async () => {
    if (!podcastToDelete) return;
    try {
      await api.admin.deletePodcast(podcastToDelete.id);
      showToast(`تم حذف حلقة "${podcastToDelete.title}"`, 'info');
      setPodcastToDelete(null);
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
            <span className="p-2 bg-stone-900 text-white rounded-xl">
              <Headphones className="w-5 h-5" />
            </span>
            <h2 className="font-heading font-bold text-xl text-stone-900">
              إدارة البودكاست والمقاطع الصوتية
            </h2>
            <span className="px-2.5 py-0.5 bg-[#FAF7F2] text-[#36533D] text-xs font-bold rounded-full border border-[#E7E2D8]">
              {podcasts.length} حلقة
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            ارفعي ملفات صوتية، تأملات إرشادية، أو حلقات نقاشية تساعد في رحلة التعافي والوعي.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2b4231] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة حلقة بودكاست جديدة</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث في عناوين البودكاست..."
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

      {/* Podcasts List Table */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-[#FAF7F2] text-stone-700 border-b border-[#E7E2D8]">
              <th className="p-3.5 font-bold">الحلقة والبيانات</th>
              <th className="p-3.5 font-bold">التصنيف</th>
              <th className="p-3.5 font-bold text-center">المدة</th>
              <th className="p-3.5 font-bold text-center">الحالة</th>
              <th className="p-3.5 font-bold text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E2D8]">
            {filteredPodcasts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-stone-400">
                  لا توجد حلقات بودكاست مطابقة للبحث.
                </td>
              </tr>
            ) : (
              filteredPodcasts.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#E7E2D8] shrink-0 bg-stone-100">
                        <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 mb-0.5">{p.title}</h4>
                        <p className="text-[10px] text-stone-400 line-clamp-1">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-stone-600 font-medium">
                    {p.category_name || 'تطوير الذات'}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="inline-flex items-center gap-1 text-stone-500">
                      <Clock className="w-3 h-3" />
                      <span>{p.duration}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {p.status === 'published' ? 'منشور' : 'مسودة'}
                    </span>
                  </td>
                  <td className="p-3.5 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onNavigate(`/podcasts/${p.slug}`)}
                        className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-[#36533D] hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPodcastToDelete(p)}
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

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7E2D8] rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-5 border-b border-[#E7E2D8] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-stone-900 text-white rounded-xl">
                  <Mic2 className="w-5 h-5" />
                </span>
                <h3 className="font-heading font-bold text-base text-stone-900">
                  {currentPodcast.id ? 'تعديل حلقة بودكاست' : 'إضافة حلقة بودكاست جديدة 🎧'}
                </h3>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePodcast} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">عنوان الحلقة</label>
                <input
                  type="text"
                  required
                  value={currentPodcast.title || ''}
                  onChange={(e) => setCurrentPodcast({ ...currentPodcast, title: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">الرابط المخصص (Slug)</label>
                  <input
                    type="text"
                    value={currentPodcast.slug || ''}
                    onChange={(e) => setCurrentPodcast({ ...currentPodcast, slug: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">المدة (مثال: 15:40)</label>
                  <input
                    type="text"
                    value={currentPodcast.duration || ''}
                    onChange={(e) => setCurrentPodcast({ ...currentPodcast, duration: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">رابط الملف الصوتي (MP3)</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/audio.mp3"
                  value={currentPodcast.audio_url || ''}
                  onChange={(e) => setCurrentPodcast({ ...currentPodcast, audio_url: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">رابط صورة الغلاف</label>
                <input
                  type="url"
                  value={currentPodcast.cover_image || ''}
                  onChange={(e) => setCurrentPodcast({ ...currentPodcast, cover_image: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                />
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                  {PODCAST_THUMBNAIL_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPodcast({ ...currentPodcast, cover_image: p.url })}
                      className="px-2 py-1 bg-stone-100 hover:bg-[#36533D]/10 rounded text-[10px] text-stone-700 whitespace-nowrap"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">التصنيف</label>
                  <select
                    value={currentPodcast.category_id || 1}
                    onChange={(e) => setCurrentPodcast({ ...currentPodcast, category_id: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">الحالة</label>
                  <select
                    value={currentPodcast.status || 'published'}
                    onChange={(e) => setCurrentPodcast({ ...currentPodcast, status: e.target.value as any })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                  >
                    <option value="published">منشور</option>
                    <option value="draft">مسودة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">وصف الحلقة</label>
                <textarea
                  rows={3}
                  value={currentPodcast.description || ''}
                  onChange={(e) => setCurrentPodcast({ ...currentPodcast, description: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#36533D] text-white text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الحلقة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {podcastToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-heading font-bold text-stone-900">حذف الحلقة؟</h3>
              <p className="text-xs text-stone-500">هل أنتِ متأكدة من حذف حلقة "{podcastToDelete.title}"؟</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPodcastToDelete(null)} className="flex-1 py-2 border rounded-xl text-xs font-bold">تراجع</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
