import React, { useState, useMemo } from 'react';
import {
  Video as VideoIcon,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  Play,
  Clock,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Save,
  Youtube,
  MonitorPlay
} from 'lucide-react';
import { Video, Category } from '../../types';
import { api } from '../../lib/api';

const VIDEO_THUMBNAIL_PRESETS = [
  { label: 'هدوء نفسي', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80' },
  { label: 'طبيعة وتأمل', url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80' },
  { label: 'شروق وأمل', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' }
];

interface AdminVideosTabProps {
  videos: Video[];
  categories: Category[];
  onReload: () => void | Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (path: string) => void;
}

export function AdminVideosTab({
  videos,
  categories,
  onReload,
  showToast,
  onNavigate
}: AdminVideosTabProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit / Create state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);

  const [currentVideo, setCurrentVideo] = useState<Partial<Video>>({
    title: '',
    slug: '',
    description: '',
    thumbnail: '',
    video_url: '',
    video_provider: 'youtube',
    duration: '00:00',
    category_id: categories[0]?.id || 1,
    status: 'published'
  });

  // Filtered videos
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (categoryFilter !== 'all' && String(v.category_id) !== String(categoryFilter)) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = v.title?.toLowerCase().includes(q);
        const matchDesc = v.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [videos, searchQuery, categoryFilter, statusFilter]);

  // Open Create
  const handleOpenCreate = () => {
    setCurrentVideo({
      title: '',
      slug: '',
      description: '',
      thumbnail: VIDEO_THUMBNAIL_PRESETS[0].url,
      video_url: '',
      video_provider: 'youtube',
      duration: '05:00',
      category_id: categories[0]?.id || 1,
      status: 'published'
    });
    setIsEditing(true);
  };

  // Open Edit
  const handleOpenEdit = (video: Video) => {
    setCurrentVideo(video);
    setIsEditing(true);
  };

  // Save Video
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVideo.title?.trim() || !currentVideo.video_url?.trim()) {
      showToast('يرجى إكمال الحقول المطلوبة', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: currentVideo.title,
        slug: currentVideo.slug || currentVideo.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        description: currentVideo.description || '',
        thumbnail: currentVideo.thumbnail || VIDEO_THUMBNAIL_PRESETS[0].url,
        video_url: currentVideo.video_url,
        video_provider: currentVideo.video_provider || 'youtube',
        duration: currentVideo.duration || '05:00',
        category_id: currentVideo.category_id || 1,
        status: currentVideo.status || 'published'
      };

      if (currentVideo.id) {
        await api.admin.updateVideo(currentVideo.id, payload);
        showToast('تم تحديث الفيديو بنجاح ✨', 'success');
      } else {
        await api.admin.createVideo(payload);
        showToast('تمت إضافة فيديو إرشادي جديد 🎬', 'success');
      }

      setIsEditing(false);
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ الفيديو', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Video
  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;
    try {
      await api.admin.deleteVideo(videoToDelete.id);
      showToast(`تم حذف فيديو "${videoToDelete.title}"`, 'info');
      setVideoToDelete(null);
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
              <VideoIcon className="w-5 h-5" />
            </span>
            <h2 className="font-heading font-bold text-xl text-stone-900">
              إدارة الفيديوهات الإرشادية
            </h2>
            <span className="px-2.5 py-0.5 bg-[#FAF7F2] text-[#36533D] text-xs font-bold rounded-full border border-[#E7E2D8]">
              {videos.length} فيديو
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            أضيفي مقاطع فيديو تعليمية أو إرشادية تساعد في رحلة الوعي النفسي والنمو الذاتي.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2b4231] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فيديو جديد</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث في عناوين الفيديوهات..."
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

      {/* Videos List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 text-xs">
            لا توجد فيديوهات مطابقة للبحث.
          </div>
        ) : (
          filteredVideos.map((v) => (
            <div key={v.id} className="bg-white border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-xs hover:border-[#36533D]/40 transition-all flex flex-col">
              <div className="relative aspect-video bg-stone-100 overflow-hidden">
                <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-10 h-10 text-white fill-current" />
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded">
                  {v.duration}
                </div>
              </div>
              <div className="p-4 space-y-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-[#FAF7F2] text-[#36533D] rounded border border-[#E7E2D8]">
                    {v.category_name}
                  </span>
                  <span className={`text-[10px] font-bold ${v.status === 'published' ? 'text-emerald-600' : 'text-stone-400'}`}>
                    {v.status === 'published' ? '● منشور' : '○ مسودة'}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-stone-900 line-clamp-1">{v.title}</h4>
                <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">{v.description}</p>
              </div>
              <div className="p-3 bg-[#FAF7F2] border-t border-[#E7E2D8] flex items-center justify-between">
                <button
                  onClick={() => onNavigate(`/videos/${v.slug}`)}
                  className="p-1.5 text-stone-500 hover:text-stone-900"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="p-1.5 text-[#36533D] hover:bg-emerald-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setVideoToDelete(v)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7E2D8] rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-5 border-b border-[#E7E2D8] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#36533D] text-white rounded-xl">
                  <MonitorPlay className="w-5 h-5" />
                </span>
                <h3 className="font-heading font-bold text-base text-stone-900">
                  {currentVideo.id ? 'تعديل بيانات الفيديو' : 'إضافة فيديو إرشادي جديد 🎬'}
                </h3>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">عنوان الفيديو</label>
                <input
                  type="text"
                  required
                  value={currentVideo.title || ''}
                  onChange={(e) => setCurrentVideo({ ...currentVideo, title: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none focus:border-[#36533D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">الرابط المخصص (Slug)</label>
                  <input
                    type="text"
                    value={currentVideo.slug || ''}
                    onChange={(e) => setCurrentVideo({ ...currentVideo, slug: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">المزود (Provider)</label>
                  <select
                    value={currentVideo.video_provider || 'youtube'}
                    onChange={(e) => setCurrentVideo({ ...currentVideo, video_provider: e.target.value as any })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="custom">رابط مباشر (Direct URL)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">رابط الفيديو</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={currentVideo.video_url || ''}
                  onChange={(e) => setCurrentVideo({ ...currentVideo, video_url: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">رابط الصورة المصغرة</label>
                  <input
                    type="url"
                    value={currentVideo.thumbnail || ''}
                    onChange={(e) => setCurrentVideo({ ...currentVideo, thumbnail: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">المدة (مثال: 08:30)</label>
                  <input
                    type="text"
                    value={currentVideo.duration || ''}
                    onChange={(e) => setCurrentVideo({ ...currentVideo, duration: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">التصنيف</label>
                  <select
                    value={currentVideo.category_id || 1}
                    onChange={(e) => setCurrentVideo({ ...currentVideo, category_id: Number(e.target.value) })}
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
                    value={currentVideo.status || 'published'}
                    onChange={(e) => setCurrentVideo({ ...currentVideo, status: e.target.value as any })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                  >
                    <option value="published">منشور</option>
                    <option value="draft">مسودة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">وصف الفيديو</label>
                <textarea
                  rows={3}
                  value={currentVideo.description || ''}
                  onChange={(e) => setCurrentVideo({ ...currentVideo, description: e.target.value })}
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
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الفيديو'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {videoToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <h3 className="font-heading font-bold text-stone-900">حذف الفيديو نهائياً؟</h3>
              <p className="text-xs text-stone-500">هل أنتِ متأكدة من حذف فيديو "{videoToDelete.title}"؟</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVideoToDelete(null)} className="flex-1 py-2 border rounded-xl text-xs font-bold">تراجع</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
