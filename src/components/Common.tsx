import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// 1. Breadcrumbs
export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumbs({ items, onNavigate }: { items: BreadcrumbItem[]; onNavigate: (path: string) => void }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 overflow-x-auto py-1" dir="rtl">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {item.path && !isLast ? (
              <button
                onClick={() => onNavigate(item.path!)}
                className="hover:text-[#36533D] hover:underline font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <span className={`whitespace-nowrap ${isLast ? 'text-stone-900 font-bold' : ''}`}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronLeft className="w-3.5 h-3.5 text-stone-400 shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// 2. ShareButtons
export function ShareButtons({ title, url }: { title: string; url?: string }) {
  const { showToast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      showToast('تم نسخ الرابط بنجاح 📋', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n${fullUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`${title} عبر @lesanour`);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${text}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2 flex-wrap" dir="rtl">
      <span className="text-xs font-bold text-stone-500 ml-2 flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5" />
        مشاركة:
      </span>
      <button
        onClick={shareWhatsApp}
        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        واتساب
      </button>
      <button
        onClick={shareFacebook}
        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        فيسبوك
      </button>
      <button
        onClick={shareTwitter}
        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        منصة X
      </button>
      <button
        onClick={copyToClipboard}
        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
      </button>
    </div>
  );
}

// 3. Pagination
export function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-12 mb-6" dir="rtl">
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-[#E7E2D8] bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        السابق
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
            p === currentPage
              ? 'bg-[#36533D] text-white shadow-sm'
              : 'bg-white border border-[#E7E2D8] text-stone-700 hover:bg-stone-50'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-[#E7E2D8] bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        التالي
      </button>
    </div>
  );
}

// 4. EmptyState
export function EmptyState({
  title = 'لم نجد ما تبحثين عنه الآن، لكن لسه في نور 🤍',
  description = 'جربي البحث بكلمات أخرى أو استكشفي أقسام المنصة وموضوعات التعافي المتاحة.',
  actionLabel,
  onAction
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 my-8 bg-white/60 border border-[#E7E2D8] rounded-2xl max-w-lg mx-auto" dir="rtl">
      <div className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#E7E2D8] flex items-center justify-center text-[#36533D] mb-4 shadow-sm">
        <Sparkles className="w-7 h-7" />
      </div>
      <h3 className="font-heading font-bold text-lg text-stone-900 mb-2 leading-relaxed">{title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-[#36533D] hover:bg-[#2A4230] text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 5. LoadingState
export function LoadingState({ message = 'نستحضر النور...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20" dir="rtl">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[#36533D]/20 border-t-[#36533D] animate-spin"></div>
        <Sparkles className="w-5 h-5 text-[#36533D] animate-pulse" />
      </div>
      <p className="text-sm font-medium text-stone-500 mt-4 animate-pulse">{message}</p>
    </div>
  );
}

// 6. ErrorState
export function ErrorState({
  message = 'تعذر تحميل البيانات مؤقتاً',
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 my-8 bg-rose-50/50 border border-rose-200 rounded-2xl max-w-md mx-auto" dir="rtl">
      <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
      <h3 className="font-bold text-rose-900 mb-1">{message}</h3>
      <p className="text-xs text-rose-600 mb-4">يرجى التأكد من اتصالك بالشبكة ثم إعادة المحاولة.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

// 7. Reusable Modal
export function Modal({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#FCFAF7] border border-[#E7E2D8] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#E7E2D8] bg-[#FAF7F2]">
          <h3 className="font-heading font-bold text-base text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
}

// 8. SEO Head sync
export function SEOHead({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  useEffect(() => {
    document.title = `${title} | لسه في نور`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
  }, [title, description]);

  return null;
}
