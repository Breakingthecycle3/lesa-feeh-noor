import React, { useState, useEffect } from 'react';
import { Sparkles, Quote, Copy, Check, Share2, ArrowRight, Edit, Shield } from 'lucide-react';
import { Message } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumbs, LoadingState, ErrorState, SEOHead } from '../components/Common';
import { MessageEditModal } from '../components/MessageEditModal';

export function MessageDetailPage({
  slug,
  onNavigate
}: {
  slug: string;
  onNavigate: (path: string) => void;
}) {
  const { user, isAdmin, isEditor } = useAuth();
  const isAdminUser = Boolean(
    isAdmin ||
    user?.role === 'ADMIN' ||
    isEditor ||
    user?.email === 'fatmamohamed36699@gmail.com'
  );

  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchMsg = async () => {
    setLoading(true);
    try {
      const res = await api.getMessage(slug);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل الرسالة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMsg();
  }, [slug]);

  const copyText = () => {
    if (!message) return;
    navigator.clipboard.writeText(`"${message.text}"\n\n— منصة لسه في نور\nhttps://lesanour.com/messages/${message.slug}`);
    setCopied(true);
    showToast('تم نسخ الرسالة الملهمة 🤍', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    if (!message) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = encodeURIComponent(`"${message.text}"\n\n— منصة لسه في نور\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) return <LoadingState message="نستحضر لكِ الرسالة..." />;
  if (error || !message) return <ErrorState message={error || 'الرسالة غير موجودة'} onRetry={fetchMsg} />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 text-right" dir="rtl">
      <SEOHead title={message.title} description={message.text} />

      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'رسائل لسه في نور', path: '/messages' },
          { label: message.title }
        ]}
        onNavigate={onNavigate}
      />

      {/* 🛡️ Admin In-Place Message Edit Banner (Visible only for admins) */}
      {isAdminUser && (
        <div
          id="admin-message-edit-banner"
          className="my-6 p-4 sm:p-5 bg-gradient-to-r from-amber-50/90 via-emerald-50/70 to-stone-50 border-2 border-amber-400/90 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              ✏️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-black text-sm sm:text-base text-stone-900">
                  لوحة تعديل الرسالة المباشرة (فاطمة محمد)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#36533D] text-white">
                  مسؤول المنصة 🛡️
                </span>
                {message.status === 'published' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    منشورة للعامة 🟢
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                    مسودة خاصة 📝
                  </span>
                )}
                {message.is_featured === 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    مميزة في الرئيسية ⭐
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                يمكنكِ تعديل نص وعنوان وتصنيف وخلفية هذه الرسالة مباشرة، وستظهر التعديلات أمامكِ فوراً داخل الصفحة!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditModalOpen(true)}
              id="btn-edit-message-top-action"
              className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer border border-[#36533D] active:scale-95"
            >
              <Edit className="w-4 h-4 text-amber-300" />
              <span>تعديل هذه الرسالة الآن</span>
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="px-3.5 py-2.5 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="الانتقال للوحة التحكم العامة"
            >
              <Shield className="w-3.5 h-3.5 text-stone-500" />
              <span>لوحة الإدارة</span>
            </button>
          </div>
        </div>
      )}

      {/* Contemplation Card Poster */}
      <div
        className="relative p-8 md:p-14 rounded-3xl border border-[#E7E2D8] bg-[#FDFCFB] shadow-lg text-center overflow-hidden my-6 transition-all"
        style={
          message.background_image
            ? {
                backgroundImage: `linear-gradient(rgba(253, 252, 251, 0.92), rgba(253, 252, 251, 0.92)), url('${message.background_image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
            : undefined
        }
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#36533D]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#36533D]/10 text-[#36533D] font-bold text-xs mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{message.category_name || 'همسة أمل'}</span>
        </div>

        <h1 className="font-heading font-black text-2xl md:text-3xl text-stone-900 mb-6">
          {message.title}
        </h1>

        <div className="max-w-xl mx-auto my-6">
          <p className="font-heading font-medium text-lg sm:text-xl md:text-2xl text-stone-800 leading-relaxed">
            "{message.text}"
          </p>
        </div>

        <p className="text-xs text-stone-400 mt-8 mb-8">— فريق منصة لسه في نور</p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#E7E2D8] flex-wrap">
          {/* Edit Button visible ONLY for Admin */}
          {isAdminUser && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              id="btn-edit-message-card-action"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs border border-amber-500/40 transition-all active:scale-95"
              title="تعديل محتوى هذه الرسالة مباشرة داخل الصفحة"
            >
              <Edit className="w-4 h-4 text-stone-950" />
              <span>تعديل الرسالة</span>
            </button>
          )}

          <button
            onClick={copyText}
            className="px-5 py-2.5 bg-white border border-[#E7E2D8] hover:bg-stone-50 text-stone-700 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
            <span>{copied ? 'تم النسخ' : 'نسخ الرسالة'}</span>
          </button>

          <button
            onClick={shareWhatsApp}
            className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة عبر واتساب</span>
          </button>
        </div>
      </div>

      {/* Floating Quick Edit Button for Admin */}
      {isAdminUser && (
        <button
          onClick={() => setIsEditModalOpen(true)}
          id="message-floating-edit-btn"
          className="fixed bottom-6 left-6 z-40 px-4 py-3 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl flex items-center gap-2 border-2 border-amber-400 cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="تعديل هذه الرسالة من الداخل"
        >
          <Edit className="w-4 h-4 text-amber-300" />
          <span>تعديل الرسالة من الداخل ✏️</span>
        </button>
      )}

      {/* Message Edit Modal */}
      {message && (
        <MessageEditModal
          isOpen={isEditModalOpen}
          message={message}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={(updated) => {
            setMessage(updated);
            if (updated.slug && updated.slug !== slug) {
              onNavigate(`/messages/${updated.slug}`);
            }
          }}
        />
      )}
    </div>
  );
}
