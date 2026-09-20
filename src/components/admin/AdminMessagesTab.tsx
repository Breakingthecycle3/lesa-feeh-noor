import React, { useState, useMemo } from 'react';
import {
  Quote,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Star,
  Check,
  X,
  AlertTriangle,
  Save,
  MessageCircle,
  Copy,
  Sparkles
} from 'lucide-react';
import { Message, Category } from '../../types';
import { api } from '../../lib/api';

interface AdminMessagesTabProps {
  messages: Message[];
  categories: Category[];
  onReload: () => void | Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (path: string) => void;
}

export function AdminMessagesTab({
  messages,
  categories,
  onReload,
  showToast,
  onNavigate
}: AdminMessagesTabProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit / Create state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  const [currentMessage, setCurrentMessage] = useState<Partial<Message>>({
    title: '',
    slug: '',
    text: '',
    category_id: categories[0]?.id || 1,
    status: 'published'
  });

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (categoryFilter !== 'all' && String(m.category_id) !== String(categoryFilter)) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title?.toLowerCase().includes(q);
        const matchText = m.text?.toLowerCase().includes(q);
        if (!matchTitle && !matchText) return false;
      }
      return true;
    });
  }, [messages, searchQuery, categoryFilter, statusFilter]);

  // Open Create
  const handleOpenCreate = () => {
    setCurrentMessage({
      title: '',
      slug: '',
      text: '',
      category_id: categories[0]?.id || 1,
      status: 'published'
    });
    setIsEditing(true);
  };

  // Open Edit
  const handleOpenEdit = (message: Message) => {
    setCurrentMessage(message);
    setIsEditing(true);
  };

  // Save Message
  const handleSaveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.title?.trim() || !currentMessage.text?.trim()) {
      showToast('يرجى إكمال الحقول المطلوبة', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: currentMessage.title,
        slug: currentMessage.slug || currentMessage.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        text: currentMessage.text,
        category_id: currentMessage.category_id || 1,
        status: currentMessage.status || 'published'
      };

      if (currentMessage.id) {
        await api.admin.updateMessage(currentMessage.id, payload);
        showToast('تم تحديث الرسالة بنجاح 💌', 'success');
      } else {
        await api.admin.createMessage(payload);
        showToast('تمت إضافة رسالة إلهام جديدة ✨', 'success');
      }

      setIsEditing(false);
      onReload();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ الرسالة', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Message
  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;
    try {
      await api.admin.deleteMessage(messageToDelete.id);
      showToast(`تم حذف رسالة "${messageToDelete.title}"`, 'info');
      setMessageToDelete(null);
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
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="font-heading font-bold text-xl text-stone-900">
              إدارة رسائل الأمل والسكينة
            </h2>
            <span className="px-2.5 py-0.5 bg-[#FAF7F2] text-[#36533D] text-xs font-bold rounded-full border border-[#E7E2D8]">
              {messages.length} رسالة
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            اقتباسات قصيرة، توكيدات إيجابية، وبطاقات ملهمة تظهر للزائرات في الصفحة الرئيسية وقسم الرسائل.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2b4231] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة رسالة جديدة</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث في نصوص الرسائل..."
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

      {/* Messages List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMessages.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 text-xs">
            لا توجد رسائل مطابقة.
          </div>
        ) : (
          filteredMessages.map((m) => (
            <div key={m.id} className="bg-white border border-[#E7E2D8] rounded-2xl p-5 space-y-4 hover:border-amber-200 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    {m.category_name || 'إلهام'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {m.status === 'published' ? 'منشور' : 'مسودة'}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-stone-900 text-sm">{m.title}</h4>
                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-dashed border-[#E7E2D8] relative">
                  <Quote className="w-8 h-8 text-amber-200 absolute -top-2 -right-2 rotate-180" />
                  <p className="text-xs text-stone-700 italic leading-relaxed text-center py-2">
                    "{m.text}"
                  </p>
                </div>
              </div>
              <div className="pt-3 flex items-center justify-between border-t border-[#E7E2D8] mt-2">
                <button
                  onClick={() => onNavigate(`/messages/${m.slug}`)}
                  className="p-1.5 text-stone-400 hover:text-stone-900"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-1.5 text-[#36533D] hover:bg-emerald-50 rounded-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMessageToDelete(m)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E2D8] rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E7E2D8] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500 text-white rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <h3 className="font-heading font-bold text-stone-900">
                  {currentMessage.id ? 'تعديل رسالة النور' : 'إضافة رسالة إلهام جديدة ✨'}
                </h3>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMessage} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">عنوان الرسالة أو المناسبة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: رسالة الصباح، قوة المواجهة..."
                  value={currentMessage.title || ''}
                  onChange={(e) => setCurrentMessage({ ...currentMessage, title: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">نص الرسالة</label>
                <textarea
                  rows={4}
                  required
                  placeholder="اكتبي كلمات الأمل والتطمين هنا..."
                  value={currentMessage.text || ''}
                  onChange={(e) => setCurrentMessage({ ...currentMessage, text: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs leading-relaxed focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">التصنيف</label>
                  <select
                    value={currentMessage.category_id || 1}
                    onChange={(e) => setCurrentMessage({ ...currentMessage, category_id: Number(e.target.value) })}
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
                    value={currentMessage.status || 'published'}
                    onChange={(e) => setCurrentMessage({ ...currentMessage, status: e.target.value as any })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl text-xs"
                  >
                    <option value="published">منشور للجمهور</option>
                    <option value="draft">مسودة خاصة</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#36533D] text-white text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ونشر ✨'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {messageToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-heading font-bold text-stone-900">حذف الرسالة؟</h3>
              <p className="text-xs text-stone-500">هل أنتِ متأكدة من حذف رسالة "{messageToDelete.title}"؟</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMessageToDelete(null)} className="flex-1 py-2 border rounded-xl text-xs font-bold">تراجع</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
